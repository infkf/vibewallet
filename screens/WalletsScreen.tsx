import * as React from 'react';
import { useState } from 'react';
import { Alert, Button, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AppData, Wallet } from '../types';
import { uid, stringToColor } from '../utils';
import { saveData } from '../storage';
import { Section, LabeledInput } from '../components';
import { CURRENCIES, getCurrencySymbol } from '../currencies';

interface WalletsScreenProps {
  data: AppData;
  setData: (data: AppData) => void;
  selectedWalletId: string | undefined;
  onWalletSelect: (walletId: string) => void;
}

export function WalletsScreen({ data, setData, selectedWalletId, onWalletSelect }: WalletsScreenProps) {
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const addWallet = async () => {
    if (!newWalletName.trim()) {
      Alert.alert('Missing info', 'Enter a wallet name.');
      return;
    }

    const currency = CURRENCIES.find(c => c.iso === selectedCurrency);
    if (!currency) {
      Alert.alert('Error', 'Invalid currency selected.');
      return;
    }

    const wallet: Wallet = {
      id: uid(),
      name: newWalletName.trim(),
      currency: currency.iso,
      decimals: currency.decimals,
    };

    const next = { ...data, wallets: [...data.wallets, wallet] };
    setData(next);
    await saveData(next);
    
    setNewWalletName('');
    setShowAddWallet(false);
    onWalletSelect(wallet.id);
  };

  const deleteWallet = async (walletId: string) => {
    const wallet = data.wallets.find(w => w.id === walletId);
    if (!wallet) return;

    const hasTransactions = data.transactions.some(t => t.walletId === walletId);
    if (hasTransactions) {
      Alert.alert(
        'Cannot delete wallet',
        'This wallet has transactions. Please move or delete the transactions first.'
      );
      return;
    }

    Alert.alert(
      'Delete wallet',
      `Are you sure you want to delete "${wallet.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const next = {
              ...data,
              wallets: data.wallets.filter(w => w.id !== walletId),
            };
            setData(next);
            await saveData(next);
            
            if (selectedWalletId === walletId && next.wallets.length > 0) {
              onWalletSelect(next.wallets[0].id);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Section title="Wallets">
        {data.wallets.length === 0 ? (
          <Text style={{ color: '#666', textAlign: 'center', paddingVertical: 20 }}>
            No wallets yet. Create one to get started.
          </Text>
        ) : (
          data.wallets.map(wallet => {
            const isSelected = wallet.id === selectedWalletId;
            const transactionCount = data.transactions.filter(t => t.walletId === wallet.id).length;
            const symbol = getCurrencySymbol(wallet.currency);
            
            return (
              <TouchableOpacity
                key={wallet.id}
                onPress={() => onWalletSelect(wallet.id)}
                style={{
                  padding: 16,
                  marginBottom: 8,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: isSelected ? '#007AFF' : '#e1e5e9',
                  backgroundColor: isSelected ? '#f0f8ff' : '#fff',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 4 }}>
                      {wallet.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#666' }}>
                      {wallet.currency} {symbol} • {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    onPress={() => deleteWallet(wallet.id)}
                    style={{
                      padding: 8,
                      borderRadius: 4,
                      backgroundColor: '#ff4444',
                      marginLeft: 12,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        
        <Button title="+ Add Wallet" onPress={() => setShowAddWallet(true)} />
      </Section>

      {showAddWallet && (
        <Section title="Add New Wallet">
          <LabeledInput
            label="Wallet Name"
            value={newWalletName}
            onChangeText={setNewWalletName}
            placeholder="e.g., Main Wallet"
          />
          
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 }}>Currency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {CURRENCIES.slice(0, 20).map(currency => ( // Show first 20 popular currencies
                <TouchableOpacity
                  key={currency.iso}
                  onPress={() => setSelectedCurrency(currency.iso)}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: selectedCurrency === currency.iso ? '#007AFF' : '#ccc',
                    backgroundColor: selectedCurrency === currency.iso ? '#f0f8ff' : '#fff',
                    minWidth: 80,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600' }}>{currency.symbol}</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>{currency.iso}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
            Selected: {CURRENCIES.find(c => c.iso === selectedCurrency)?.name || selectedCurrency}
          </Text>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setShowAddWallet(false)}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#ccc',
                alignItems: 'center',
              }}
            >
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={addWallet}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                backgroundColor: '#007AFF',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Add Wallet</Text>
            </TouchableOpacity>
          </View>
        </Section>
      )}
    </ScrollView>
  );
}
