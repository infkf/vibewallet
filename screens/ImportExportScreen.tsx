import * as React from 'react';
import { Alert, Button, Platform, ScrollView, Text } from 'react-native';
import { AppData } from '../types';
import { saveData, pickAndImport, exportData } from '../storage';
import { Section } from '../components';

interface ImportExportScreenProps {
  data: AppData;
  setData: (data: AppData) => void;
}

export function ImportExportScreen({ data, setData }: ImportExportScreenProps) {
  const resetData = async () => {
    Alert.alert('Reset all data?', 'This will clear all stored data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => {
        const empty: AppData = { schemaVersion: 1, categories: [], wallets: [], transactions: [] };
        await saveData(empty); setData(empty);
      }}
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Section title="Import">
        <Text style={{ marginBottom: 8 }}>Import from Money Tracker JSON (e.g., extracted database.json) or this app's own export.</Text>
        <Button title="Pick JSON file" onPress={() => pickAndImport(setData, data)} />
      </Section>
      <Section title="Export">
        <Text style={{ marginBottom: 8 }}>Export current data as JSON.</Text>
        <Button title="Export JSON" onPress={() => exportData(data)} />
      </Section>
      <Section title="Danger Zone">
        <Button title="Reset all data" color={Platform.OS === 'ios' ? undefined : '#b00020'} onPress={resetData} />
      </Section>
    </ScrollView>
  );
}
