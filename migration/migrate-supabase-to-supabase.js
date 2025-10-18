/**
 * ============================================================================
 * MIGRAÇÃO SUPABASE PARA SUPABASE - Cardápio Digital v3
 * ============================================================================
 * Uso: node migrate-supabase-to-supabase.js
 * ============================================================================
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

// BANCO ORIGEM (antigo - cduyketpnybwwynsjyuq)
const SOURCE_URL = 'https://cduyketpnybwwynsjyuq.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdXlrZXRwbnlid3d5bnNqeXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTg0NjgsImV4cCI6MjA2NjY5NDQ2OH0.4LfqohIGuit8w1lWK3DFRREoeSTITnhtNWzSvek2Puc';

// BANCO DESTINO (novo - umbjzrlajwzlclyemslv)
const TARGET_URL = 'https://umbjzrlajwzlclyemslv.supabase.co';
const TARGET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYmp6cmxhand6bGNseWVtc2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NTM2OTAsImV4cCI6MjA3NjMyOTY5MH0.-7ydsHkpdmUDFOULPQYumdjluig-wwmwXJtrMSUy8WM';

const sourceSupabase = createClient(SOURCE_URL, SOURCE_KEY);
const targetSupabase = createClient(TARGET_URL, TARGET_KEY);

// Ordem de migração
const TABLES = [
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
// FUNÇÕES
// ============================================================================

async function migrateTable(tableName) {
  console.log(`\n📊 Migrando: ${tableName}...`);
  
  try {
    // Buscar dados do banco origem
    const { data: sourceData, error: fetchError } = await sourceSupabase
      .from(tableName)
      .select('*');
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!sourceData || sourceData.length === 0) {
      console.log(`   ⏭️  Tabela vazia, pulando...`);
      return { table: tableName, rows: 0, success: true };
    }
    
    console.log(`   ✓ ${sourceData.length} registro(s) encontrado(s)`);
    
    // Inserir no banco destino
    const { error: insertError } = await targetSupabase
      .from(tableName)
      .insert(sourceData);
    
    if (insertError) {
      throw insertError;
    }
    
    console.log(`   ✓ ${sourceData.length} registro(s) inserido(s)`);
    
    return { table: tableName, rows: sourceData.length, success: true };
  } catch (error) {
    console.error(`   ❌ Erro:`, error.message);
    return { table: tableName, success: false, error: error.message };
  }
}

async function main() {
  console.log('============================================================================');
  console.log('🚀 MIGRAÇÃO SUPABASE → SUPABASE - Cardápio Digital v3');
  console.log('============================================================================');
  console.log(`Origem: ${SOURCE_URL}`);
  console.log(`Destino: ${TARGET_URL}`);
  console.log('');
  
  const results = [];
  let totalRows = 0;
  
  for (const table of TABLES) {
    const result = await migrateTable(table);
    results.push(result);
    if (result.success) {
      totalRows += result.rows || 0;
    }
  }
  
  // Resumo
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMO DA MIGRAÇÃO');
  console.log('='.repeat(70));
  console.log(`Tabelas migradas: ${results.filter(r => r.success).length}/${TABLES.length}`);
  console.log(`Total de registros: ${totalRows}`);
  console.log(`Falhas: ${results.filter(r => !r.success).length}`);
  
  if (results.some(r => !r.success)) {
    console.log('\n❌ ERROS:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.table}: ${r.error}`);
    });
  } else {
    console.log('\n✅ Migração concluída com sucesso!');
  }
  
  console.log('='.repeat(70));
}

main().catch(error => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
});
