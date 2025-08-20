import * as React from 'react';
import { Button, Text, View } from 'react-native';

interface MonthNavigatorProps {
  start: Date;
  end: Date;
  onChange: (start: Date, end: Date) => void;
}

export function MonthNavigator({ start, end, onChange }: MonthNavigatorProps) {
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
