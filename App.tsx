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
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, FlatList, Modal, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

// ---------- Types ----------

type UUID = string;

type CategoryKind = 'income' | 'expense';

type Category = {
  id: UUID;
  name: string;
  kind: CategoryKind;
};

type Wallet = {
  id: UUID;
  name: string;
  currency: string; // e.g., 'USD'
  decimals: number; // e.g., 2
};

type Transaction = {
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

const STORAGE_KEY = 'rn-expense-tracker:data:v1';

// ---------- Helpers ----------

const uid = () => {
  // Simple UUID-ish (good enough for local data)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const startOfCurrentMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const endOfCurrentMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
};

function formatCurrency(n: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

function toISODateString(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseMoneyTrackerDate(str: string): Date {
  // Money Tracker uses 'YYYY-MM-DD HH:mm:ss'
  // Treat as local time
  const [datePart, timePart] = str.split(' ');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm, ss] = timePart.split(':').map(Number);
  return new Date(y, (m - 1), d, hh, mm, ss || 0);
}

function stringToColor(name: string) {
  // Deterministic category color
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 45%)`;
}

// ---------- Storage ----------

async function loadData(): Promise<AppData> {
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

async function saveData(data: AppData) {
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
    .map(c => ({
      id: String(c.id),
      name: String(c.name),
      kind: c.type === 0 ? 'income' : 'expense',
    }));

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

async function pickAndImport(setData: (d: AppData) => void) {
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

async function exportData(data: AppData) {
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

// ---------- Pie Chart (SVG) ----------

type PieDatum = { key: string; label: string; value: number; color: string };

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const a = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y, 'L', cx, cy, 'Z'].join(' ');
}

function PieChart({ data, size = 220 }: { data: PieDatum[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let angle = 0;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  return (
    <Svg width={size} height={size}>
      <G>
        {data.map((d, idx) => {
          const start = angle;
          const sliceAngle = total === 0 ? 0 : (d.value / total) * 360;
          const end = start + sliceAngle;
          angle = end;
          const path = describeArc(cx, cy, r, start, end);
          // Place label at the middle angle
          const mid = start + sliceAngle / 2;
          const labelPos = polarToCartesian(cx, cy, r * 0.6, mid);
          const percent = total === 0 ? 0 : (d.value / total) * 100;
          return (
            <G key={d.key}>
              <Path d={path} fill={d.color} />
              {percent >= 6 && (
                <SvgText x={labelPos.x} y={labelPos.y} fontSize={12} textAnchor="middle" fill="#fff">
                  {`${Math.round(percent)}%`}
                </SvgText>
              )}
            </G>
          );
        })}
      </G>
    </Svg>
  );
}

// ---------- UI Components ----------

function TabButton({ title, active, onPress }: { title: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 3, borderBottomColor: active ? '#222' : 'transparent' }}>
      <Text style={{ fontWeight: active ? '700' : '500', fontSize: 16 }}>{title}</Text>
    </TouchableOpacity>
  );
}

function LabeledInput({ label, value, onChangeText, keyboardType = 'default', placeholder }:{ label:string; value:string; onChangeText:(t:string)=>void; keyboardType?: 'default'|'numeric'; placeholder?:string }){
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 12, color: '#444', marginBottom: 4 }}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholder={placeholder} style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8 }} />
    </View>
  );
}

function Section({ title, children }:{ title:string; children: React.ReactNode }){
  return (
    <View style={{ marginVertical: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>{title}</Text>
      <View>{children}</View>
    </View>
  );
}

function MonthNavigator({ start, end, onChange }:{ start: Date; end: Date; onChange:(s:Date, e:Date)=>void }){
  const label = `${start.toLocaleString(undefined, { month: 'long' })} ${start.getFullYear()}`;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <Button title="◀ Prev" onPress={() => {
        const s = new Date(start.getFullYear(), start.getMonth() - 1, 1);
        const e = new Date(s.getFullYear(), s.getMonth() + 1, 0, 23, 59, 59, 999);
        onChange(s, e);
      }} />
      <Text style={{ fontSize: 16, fontWeight: '600' }}>{label}</Text>
      <Button title="Next ▶" onPress={() => {
        const s = new Date(start.getFullYear(), start.getMonth() + 1, 1);
        const e = new Date(s.getFullYear(), s.getMonth() + 1, 0, 23, 59, 59, 999);
        onChange(s, e);
      }} />
    </View>
  );
}

function CategorySelector({ categories, kind, value, onChange }:{ categories: Category[]; kind: CategoryKind; value?: string; onChange:(id:string)=>void }){
  const filtered = categories.filter(c => c.kind === kind);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
      {filtered.map(c => (
        <TouchableOpacity key={c.id} onPress={() => onChange(c.id)} style={{ paddingVertical: 6, paddingHorizontal: 10, marginRight: 8, borderRadius: 20, borderWidth: 1, borderColor: value===c.id? '#222':'#ccc', backgroundColor: value===c.id? '#eee':'#fff' }}>
          <Text>{c.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function AddCategoryModal({ visible, kind, onClose, onAdd }:{ visible:boolean; kind:CategoryKind; onClose:()=>void; onAdd:(name:string)=>void }){
  const [name, setName] = useState('');
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex:1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8 }}>New {kind} category</Text>
          <LabeledInput label="Name" value={name} onChangeText={setName} placeholder="e.g., Groceries" />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button title="Cancel" onPress={onClose} />
            <Button title="Add" onPress={() => { if(name.trim()){ onAdd(name.trim()); setName(''); onClose(); } }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------- Main App ----------

export default function App() {
  const [data, setData] = useState<AppData>({ schemaVersion: 1, categories: [], wallets: [], transactions: [] });
  const [tab, setTab] = useState<'add'|'chart'|'io'>('add');
  const [rangeStart, setRangeStart] = useState<Date>(startOfCurrentMonth());
  const [rangeEnd, setRangeEnd] = useState<Date>(endOfCurrentMonth());

  // Add form
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<'income'|'expense'>('expense');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [showAddCategory, setShowAddCategory] = useState(false);

  useEffect(() => {
    (async () => {
      const d = await loadData();
      setData(d);
    })();
  }, []);

  const currency = data.wallets[0]?.currency || 'USD';

  const transactionsInRange = useMemo(() => {
    const s = rangeStart.getTime();
    const e = rangeEnd.getTime();
    return data.transactions.filter(t => {
      const ts = new Date(t.date).getTime();
      return ts >= s && ts <= e;
    });
  }, [data.transactions, rangeStart, rangeEnd]);

  const totals = useMemo(() => {
    const exp = transactionsInRange.filter(t => t.type==='expense').reduce((s, t) => s + t.amount, 0);
    const inc = transactionsInRange.filter(t => t.type==='income').reduce((s, t) => s + t.amount, 0);
    return { expense: exp, income: inc, net: inc - exp };
  }, [transactionsInRange]);

  const expenseByCategory: PieDatum[] = useMemo(() => {
    const map = new Map<string, number>();
    transactionsInRange
      .filter(t => t.type === 'expense')
      .forEach(t => map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount));

    const items: PieDatum[] = [];
    for (const [cid, val] of map.entries()) {
      const cat = data.categories.find(c => c.id === cid);
      if (!cat) continue;
      items.push({ key: cid, label: cat.name, value: val, color: stringToColor(cat.name) });
    }
    // sort desc by value
    items.sort((a,b) => b.value - a.value);
    return items;
  }, [transactionsInRange, data.categories]);

  const addCategory = async (name: string) => {
    const c: Category = { id: uid(), name, kind: type };
    const next = { ...data, categories: [...data.categories, c] };
    setData(next);
    await saveData(next);
    setCategoryId(c.id);
  };

  const addTransaction = async () => {
    const amt = parseFloat(amount);
    if (!amt || !categoryId) { Alert.alert('Missing info', 'Enter amount and choose a category.'); return; }
    const walletId = data.wallets[0]?.id || 'default-wallet';
    const tx: Transaction = {
      id: uid(),
      date: new Date().toISOString(),
      description: desc,
      amount: Math.abs(amt),
      type,
      categoryId,
      walletId,
    };
    const next = { ...data, transactions: [tx, ...data.transactions] };
    setData(next);
    await saveData(next);
    setAmount(''); setDesc('');
  };

  const resetData = async () => {
    Alert.alert('Reset all data?', 'This will clear all stored data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => {
        const empty: AppData = { schemaVersion: 1, categories: [], wallets: [], transactions: [] };
        await saveData(empty); setData(empty);
      }}
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row' }}>
          <TabButton title="Add" active={tab==='add'} onPress={() => setTab('add')} />
          <TabButton title="Chart" active={tab==='chart'} onPress={() => setTab('chart')} />
          <TabButton title="Import/Export" active={tab==='io'} onPress={() => setTab('io')} />
        </View>
        <Text style={{ fontSize: 12, color: '#666' }}>{currency}</Text>
      </View>

      {tab === 'add' && (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Section title="Type">
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => { setType('expense'); }} style={{ padding: 10, borderRadius: 8, borderWidth: 1, borderColor: type==='expense'? '#222':'#ccc', backgroundColor: type==='expense'? '#eee':'#fff' }}>
                <Text>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setType('income'); }} style={{ padding: 10, borderRadius: 8, borderWidth: 1, borderColor: type==='income'? '#222':'#ccc', backgroundColor: type==='income'? '#eee':'#fff' }}>
                <Text>Income</Text>
              </TouchableOpacity>
            </View>
          </Section>

          <Section title="Details">
            <LabeledInput label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="e.g., 12.50" />
            <LabeledInput label="Description" value={desc} onChangeText={setDesc} placeholder="e.g., Coffee" />
            <Text style={{ fontSize: 12, color: '#444', marginBottom: 4 }}>Category</Text>
            <CategorySelector categories={data.categories} kind={type} value={categoryId} onChange={setCategoryId} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="+ New category" onPress={() => setShowAddCategory(true)} />
            </View>
          </Section>

          <Button title="Add transaction" onPress={addTransaction} />

          <Section title="Recent">
            {data.transactions.slice(0, 10).map(t => {
              const cat = data.categories.find(c => c.id === t.categoryId)?.name || '—';
              return (
                <View key={t.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f1f1', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontWeight: '600' }}>{t.description || cat}</Text>
                    <Text style={{ color: '#666', fontSize: 12 }}>{toISODateString(new Date(t.date))} · {cat}</Text>
                  </View>
                  <Text style={{ fontWeight: '700', color: t.type==='income' ? '#137333' : '#b00020' }}>{t.type==='income' ? '+' : '-'}{formatCurrency(t.amount, currency)}</Text>
                </View>
              );
            })}
          </Section>

          <View style={{ height: 60 }} />
          <AddCategoryModal visible={showAddCategory} kind={type} onClose={() => setShowAddCategory(false)} onAdd={addCategory} />
        </ScrollView>
      )}

      {tab === 'chart' && (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Section title="Date range">
            <MonthNavigator start={rangeStart} end={rangeEnd} onChange={(s,e)=>{ setRangeStart(s); setRangeEnd(e); }} />
          </Section>
          <Section title="Totals">
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 }}>
              <View>
                <Text style={{ color: '#666' }}>Income</Text>
                <Text style={{ fontWeight: '700' }}>{formatCurrency(totals.income, currency)}</Text>
              </View>
              <View>
                <Text style={{ color: '#666' }}>Expense</Text>
                <Text style={{ fontWeight: '700' }}>{formatCurrency(totals.expense, currency)}</Text>
              </View>
              <View>
                <Text style={{ color: '#666' }}>Net</Text>
                <Text style={{ fontWeight: '700' }}>{formatCurrency(totals.net, currency)}</Text>
              </View>
            </View>
          </Section>

          <Section title="Spending by category">
            {expenseByCategory.length === 0 ? (
              <Text style={{ color: '#666' }}>No expenses in selected range.</Text>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <PieChart data={expenseByCategory} size={240} />
              </View>
            )}

            <View style={{ marginTop: 12 }}>
              {expenseByCategory.map(d => (
                <View key={d.key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: d.color }} />
                    <Text>{d.label}</Text>
                  </View>
                  <Text style={{ fontWeight: '700' }}>{formatCurrency(d.value, currency)}</Text>
                </View>
              ))}
            </View>
          </Section>
        </ScrollView>
      )}

      {tab === 'io' && (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Section title="Import">
            <Text style={{ marginBottom: 8 }}>Import from Money Tracker JSON (e.g., extracted database.json) or this app's own export.</Text>
            <Button title="Pick JSON file" onPress={() => pickAndImport(setData)} />
          </Section>
          <Section title="Export">
            <Text style={{ marginBottom: 8 }}>Export current data as JSON.</Text>
            <Button title="Export JSON" onPress={() => exportData(data)} />
          </Section>
          <Section title="Danger Zone">
            <Button title="Reset all data" color={Platform.OS==='ios' ? undefined : '#b00020'} onPress={resetData} />
          </Section>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
