import * as React from 'react';
import { Text, View } from 'react-native';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <View style={{ marginVertical: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>{title}</Text>
      <View>{children}</View>
    </View>
  );
}
