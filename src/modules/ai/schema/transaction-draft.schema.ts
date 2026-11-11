export const kindEnum = ['income', 'expense', 'transfer', 'unknown'] as const;

export const TRANSACTION_DRAFT_SCHEMA = {
  type: 'object',

  properties: {
    kind: {
      type: 'string',
      enum: kindEnum,
    },

    amountText: {
      type: ['string', 'null'],
    },

    categoryId: {
      type: ['string', 'null'],
    },

    walletId: {
      type: ['string', 'null'],
    },

    note: {
      type: 'string',
    },

    dateText: {
      type: ['string', 'null'],
    },

    hasMultipleTransactions: {
      type: 'boolean',
    },
  },

  required: [
    'kind',
    'amountText',
    'categoryId',
    'walletId',
    'note',
    'dateText',
    'hasMultipleTransactions',
  ],

  additionalProperties: false,
};
