
import * as React from 'react';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Button, Card, Chip, Text, TextInput } from 'react-native-paper';
import { AppData, Category, Transaction } from '../types';
import { formatCurrency, formatCurrencyWithSymbol, toISODateString, uid, stringToColor } from '../utils';
import { saveData } from '../storage';
import { LabeledInput, CategorySelector, AddCategoryModal } from '../components';
import { getCurrencySymbol } from '../currencies';

interface AddScreenProps {
  data: AppData;
  setData: (data: AppData) => void;
  currency: string;
  selectedWalletId: string | undefined;
}

export default function AddScreen({ data, setData, currency, selectedWalletId }: AddScreenProps) {
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
      <Card style={{ marginBottom: 16 }}>
        <Card.Title title="New Transaction" />
        <Card.Content>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <Chip selected={type === 'expense'} onPress={() => setType('expense')}>Expense</Chip>
            <Chip selected={type === 'income'} onPress={() => setType('income')}>Income</Chip>
          </View>
          <TextInput label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="e.g., 12.50" style={{ marginBottom: 8 }} />
          <TextInput label="Description" value={desc} onChangeText={setDesc} placeholder="e.g., Coffee" style={{ marginBottom: 8 }} />
          <Text style={{ marginBottom: 4 }}>Category</Text>
          <CategorySelector categories={data.categories} kind={type} value={categoryId} onChange={setCategoryId} />
          <Button onPress={() => setShowAddCategory(true)} style={{ marginTop: 8 }}>+ New category</Button>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" onPress={addTransaction}>Add transaction</Button>
        </Card.Actions>
      </Card>

      <Card>
        <Card.Title title="Recent Transactions" />
        <Card.Content>
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
        </Card.Content>
      </Card>

      <View style={{ height: 60 }} />
      <AddCategoryModal visible={showAddCategory} kind={type} onClose={() => setShowAddCategory(false)} onAdd={addCategory} />
    </ScrollView>
  );
}
