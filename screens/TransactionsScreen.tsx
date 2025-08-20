import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { AppData } from '../types';
import { formatCurrency, toISODateString, stringToColor } from '../utils';
import { Section } from '../components';

interface TransactionsScreenProps {
  data: AppData;
  currency: string;
}

export function TransactionsScreen({ data, currency }: TransactionsScreenProps) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Section title="All Transactions">
        {data.transactions.length === 0 ? (
          <Text style={{ color: '#666', textAlign: 'center', paddingVertical: 20 }}>No transactions yet.</Text>
        ) : (
          data.transactions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(t => {
              const category = data.categories.find(c => c.id === t.categoryId);
              const catName = category?.name || '—';
              const catColor = category?.color || stringToColor(catName);
              return (
                <View key={t.id} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f1f1', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: catColor }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', fontSize: 16 }}>{t.description || catName}</Text>
                      <Text style={{ color: '#666', fontSize: 14, marginTop: 2 }}>{toISODateString(new Date(t.date))} · {catName}</Text>
                    </View>
                  </View>
                  <Text style={{ fontWeight: '700', fontSize: 16, color: t.type === 'income' ? '#137333' : '#b00020' }}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                  </Text>
                </View>
              );
            })
        )}
      </Section>
    </ScrollView>
  );
}
