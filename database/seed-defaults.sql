-- Optional: run after registering a user through POST /api/auth/register.
-- Replace the email below. If the user does not exist, no data is inserted.
-- Reuses the first existing book, or creates one. Run serially during initial setup.
SET NAMES utf8mb4;
SET SESSION time_zone = '+00:00';
USE vunven;
SET @owner_email = 'replace-with-your-registered-email@example.com';
SET @owner_id = (SELECT id FROM users WHERE email = @owner_email);
SET @book_id = COALESCE(
  (SELECT id FROM books WHERE owner_id = @owner_id ORDER BY created_at, id LIMIT 1),
  UUID()
);

START TRANSACTION;
INSERT INTO user_settings (user_id, theme)
SELECT @owner_id, 'light'
WHERE @owner_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM user_settings WHERE user_id = @owner_id);

INSERT INTO books (id, owner_id, name)
SELECT @book_id, @owner_id, 'Sổ cá nhân'
WHERE @owner_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM books WHERE id = @book_id);

INSERT INTO categories (id, book_id, code, name, sort_order)
SELECT UUID(), @book_id, defaults.code, defaults.name, defaults.sort_order
FROM (
  SELECT 'food' AS code, 'Ăn uống' AS name, 1 AS sort_order
  UNION ALL SELECT 'transport', 'Di chuyển', 2
  UNION ALL SELECT 'shopping', 'Mua sắm', 3
  UNION ALL SELECT 'bills', 'Hóa đơn', 4
  UNION ALL SELECT 'entertainment', 'Giải trí', 5
  UNION ALL SELECT 'other', 'Khác', 6
) AS defaults
WHERE @owner_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM categories c WHERE c.book_id = @book_id AND c.code = defaults.code
  );

INSERT INTO wallets (id, book_id, name, kind)
SELECT UUID(), @book_id, defaults.name, defaults.kind
FROM (
  SELECT 'Tiền mặt' AS name, 'cash' AS kind
  UNION ALL SELECT 'Chuyển khoản', 'bank'
) AS defaults
WHERE @owner_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM wallets w WHERE w.book_id = @book_id AND w.name = defaults.name
  );
COMMIT;

SELECT @owner_id AS user_id, @book_id AS book_id,
  CASE WHEN @owner_id IS NULL THEN 'User not found: register first and edit @owner_email'
       ELSE 'Default book, categories and wallets are ready' END AS result;
