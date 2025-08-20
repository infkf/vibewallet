import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { AppData, Category, Transaction, Wallet } from "./types";
import { parseMoneyTrackerDate, uid } from "./utils";

const STORAGE_KEY = "rn-expense-tracker:data:v1";

// ---------- Storage ----------

export async function loadData(): Promise<AppData> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial: AppData = {
      schemaVersion: 1,
      categories: [],
      wallets: [],
      transactions: [],
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(raw);
}

export async function saveData(data: AppData) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ---------- Import (Money Tracker) & Export ----------

type MoneyTrackerCurrency = {
  iso: string;
  decimals: number;
};

type MoneyTrackerWallet = {
  id: string | number;
  name: string;
  currency?: string;
};

type MoneyTrackerCategory = {
  id: string | number;
  name: string;
  type: number; // 0 = income, 1 = expense, 2 = transfer
  icon?: string;
};

type MoneyTrackerTransaction = {
  id?: string | number;
  date: string;
  description?: string;
  money: number;
  direction?: number;
  type?: number;
  category?: string | number | { type?: number };
  wallet?: string | number;
  deleted?: boolean;
  count_in_total?: boolean;
};

type MoneyTrackerJSON = {
  header?: Record<string, unknown>;
  currencies?: MoneyTrackerCurrency[];
  wallets?: MoneyTrackerWallet[];
  categories?: MoneyTrackerCategory[];
  transactions?: MoneyTrackerTransaction[];
  transfers?: unknown[];
};

function detectMoneyTracker(json: unknown): json is MoneyTrackerJSON {
  return (
    json &&
    typeof json === "object" &&
    json !== null &&
    "categories" in json &&
    "transactions" in json &&
    Array.isArray((json as Record<string, unknown>).categories) &&
    Array.isArray((json as Record<string, unknown>).transactions) &&
    (Array.isArray((json as Record<string, unknown>).wallets) ||
      !("wallets" in json))
  );
}

function mapMoneyTrackerToApp(json: MoneyTrackerJSON): AppData {
  // Build currency decimals lookup
  const decimalsByIso = new Map<string, number>();
  (json.currencies || []).forEach((c) =>
    decimalsByIso.set(c.iso, c.decimals ?? 2),
  );

  // Wallets
  const wallets: Wallet[] = (json.wallets || []).map((w) => ({
    id: String(w.id),
    name: String(w.name),
    currency: String(w.currency || "USD"),
    decimals: decimalsByIso.get(String(w.currency || "USD")) ?? 2,
  }));

  // Categories: map type 0 => income, 1 => expense, 2 => transfer (skip)
  const categories: Category[] = (json.categories || [])
    .filter((c) => c.type !== 2)
    .map((c) => {
      let color: string | undefined;
      try {
        // Parse the icon field to extract color
        if (c.icon && typeof c.icon === "string") {
          const iconData = JSON.parse(c.icon);
          if (iconData.type === "color" && iconData.color) {
            color = String(iconData.color);
          }
        }
      } catch {
        // If parsing fails, color will remain undefined
      }

      return {
        id: String(c.id),
        name: String(c.name),
        kind: c.type === 0 ? "income" : "expense",
        color,
      };
    });

  const walletDecimals = new Map(
    wallets.map((w) => [w.id, w.decimals] as const),
  );
  // Remove unused variable
  // const walletCurrency = new Map(wallets.map(w => [w.id, w.currency] as const));
  const validCategoryIds = new Set(categories.map((c) => c.id));

  // Transactions
  const txs: Transaction[] = (json.transactions || [])
    .filter((t) => t.deleted === false || t.deleted === undefined)
    .filter((t) => t.count_in_total !== false)
    .filter((t) => t.category && validCategoryIds.has(String(t.category)))
    .map((t) => {
      const walletId = String(t.wallet || "default");
      const dec = walletDecimals.get(walletId) ?? 2;
      const amtMajor = Number(t.money) / Math.pow(10, dec);
      const type: "income" | "expense" =
        t.direction === 1 || t.type === 1 || t?.category?.type === 0
          ? "income"
          : "expense";
      const dateISO = parseMoneyTrackerDate(String(t.date)).toISOString();
      return {
        id: String(t.id || uid()),
        date: dateISO,
        description: String(t.description || ""),
        amount: Math.abs(amtMajor),
        type,
        categoryId: String(t.category),
        walletId,
      } as Transaction;
    });

  return {
    schemaVersion: 1,
    categories,
    wallets,
    transactions: txs,
  };
}

export async function pickAndImport(
  setData: (d: AppData) => void,
  currentData: AppData,
) {
  try {
    const res = await DocumentPicker.getDocumentAsync({
      type: "application/json",
    });
    if (res.canceled || !res.assets?.length) return;
    const file = res.assets[0];
    const contents = await FileSystem.readAsStringAsync(file.uri);
    const json = JSON.parse(contents);

    let importedData: AppData | null = null;
    if (detectMoneyTracker(json)) {
      importedData = mapMoneyTrackerToApp(json);
    } else if (
      json &&
      json.schemaVersion === 1 &&
      Array.isArray(json.transactions)
    ) {
      importedData = json as AppData;
    } else if (json && json.databases) {
      // Support importing database.json extracted from .mwbx
      const db = json.databases ? json : json; // already is database.json root
      if (detectMoneyTracker(db)) importedData = mapMoneyTrackerToApp(db);
    }

    if (!importedData) {
      Alert.alert("Import failed", "Unrecognized JSON format.");
      return;
    }

    // Merge with existing data, matching wallets by name
    const mergedData = mergeImportedData(currentData, importedData);

    await saveData(mergedData);
    setData(mergedData);
    Alert.alert(
      "Import done",
      `Imported ${importedData.transactions.length} transactions, ${importedData.categories.length} categories, ${importedData.wallets.length} wallets.`,
    );
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    Alert.alert("Import error", errorMessage);
  }
}

function mergeImportedData(
  currentData: AppData,
  importedData: AppData,
): AppData {
  // Create maps for efficient lookup
  const existingWalletsByName = new Map(
    currentData.wallets.map((w) => [w.name.toLowerCase(), w]),
  );
  const existingCategoriesByName = new Map(
    currentData.categories.map((c) => [c.name.toLowerCase(), c]),
  );

  // Merge wallets - match by name, add new ones
  const mergedWallets = [...currentData.wallets];
  const walletIdMapping = new Map<string, string>(); // old ID -> new ID

  for (const importedWallet of importedData.wallets) {
    const existingWallet = existingWalletsByName.get(
      importedWallet.name.toLowerCase(),
    );
    if (existingWallet) {
      // Wallet with same name exists, map the imported wallet ID to existing wallet ID
      walletIdMapping.set(importedWallet.id, existingWallet.id);
    } else {
      // New wallet, add it with a new ID to avoid conflicts
      const newWallet = { ...importedWallet, id: uid() };
      mergedWallets.push(newWallet);
      walletIdMapping.set(importedWallet.id, newWallet.id);
    }
  }

  // Merge categories - match by name and kind, add new ones
  const mergedCategories = [...currentData.categories];
  const categoryIdMapping = new Map<string, string>(); // old ID -> new ID

  for (const importedCategory of importedData.categories) {
    const existingCategory = existingCategoriesByName.get(
      importedCategory.name.toLowerCase(),
    );
    if (existingCategory && existingCategory.kind === importedCategory.kind) {
      // Category with same name and kind exists, map the imported category ID to existing category ID
      categoryIdMapping.set(importedCategory.id, existingCategory.id);
    } else {
      // New category, add it with a new ID to avoid conflicts
      const newCategory = { ...importedCategory, id: uid() };
      mergedCategories.push(newCategory);
      categoryIdMapping.set(importedCategory.id, newCategory.id);
    }
  }

  // Add transactions with updated wallet and category IDs
  const mergedTransactions = [...currentData.transactions];
  for (const importedTransaction of importedData.transactions) {
    const newWalletId = walletIdMapping.get(importedTransaction.walletId);
    const newCategoryId = categoryIdMapping.get(importedTransaction.categoryId);

    if (newWalletId && newCategoryId) {
      const newTransaction = {
        ...importedTransaction,
        id: uid(), // Generate new ID to avoid conflicts
        walletId: newWalletId,
        categoryId: newCategoryId,
      };
      mergedTransactions.push(newTransaction);
    }
  }

  return {
    ...currentData,
    wallets: mergedWallets,
    categories: mergedCategories,
    transactions: mergedTransactions,
  };
}

export async function exportData(data: AppData) {
  try {
    const payload = JSON.stringify(data, null, 2);
    const fileName = `expense_export_${Date.now()}.json`;
    const path = FileSystem.cacheDirectory! + fileName;
    await FileSystem.writeAsStringAsync(path, payload);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: "application/json" });
    } else {
      Alert.alert("Exported", `Saved to: ${path}`);
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    Alert.alert("Export error", errorMessage);
  }
}
