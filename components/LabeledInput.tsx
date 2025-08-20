import * as React from 'react';
import { Text, TextInput, View } from 'react-native';

interface LabeledInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric';
  placeholder?: string;
}

export function LabeledInput({ label, value, onChangeText, keyboardType = 'default', placeholder }: LabeledInputProps) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 12, color: '#444', marginBottom: 4 }}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholder={placeholder} style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8 }} />
    </View>
  );
}
