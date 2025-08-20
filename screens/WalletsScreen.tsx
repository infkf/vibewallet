import * as React from "react";
import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { AppData, Wallet } from "../types";
import { uid } from "../utils";
import { saveData } from "../storage";
import {
  Button,
  Card,
  Chip,
  Dialog,
  IconButton,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { CURRENCIES, getCurrencySymbol } from "../currencies";

interface WalletsScreenProps {
  data: AppData;
  setData: (data: AppData) => void;
  selectedWalletId: string | undefined;
  onWalletSelect: (walletId: string) => void;
}

export default function WalletsScreen({
  data,
  setData,
  selectedWalletId,
  onWalletSelect,
}: WalletsScreenProps) {
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  const addWallet = async () => {
    if (!newWalletName.trim()) {
      Alert.alert("Missing info", "Enter a wallet name.");
      return;
    }

    const currency = CURRENCIES.find((c) => c.iso === selectedCurrency);
    if (!currency) {
      Alert.alert("Error", "Invalid currency selected.");
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

    setNewWalletName("");
    setShowAddWallet(false);
    onWalletSelect(wallet.id);
  };

  const deleteWallet = async (walletId: string) => {
    const wallet = data.wallets.find((w) => w.id === walletId);
    if (!wallet) return;

    const hasTransactions = data.transactions.some(
      (t) => t.walletId === walletId,
    );
    if (hasTransactions) {
      Alert.alert(
        "Cannot delete wallet",
        "This wallet has transactions. Please move or delete the transactions first.",
      );
      return;
    }

    Alert.alert(
      "Delete wallet",
      `Are you sure you want to delete "${wallet.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const next = {
              ...data,
              wallets: data.wallets.filter((w) => w.id !== walletId),
            };
            setData(next);
            await saveData(next);

            if (selectedWalletId === walletId && next.wallets.length > 0) {
              onWalletSelect(next.wallets[0].id);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Button
        mode="contained"
        onPress={() => setShowAddWallet(true)}
        style={{ marginBottom: 16 }}
      >
        + Add Wallet
      </Button>

      {data.wallets.map((wallet) => {
        const isSelected = wallet.id === selectedWalletId;
        const transactionCount = data.transactions.filter(
          (t) => t.walletId === wallet.id,
        ).length;
        const symbol = getCurrencySymbol(wallet.currency);

        return (
          <Card
            key={wallet.id}
            onPress={() => onWalletSelect(wallet.id)}
            style={{
              marginBottom: 8,
              borderColor: isSelected ? "blue" : "transparent",
              borderWidth: 2,
            }}
          >
            <Card.Title
              title={wallet.name}
              subtitle={`${wallet.currency} ${symbol} · ${transactionCount} transaction${transactionCount !== 1 ? "s" : ""}`}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="delete"
                  onPress={() => deleteWallet(wallet.id)}
                />
              )}
            />
          </Card>
        );
      })}

      <Portal>
        <Dialog
          visible={showAddWallet}
          onDismiss={() => setShowAddWallet(false)}
        >
          <Dialog.Title>Add New Wallet</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Wallet Name"
              value={newWalletName}
              onChangeText={setNewWalletName}
              placeholder="e.g., Main Wallet"
              mode="outlined"
              style={{ marginBottom: 16, backgroundColor: "transparent" }}
            />
            <Text variant="labelMedium" style={{ marginBottom: 8 }}>
              Currency
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16 }}
            >
              <View style={{ flexDirection: "row", gap: 8 }}>
                {CURRENCIES.slice(0, 20).map((currency) => (
                  <Chip
                    key={currency.iso}
                    selected={selectedCurrency === currency.iso}
                    onPress={() => setSelectedCurrency(currency.iso)}
                  >
                    {currency.iso}
                  </Chip>
                ))}
              </View>
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddWallet(false)}>Cancel</Button>
            <Button onPress={addWallet}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}
