import { BooksModule } from './books/books.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

export const AppModules = [UsersModule, AuthModule, BooksModule];
