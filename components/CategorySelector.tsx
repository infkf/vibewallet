import * as React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { Category, CategoryKind } from '../types';

interface CategorySelectorProps {
  categories: Category[];
  kind: CategoryKind;
  value?: string;
  onChange: (id: string) => void;
}

export function CategorySelector({ categories, kind, value, onChange }: CategorySelectorProps) {
  const filtered = categories.filter(c => c.kind === kind);
  
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
      {filtered.map(c => (
        <TouchableOpacity key={c.id} onPress={() => onChange(c.id)} style={{ paddingVertical: 6, paddingHorizontal: 10, marginRight: 8, borderRadius: 20, borderWidth: 1, borderColor: value === c.id ? '#222' : '#ccc', backgroundColor: value === c.id ? '#eee' : '#fff' }}>
          <Text>{c.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
