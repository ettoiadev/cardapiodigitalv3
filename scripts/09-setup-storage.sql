-- Configuração do Supabase Storage para upload de imagens
-- Execute este script no SQL Editor do Supabase

-- Criar bucket para imagens se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload de imagens (qualquer usuário autenticado)
CREATE POLICY "Permitir upload de imagens" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images');

-- Política para permitir visualização pública das imagens
CREATE POLICY "Permitir acesso público às imagens" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Política para permitir atualização de imagens (qualquer usuário autenticado)
CREATE POLICY "Permitir atualização de imagens" ON storage.objects
FOR UPDATE USING (bucket_id = 'images');

-- Política para permitir exclusão de imagens (qualquer usuário autenticado)
CREATE POLICY "Permitir exclusão de imagens" ON storage.objects
FOR DELETE USING (bucket_id = 'images'); 