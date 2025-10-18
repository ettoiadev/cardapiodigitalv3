/**
 * ============================================================================
 * SCRIPT DE IMPORTAÇÃO DE DADOS - Cardápio Digital v3
 * ============================================================================
 * Descrição: Importa dados JSON para o novo banco de dados
 * Uso: node migration/import-data.js --connection=<connection_string>
 * ============================================================================
 */

const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

// Parse argumentos
const args = process.argv.slice(2);
const connectionArg = args.find(arg => arg.startsWith('--connection='));
const dryRunArg = args.includes('--dry-run');

if (!connectionArg && !dryRunArg) {
  console.error('❌ Uso: node import-data.js --connection="postgresql://user:pass@host:port/db"');
  console.error('   Ou: node import-data.js --dry-run (para testar sem importar)');
  process.exit(1);
}

const CONNECTION_STRING = connectionArg ? connectionArg.split('=')[1] : null;
const DRY_RUN = dryRunArg;

// Diretório de dados
const DATA_DIR = path.join(__dirname, 'data');

// ============================================================================
// ORDEM DE IMPORTAÇÃO (mesma da exportação)
// ============================================================================

const IMPORT_ORDER = [
  'pizzaria_config',
  'categorias',
  'bordas_recheadas',
  'opcoes_sabores',
  'tamanhos_pizza',
  'carousel_config',
  'admins',
  'produtos',
  'carousel_images',
  'pedidos',
  'pedido_itens',
  'mensagens_whatsapp'
];

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Conecta ao banco de dados
 */
async function connectDatabase() {
  if (DRY_RUN) {
    console.log('🔍 Modo DRY-RUN: Não conectará ao banco');
    return null;
  }
  
  const client = new Client({ connectionString: CONNECTION_STRING });
  
  try {
    await client.connect();
    console.log('✓ Conectado ao banco de dados');
    
    // Testar conexão
    const result = await client.query('SELECT version()');
    console.log(`✓ PostgreSQL: ${result.rows[0].version.split(' ')[0]}`);
    
    return client;
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
    throw error;
  }
}

/**
 * Carrega dados de um arquivo JSON
 */
async function loadDataFile(tableName) {
  const filename = path.join(DATA_DIR, `${tableName}.json`);
  
  try {
    const content = await fs.readFile(filename, 'utf8');
    const data = JSON.parse(content);
    
    console.log(`   ✓ Carregado: ${data.length} registro(s)`);
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`   ⚠️  Arquivo não encontrado: ${filename}`);
      return [];
    }
    throw error;
  }
}

/**
 * Gera SQL INSERT para uma linha
 */
function generateInsertSQL(tableName, row) {
  const columns = Object.keys(row);
  const values = Object.values(row);
  
  // Placeholders ($1, $2, etc.)
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  
  const sql = `
    INSERT INTO public.${tableName} (${columns.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT (id) DO UPDATE SET
      ${columns.filter(c => c !== 'id').map(c => `${c} = EXCLUDED.${c}`).join(', ')}
  `;
  
  return { sql, values };
}

/**
 * Importa dados de uma tabela
 */
async function importTable(client, tableName) {
  console.log(`\n📥 Importando: ${tableName}...`);
  
  // Carregar dados do arquivo
  const data = await loadDataFile(tableName);
  
  if (data.length === 0) {
    console.log(`   ⏭️  Tabela vazia, pulando...`);
    return {
      table: tableName,
      success: true,
      rowCount: 0,
      inserted: 0,
      skipped: 0
    };
  }
  
  if (DRY_RUN) {
    console.log(`   🔍 DRY-RUN: Simularia importação de ${data.length} registro(s)`);
    return {
      table: tableName,
      success: true,
      rowCount: data.length,
      inserted: data.length,
      skipped: 0,
      dryRun: true
    };
  }
  
  let inserted = 0;
  let skipped = 0;
  
  try {
    // Desabilitar triggers temporariamente para performance
    await client.query(`ALTER TABLE public.${tableName} DISABLE TRIGGER ALL`);
    
    // Importar cada linha
    for (const row of data) {
      try {
        const { sql, values } = generateInsertSQL(tableName, row);
        await client.query(sql, values);
        inserted++;
      } catch (error) {
        console.warn(`   ⚠️  Erro ao inserir registro:`, error.message);
        skipped++;
      }
    }
    
    // Reabilitar triggers
    await client.query(`ALTER TABLE public.${tableName} ENABLE TRIGGER ALL`);
    
    console.log(`   ✓ Inseridos: ${inserted}`);
    if (skipped > 0) {
      console.warn(`   ⚠️  Pulados: ${skipped}`);
    }
    
    // Atualizar sequência de IDs (se houver)
    try {
      await client.query(`
        SELECT setval(
          pg_get_serial_sequence('public.${tableName}', 'id'),
          (SELECT MAX(id) FROM public.${tableName})
        )
      `);
    } catch {
      // Ignorar se não houver sequência
    }
    
    return {
      table: tableName,
      success: true,
      rowCount: data.length,
      inserted,
      skipped
    };
  } catch (error) {
    console.error(`   ❌ Erro ao importar ${tableName}:`, error.message);
    
    return {
      table: tableName,
      success: false,
      error: error.message,
      rowCount: data.length,
      inserted,
      skipped
    };
  }
}

/**
 * Valida integridade referencial
 */
async function validateIntegrity(client) {
  console.log(`\n🔍 Validando integridade referencial...`);
  
  if (DRY_RUN) {
    console.log('   🔍 DRY-RUN: Pulando validação');
    return true;
  }
  
  const checks = [
    {
      name: 'Produtos sem categoria',
      sql: `SELECT COUNT(*) FROM public.produtos WHERE categoria_id IS NOT NULL AND categoria_id NOT IN (SELECT id FROM public.categorias)`
    },
    {
      name: 'Itens de pedido sem pedido',
      sql: `SELECT COUNT(*) FROM public.pedido_itens WHERE pedido_id NOT IN (SELECT id FROM public.pedidos)`
    },
    {
      name: 'Itens de pedido sem produto',
      sql: `SELECT COUNT(*) FROM public.pedido_itens WHERE produto_id IS NOT NULL AND produto_id NOT IN (SELECT id FROM public.produtos)`
    }
  ];
  
  let allValid = true;
  
  for (const check of checks) {
    try {
      const result = await client.query(check.sql);
      const count = parseInt(result.rows[0].count);
      
      if (count > 0) {
        console.warn(`   ⚠️  ${check.name}: ${count} registro(s) órfãos`);
        allValid = false;
      } else {
        console.log(`   ✓ ${check.name}: OK`);
      }
    } catch (error) {
      console.error(`   ❌ Erro ao validar "${check.name}":`, error.message);
      allValid = false;
    }
  }
  
  return allValid;
}

/**
 * Gera relatório de importação
 */
async function generateReport(results, integrityOk) {
  const timestamp = new Date().toISOString();
  
  const report = {
    timestamp,
    dryRun: DRY_RUN,
    connection: DRY_RUN ? 'N/A' : CONNECTION_STRING.replace(/:[^:@]+@/, ':****@'),
    totalTables: results.length,
    successfulImports: results.filter(r => r.success).length,
    failedImports: results.filter(r => !r.success).length,
    totalRows: results.reduce((sum, r) => sum + (r.rowCount || 0), 0),
    totalInserted: results.reduce((sum, r) => sum + (r.inserted || 0), 0),
    totalSkipped: results.reduce((sum, r) => sum + (r.skipped || 0), 0),
    integrityValidation: integrityOk ? 'PASS' : 'FAIL',
    tables: results
  };
  
  const reportFile = path.join(DATA_DIR, 'import-report.json');
  await fs.writeFile(
    reportFile,
    JSON.stringify(report, null, 2),
    'utf8'
  );
  
  console.log(`\n📄 Relatório salvo em: ${reportFile}`);
  
  return report;
}

/**
 * Exibe resumo da importação
 */
function displaySummary(report) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMO DA IMPORTAÇÃO');
  console.log('='.repeat(70));
  console.log(`Data/Hora: ${report.timestamp}`);
  console.log(`Modo: ${report.dryRun ? 'DRY-RUN (simulação)' : 'PRODUÇÃO'}`);
  console.log(`Total de tabelas: ${report.totalTables}`);
  console.log(`Importações bem-sucedidas: ${report.successfulImports} ✓`);
  console.log(`Importações com erro: ${report.failedImports} ✗`);
  console.log(`Total de registros: ${report.totalRows}`);
  console.log(`Registros inseridos: ${report.totalInserted}`);
  console.log(`Registros pulados: ${report.totalSkipped}`);
  console.log(`Validação de integridade: ${report.integrityValidation}`);
  
  if (report.failedImports > 0) {
    console.log(`\n❌ ERROS:`);
    report.tables
      .filter(t => !t.success)
      .forEach(t => {
        console.log(`   - ${t.table}: ${t.error}`);
      });
  }
  
  console.log('='.repeat(70));
  
  if (report.dryRun) {
    console.log('🔍 Modo DRY-RUN concluído - nenhum dado foi importado');
  } else if (report.failedImports === 0 && report.integrityValidation === 'PASS') {
    console.log('✅ Importação concluída com sucesso!');
  } else {
    console.log('⚠️  Importação concluída com problemas - revisar relatório');
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  console.log('============================================================================');
  console.log('🚀 IMPORTAÇÃO DE DADOS - Cardápio Digital v3');
  console.log('============================================================================');
  console.log(`Origem: ${DATA_DIR}`);
  console.log(`Destino: ${DRY_RUN ? 'DRY-RUN (simulação)' : CONNECTION_STRING.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`Tabelas a importar: ${IMPORT_ORDER.length}`);
  console.log('');
  
  // Conectar ao banco
  const client = await connectDatabase();
  
  try {
    // Importar todas as tabelas
    const results = [];
    for (const tableName of IMPORT_ORDER) {
      const result = await importTable(client, tableName);
      results.push(result);
    }
    
    // Validar integridade
    const integrityOk = await validateIntegrity(client);
    
    // Gerar relatório
    const report = await generateReport(results, integrityOk);
    
    // Exibir resumo
    displaySummary(report);
    
    // Exit code baseado no resultado
    const exitCode = (report.failedImports > 0 || !integrityOk) ? 1 : 0;
    
    if (client) {
      await client.end();
    }
    
    process.exit(exitCode);
  } catch (error) {
    if (client) {
      await client.end();
    }
    throw error;
  }
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

main().catch(error => {
  console.error('\n💥 Erro fatal durante importação:', error);
  process.exit(1);
});
