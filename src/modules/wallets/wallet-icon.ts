import { WalletKindEnum } from '../../config/enums';

export const WALLET_GENERIC_ICONS = ['banknote', 'landmark', 'wallet', 'credit-card', 'coins', 'smartphone', 'building'];
export const BANK_ICONS = ['vcb', 'mb', 'tcb', 'acb', 'bidv', 'icb', 'vpb', 'vib', 'vba', 'tpb', 'stb', 'hdb', 'ocb', 'shb', 'msb', 'eib', 'lpb'];
export const EWALLET_ICONS = ['momo', 'zalopay', 'shopeepay'];
export const WALLET_ICON_IDS = [...WALLET_GENERIC_ICONS, ...BANK_ICONS, ...EWALLET_ICONS];

export function isWalletIcon(value: unknown, kind: WalletKindEnum): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string') return false;
  return WALLET_GENERIC_ICONS.includes(value) ||
    (kind === WalletKindEnum.Bank && BANK_ICONS.includes(value)) ||
    (kind === WalletKindEnum.Ewallet && EWALLET_ICONS.includes(value));
}
