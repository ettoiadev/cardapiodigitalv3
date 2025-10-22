# Instrucoes para Executar Scripts SQL no Supabase

## Script 1: Sincronizacao de Usuarios (OBRIGATORIO)

### Arquivo: scripts/fix-handle-new-user-ALTERNATIVO.sql

Este script e ESSENCIAL para o funcionamento do cadastro de usuarios.

### Passo a Passo:

1. Abra o navegador e acesse: https://supabase.com/dashboard

2. Faca login com suas credenciais

3. Selecione o projeto: cardapiodigitalv3

4. No menu lateral, clique em: SQL Editor

5. Clique em: New Query

6. Abra o arquivo: scripts/fix-handle-new-user-ALTERNATIVO.sql

7. Copie TODO o conteudo do arquivo

8. Cole no editor SQL do Supabase

9. Clique no botao verde Run (ou pressione Ctrl+Enter)

10. Aguarde a execucao (deve levar 2-5 segundos)

11. Verifique se apareceu a mensagem de sucesso no painel Results

### Resultado Esperado:

Voce deve ver mensagens como:
- Funcao sync_user_to_cliente criada
- X usuarios sincronizados com sucesso
- Total de usuarios em auth.users: X
- Total de usuarios em public.clientes: X

---

## Script 2: Otimizacao de Indices (RECOMENDADO)

### Arquivo: scripts/otimizacao-indices-banco.sql

Este script melhora a performance do sistema.

### Passo a Passo:

1. No mesmo SQL Editor do Supabase

2. Clique em: New Query

3. Abra o arquivo: scripts/otimizacao-indices-banco.sql

4. Copie TODO o conteudo

5. Cole no editor

6. Clique em Run

7. Aguarde (pode levar 10-30 segundos)

### Resultado Esperado:

- 8 indices criados com sucesso
- Mensagem: Indices criados com sucesso
- Beneficios: Queries 5-50x mais rapidas

---

## Verificacao Final

Apos executar os scripts, execute esta query para verificar:

SELECT 
  'auth.users' as tabela,
  COUNT(*) as total
FROM auth.users
UNION ALL
SELECT 
  'public.clientes' as tabela,
  COUNT(*) as total
FROM public.clientes
ORDER BY tabela;

Os numeros devem ser IGUAIS.

---

## Problemas Comuns

### Erro: must be owner of relation users

Solucao: Voce esta tentando executar o script ERRADO.
Use: fix-handle-new-user-ALTERNATIVO.sql (NAO o fix-handle-new-user-trigger.sql)

### Erro: function already exists

Solucao: Tudo bem! A funcao ja foi criada. Continue normalmente.

### Erro: permission denied

Solucao: Verifique se voce esta logado com a conta correta no Supabase.

---

## Proximos Passos

Apos executar os scripts:

1. Teste o cadastro de um novo usuario
2. Verifique se o usuario aparece em public.clientes
3. Teste o login com o novo usuario
4. Continue com as proximas melhorias do sistema
