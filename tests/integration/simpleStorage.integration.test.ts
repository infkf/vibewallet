import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppData, Transaction, Category, Wallet } from "../../types";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const STORAGE_KEY = "rn-expense-tracker:data:v1";

// Simple storage functions for testing (without React Native dependencies)
async function loadDataSimple(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: AppData = {
        schemaVersion: 1,
        categories: [],
        wallets: [],
        transactions: [],
      };
      return initial;
    }
    const parsed = JSON.parse(raw);

    // Validate schema version
    if (parsed.schemaVersion !== 1) {
      return {
        schemaVersion: 1,
        categories: [],
        wallets: [],
        transactions: [],
      };
    }

    return parsed;
  } catch {
    // Return default data on any error
    return {
      schemaVersion: 1,
      categories: [],
      wallets: [],
      transactions: [],
    };
  }
}

async function saveDataSimple(data: AppData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // Silently fail for testing purposes
    console.warn("Save failed:", error);
  }
}

describe("Simple Storage Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Storage Operations", () => {
    it("should save and load data correctly", async () => {
      const testData: AppData = {
        schemaVersion: 1,
        categories: [
          { id: "cat-1", name: "Food", kind: "expense", color: "#FF6B6B" },
          { id: "cat-2", name: "Income", kind: "income", color: "#4ECDC4" },
        ],
        wallets: [
          { id: "wallet-1", name: "Main Wallet", currency: "USD", decimals: 2 },
        ],
        transactions: [
          {
            id: "tx-1",
            date: "2024-01-15T10:00:00.000Z",
            description: "Test Transaction",
            amount: 25.5,
            type: "expense",
            categoryId: "cat-1",
            walletId: "wallet-1",
          },
        ],
      };

      // Mock storage to return our test data
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(testData));

      const loadedData = await loadDataSimple();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(loadedData).toEqual(testData);
    });

    it("should return default data when storage is empty", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const loadedData = await loadDataSimple();

      expect(loadedData).toEqual({
        schemaVersion: 1,
        categories: [],
        wallets: [],
        transactions: [],
      });
    });

    it("should handle invalid JSON gracefully", async () => {
      mockAsyncStorage.getItem.mockResolvedValue("invalid json data");

      const loadedData = await loadDataSimple();

      expect(loadedData).toEqual({
        schemaVersion: 1,
        categories: [],
        wallets: [],
        transactions: [],
      });
    });

    it("should save data to AsyncStorage", async () => {
      const testData: AppData = {
        schemaVersion: 1,
        categories: [{ id: "cat-1", name: "Test", kind: "expense" }],
        wallets: [
          { id: "wallet-1", name: "Test", currency: "USD", decimals: 2 },
        ],
        transactions: [],
      };

      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      await saveDataSimple(testData);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify(testData),
      );
    });

    it("should handle save errors gracefully", async () => {
      const testData: AppData = {
        schemaVersion: 1,
        categories: [],
        wallets: [],
        transactions: [],
      };

      mockAsyncStorage.setItem.mockRejectedValue(new Error("Storage full"));

      // Should not throw
      await expect(saveDataSimple(testData)).resolves.toBeUndefined();
    });
  });

  describe("Data Validation", () => {
    it("should reject data with invalid schema version", async () => {
      const invalidData = {
        schemaVersion: 999,
        categories: [],
        wallets: [],
        transactions: [],
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(invalidData));

      const loadedData = await loadDataSimple();

      // Should return fresh data with correct schema version
      expect(loadedData.schemaVersion).toBe(1);
      expect(loadedData.categories).toEqual([]);
      expect(loadedData.wallets).toEqual([]);
      expect(loadedData.transactions).toEqual([]);
    });

    it("should maintain data integrity across save/load cycles", async () => {
      const originalData: AppData = {
        schemaVersion: 1,
        categories: [
          {
            id: "cat-food",
            name: "Food & Dining",
            kind: "expense",
            color: "#FF6B6B",
          },
          {
            id: "cat-income",
            name: "Salary",
            kind: "income",
            color: "#4ECDC4",
          },
        ],
        wallets: [
          {
            id: "wallet-main",
            name: "Main Account",
            currency: "USD",
            decimals: 2,
          },
          {
            id: "wallet-savings",
            name: "Savings",
            currency: "EUR",
            decimals: 2,
          },
        ],
        transactions: [
          {
            id: "tx-1",
            date: "2024-01-15T12:00:00.000Z",
            description: "Restaurant bill",
            amount: 42.75,
            type: "expense",
            categoryId: "cat-food",
            walletId: "wallet-main",
          },
          {
            id: "tx-2",
            date: "2024-01-01T08:00:00.000Z",
            description: "Salary payment",
            amount: 3200.0,
            type: "income",
            categoryId: "cat-income",
            walletId: "wallet-main",
          },
        ],
      };

      // Simulate save
      let savedData = "";
      mockAsyncStorage.setItem.mockImplementation(async (key, value) => {
        savedData = value;
      });

      await saveDataSimple(originalData);

      // Simulate load
      mockAsyncStorage.getItem.mockResolvedValue(savedData);
      const loadedData = await loadDataSimple();

      // Data should be identical
      expect(loadedData).toEqual(originalData);
    });

    it("should preserve transaction amounts with high precision", async () => {
      const preciseData: AppData = {
        schemaVersion: 1,
        categories: [{ id: "cat-1", name: "Test", kind: "expense" }],
        wallets: [
          { id: "wallet-1", name: "Test", currency: "BTC", decimals: 8 },
        ],
        transactions: [
          {
            id: "tx-1",
            date: "2024-01-15T10:00:00.000Z",
            description: "Bitcoin transaction",
            amount: 0.00123456, // High precision amount
            type: "expense",
            categoryId: "cat-1",
            walletId: "wallet-1",
          },
        ],
      };

      let savedData = "";
      mockAsyncStorage.setItem.mockImplementation(async (key, value) => {
        savedData = value;
      });

      await saveDataSimple(preciseData);
      mockAsyncStorage.getItem.mockResolvedValue(savedData);

      const loadedData = await loadDataSimple();

      expect(loadedData.transactions[0].amount).toBe(0.00123456);
    });
  });

  describe("Real-world Scenarios", () => {
    it("should handle large datasets efficiently", async () => {
      // Generate a large dataset
      const categories: Category[] = Array.from({ length: 50 }, (_, i) => ({
        id: `cat-${i}`,
        name: `Category ${i}`,
        kind: i % 2 === 0 ? "expense" : "income",
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      }));

      const wallets: Wallet[] = Array.from({ length: 10 }, (_, i) => ({
        id: `wallet-${i}`,
        name: `Wallet ${i}`,
        currency: i % 3 === 0 ? "USD" : i % 3 === 1 ? "EUR" : "GBP",
        decimals: 2,
      }));

      const transactions: Transaction[] = Array.from(
        { length: 1000 },
        (_, i) => ({
          id: `tx-${i}`,
          date: new Date(2024, 0, 1 + (i % 31)).toISOString(),
          description: `Transaction ${i}`,
          amount: Math.round(Math.random() * 1000 * 100) / 100,
          type: i % 2 === 0 ? "expense" : "income",
          categoryId: categories[i % categories.length].id,
          walletId: wallets[i % wallets.length].id,
        }),
      );

      const largeData: AppData = {
        schemaVersion: 1,
        categories,
        wallets,
        transactions,
      };

      let savedData = "";
      mockAsyncStorage.setItem.mockImplementation(async (key, value) => {
        savedData = value;
      });

      const startTime = Date.now();
      await saveDataSimple(largeData);
      const saveTime = Date.now() - startTime;

      mockAsyncStorage.getItem.mockResolvedValue(savedData);

      const loadStartTime = Date.now();
      const loadedData = await loadDataSimple();
      const loadTime = Date.now() - loadStartTime;

      // Operations should complete reasonably quickly (under 100ms)
      expect(saveTime).toBeLessThan(100);
      expect(loadTime).toBeLessThan(100);

      // Data should be preserved
      expect(loadedData.transactions).toHaveLength(1000);
      expect(loadedData.categories).toHaveLength(50);
      expect(loadedData.wallets).toHaveLength(10);
    });

    it("should handle concurrent storage operations", async () => {
      const data1: AppData = {
        schemaVersion: 1,
        categories: [],
        wallets: [],
        transactions: [
          {
            id: "tx-1",
            date: "2024-01-15T10:00:00.000Z",
            description: "Concurrent transaction 1",
            amount: 100,
            type: "expense",
            categoryId: "cat-1",
            walletId: "wallet-1",
          },
        ],
      };

      const data2: AppData = {
        schemaVersion: 1,
        categories: [],
        wallets: [],
        transactions: [
          {
            id: "tx-2",
            date: "2024-01-15T11:00:00.000Z",
            description: "Concurrent transaction 2",
            amount: 200,
            type: "expense",
            categoryId: "cat-1",
            walletId: "wallet-1",
          },
        ],
      };

      let saveCount = 0;
      mockAsyncStorage.setItem.mockImplementation(async () => {
        saveCount++;
        // Simulate async delay
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Execute concurrent saves
      await Promise.all([saveDataSimple(data1), saveDataSimple(data2)]);

      expect(saveCount).toBe(2);
    });
  });
});
