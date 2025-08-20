import * as React from 'react';
import { Alert, Platform, ScrollView } from 'react-native';
import { AppData } from '../types';
import { saveData, pickAndImport, exportData } from '../storage';
import { Button, Card, Text } from 'react-native-paper';

interface ImportExportScreenProps {
  data: AppData;
  setData: (data: AppData) => void;
}

export default function ImportExportScreen({ data, setData }: ImportExportScreenProps) {
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
      <Card style={{ marginBottom: 16 }}>
        <Card.Title title="Import" />
        <Card.Content>
          <Text style={{ marginBottom: 8 }}>Import from Money Tracker JSON (e.g., extracted database.json) or this app's own export.</Text>
          <Button mode="contained" onPress={() => pickAndImport(setData, data)}>Pick JSON file</Button>
        </Card.Content>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Card.Title title="Export" />
        <Card.Content>
          <Text style={{ marginBottom: 8 }}>Export current data as JSON.</Text>
          <Button mode="contained" onPress={() => exportData(data)}>Export JSON</Button>
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Danger Zone" />
        <Card.Content>
          <Button mode="contained" buttonColor='red' onPress={resetData}>Reset all data</Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}