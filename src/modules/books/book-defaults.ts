import { CategoryCodeEnum, WalletKindEnum } from '../../config/enums';

export const DEFAULT_CATEGORIES = [
  { code: CategoryCodeEnum.Food, name: 'Ăn uống', sortOrder: 1 },
  { code: CategoryCodeEnum.Transport, name: 'Di chuyển', sortOrder: 2 },
  { code: CategoryCodeEnum.Shopping, name: 'Mua sắm', sortOrder: 3 },
  { code: CategoryCodeEnum.Bills, name: 'Hóa đơn', sortOrder: 4 },
  { code: CategoryCodeEnum.Entertainment, name: 'Giải trí', sortOrder: 5 },
  { code: CategoryCodeEnum.Other, name: 'Khác', sortOrder: 6 },
] as const;

export const DEFAULT_WALLETS = [
  { name: 'Tiền mặt', kind: WalletKindEnum.Cash },
  { name: 'Chuyển khoản', kind: WalletKindEnum.Bank },
] as const;
