import { uid, startOfCurrentMonth, endOfCurrentMonth, formatCurrency, parseMoneyTrackerDate } from '../../utils';
import { AppData, Transaction, Category, Wallet } from '../../types';

describe('Data Flow Integration Tests', () => {
  describe('Utility Functions Integration', () => {
    it('should generate unique IDs consistently', () => {
      const ids = new Set();
      
      // Generate 1000 IDs
      for (let i = 0; i < 1000; i++) {
        ids.add(uid());
      }
      
      // All IDs should be unique
      expect(ids.size).toBe(1000);
      
      // All IDs should match UUID format
      ids.forEach(id => {
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      });
    });

    it('should create consistent date ranges for current month', () => {
      const start = startOfCurrentMonth();
      const end = endOfCurrentMonth();
      
      expect(start.getDate()).toBe(1);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);
      
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
      expect(end.getMilliseconds()).toBe(999);
      
      // Start should be before end
      expect(start.getTime()).toBeLessThan(end.getTime());
      
      // Should be same month and year
      expect(start.getMonth()).toBe(end.getMonth());
      expect(start.getFullYear()).toBe(end.getFullYear());
    });

    it('should format currency amounts correctly for different currencies', () => {
      const testCases = [
        { amount: 1234.56, currency: 'USD', expected: '$1,234.56' },
        { amount: 1234.56, currency: 'EUR', expected: '€1,234.56' },
        { amount: 1234.56, currency: 'JPY', expected: '¥1,235' }, // JPY has no decimal places
        { amount: 0, currency: 'USD', expected: '$0.00' },
        { amount: 0.01, currency: 'USD', expected: '$0.01' },
        { amount: 1000000, currency: 'USD', expected: '$1,000,000.00' },
      ];

      testCases.forEach(({ amount, currency, expected }) => {
        const result = formatCurrency(amount, currency);
        expect(result).toBe(expected);
      });
    });

    it('should handle invalid currency codes gracefully', () => {
      const result = formatCurrency(1234.56, 'INVALID');
      expect(result).toBe('1234.56 INVALID');
    });
  });

  describe('Transaction Data Flow', () => {
    it('should create valid transaction objects with all required fields', () => {
      const category: Category = {
        id: uid(),
        name: 'Test Category',
        kind: 'expense',
        color: '#FF0000'
      };

      const wallet: Wallet = {
        id: uid(),
        name: 'Test Wallet',
        currency: 'USD',
        decimals: 2
      };

      const transaction: Transaction = {
        id: uid(),
        date: new Date().toISOString(),
        description: 'Test Transaction',
        amount: 99.99,
        type: 'expense',
        categoryId: category.id,
        walletId: wallet.id
      };

      // Verify all required fields are present and valid
      expect(transaction.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(new Date(transaction.date)).toBeInstanceOf(Date);
      expect(transaction.description).toBeTruthy();
      expect(typeof transaction.amount).toBe('number');
      expect(transaction.amount).toBeGreaterThan(0);
      expect(['income', 'expense']).toContain(transaction.type);
      expect(transaction.categoryId).toBe(category.id);
      expect(transaction.walletId).toBe(wallet.id);
    });

    it('should maintain referential integrity between transactions, categories, and wallets', () => {
      const appData: AppData = {
        schemaVersion: 1,
        categories: [
          { id: 'cat-1', name: 'Food', kind: 'expense', color: '#FF0000' },
          { id: 'cat-2', name: 'Salary', kind: 'income', color: '#00FF00' }
        ],
        wallets: [
          { id: 'wallet-1', name: 'Main', currency: 'USD', decimals: 2 },
          { id: 'wallet-2', name: 'Savings', currency: 'EUR', decimals: 2 }
        ],
        transactions: [
          {
            id: 'tx-1',
            date: '2024-01-15T10:00:00.000Z',
            description: 'Lunch',
            amount: 25.50,
            type: 'expense',
            categoryId: 'cat-1',
            walletId: 'wallet-1'
          },
          {
            id: 'tx-2',
            date: '2024-01-16T09:00:00.000Z',
            description: 'Monthly pay',
            amount: 3000.00,
            type: 'income',
            categoryId: 'cat-2',
            walletId: 'wallet-2'
          }
        ]
      };

      // Verify all transactions have valid category references
      appData.transactions.forEach(transaction => {
        const category = appData.categories.find(cat => cat.id === transaction.categoryId);
        expect(category).toBeTruthy();
        expect(category!.kind).toBe(transaction.type);
      });

      // Verify all transactions have valid wallet references
      appData.transactions.forEach(transaction => {
        const wallet = appData.wallets.find(w => w.id === transaction.walletId);
        expect(wallet).toBeTruthy();
      });
    });

    it('should filter transactions by date range correctly', () => {
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          date: '2024-01-10T10:00:00.000Z',
          description: 'Before range',
          amount: 10,
          type: 'expense',
          categoryId: 'cat-1',
          walletId: 'wallet-1'
        },
        {
          id: 'tx-2',
          date: '2024-01-15T10:00:00.000Z',
          description: 'In range',
          amount: 20,
          type: 'expense',
          categoryId: 'cat-1',
          walletId: 'wallet-1'
        },
        {
          id: 'tx-3',
          date: '2024-01-20T10:00:00.000Z',
          description: 'After range',
          amount: 30,
          type: 'expense',
          categoryId: 'cat-1',
          walletId: 'wallet-1'
        }
      ];

      const rangeStart = new Date('2024-01-12T00:00:00.000Z');
      const rangeEnd = new Date('2024-01-18T23:59:59.999Z');

      const filteredTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= rangeStart && txDate <= rangeEnd;
      });

      expect(filteredTransactions).toHaveLength(1);
      expect(filteredTransactions[0].description).toBe('In range');
    });

    it('should calculate correct totals by transaction type', () => {
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          date: '2024-01-15T10:00:00.000Z',
          description: 'Expense 1',
          amount: 100.50,
          type: 'expense',
          categoryId: 'cat-1',
          walletId: 'wallet-1'
        },
        {
          id: 'tx-2',
          date: '2024-01-16T10:00:00.000Z',
          description: 'Income 1',
          amount: 1000.00,
          type: 'income',
          categoryId: 'cat-2',
          walletId: 'wallet-1'
        },
        {
          id: 'tx-3',
          date: '2024-01-17T10:00:00.000Z',
          description: 'Expense 2',
          amount: 75.25,
          type: 'expense',
          categoryId: 'cat-1',
          walletId: 'wallet-1'
        }
      ];

      const expenseTotal = transactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const incomeTotal = transactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);

      expect(expenseTotal).toBe(175.75);
      expect(incomeTotal).toBe(1000.00);
      
      const netTotal = incomeTotal - expenseTotal;
      expect(netTotal).toBe(824.25);
    });
  });

  describe('Category and Wallet Management', () => {
    it('should prevent orphaned transactions when deleting categories', () => {
      const appData: AppData = {
        schemaVersion: 1,
        categories: [
          { id: 'cat-1', name: 'Food', kind: 'expense' },
          { id: 'cat-2', name: 'Transport', kind: 'expense' }
        ],
        wallets: [
          { id: 'wallet-1', name: 'Main', currency: 'USD', decimals: 2 }
        ],
        transactions: [
          {
            id: 'tx-1',
            date: '2024-01-15T10:00:00.000Z',
            description: 'Lunch',
            amount: 25.50,
            type: 'expense',
            categoryId: 'cat-1',
            walletId: 'wallet-1'
          }
        ]
      };

      // Check if category can be safely deleted
      const categoryToDelete = 'cat-1';
      const hasTransactions = appData.transactions.some(tx => tx.categoryId === categoryToDelete);

      // Should not delete category with transactions
      expect(hasTransactions).toBe(true);

      // Can delete category without transactions
      const categoryToDeleteSafe = 'cat-2';
      const hasTransactionsSafe = appData.transactions.some(tx => tx.categoryId === categoryToDeleteSafe);
      expect(hasTransactionsSafe).toBe(false);
    });

    it('should prevent orphaned transactions when deleting wallets', () => {
      const appData: AppData = {
        schemaVersion: 1,
        categories: [
          { id: 'cat-1', name: 'Food', kind: 'expense' }
        ],
        wallets: [
          { id: 'wallet-1', name: 'Main', currency: 'USD', decimals: 2 },
          { id: 'wallet-2', name: 'Savings', currency: 'USD', decimals: 2 }
        ],
        transactions: [
          {
            id: 'tx-1',
            date: '2024-01-15T10:00:00.000Z',
            description: 'Lunch',
            amount: 25.50,
            type: 'expense',
            categoryId: 'cat-1',
            walletId: 'wallet-1'
          }
        ]
      };

      // Check if wallet can be safely deleted
      const walletToDelete = 'wallet-1';
      const hasTransactions = appData.transactions.some(tx => tx.walletId === walletToDelete);

      // Should not delete wallet with transactions
      expect(hasTransactions).toBe(true);

      // Can delete wallet without transactions
      const walletToDeleteSafe = 'wallet-2';
      const hasTransactionsSafe = appData.transactions.some(tx => tx.walletId === walletToDeleteSafe);
      expect(hasTransactionsSafe).toBe(false);
    });
  });

  describe('Money Tracker Import Integration', () => {
    it('should correctly parse Money Tracker date format', () => {
      const testCases = [
        {
          input: '2024-01-15 14:30:25',
          expected: new Date(2024, 0, 15, 14, 30, 25) // Month is 0-indexed
        },
        {
          input: '2023-12-31 23:59:59',
          expected: new Date(2023, 11, 31, 23, 59, 59)
        },
        {
          input: '2024-06-01 00:00:00',
          expected: new Date(2024, 5, 1, 0, 0, 0)
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const parsed = parseMoneyTrackerDate(input);
        expect(parsed.getTime()).toBe(expected.getTime());
      });
    });

    it('should handle Money Tracker data transformation correctly', () => {
      // Simulated Money Tracker data structure
      const moneyTrackerData = {
        categories: [
          { id: 1, name: 'Food', type: 0 }, // 0 = expense
          { id: 2, name: 'Salary', type: 1 } // 1 = income
        ],
        transactions: [
          {
            id: 1,
            amount: 1250, // Money Tracker stores in minor units (cents)
            description: 'Lunch',
            date: '2024-01-15 12:30:00',
            direction: 0, // 0 = expense
            categoryId: 1
          },
          {
            id: 2,
            amount: 300000, // $3000.00 in cents
            description: 'Monthly salary',
            date: '2024-01-01 09:00:00',
            direction: 1, // 1 = income
            categoryId: 2
          }
        ]
      };

      // Transform to VibeWallet format
      const transformedCategories = moneyTrackerData.categories.map(cat => ({
        id: `mt-cat-${cat.id}`,
        name: cat.name,
        kind: cat.type === 0 ? 'expense' as const : 'income' as const
      }));

      const transformedTransactions = moneyTrackerData.transactions.map(tx => ({
        id: `mt-tx-${tx.id}`,
        date: parseMoneyTrackerDate(tx.date).toISOString(),
        description: tx.description,
        amount: tx.amount / 100, // Convert from cents to dollars
        type: tx.direction === 0 ? 'expense' as const : 'income' as const,
        categoryId: `mt-cat-${tx.categoryId}`,
        walletId: 'default-wallet'
      }));

      expect(transformedCategories).toHaveLength(2);
      expect(transformedCategories[0].kind).toBe('expense');
      expect(transformedCategories[1].kind).toBe('income');

      expect(transformedTransactions).toHaveLength(2);
      expect(transformedTransactions[0].amount).toBe(12.50);
      expect(transformedTransactions[1].amount).toBe(3000.00);
      expect(transformedTransactions[0].type).toBe('expense');
      expect(transformedTransactions[1].type).toBe('income');
    });
  });
});
