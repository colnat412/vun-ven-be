-- Vun Ven: fresh database schema, MySQL 8.0.16+ (enforced CHECK constraints).
-- No DROP/TRUNCATE. Existing tables intentionally cause an error: this is not an upgrade migration.
-- UUIDs are supplied by the application (TypeORM uses varchar(36)).
-- All DATETIME values are UTC. occurred_on is the business date in the book timezone.
SET NAMES utf8mb4;
SET SESSION time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS vunven CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vunven;

CREATE TABLE users (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE user_settings (
  user_id VARCHAR(36) NOT NULL,
  theme ENUM('light', 'dark') NOT NULL DEFAULT 'light',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT ck_settings_theme CHECK (theme IN ('light', 'dark'))
) ENGINE=InnoDB;

CREATE TABLE books (
  id VARCHAR(36) NOT NULL,
  owner_id VARCHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  currency ENUM('VND') NOT NULL DEFAULT 'VND',
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_books_owner (owner_id),
  CONSTRAINT fk_books_owner FOREIGN KEY (owner_id) REFERENCES users (id),
  CONSTRAINT ck_books_currency CHECK (currency = 'VND')
) ENGINE=InnoDB;

CREATE TABLE categories (
  id VARCHAR(36) NOT NULL,
  book_id VARCHAR(36) NOT NULL,
  code ENUM('food', 'transport', 'shopping', 'bills', 'entertainment', 'other') NOT NULL,
  name VARCHAR(120) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_book_id (book_id, id),
  UNIQUE KEY uq_categories_book_code (book_id, code),
  KEY ix_categories_sort (book_id, is_active, sort_order),
  CONSTRAINT fk_categories_book FOREIGN KEY (book_id) REFERENCES books (id),
  CONSTRAINT ck_categories_active CHECK (is_active IN (0, 1)),
  CONSTRAINT ck_categories_sort CHECK (sort_order >= 0)
) ENGINE=InnoDB;

CREATE TABLE wallets (
  id VARCHAR(36) NOT NULL,
  book_id VARCHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  kind ENUM('cash', 'bank') NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_wallets_book_id (book_id, id),
  UNIQUE KEY uq_wallets_book_name (book_id, name),
  KEY ix_wallets_active (book_id, is_active),
  CONSTRAINT fk_wallets_book FOREIGN KEY (book_id) REFERENCES books (id),
  CONSTRAINT ck_wallets_kind CHECK (kind IN ('cash', 'bank')),
  CONSTRAINT ck_wallets_active CHECK (is_active IN (0, 1))
) ENGINE=InnoDB;

CREATE TABLE monthly_budgets (
  id VARCHAR(36) NOT NULL,
  book_id VARCHAR(36) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_limit_vnd BIGINT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_monthly_budgets_book_start (book_id, start_date),
  UNIQUE KEY uq_monthly_budgets_book_id (book_id, id),
  CONSTRAINT fk_monthly_budgets_book FOREIGN KEY (book_id) REFERENCES books (id),
  CONSTRAINT ck_monthly_budgets_dates CHECK (
    DAYOFMONTH(start_date) = 1 AND end_date = LAST_DAY(start_date)
  ),
  CONSTRAINT ck_monthly_budgets_limit CHECK (total_limit_vnd IS NULL OR total_limit_vnd >= 0)
) ENGINE=InnoDB;

CREATE TABLE category_budgets (
  budget_id VARCHAR(36) NOT NULL,
  category_id VARCHAR(36) NOT NULL,
  book_id VARCHAR(36) NOT NULL,
  limit_vnd BIGINT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (budget_id, category_id),
  KEY ix_category_budgets_book_budget (book_id, budget_id),
  KEY ix_category_budgets_book_category (book_id, category_id),
  CONSTRAINT fk_category_budgets_budget FOREIGN KEY (book_id, budget_id)
    REFERENCES monthly_budgets (book_id, id),
  CONSTRAINT fk_category_budgets_category FOREIGN KEY (book_id, category_id)
    REFERENCES categories (book_id, id),
  CONSTRAINT ck_category_budgets_limit CHECK (limit_vnd >= 0)
) ENGINE=InnoDB;

CREATE TABLE transactions (
  id VARCHAR(36) NOT NULL,
  book_id VARCHAR(36) NOT NULL,
  category_id VARCHAR(36) NULL,
  kind ENUM('income', 'expense', 'transfer') NOT NULL,
  amount_vnd BIGINT NOT NULL,
  note VARCHAR(160) NOT NULL DEFAULT '',
  occurred_on DATE NOT NULL,
  occurred_at_utc DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  version INT NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_transactions_book_id (book_id, id),
  KEY ix_transactions_date (book_id, occurred_on, id),
  KEY ix_transactions_kind_date (book_id, kind, occurred_on),
  KEY ix_transactions_category_date (book_id, category_id, occurred_on),
  CONSTRAINT fk_transactions_book FOREIGN KEY (book_id) REFERENCES books (id),
  CONSTRAINT fk_transactions_category FOREIGN KEY (book_id, category_id)
    REFERENCES categories (book_id, id),
  CONSTRAINT ck_transactions_kind CHECK (kind IN ('income', 'expense', 'transfer')),
  CONSTRAINT ck_transactions_amount CHECK (amount_vnd > 0),
  CONSTRAINT ck_transactions_version CHECK (version >= 1),
  CONSTRAINT ck_transactions_category CHECK (
    (kind IN ('income', 'expense') AND category_id IS NOT NULL)
    OR (kind = 'transfer' AND category_id IS NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE wallet_entries (
  id VARCHAR(36) NOT NULL,
  book_id VARCHAR(36) NOT NULL,
  transaction_id VARCHAR(36) NOT NULL,
  wallet_id VARCHAR(36) NOT NULL,
  delta_vnd BIGINT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_entries_transaction_wallet (transaction_id, wallet_id),
  KEY ix_entries_book_transaction (book_id, transaction_id),
  KEY ix_entries_book_wallet (book_id, wallet_id),
  CONSTRAINT fk_entries_transaction FOREIGN KEY (book_id, transaction_id)
    REFERENCES transactions (book_id, id),
  CONSTRAINT fk_entries_wallet FOREIGN KEY (book_id, wallet_id)
    REFERENCES wallets (book_id, id),
  CONSTRAINT ck_entries_delta CHECK (delta_vnd <> 0)
) ENGINE=InnoDB;

-- Query-time balance; no duplicated stored balance.
CREATE VIEW wallet_balances AS
SELECT w.id AS wallet_id, w.book_id, w.name, w.kind, w.is_active,
       COALESCE(SUM(e.delta_vnd), 0) AS balance_vnd
FROM wallets w
LEFT JOIN wallet_entries e ON e.book_id = w.book_id AND e.wallet_id = w.id
GROUP BY w.id, w.book_id, w.name, w.kind, w.is_active;

-- REQUIRED APPLICATION INVARIANTS (cross-row rules are not enforced by CHECK):
-- Write/update/delete transactions and their entries in one DB transaction.
-- income: exactly one entry, delta_vnd = amount_vnd.
-- expense: exactly one entry, delta_vnd = -amount_vnd.
-- transfer: exactly two different wallets, deltas = -amount_vnd and +amount_vnd.
-- On updates, compare and increment version to prevent lost writes.
-- Authorize book.owner_id against the authenticated user on every operation.
-- API money values must be decimal strings; do not coerce BIGINT to JS Number.
-- Configure every application DB session/server to UTC (driver timezone Z alone is insufficient).
