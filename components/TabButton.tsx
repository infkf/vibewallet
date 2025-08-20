import * as React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface TabButtonProps {
  title: string;
  active: boolean;
  onPress: () => void;
}

export function TabButton({ title, active, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 3, borderBottomColor: active ? '#222' : 'transparent' }}>
      <Text style={{ fontWeight: active ? '700' : '500', fontSize: 16 }}>{title}</Text>
    </TouchableOpacity>
  );
}
