import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { TransactionDraftDto } from '../dto/transaction-draft.dto';
import { TRANSACTION_DRAFT_SCHEMA } from '../schema/transaction-draft.schema';

export class InvalidTransactionDraftError extends Error {
  constructor() {
    super('Invalid transaction draft.');
    this.name = 'InvalidTransactionDraftError';
  }
}

export function parseGeminiOutput(output: string): TransactionDraftDto {
  let data: unknown;
  try {
    data = JSON.parse(output);
  } catch {
    throw new InvalidTransactionDraftError();
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new InvalidTransactionDraftError();
  }
  // Check own keys before transformation so missing fields and stripped prototype keys fail too.
  const fields = TRANSACTION_DRAFT_SCHEMA.required;
  if (
    fields.some((key) => !Object.hasOwn(data, key)) ||
    Object.keys(data).some((key) => !fields.includes(key))
  ) {
    throw new InvalidTransactionDraftError();
  }
  const draft = plainToInstance(TransactionDraftDto, data, { enableImplicitConversion: false });
  const errors = validateSync(draft, {
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
  });
  if (errors.length) throw new InvalidTransactionDraftError();
  return draft;
}

export function parseMoneyExpression(input: string): string | null {
  // Bound input before BigInt conversion; the public DTO also limits this field.
  if (typeof input !== 'string' || input.length > 80) return null;
  let text = input
    .trim()
    .toLowerCase()
    .replace(/\s*(?:vnd|đồng|đ)\s*$/u, '')
    .trim();
  if (/^\d{1,3}(?:\.\d{3})+$/.test(text) || /^\d{1,3}(?:,\d{3})+$/.test(text)) {
    text = text.replace(/[.,]/g, '');
  }
  const match = /^(\d{1,13})(?:[.,](\d{1,2}))?\s*(k|nghìn|ngàn|tr|triệu|m)?$/u.exec(text);
  if (!match) return null;
  const [, whole, fraction = '', unit] = match;
  if (fraction && !unit) return null;
  const multiplier = ['k', 'nghìn', 'ngàn'].includes(unit) ? 1000n : unit ? 1000000n : 1n;
  const denominator = 10n ** BigInt(fraction.length);
  const scaled = (BigInt(whole) * denominator + BigInt(fraction || '0')) * multiplier;
  if (scaled % denominator !== 0n) return null;
  const amount = scaled / denominator;
  return amount > 0n && amount <= 1000000000000n ? amount.toString() : null;
}

export function hasAmountEvidence(text: string, amountText: string): boolean {
  // Require a quoted amount from the input, not a number invented/converted by the model.
  const escaped = amountText
    .trim()
    .split(/\s+/u)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\s*');
  return (
    escaped.length > 0 &&
    new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu').test(text)
  );
}
