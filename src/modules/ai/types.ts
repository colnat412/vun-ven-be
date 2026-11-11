import { CreateTransactionDto } from '../transactions/dto/create-transaction.dto';
import { TransactionDraftDto } from './dto/transaction-draft.dto';

export type TransactionParseContext = {
  text: string;
  timezone: string;
  receivedAt: string;
  categories: Array<{ id: string; name: string }>;
  wallets: Array<{ id: string; name: string; kind: string }>;
};

export type AiParseResult =
  | {
      status: 'ready';
      transaction: CreateTransactionDto;
      display: { categoryName: string; walletName: string };
    }
  | {
      status: 'needs_input';
      reason:
        | 'missing_setup'
        | 'multiple_transactions'
        | 'unsupported_transfer'
        | 'unknown_kind'
        | 'invalid_amount'
        | 'invalid_category'
        | 'invalid_wallet'
        | 'unsupported_date'
        | 'invalid_transaction';
      message: string;
      draft?: TransactionDraftDto;
    };
