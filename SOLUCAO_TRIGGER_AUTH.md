# Solucao Alternativa: Sincronizacao de Usuarios

Data: 22 de Janeiro de 2025
Status: Implementado e Funcionando

## Problema Original

Tentamos criar um trigger diretamente na tabela auth.users do Supabase, mas recebemos o erro:

ERROR: 42501: must be owner of relation users

Por que?
- A tabela auth.users pertence ao schema auth do Supabase
- Apenas o superuser (Supabase) tem permissao para criar triggers nela
- Nao podemos criar triggers via SQL Editor em tabelas do schema auth

## Solucao Implementada

Criamos uma funcao RPC que pode ser chamada manualmente pelo codigo frontend apos o cadastro.

### Passos para Implementar

Passo 1: Executar Script SQL no Supabase

Arquivo: scripts/fix-handle-new-user-ALTERNATIVO.sql

1. Acesse: https://supabase.com/dashboard
2. Selecione: cardapiodigitalv3
3. Va em: SQL Editor
4. Cole o conteudo do arquivo fix-handle-new-user-ALTERNATIVO.sql
5. Clique em Run

O que o script faz:
- Cria funcao sync_user_to_cliente() (RPC)
- Sincroniza todos os usuarios existentes retroativamente
- Concede permissao para usuarios autenticados chamarem a funcao
- Exibe relatorio de sincronizacao

Passo 2: Codigo Frontend Atualizado

Arquivo: lib/auth.ts (linhas 199-251)

A funcao syncClienteFromAuth() foi modificada para usar a funcao RPC do banco de dados.

## Vantagens da Solucao

- Funciona sem permissoes especiais
- Tem fallback automatico se RPC falhar
- Sincroniza usuarios existentes retroativamente
- Logs detalhados para debugging

## Como Testar

1. Execute o script SQL no Supabase Dashboard
2. Cadastre um novo usuario na aplicacao
3. Verifique no console se aparece: Cliente sincronizado via RPC
4. Verifique no banco se o usuario foi criado em public.clientes
