-- Migration 026: Allow products.category_id to be NULL when product categories are deleted
ALTER TABLE products DROP FOREIGN KEY fk_products_category;
ALTER TABLE products MODIFY COLUMN category_id INT NULL DEFAULT NULL;
ALTER TABLE products ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES product_categories (id) ON DELETE SET NULL ON UPDATE CASCADE;
