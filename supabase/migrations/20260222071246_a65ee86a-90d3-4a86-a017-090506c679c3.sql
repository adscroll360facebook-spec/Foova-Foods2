
-- Add COD availability flag per product
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cod_available boolean NOT NULL DEFAULT true;
