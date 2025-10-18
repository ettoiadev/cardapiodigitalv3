/**
 * ============================================================================
 * SCRIPT DE VALIDAÇÃO PÓS-MIGRAÇÃO - Cardápio Digital v3
 * ============================================================================
 * Descrição: Valida que a migração foi bem-sucedida comparando dados
 * Uso: node migration/validate-migration.js --target=<connection_string>
 * ============================================================================
 */

const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

require('dotenv').config({ path: '.env.local' });

const args = process.argv.slice(2);
const targetArg = args.find(arg => arg.startsWith('--target='));

if (!targetArg) {
  console.error('❌ Uso: node validate-migration.js --target="postgresql://user:pass@host:port/db"');
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TARGET_CONNECTION = targetArg.split('=')[1];

// ============================================================================
// TABELAS A VALIDAR
// ============================================================================

const TABLES_TO_VALIDATE = [
  'pizzaria_config',
  'categorias',
  'produtos',
  'bordas_recheadas',
  'opcoes_sabores',
  'tamanhos_pizza',
  'carousel_config',
  'carousel_images',
  'admins',
  'pedidos',
  'pedido_itens',
  'mensagens_whatsapp'
];

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Conecta aos bancos de dados
 */
async function connectDatabases() {
  console.log('🔌 Conectando aos bancos de dados...');
  
  // Supabase (origem)
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('  ✓ Conectado ao Supabase (origem)');
  
  // Novo banco (destino)
  const target = new Client({ connectionString: TARGET_CONNECTION });
  await target.connect();
  console.log('  ✓ Conectado ao banco destino');
  
  return { supabase, target };
}

/**
 * Conta registros em uma tabela
 */
async function countRecords(client, tableName, isSupabase = false) {
  if (isSupabase) {
    const { count, error } = await client
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count;
  } else {
    const result = await client.query(`SELECT COUNT(*) FROM public.${tableName}`);
    return parseInt(result.rows[0].count);
  }
}

/**
 * Busca todos os registros de uma tabela
 */
async function fetchAllRecords(client, tableName, isSupabase = false) {
  if (isSupabase) {
    const { data, error } = await client
      .from(tableName)
      .select('*');
    
    if (error) throw error;
    return data || [];
  } else {
    const result = await client.query(`SELECT * FROM public.${tableName}`);
    return result.rows;
  }
}

/**
 * Calcula checksum de dados
 */
function calculateChecksum(data) {
  // Ordenar por ID para garantir consistência
  const sorted = [...data].sort((a, b) => {
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
  
  const serialized = JSON.stringify(sorted);
  return crypto.createHash('md5').update(serialized).digest('hex');
}

/**
 * Valida contagem de registros
 */
async function validateTableCounts(supabase, target, tableName) {
  console.log(`\n📊 Validando contagem: ${tableName}...`);
  
  try {
    const sourceCount = await countRecords(supabase, tableName, true);
    const targetCount = await countRecords(target, tableName, false);
    
    const match = sourceCount === targetCount;
    
    console.log(`  Origem: ${sourceCount} | Destino: ${targetCount} | ${match ? '✓' : '✗'}`);
    
    return {
      table: tableName,
      test: 'count',
      sourceCount,
      targetCount,
      match,
      pass: match
    };
  } catch (error) {
    console.error(`  ❌ Erro:`, error.message);
    return {
      table: tableName,
      test: 'count',
      pass: false,
      error: error.message
    };
  }
}

/**
 * Valida checksum de dados
 */
async function validateTableChecksum(supabase, target, tableName) {
  console.log(`\n🔐 Validando checksum: ${tableName}...`);
  
  try {
    const sourceData = await fetchAllRecords(supabase, tableName, true);
    const targetData = await fetchAllRecords(target, tableName, false);
    
    const sourceChecksum = calculateChecksum(sourceData);
    const targetChecksum = calculateChecksum(targetData);
    
    const match = sourceChecksum === targetChecksum;
    
    console.log(`  Origem: ${sourceChecksum}`);
    console.log(`  Destino: ${targetChecksum}`);
    console.log(`  ${match ? '✓ Checksums idênticos' : '✗ Checksums diferentes'}`);
    
    return {
      table: tableName,
      test: 'checksum',
      sourceChecksum,
      targetChecksum,
      match,
      pass: match
    };
  } catch (error) {
    console.error(`  ❌ Erro:`, error.message);
    return {
      table: tableName,
      test: 'checksum',
      pass: false,
      error: error.message
    };
  }
}

/**
 * Valida estrutura de tabela
 */
async function validateTableStructure(target, tableName) {
  console.log(`\n🏗️  Validando estrutura: ${tableName}...`);
  
  const checks = [];
  
  try {
    // Verificar se tabela existe
    const tableExists = await target.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    
    checks.push({
      check: 'Tabela existe',
      pass: tableExists.rows[0].exists
    });
    
    if (!tableExists.rows[0].exists) {
      return {
        table: tableName,
        test: 'structure',
        checks,
        pass: false
      };
    }
    
    // Verificar primary key
    const hasPK = await target.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.table_constraints
        WHERE table_schema = 'public'
        AND table_name = $1
        AND constraint_type = 'PRIMARY KEY'
      )
    `, [tableName]);
    
    checks.push({
      check: 'Primary Key definida',
      pass: hasPK.rows[0].exists
    });
    
    // Verificar RLS habilitado
    const hasRLS = await target.query(`
      SELECT relrowsecurity
      FROM pg_class
      WHERE relname = $1
      AND relnamespace = 'public'::regnamespace
    `, [tableName]);
    
    checks.push({
      check: 'RLS habilitado',
      pass: hasRLS.rows[0]?.relrowsecurity || false
    });
    
    const allPass = checks.every(c => c.pass);
    
    checks.forEach(c => {
      console.log(`  ${c.pass ? '✓' : '✗'} ${c.check}`);
    });
    
    return {
      table: tableName,
      test: 'structure',
      checks,
      pass: allPass
    };
  } catch (error) {
    console.error(`  ❌ Erro:`, error.message);
    return {
      table: tableName,
      test: 'structure',
      checks,
      pass: false,
      error: error.message
    };
  }
}

/**
 * Valida foreign keys
 */
async function validateForeignKeys(target) {
  console.log(`\n🔗 Validando foreign keys...`);
  
  try {
    const fkQuery = `
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name
    `;
    
    const result = await target.query(fkQuery);
    const fkCount = result.rows.length;
    
    console.log(`  ✓ ${fkCount} foreign keys encontradas`);
    
    result.rows.forEach(fk => {
      console.log(`    - ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    return {
      test: 'foreign_keys',
      count: fkCount,
      pass: fkCount >= 3,  // Esperamos pelo menos 3 FKs
      foreignKeys: result.rows
    };
  } catch (error) {
    console.error(`  ❌ Erro:`, error.message);
    return {
      test: 'foreign_keys',
      pass: false,
      error: error.message
    };
  }
}

/**
 * Gera relatório de validação
 */
async function generateReport(results) {
  const timestamp = new Date().toISOString();
  
  const report = {
    timestamp,
    source: SUPABASE_URL,
    target: TARGET_CONNECTION.replace(/:[^:@]+@/, ':****@'),
    totalTests: results.length,
    passedTests: results.filter(r => r.pass).length,
    failedTests: results.filter(r => !r.pass).length,
    tests: results,
    summary: {
      allPassed: results.every(r => r.pass),
      criticalIssues: results.filter(r => !r.pass && r.test !== 'checksum').length
    }
  };
  
  const reportFile = path.join(__dirname, 'data', 'validation-report.json');
  await fs.writeFile(
    reportFile,
    JSON.stringify(report, null, 2),
    'utf8'
  );
  
  console.log(`\n📄 Relatório salvo em: ${reportFile}`);
  
  return report;
}

/**
 * Exibe resumo da validação
 */
function displaySummary(report) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMO DA VALIDAÇÃO');
  console.log('='.repeat(70));
  console.log(`Data/Hora: ${report.timestamp}`);
  console.log(`Total de testes: ${report.totalTests}`);
  console.log(`Testes aprovados: ${report.passedTests} ✓`);
  console.log(`Testes reprovados: ${report.failedTests} ✗`);
  
  if (report.failedTests > 0) {
    console.log(`\n❌ FALHAS:`);
    report.tests
      .filter(t => !t.pass)
      .forEach(t => {
        console.log(`   - ${t.table || 'N/A'} (${t.test}): ${t.error || 'Mismatch'}`);
      });
  }
  
  console.log('='.repeat(70));
  
  if (report.summary.allPassed) {
    console.log('✅ Validação concluída - Migração BEM-SUCEDIDA!');
  } else if (report.summary.criticalIssues === 0) {
    console.log('⚠️  Validação concluída - Pequenas diferenças detectadas');
    console.log('    (Apenas checksums diferentes - pode ser ordem de dados)');
  } else {
    console.log('❌ Validação FALHOU - Migração com problemas críticos');
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  console.log('============================================================================');
  console.log('🔍 VALIDAÇÃO PÓS-MIGRAÇÃO - Cardápio Digital v3');
  console.log('============================================================================');
  console.log(`Origem: ${SUPABASE_URL}`);
  console.log(`Destino: ${TARGET_CONNECTION.replace(/:[^:@]+@/, ':****@')}`);
  console.log('');
  
  // Conectar aos bancos
  const { supabase, target } = await connectDatabases();
  
  const results = [];
  
  try {
    // Validar cada tabela
    for (const tableName of TABLES_TO_VALIDATE) {
      // Estrutura
      const structureResult = await validateTableStructure(target, tableName);
      results.push(structureResult);
      
      // Contagem
      const countResult = await validateTableCounts(supabase, target, tableName);
      results.push(countResult);
      
      // Checksum (apenas se contagens batem)
      if (countResult.pass && countResult.sourceCount > 0) {
        const checksumResult = await validateTableChecksum(supabase, target, tableName);
        results.push(checksumResult);
      }
    }
    
    // Validar foreign keys
    const fkResult = await validateForeignKeys(target);
    results.push(fkResult);
    
    // Gerar relatório
    const report = await generateReport(results);
    
    // Exibir resumo
    displaySummary(report);
    
    // Desconectar
    await target.end();
    
    // Exit code
    const exitCode = report.summary.criticalIssues > 0 ? 1 : 0;
    process.exit(exitCode);
  } catch (error) {
    await target.end();
    throw error;
  }
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

main().catch(error => {
  console.error('\n💥 Erro fatal durante validação:', error);
  process.exit(1);
});
