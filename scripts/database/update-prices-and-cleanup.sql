-- Update product prices and currency to euros
UPDATE products SET price = '37.00', currency = 'EUR' WHERE name = 'PMU Profit System';
UPDATE products SET price = '27.00', currency = 'EUR' WHERE name = 'PMU Ad Generator';
UPDATE products SET price = '33.00', currency = 'EUR' WHERE name = 'Consultation Success Blueprint';

-- Delete existing user entitlements
DELETE FROM user_entitlements;

-- Delete existing purchases
DELETE FROM purchases;

-- Delete existing users (from auth schema)
DELETE FROM auth.users;

-- Verify updated product prices
SELECT id, name, price, currency FROM products; 