-- Script para popular a tabela opcoes_sabores com dados iniciais

-- Verificar se já existem dados na tabela
DO $$
BEGIN
    -- Se a tabela está vazia, inserir dados iniciais
    IF NOT EXISTS (SELECT 1 FROM opcoes_sabores LIMIT 1) THEN
        INSERT INTO opcoes_sabores (nome, maximo_sabores, descricao, ordem, ativo) VALUES 
        ('1 Sabor', 1, 'Pizza com apenas um sabor', 1, true),
        ('2 Sabores', 2, 'Pizza dividida com dois sabores', 2, true),
        ('3 Sabores', 3, 'Pizza dividida com tres sabores', 3, true);
        
        RAISE NOTICE 'Dados iniciais inseridos na tabela opcoes_sabores';
    ELSE
        RAISE NOTICE 'Tabela opcoes_sabores ja contem dados, pulando insercao';
    END IF;
END $$;

-- Verificar o estado atual das opções
SELECT 
    nome,
    maximo_sabores,
    ativo,
    ordem
FROM opcoes_sabores 
ORDER BY ordem; 