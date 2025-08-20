import * as React from 'react';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { AppData } from '../types';
import { formatCurrency, stringToColor } from '../utils';
import { Section, MonthNavigator } from '../components';
import { PieChart, PieDatum } from '../components/PieChart';

interface ChartScreenProps {
  data: AppData;
  currency: string;
  rangeStart: Date;
  rangeEnd: Date;
  onRangeChange: (start: Date, end: Date) => void;
}

export function ChartScreen({ data, currency, rangeStart, rangeEnd, onRangeChange }: ChartScreenProps) {
  const transactionsInRange = useMemo(() => {
    const s = rangeStart.getTime();
    const e = rangeEnd.getTime();
    return data.transactions.filter(t => {
      const ts = new Date(t.date).getTime();
      return ts >= s && ts <= e;
    });
  }, [data.transactions, rangeStart, rangeEnd]);

  const totals = useMemo(() => {
    const exp = transactionsInRange.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const inc = transactionsInRange.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
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
      items.push({ key: cid, label: cat.name, value: val, color: cat.color || stringToColor(cat.name) });
    }
    // sort desc by value
    items.sort((a, b) => b.value - a.value);
    return items;
  }, [transactionsInRange, data.categories]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Section title="Date range">
        <MonthNavigator start={rangeStart} end={rangeEnd} onChange={onRangeChange} />
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
  );
}
