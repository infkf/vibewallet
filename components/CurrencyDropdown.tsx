import * as React from "react";
import { useState } from "react";
import { ScrollView } from "react-native";
import {
  Button,
  Text,
  Searchbar,
  List,
  Portal,
  Modal,
} from "react-native-paper";
import { CURRENCIES } from "../currencies";

interface CurrencyDropdownProps {
  value: string;
  onChange: (currencyISO: string) => void;
}

export function CurrencyDropdown({ value, onChange }: CurrencyDropdownProps) {
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedCurrency = CURRENCIES.find((c) => c.iso === value);

  const filteredCurrencies = CURRENCIES.filter(
    (currency) =>
      currency.iso.toLowerCase().includes(searchQuery.toLowerCase()) ||
      currency.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelect = (currencyISO: string) => {
    onChange(currencyISO);
    setVisible(false);
    setSearchQuery("");
  };

  return (
    <>
      <Button
        mode="outlined"
        onPress={() => setVisible(true)}
        style={{ marginBottom: 16, justifyContent: "flex-start" }}
        contentStyle={{ justifyContent: "flex-start" }}
      >
        {selectedCurrency
          ? `${selectedCurrency.iso} - ${selectedCurrency.name} (${selectedCurrency.symbol})`
          : "Select Currency"}
      </Button>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={{
            backgroundColor: "white",
            padding: 20,
            margin: 20,
            borderRadius: 8,
            maxHeight: "80%",
          }}
        >
          <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
            Select Currency
          </Text>

          <Searchbar
            placeholder="Search currencies..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={{ marginBottom: 16 }}
          />

          <ScrollView style={{ maxHeight: 400 }}>
            {filteredCurrencies.map((currency) => (
              <List.Item
                key={currency.iso}
                title={`${currency.iso} - ${currency.name}`}
                description={`Symbol: ${currency.symbol}`}
                onPress={() => handleSelect(currency.iso)}
                style={{
                  backgroundColor:
                    currency.iso === value ? "#e3f2fd" : "transparent",
                }}
              />
            ))}
          </ScrollView>

          <Button onPress={() => setVisible(false)} style={{ marginTop: 16 }}>
            Cancel
          </Button>
        </Modal>
      </Portal>
    </>
  );
}
