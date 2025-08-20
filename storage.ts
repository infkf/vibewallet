import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { AppData, Category, Transaction, Wallet } from './types';
import { parseMoneyTrackerDate, uid } from './utils';

const STORAGE_KEY = 'rn-expense-tracker:data:v1';

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

type MoneyTrackerJSON = {
  header?: any;
  currencies?: { iso: string; decimals: number }[];
  wallets?: any[];
  categories?: any[];
  transactions?: any[];
  transfers?: any[];
};

function detectMoneyTracker(json: any): json is MoneyTrackerJSON {
  return (
    json &&
    Array.isArray(json.categories) &&
    Array.isArray(json.transactions) &&
    (Array.isArray(json.wallets) || json.wallets === undefined)
  );
}

function mapMoneyTrackerToApp(json: MoneyTrackerJSON): AppData {
  // Build currency decimals lookup
  const decimalsByIso = new Map<string, number>();
  (json.currencies || []).forEach(c => decimalsByIso.set(c.iso, c.decimals ?? 2));

  // Wallets
  const wallets: Wallet[] = (json.wallets || []).map(w => ({
    id: String(w.id),
    name: String(w.name),
    currency: String(w.currency || 'USD'),
    decimals: decimalsByIso.get(String(w.currency || 'USD')) ?? 2,
  }));

  // Categories: map type 0 => income, 1 => expense, 2 => transfer (skip)
  const categories: Category[] = (json.categories || [])
    .filter(c => c.type !== 2)
    .map(c => {
      let color: string | undefined;
      try {
        // Parse the icon field to extract color
        if (c.icon && typeof c.icon === 'string') {
          const iconData = JSON.parse(c.icon);
          if (iconData.type === 'color' && iconData.color) {
            color = String(iconData.color);
          }
        }
      } catch {
        // If parsing fails, color will remain undefined
      }
      
      return {
        id: String(c.id),
        name: String(c.name),
        kind: c.type === 0 ? 'income' : 'expense',
        color,
      };
    });

  const walletDecimals = new Map(wallets.map(w => [w.id, w.decimals] as const));
  const walletCurrency = new Map(wallets.map(w => [w.id, w.currency] as const));
  const validCategoryIds = new Set(categories.map(c => c.id));

  // Transactions
  const txs: Transaction[] = (json.transactions || [])
    .filter(t => t.deleted === false || t.deleted === undefined)
    .filter(t => t.count_in_total !== false)
    .filter(t => t.category && validCategoryIds.has(String(t.category)))
    .map(t => {
      const walletId = String(t.wallet || 'default');
      const dec = walletDecimals.get(walletId) ?? 2;
      const amtMajor = Number(t.money) / Math.pow(10, dec);
      const type: 'income' | 'expense' = (t.direction === 1 || t.type === 1 || t?.category?.type === 0) ? 'income' : 'expense';
      const dateISO = parseMoneyTrackerDate(String(t.date)).toISOString();
      return {
        id: String(t.id || uid()),
        date: dateISO,
        description: String(t.description || ''),
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

export async function pickAndImport(setData: (d: AppData) => void) {
  try {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
    if (res.canceled || !res.assets?.length) return;
    const file = res.assets[0];
    const contents = await FileSystem.readAsStringAsync(file.uri);
    const json = JSON.parse(contents);

    let newData: AppData | null = null;
    if (detectMoneyTracker(json)) {
      newData = mapMoneyTrackerToApp(json);
    } else if (json && json.schemaVersion === 1 && Array.isArray(json.transactions)) {
      newData = json as AppData;
    } else if (json && json.databases) {
      // Support importing database.json extracted from .mwbx
      const db = json.databases ? json : json; // already is database.json root
      if (detectMoneyTracker(db)) newData = mapMoneyTrackerToApp(db);
    }

    if (!newData) {
      Alert.alert('Import failed', 'Unrecognized JSON format.');
      return;
    }

    await saveData(newData);
    setData(newData);
    Alert.alert('Import done', `Imported ${newData.transactions.length} transactions, ${newData.categories.length} categories.`);
  } catch (e: any) {
    Alert.alert('Import error', e?.message ?? String(e));
  }
}

export async function exportData(data: AppData) {
  try {
    const payload = JSON.stringify(data, null, 2);
    const fileName = `expense_export_${Date.now()}.json`;
    const path = FileSystem.cacheDirectory! + fileName;
    await FileSystem.writeAsStringAsync(path, payload);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: 'application/json' });
    } else {
      Alert.alert('Exported', `Saved to: ${path}`);
    }
  } catch (e: any) {
    Alert.alert('Export error', e?.message ?? String(e));
  }
}
