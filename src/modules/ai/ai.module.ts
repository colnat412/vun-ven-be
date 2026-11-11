import { Module } from '@nestjs/common';
import { BooksModule } from '../books/books.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';

@Module({
  imports: [BooksModule],
  controllers: [AiController],
  providers: [AiService, GeminiService],
})
export class AiModule {}
