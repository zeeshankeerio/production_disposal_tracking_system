-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'unit',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create production_entries table
CREATE TABLE IF NOT EXISTS public.production_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  shift TEXT NOT NULL,
  expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create disposal_entries table
CREATE TABLE IF NOT EXISTS public.disposal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  shift TEXT NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable row-level security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disposal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies to allow authenticated users full access
CREATE POLICY "Allow full access to authenticated users" ON public.products
  FOR ALL USING (true);
  
CREATE POLICY "Allow full access to authenticated users" ON public.production_entries
  FOR ALL USING (true);
  
CREATE POLICY "Allow full access to authenticated users" ON public.disposal_entries
  FOR ALL USING (true);

-- Add sample products with proper categories
INSERT INTO public.products (name, category, description, unit) VALUES
('Pão Francês', 'Pães', 'Pão tradicional francês crocante', 'unit'),
('Pão de Forma', 'Pães', 'Pão de forma macio para sanduíches', 'loaf'),
('Croissant', 'Confeitaria', 'Croissant de massa folhada amanteigada', 'piece'),
('Bolo de Chocolate', 'Bolos', 'Bolo macio de chocolate com cobertura', 'cake'),
('Coxinha', 'Salgados', 'Salgado de massa de batata recheado com frango', 'piece'),
('Esfiha', 'Salgados', 'Massa recheada com carne temperada', 'piece'),
('Bolo de Cenoura', 'Bolos', 'Bolo de cenoura com cobertura de chocolate', 'cake'),
('Pão de Queijo', 'Salgados', 'Pão de queijo mineiro tradicional', 'piece'),
('Torta de Limão', 'Confeitaria', 'Torta de limão com massa crocante', 'piece'),
('Brigadeiro', 'Confeitaria', 'Doce tradicional de chocolate', 'piece');

-- Get the product IDs for use in sample entries
WITH product_ids AS (
  SELECT id, name FROM public.products
)
-- Add sample production entries with proper timestamp handling
INSERT INTO public.production_entries (
  staff_name, date, product_id, product_name, 
  quantity, shift, expiration_date
)
SELECT 
  CASE 
    WHEN MOD(s.n, 3) = 0 THEN 'Maria Silva'
    WHEN MOD(s.n, 3) = 1 THEN 'João Oliveira'
    ELSE 'Ana Santos'
  END,
  (CURRENT_DATE - (RANDOM() * 30)::integer)::timestamp with time zone,
  p.id,
  p.name,
  ROUND((RANDOM() * 100)::numeric, 2),
  CASE 
    WHEN RANDOM() > 0.66 THEN 'morning' 
    WHEN RANDOM() > 0.33 THEN 'afternoon'
    ELSE 'night' 
  END,
  (CURRENT_DATE + (RANDOM() * 10)::integer)::timestamp with time zone
FROM product_ids p
CROSS JOIN generate_series(1, 3) AS s(n);

-- Get the product IDs again for the disposal entries
WITH product_ids AS (
  SELECT id, name FROM public.products
)
-- Add sample disposal entries with proper timestamp handling
INSERT INTO public.disposal_entries (
  staff_name, date, product_id, product_name, 
  quantity, shift, reason, notes
)
SELECT 
  CASE 
    WHEN MOD(s.n, 3) = 0 THEN 'Carlos Mendes'
    WHEN MOD(s.n, 3) = 1 THEN 'Luiza Costa'
    ELSE 'Roberto Alves'
  END,
  (CURRENT_DATE - (RANDOM() * 30)::integer)::timestamp with time zone,
  p.id,
  p.name,
  ROUND((RANDOM() * 20)::numeric, 2),
  CASE 
    WHEN RANDOM() > 0.66 THEN 'morning' 
    WHEN RANDOM() > 0.33 THEN 'afternoon'
    ELSE 'night' 
  END,
  CASE 
    WHEN RANDOM() > 0.8 THEN 'Expired/Vencidos'
    WHEN RANDOM() > 0.6 THEN 'Damaged/Danificados'
    WHEN RANDOM() > 0.4 THEN 'Unsold/Não Vendido'
    WHEN RANDOM() > 0.2 THEN 'Quality Issues/Problemas de Qualidade'
    ELSE 'Return/Devoluções de Clientes'
  END,
  CASE 
    WHEN RANDOM() > 0.7 THEN 'Cliente reclamou do sabor'
    WHEN RANDOM() > 0.4 THEN 'Produto com aparência ruim'
    ELSE NULL
  END
FROM product_ids p
CROSS JOIN generate_series(1, 2) AS s(n); 