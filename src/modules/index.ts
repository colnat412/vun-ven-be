import { TransactionsModule } from './transactions/transactions.module';
import { BooksModule } from './books/books.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { BudgetsModule } from './budgets/budgets.module';
import { AiModule } from './ai/ai.module';
import { WalletsModule } from './wallets/wallets.module';

export const AppModules = [UsersModule, AuthModule, BooksModule, TransactionsModule, CategoriesModule, BudgetsModule, AiModule, WalletsModule];
