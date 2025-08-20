import * as React from "react";
import { View } from "react-native";
import { Text, TextInput } from "react-native-paper";

interface LabeledInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "numeric";
  placeholder?: string;
}

export function LabeledInput({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  placeholder,
}: LabeledInputProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text variant="labelMedium" style={{ marginBottom: 8 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        mode="outlined"
        style={{ backgroundColor: "transparent" }}
      />
    </View>
  );
}
