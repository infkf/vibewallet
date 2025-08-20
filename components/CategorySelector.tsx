import * as React from "react";
import { ScrollView } from "react-native";
import { Chip } from "react-native-paper";
import { Category, CategoryKind } from "../types";

interface CategorySelectorProps {
  categories: Category[];
  kind: CategoryKind;
  value?: string;
  onChange: (id: string) => void;
}

export function CategorySelector({
  categories,
  kind,
  value,
  onChange,
}: CategorySelectorProps) {
  const filtered = categories.filter((c) => c.kind === kind);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginVertical: 6 }}
    >
      {filtered.map((c) => (
        <Chip
          key={c.id}
          selected={value === c.id}
          onPress={() => onChange(c.id)}
          style={{ marginRight: 8 }}
        >
          {c.name}
        </Chip>
      ))}
    </ScrollView>
  );
}
