// ---------- Types ----------

export type UUID = string;

export type CategoryKind = 'income' | 'expense';

export type Category = {
  id: UUID;
  name: string;
  kind: CategoryKind;
  color?: string; // hex color like #FF0000
};

export type Wallet = {
  id: UUID;
  name: string;
  currency: string; // e.g., 'USD'
  decimals: number; // e.g., 2
};

export type Transaction = {
  id: UUID;
  date: string; // ISO string
  description: string;
  amount: number; // major units (e.g., 12.34)
  type: 'income' | 'expense';
  categoryId: UUID;
  walletId: UUID;
};

// Data persisted in AsyncStorage
export type AppData = {
  schemaVersion: 1;
  categories: Category[];
  wallets: Wallet[];
  transactions: Transaction[];
};
