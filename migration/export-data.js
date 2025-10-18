/**
 * ============================================================================
 * SCRIPT DE EXPORTAÇÃO DE DADOS - Cardápio Digital v3
 * ============================================================================
 * Descrição: Exporta todos os dados do Supabase para arquivos JSON
 * Uso: node migration/export-data.js
 * Saída: migration/data/ (vários arquivos JSON)
 * ============================================================================
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

// Verificar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Diretório de saída
const OUTPUT_DIR = path.join(__dirname, 'data');

// ============================================================================
// ORDEM DE EXPORTAÇÃO (respeitando dependências)
// ============================================================================

const EXPORT_ORDER = [
  // Tabelas base (sem foreign keys)
  { table: 'pizzaria_config', critical: true },
  { table: 'categorias', critical: true },
  { table: 'bordas_recheadas', critical: true },
  { table: 'opcoes_sabores', critical: true },
  { table: 'tamanhos_pizza', critical: false },
  { table: 'carousel_config', critical: true },
  { table: 'admins', critical: true },
  
  // Tabelas dependentes
  { table: 'produtos', critical: true, dependsOn: ['categorias'] },
  { table: 'carousel_images', critical: true, dependsOn: ['carousel_config'] },
  { table: 'pedidos', critical: true },
  { table: 'pedido_itens', critical: true, dependsOn: ['pedidos', 'produtos'] },
  { table: 'mensagens_whatsapp', critical: false }
];

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Cria diretório de saída se não existir
 */
async function ensureOutputDir() {
  try {
    await fs.access(OUTPUT_DIR);
  } catch {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Diretório criado: ${OUTPUT_DIR}`);
  }
}

/**
 * Exporta dados de uma tabela
 */
async function exportTable(tableName, isCritical = true) {
  console.log(`\n📊 Exportando: ${tableName}...`);
  
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' });
    
    if (error) {
      throw error;
    }
    
    const rowCount = data?.length || 0;
    console.log(`   ✓ ${rowCount} registro(s) encontrado(s)`);
    
    // Salvar em arquivo JSON
    const filename = path.join(OUTPUT_DIR, `${tableName}.json`);
    await fs.writeFile(
      filename,
      JSON.stringify(data, null, 2),
      'utf8'
    );
    
    console.log(`   ✓ Salvo em: ${filename}`);
    
    // Verificar se tabela crítica está vazia
    if (isCritical && rowCount === 0) {
      console.warn(`   ⚠️  ATENÇÃO: Tabela crítica "${tableName}" está vazia!`);
    }
    
    return {
      table: tableName,
      success: true,
      rowCount,
      critical: isCritical
    };
  } catch (error) {
    console.error(`   ❌ Erro ao exportar ${tableName}:`, error.message);
    
    return {
      table: tableName,
      success: false,
      error: error.message,
      critical: isCritical
    };
  }
}

/**
 * Gera relatório de exportação
 */
async function generateReport(results) {
  const timestamp = new Date().toISOString();
  
  const report = {
    timestamp,
    supabaseUrl: SUPABASE_URL,
    totalTables: results.length,
    successfulExports: results.filter(r => r.success).length,
    failedExports: results.filter(r => !r.success).length,
    totalRows: results.reduce((sum, r) => sum + (r.rowCount || 0), 0),
    tables: results,
    warnings: results
      .filter(r => r.critical && r.rowCount === 0)
      .map(r => `Tabela crítica "${r.table}" está vazia`)
  };
  
  const reportFile = path.join(OUTPUT_DIR, 'export-report.json');
  await fs.writeFile(
    reportFile,
    JSON.stringify(report, null, 2),
    'utf8'
  );
  
  console.log(`\n📄 Relatório salvo em: ${reportFile}`);
  
  return report;
}

/**
 * Exibe resumo da exportação
 */
function displaySummary(report) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMO DA EXPORTAÇÃO');
  console.log('='.repeat(70));
  console.log(`Data/Hora: ${report.timestamp}`);
  console.log(`Total de tabelas: ${report.totalTables}`);
  console.log(`Exportações bem-sucedidas: ${report.successfulExports} ✓`);
  console.log(`Exportações com erro: ${report.failedExports} ✗`);
  console.log(`Total de registros: ${report.totalRows}`);
  
  if (report.warnings.length > 0) {
    console.log(`\n⚠️  AVISOS (${report.warnings.length}):`);
    report.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
  }
  
  if (report.failedExports > 0) {
    console.log(`\n❌ ERROS:`);
    report.tables
      .filter(t => !t.success)
      .forEach(t => {
        console.log(`   - ${t.table}: ${t.error}`);
      });
  }
  
  console.log('='.repeat(70));
  
  if (report.failedExports === 0 && report.warnings.length === 0) {
    console.log('✅ Exportação concluída com sucesso!');
  } else if (report.failedExports === 0) {
    console.log('⚠️  Exportação concluída com avisos');
  } else {
    console.log('❌ Exportação concluída com erros');
  }
}

/**
 * Cria arquivo de metadados
 */
async function createMetadata(report) {
  const metadata = {
    exportedAt: report.timestamp,
    source: {
      provider: 'Supabase',
      url: SUPABASE_URL,
      version: 'PostgreSQL 17.4.1.45'
    },
    statistics: {
      totalTables: report.totalTables,
      totalRows: report.totalRows,
      successfulExports: report.successfulExports
    },
    schema: {
      version: '1.0',
      tables: EXPORT_ORDER.map(({ table, critical, dependsOn }) => ({
        name: table,
        critical,
        dependencies: dependsOn || [],
        rowCount: report.tables.find(t => t.table === table)?.rowCount || 0
      }))
    }
  };
  
  const metadataFile = path.join(OUTPUT_DIR, 'metadata.json');
  await fs.writeFile(
    metadataFile,
    JSON.stringify(metadata, null, 2),
    'utf8'
  );
  
  console.log(`📋 Metadados salvos em: ${metadataFile}`);
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  console.log('============================================================================');
  console.log('🚀 EXPORTAÇÃO DE DADOS - Cardápio Digital v3');
  console.log('============================================================================');
  console.log(`Origem: ${SUPABASE_URL}`);
  console.log(`Destino: ${OUTPUT_DIR}`);
  console.log(`Tabelas a exportar: ${EXPORT_ORDER.length}`);
  console.log('');
  
  // Criar diretório de saída
  await ensureOutputDir();
  
  // Exportar todas as tabelas
  const results = [];
  for (const { table, critical } of EXPORT_ORDER) {
    const result = await exportTable(table, critical);
    results.push(result);
  }
  
  // Gerar relatório
  const report = await generateReport(results);
  
  // Criar metadados
  await createMetadata(report);
  
  // Exibir resumo
  displaySummary(report);
  
  // Exit code baseado no resultado
  const exitCode = report.failedExports > 0 ? 1 : 0;
  process.exit(exitCode);
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

main().catch(error => {
  console.error('\n💥 Erro fatal durante exportação:', error);
  process.exit(1);
});
