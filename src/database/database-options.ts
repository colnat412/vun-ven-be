import { TransactionEntity } from '../modules/transactions/entities/transaction.entity';
import { WalletEntryEntity } from '../modules/transactions/entities/wallet-entry.entity';
import { UserEntity } from '../modules/users/entities/user.entity';
import { BookEntity } from '../modules/books/entities/book.entity';
import { CategoryEntity } from '../modules/categories/entities/category.entity';
import { WalletEntity } from '../modules/wallets/entities/wallet.entity';
import { DataSourceOptions } from 'typeorm';
import { MonthlyBudgetEntity } from '../modules/budgets/entities/monthly-budget.entity';
import { CategoryBudgetEntity } from '../modules/budgets/entities/category-budget.entity';

export const databaseConfig = (env: NodeJS.ProcessEnv): DataSourceOptions => {
  const port = Number(env.DB_PORT || 3306);
  if (
    !env.DB_HOST ||
    !env.DB_USERNAME ||
    !env.DB_PASSWORD ||
    !env.DB_NAME ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error('Missing or invalid database configuration');
  }
  return {
    type: 'mysql',
    host: env.DB_HOST,
    port,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    timezone: 'Z',
    charset: 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: true,
    entities: [
      UserEntity,
      BookEntity,
      CategoryEntity,
      WalletEntity,
      TransactionEntity,
      WalletEntryEntity,
      MonthlyBudgetEntity,
      CategoryBudgetEntity,
    ],
    synchronize: false,
    migrationsRun: false,
  };
};
