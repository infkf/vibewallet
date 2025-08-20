// App.tsx — Minimal React Native (Expo) Expense Tracker for Android
// Features:
// - Track Income & Expense
// - Spending pie chart by category for a selected date range (defaults to current month)
// - Import Money Tracker JSON (database.json inside .mwbx) directly
// - Export app data as JSON (not .mwbx)
//
// Quick start (Expo):
//   npm i -g expo-cli
//   npx create-expo-app rn-expense-tracker --template expo-template-blank-typescript
//   cd rn-expense-tracker
//   expo install react-native-svg @react-native-async-storage/async-storage expo-document-picker expo-file-system expo-sharing
//   # replace App.tsx with this file's content
//   npx expo start --android
//
// Notes:
// - Amounts are stored in MAJOR currency units (e.g., USD dollars), not cents.
// - Money Tracker mapping:
//     direction: 0 => expense, 1 => income
//     category.type: 0 => income, 1 => expense, 2 => transfer (ignored)
// - We ignore deleted=false/true and count_in_total=false transactions (skip when false)
// - For simplicity this app assumes one primary wallet but supports many.

import * as React from 'react';
import { useEffect, useState } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { AppData } from './types';
import { startOfCurrentMonth, endOfCurrentMonth } from './utils';
import { loadData, saveData } from './storage';
import { TabButton } from './components';
import { AddScreen, ChartScreen, TransactionsScreen, ImportExportScreen, WalletsScreen } from './screens';
import { getCurrencySymbol } from './currencies';

// ---------- Main App ----------

export default function App() {
  const [data, setData] = useState<AppData>({ schemaVersion: 1, categories: [], wallets: [], transactions: [] });
  const [tab, setTab] = useState<'add'|'chart'|'transactions'|'wallets'|'io'>('add');
  const [rangeStart, setRangeStart] = useState<Date>(startOfCurrentMonth());
  const [rangeEnd, setRangeEnd] = useState<Date>(endOfCurrentMonth());
  const [selectedWalletId, setSelectedWalletId] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const d = await loadData();
      
      // Create default wallet if none exists
      if (d.wallets.length === 0) {
        const defaultWallet = {
          id: 'main-wallet-' + Date.now(),
          name: 'Main Wallet',
          currency: 'USD',
          decimals: 2,
        };
        d.wallets = [defaultWallet];
        setSelectedWalletId(defaultWallet.id);
        await saveData(d);
      } else {
        setSelectedWalletId(d.wallets[0].id);
      }
      
      setData(d);
    })();
  }, []);

  const selectedWallet = data.wallets.find(w => w.id === selectedWalletId) || data.wallets[0];
  const currency = selectedWallet?.currency || 'USD';
  const currencySymbol = selectedWallet ? getCurrencySymbol(selectedWallet.currency) : '$';

  const handleRangeChange = (start: Date, end: Date) => {
    setRangeStart(start);
    setRangeEnd(end);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row' }}>
          <TabButton title="Add" active={tab==='add'} onPress={() => setTab('add')} />
          <TabButton title="Chart" active={tab==='chart'} onPress={() => setTab('chart')} />
          <TabButton title="Transactions" active={tab==='transactions'} onPress={() => setTab('transactions')} />
          <TabButton title="Wallets" active={tab==='wallets'} onPress={() => setTab('wallets')} />
          <TabButton title="Import/Export" active={tab==='io'} onPress={() => setTab('io')} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 12, color: '#666' }}>{selectedWallet?.name || 'No wallet'}</Text>
          <Text style={{ fontSize: 10, color: '#999' }}>{currency} {currencySymbol}</Text>
        </View>
      </View>

      {tab === 'add' && (
        <AddScreen data={data} setData={setData} currency={currency} selectedWalletId={selectedWalletId} />
      )}

      {tab === 'chart' && (
        <ChartScreen data={data} currency={currency} rangeStart={rangeStart} rangeEnd={rangeEnd} onRangeChange={handleRangeChange} />
      )}

      {tab === 'transactions' && (
        <TransactionsScreen data={data} currency={currency} />
      )}

      {tab === 'wallets' && (
        <WalletsScreen data={data} setData={setData} selectedWalletId={selectedWalletId} onWalletSelect={setSelectedWalletId} />
      )}

      {tab === 'io' && (
        <ImportExportScreen data={data} setData={setData} />
      )}
    </SafeAreaView>
  );
}
