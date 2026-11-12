// Business modules select the purpose; clients cannot supply arbitrary storage paths.
export const IMAGE_FOLDERS = {
  avatar: 'vunven/avatars',
  transaction: 'vunven/transactions',
} as const;

export type ImagePurpose = keyof typeof IMAGE_FOLDERS;
