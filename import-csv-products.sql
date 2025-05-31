-- Import products from CSV file
-- This script imports products from the provided CSV file
-- It automatically determines appropriate units based on product categories

-- First, create a temporary table matching the CSV structure
CREATE TEMP TABLE temp_products_csv (
  id TEXT,
  product_name TEXT,
  category TEXT,
  unit TEXT
);

-- Create a staging table for processed data
CREATE TEMP TABLE processed_products (
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  description TEXT
);

-- Use COPY command to import data from CSV file
-- Note: Replace 'path/to/your/file.csv' with the actual absolute path to your CSV file
-- For Supabase, you might need to upload the CSV file first
-- COPY temp_products_csv FROM '/path/to/your/file.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Instead of direct COPY which might not work in all environments, we'll use an alternative approach
-- Insert the CSV data manually (you would typically use COPY instead of this approach)
-- This is a demonstration with the first few rows - you can add more rows as needed
INSERT INTO temp_products_csv (id, product_name, category, unit) VALUES
('1', 'Peta', 'In Display/Itens em Exposição', ''),
('2', 'Rosca Caseira Frita', 'In Display/Itens em Exposição', ''),
('3', 'Rosca Trançada de Coco', 'In Display/Itens em Exposição', ''),
('4', 'Rosca Caracol com Coco', 'In Display/Itens em Exposição', ''),
('5', 'Rosca Caracol  com Crème', 'In Display/Itens em Exposição', ''),
-- Add more rows here as needed
('129', 'Mini Kibe', 'Savory Snacks/Salgados', '');

-- Process the imported data with appropriate units based on category and product name
INSERT INTO processed_products (product_name, category, unit, description)
SELECT 
  product_name,
  category,
  CASE
    -- Assign units based on category
    WHEN LOWER(category) LIKE '%refrigerado%' THEN
      CASE
        WHEN LOWER(product_name) LIKE '%bolo%' THEN 'cake'
        WHEN LOWER(product_name) LIKE '%mousse%' THEN 'cup'
        WHEN LOWER(product_name) LIKE '%copo%' THEN 'cup'
        WHEN LOWER(product_name) LIKE '%torta%' THEN 'slice'
        WHEN LOWER(product_name) LIKE '%pudim%' THEN 'slice'
        ELSE 'piece'
      END
    WHEN LOWER(category) LIKE '%embalado%' THEN
      CASE
        WHEN LOWER(product_name) LIKE '%bolo%' THEN 'cake'
        WHEN LOWER(product_name) LIKE '%pão%' THEN 'loaf'
        WHEN LOWER(product_name) LIKE '%biscoito%' THEN 'pack'
        ELSE 'piece'
      END
    WHEN LOWER(category) LIKE '%salgados%' THEN 'piece'
    WHEN LOWER(category) LIKE '%exposição%' THEN
      CASE
        WHEN LOWER(product_name) LIKE '%bolo%' THEN 'slice'
        ELSE 'piece'
      END
    ELSE 'unit' -- Default unit
  END AS unit,
  'Produto ' || product_name AS description
FROM temp_products_csv
WHERE product_name IS NOT NULL AND product_name != '';

-- Insert processed products into the actual products table
INSERT INTO public.products (name, category, unit, description)
SELECT 
  product_name,
  category,
  unit,
  description
FROM processed_products;

-- Clean up temporary tables
DROP TABLE temp_products_csv;
DROP TABLE processed_products;

-- Confirm the import
SELECT COUNT(*) FROM public.products; 