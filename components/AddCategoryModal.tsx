import * as React from "react";
import { useState } from "react";
import { Modal, ScrollView, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { CategoryKind } from "../types";
import { LabeledInput } from "./LabeledInput";
import { ColorPicker } from "./ColorPicker";

interface AddCategoryModalProps {
  visible: boolean;
  kind: CategoryKind;
  onClose: () => void;
  onAdd: (name: string, color: string) => void;
}

export function AddCategoryModal({
  visible,
  kind,
  onClose,
  onAdd,
}: AddCategoryModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#4ECDC4");

  const handleAdd = () => {
    if (name.trim()) {
      onAdd(name.trim(), color);
      setName("");
      setColor("#4ECDC4");
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.3)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            paddingTop: 16,
            paddingHorizontal: 16,
            paddingBottom: 16,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: "80%",
          }}
        >
          <Text variant="titleLarge" style={{ marginBottom: 16 }}>
            New {kind} category
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ marginBottom: 16 }}>
              <LabeledInput
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder="e.g., Groceries"
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <ColorPicker value={color} onChange={setColor} />
            </View>
          </ScrollView>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 8,
            }}
          >
            <Button mode="outlined" onPress={onClose}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleAdd}>
              Add
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
