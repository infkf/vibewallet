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
import { loadData } from './storage';
import { TabButton } from './components';
import { AddScreen, ChartScreen, TransactionsScreen, ImportExportScreen } from './screens';

// ---------- Main App ----------

export default function App() {
  const [data, setData] = useState<AppData>({ schemaVersion: 1, categories: [], wallets: [], transactions: [] });
  const [tab, setTab] = useState<'add'|'chart'|'transactions'|'io'>('add');
  const [rangeStart, setRangeStart] = useState<Date>(startOfCurrentMonth());
  const [rangeEnd, setRangeEnd] = useState<Date>(endOfCurrentMonth());

  useEffect(() => {
    (async () => {
      const d = await loadData();
      setData(d);
    })();
  }, []);

  const currency = data.wallets[0]?.currency || 'USD';

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
          <TabButton title="Import/Export" active={tab==='io'} onPress={() => setTab('io')} />
        </View>
        <Text style={{ fontSize: 12, color: '#666' }}>{currency}</Text>
      </View>

      {tab === 'add' && (
        <AddScreen data={data} setData={setData} currency={currency} />
      )}

      {tab === 'chart' && (
        <ChartScreen data={data} currency={currency} rangeStart={rangeStart} rangeEnd={rangeEnd} onRangeChange={handleRangeChange} />
      )}

      {tab === 'transactions' && (
        <TransactionsScreen data={data} currency={currency} />
      )}

      {tab === 'io' && (
        <ImportExportScreen data={data} setData={setData} />
      )}
    </SafeAreaView>
  );
}
