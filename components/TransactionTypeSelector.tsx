import * as React from "react";
import { View } from "react-native";
import { Button, Icon } from "react-native-paper";

interface TransactionTypeSelectorProps {
  value: "income" | "expense";
  onChange: (type: "income" | "expense") => void;
}

export function TransactionTypeSelector({
  value,
  onChange,
}: TransactionTypeSelectorProps) {
  const expenseSelected = value === "expense";
  const incomeSelected = value === "income";

  return (
    <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
      <Button
        mode={expenseSelected ? "contained" : "outlined"}
        onPress={() => onChange("expense")}
        icon={() => (
          <Icon
            source="minus-circle"
            size={20}
            color={expenseSelected ? "white" : "#D32F2F"}
          />
        )}
        style={{
          flex: 1,
          backgroundColor: expenseSelected ? "#D32F2F" : "transparent",
          borderColor: "#D32F2F",
          borderWidth: expenseSelected ? 0 : 2,
        }}
        labelStyle={{
          color: expenseSelected ? "white" : "#D32F2F",
          fontWeight: "600",
        }}
        contentStyle={{
          flexDirection: "row-reverse",
          paddingVertical: 8,
        }}
      >
        Expense
      </Button>

      <Button
        mode={incomeSelected ? "contained" : "outlined"}
        onPress={() => onChange("income")}
        icon={() => (
          <Icon
            source="plus-circle"
            size={20}
            color={incomeSelected ? "white" : "#2E7D32"}
          />
        )}
        style={{
          flex: 1,
          backgroundColor: incomeSelected ? "#2E7D32" : "transparent",
          borderColor: "#2E7D32",
          borderWidth: incomeSelected ? 0 : 2,
        }}
        labelStyle={{
          color: incomeSelected ? "white" : "#2E7D32",
          fontWeight: "600",
        }}
        contentStyle={{
          flexDirection: "row-reverse",
          paddingVertical: 8,
        }}
      >
        Income
      </Button>
    </View>
  );
}
