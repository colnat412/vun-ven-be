import { BadRequestException } from '@nestjs/common';

export function budgetMonth(month: string) {
  if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new BadRequestException('Invalid budget month.');
  }
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5));
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return { startDate: `${month}-01`, endDate: `${month}-${days}` };
}

export function budgetProgress(limitVnd: string | null, spentVnd: string) {
  if (limitVnd === null) {
    return { remainingVnd: null, usedPercent: null, status: 'unset' as const };
  }
  const limit = BigInt(limitVnd);
  const spent = BigInt(spentVnd);
  return {
    remainingVnd: (limit - spent).toString(),
    usedPercent: limit > 0n ? Number((spent * 10000n) / limit) / 100 : null,
    status:
      spent > limit
        ? 'over'
        : spent === limit
          ? 'reached'
          : spent * 100n >= limit * 80n
            ? 'warning'
            : 'normal',
  };
}

export function previousBudgetMonth(month: string) {
  budgetMonth(month);
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() - 1);
  const previous = date.toISOString().slice(0, 7);
  budgetMonth(previous);
  return previous;
}
