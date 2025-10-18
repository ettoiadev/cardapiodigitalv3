-- Add promotional pricing fields to produtos table
-- These fields will store the promotional prices when a product is marked as promocao = true

-- Add promotional pricing fields
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS preco_promocional_tradicional DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS preco_promocional_broto DECIMAL(10,2);

-- Add constraints to ensure promotional prices are positive when set
ALTER TABLE produtos 
ADD CONSTRAINT check_preco_promocional_tradicional_positivo 
CHECK (preco_promocional_tradicional IS NULL OR preco_promocional_tradicional > 0);

ALTER TABLE produtos 
ADD CONSTRAINT check_preco_promocional_broto_positivo 
CHECK (preco_promocional_broto IS NULL OR preco_promocional_broto > 0);

-- Add comments to document the new fields
COMMENT ON COLUMN produtos.preco_promocional_tradicional IS 'Preço promocional para pizza tradicional - usado quando promocao = true';
COMMENT ON COLUMN produtos.preco_promocional_broto IS 'Preço promocional para pizza broto - usado quando promocao = true';

-- Update existing promotional products to have promotional prices (optional, for testing)
-- This can be removed in production if you want to set prices manually
UPDATE produtos 
SET 
  preco_promocional_tradicional = preco_tradicional * 0.8,
  preco_promocional_broto = preco_broto * 0.8
WHERE promocao = true 
  AND preco_promocional_tradicional IS NULL 
  AND preco_promocional_broto IS NULL; 