import * as React from 'react';
import { useState } from 'react';
import { Alert, Button, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AppData, Category, Transaction } from '../types';
import { formatCurrency, formatCurrencyWithSymbol, toISODateString, uid, stringToColor } from '../utils';
import { saveData } from '../storage';
import { Section, LabeledInput, CategorySelector, AddCategoryModal } from '../components';
import { getCurrencySymbol } from '../currencies';

interface AddScreenProps {
  data: AppData;
  setData: (data: AppData) => void;
  currency: string;
  selectedWalletId: string | undefined;
}

export function AddScreen({ data, setData, currency, selectedWalletId }: AddScreenProps) {
  // Add form
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const addCategory = async (name: string, color: string) => {
    const c: Category = { id: uid(), name, kind: type, color };
    const next = { ...data, categories: [...data.categories, c] };
    setData(next);
    await saveData(next);
    setCategoryId(c.id);
  };

  const addTransaction = async () => {
    const amt = parseFloat(amount);
    if (!amt || !categoryId) { Alert.alert('Missing info', 'Enter amount and choose a category.'); return; }
    if (!selectedWalletId) { Alert.alert('No wallet selected', 'Please select a wallet first.'); return; }
    const walletId = selectedWalletId;
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

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Section title="Type">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => { setType('expense'); }} style={{ padding: 10, borderRadius: 8, borderWidth: 1, borderColor: type === 'expense' ? '#222' : '#ccc', backgroundColor: type === 'expense' ? '#eee' : '#fff' }}>
            <Text>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setType('income'); }} style={{ padding: 10, borderRadius: 8, borderWidth: 1, borderColor: type === 'income' ? '#222' : '#ccc', backgroundColor: type === 'income' ? '#eee' : '#fff' }}>
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
        {data.transactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10).map(t => {
          const category = data.categories.find(c => c.id === t.categoryId);
          const wallet = data.wallets.find(w => w.id === t.walletId);
          const catName = category?.name || '—';
          const catColor = category?.color || stringToColor(catName);
          const walletSymbol = wallet ? getCurrencySymbol(wallet.currency) : '$';
          const walletDecimals = wallet?.decimals || 2;
          return (
            <View key={t.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f1f1', flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: catColor }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600' }}>{t.description || catName}</Text>
                  <Text style={{ color: '#666', fontSize: 12 }}>{toISODateString(new Date(t.date))} · {catName}</Text>
                </View>
              </View>
              <Text style={{ fontWeight: '700', color: t.type === 'income' ? '#137333' : '#b00020' }}>{t.type === 'income' ? '+' : '-'}{formatCurrencyWithSymbol(t.amount, walletSymbol, walletDecimals)}</Text>
            </View>
          );
        })}
      </Section>

      <View style={{ height: 60 }} />
      <AddCategoryModal visible={showAddCategory} kind={type} onClose={() => setShowAddCategory(false)} onAdd={addCategory} />
    </ScrollView>
  );
}
