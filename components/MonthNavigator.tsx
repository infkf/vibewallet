import * as React from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";

interface MonthNavigatorProps {
  start: Date;
  end: Date;
  onChange: (start: Date, end: Date) => void;
}

export function MonthNavigator({ start, onChange }: MonthNavigatorProps) {
  const label = `${start.toLocaleString(undefined, { month: "long" })} ${start.getFullYear()}`;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
      }}
    >
      <Button
        mode="outlined"
        onPress={() => {
          const s = new Date(start.getFullYear(), start.getMonth() - 1, 1);
          const e = new Date(
            s.getFullYear(),
            s.getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
          );
          onChange(s, e);
        }}
      >
        ◀ Prev
      </Button>
      <Text variant="titleMedium" style={{ textAlign: "center", flex: 1 }}>
        {label}
      </Text>
      <Button
        mode="outlined"
        onPress={() => {
          const s = new Date(start.getFullYear(), start.getMonth() + 1, 1);
          const e = new Date(
            s.getFullYear(),
            s.getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
          );
          onChange(s, e);
        }}
      >
        Next ▶
      </Button>
    </View>
  );
}
