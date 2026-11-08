import { TransactionsModule } from './transactions/transactions.module';
import { BooksModule } from './books/books.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';

export const AppModules = [UsersModule, AuthModule, BooksModule, TransactionsModule, CategoriesModule];
