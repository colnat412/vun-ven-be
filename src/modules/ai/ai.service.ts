import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { TransactionKindEnum } from '../../config/enums/transaction-kind.enum';
import { BooksService } from '../books/books.service';
import { CreateTransactionDto } from '../transactions/dto/create-transaction.dto';
import { GeminiService } from './gemini.service';
import { TransactionDraftDto } from './dto/transaction-draft.dto';
import { AiParseResult } from './types';
import { hasAmountEvidence, parseMoneyExpression } from './utils/helper';

@Injectable()
export class AiService {
  constructor(
    private readonly books: BooksService,
    private readonly gemini: GeminiService,
  ) {}

  private needsInput(
    reason: Extract<AiParseResult, { status: 'needs_input' }>['reason'],
    message: string,
    draft?: TransactionDraftDto,
  ): AiParseResult {
    return {
      status: 'needs_input',
      reason,
      message,
      ...(draft ? { draft } : {}),
    };
  }

  async parsePhoto(ownerId: string, bookId: string, photoDataUrl: string) {
    const book = await this.books.findOne(ownerId, bookId);
    const categories = book.categories.filter((row) => row.isActive);
    const wallets = book.wallets.filter((row) => row.isActive);
    const draft = await this.gemini.parseTransaction(
      {
        text: 'Đọc ảnh để tạo một bản nháp thu chi. Không suy đoán số tiền không có trên ảnh.',
        timezone: book.timezone,
        receivedAt: new Date().toISOString(),
        categories: categories.map((row) => ({ id: row.id, name: row.name })),
        wallets: wallets.map((row) => ({
          id: row.id,
          name: row.name,
          kind: row.kind,
        })),
      },
      photoDataUrl,
    );
    return {
      amountVnd:
        !draft.hasMultipleTransactions && draft.amountText !== null
          ? parseMoneyExpression(draft.amountText)
          : null,
      kind: ['income', 'expense'].includes(draft.kind) ? draft.kind : null,
      categoryName: categories.find((row) => row.id === draft.categoryId)?.name ?? null,
      walletName: wallets.find((row) => row.id === draft.walletId)?.name ?? null,
      note: draft.note,
      dateText: draft.dateText,
      hasMultipleTransactions: draft.hasMultipleTransactions,
    };
  }

  async parse(
    ownerId: string,
    bookId: string,
    text: string,
    walletId?: string,
  ): Promise<AiParseResult> {
    const receivedAt = new Date();
    // Ownership must be checked before sending any book data to the provider.
    const book = await this.books.findOne(ownerId, bookId);
    const categories = book.categories.filter((row) => row.isActive);
    const wallets = book.wallets.filter((row) => row.isActive);
    if (!categories.length || !wallets.length) {
      return this.needsInput('missing_setup', 'Sổ cần có danh mục và ví đang hoạt động.');
    }
    const selectedWallet = walletId ? wallets.find((row) => row.id === walletId) : undefined;
    if (walletId && !selectedWallet) {
      return this.needsInput('invalid_wallet', 'Hãy chọn ngân hàng hoặc ví đang dùng trong sổ.');
    }
    const draft = await this.gemini.parseTransaction({
      text,
      timezone: book.timezone,
      receivedAt: receivedAt.toISOString(),
      categories: categories.map((row) => ({ id: row.id, name: row.name })),
      wallets: wallets.map((row) => ({
        id: row.id,
        name: row.name,
        kind: row.kind,
      })),
    });
    if (draft.hasMultipleTransactions) {
      return this.needsInput('multiple_transactions', 'Hãy nhập mỗi lần một giao dịch.', draft);
    }
    if (draft.kind === 'transfer') {
      return this.needsInput(
        'unsupported_transfer',
        'Ghi nhanh chưa hỗ trợ chuyển tiền giữa hai ví.',
        draft,
      );
    }
    if (draft.kind === 'unknown') {
      return this.needsInput(
        'unknown_kind',
        'Hãy mô tả rõ khoản thu hoặc khoản chi cần ghi.',
        draft,
      );
    }
    if (draft.dateText !== null) {
      return this.needsInput(
        'unsupported_date',
        'Giao dịch có ngày giờ cụ thể cần nhập bằng form chi tiết.',
        draft,
      );
    }
    const amountVnd = draft.amountText === null ? null : parseMoneyExpression(draft.amountText);
    if (!amountVnd || !hasAmountEvidence(text, draft.amountText)) {
      return this.needsInput('invalid_amount', 'Hãy nhập rõ số tiền, ví dụ 30k hoặc 30000.', draft);
    }
    const category = categories.find((row) => row.id === draft.categoryId);
    if (!category) {
      return this.needsInput(
        'invalid_category',
        'Chưa xác định được danh mục hợp lệ trong sổ.',
        draft,
      );
    }
    const wallet = selectedWallet ?? wallets.find((row) => row.id === draft.walletId);
    if (!wallet) {
      return this.needsInput('invalid_wallet', 'Bạn thanh toán hoặc nhận tiền bằng ví nào?', draft);
    }
    const transaction = plainToInstance(
      CreateTransactionDto,
      {
        kind: draft.kind === 'expense' ? TransactionKindEnum.Expense : TransactionKindEnum.Income,
        amountVnd,
        categoryId: category.id,
        walletId: wallet.id,
        note: draft.note,
        occurredAt: receivedAt.toISOString(),
      },
      { enableImplicitConversion: false },
    );
    if (validateSync(transaction, { whitelist: true, forbidNonWhitelisted: true }).length) {
      return this.needsInput(
        'invalid_transaction',
        'Dữ liệu chưa hợp lệ. Hãy nhập rõ hơn hoặc dùng form chi tiết.',
        draft,
      );
    }
    return {
      status: 'ready',
      transaction,
      display: { categoryName: category.name, walletName: wallet.name },
    };
  }
}
