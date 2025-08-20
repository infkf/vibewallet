import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { Card, DataTable, Text } from 'react-native-paper';
import { AppData } from '../types';
import { formatCurrencyWithSymbol, toISODateString, stringToColor } from '../utils';
import { getCurrencySymbol } from '../currencies';

interface TransactionsScreenProps {
  data: AppData;
  currency: string;
}

export default function TransactionsScreen({ data, currency }: TransactionsScreenProps) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Card.Title title="All Transactions" />
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Transaction</DataTable.Title>
            <DataTable.Title numeric>Amount</DataTable.Title>
          </DataTable.Header>
          {data.transactions.length === 0 ? (
            <Text style={{ textAlign: 'center', padding: 16 }}>No transactions yet.</Text>
          ) : (
            data.transactions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(t => {
                const category = data.categories.find(c => c.id === t.categoryId);
                const wallet = data.wallets.find(w => w.id === t.walletId);
                const catName = category?.name || '—';
                const catColor = category?.color || stringToColor(catName);
                const walletSymbol = wallet ? getCurrencySymbol(wallet.currency) : '$';
                const walletDecimals = wallet?.decimals || 2;
                return (
                  <DataTable.Row key={t.id}>
                    <DataTable.Cell>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: catColor }} />
                        <View>
                          <Text variant='labelLarge'>{t.description || catName}</Text>
                          <Text variant='bodySmall'>
                            {toISODateString(new Date(t.date))} · {catName}
                            {wallet && wallet.name && <Text> · {wallet.name}</Text>}
                          </Text>
                        </View>
                      </View>
                    </DataTable.Cell>
                    <DataTable.Cell numeric>
                      <Text style={{ color: t.type === 'income' ? 'green' : 'red' }}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrencyWithSymbol(t.amount, walletSymbol, walletDecimals)}
                      </Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })
          )}
        </DataTable>
      </Card>
    </ScrollView>
  );
}