import * as React from "react";
import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { Card, DataTable, Text } from "react-native-paper";
import { AppData } from "../types";
import { formatCurrency, stringToColor } from "../utils";
import { MonthNavigator } from "../components";
import { PieChart, PieDatum } from "../components/PieChart";

interface ChartScreenProps {
  data: AppData;
  currency: string;
  rangeStart: Date;
  rangeEnd: Date;
  onRangeChange: (start: Date, end: Date) => void;
}

export default function ChartScreen({
  data,
  currency,
  rangeStart,
  rangeEnd,
  onRangeChange,
}: ChartScreenProps) {
  const transactionsInRange = useMemo(() => {
    const s = rangeStart.getTime();
    const e = rangeEnd.getTime();
    return data.transactions.filter((t) => {
      const ts = new Date(t.date).getTime();
      return ts >= s && ts <= e;
    });
  }, [data.transactions, rangeStart, rangeEnd]);

  const totals = useMemo(() => {
    const exp = transactionsInRange
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const inc = transactionsInRange
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    return { expense: exp, income: inc, net: inc - exp };
  }, [transactionsInRange]);

  const expenseByCategory: PieDatum[] = useMemo(() => {
    const map = new Map<string, number>();
    transactionsInRange
      .filter((t) => t.type === "expense")
      .forEach((t) =>
        map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount),
      );

    const items: PieDatum[] = [];
    for (const [cid, val] of map.entries()) {
      const cat = data.categories.find((c) => c.id === cid);
      if (!cat) continue;
      items.push({
        key: cid,
        label: cat.name,
        value: val,
        color: cat.color || stringToColor(cat.name),
      });
    }
    // sort desc by value
    items.sort((a, b) => b.value - a.value);
    return items;
  }, [transactionsInRange, data.categories]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card style={{ marginBottom: 16 }}>
        <Card.Title title="Date Range" />
        <Card.Content>
          <MonthNavigator
            start={rangeStart}
            end={rangeEnd}
            onChange={onRangeChange}
          />
        </Card.Content>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Card.Title title="Totals" />
        <Card.Content>
          <View
            style={{ flexDirection: "row", justifyContent: "space-around" }}
          >
            <View style={{ alignItems: "center" }}>
              <Text variant="labelMedium" style={{ marginBottom: 4 }}>
                Income
              </Text>
              <Text
                variant="headlineSmall"
                style={{ color: "#137333", fontVariant: ["tabular-nums"] }}
              >
                {formatCurrency(totals.income, currency)}
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text variant="labelMedium" style={{ marginBottom: 4 }}>
                Expense
              </Text>
              <Text
                variant="headlineSmall"
                style={{ color: "#D93025", fontVariant: ["tabular-nums"] }}
              >
                {formatCurrency(totals.expense, currency)}
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text variant="labelMedium" style={{ marginBottom: 4 }}>
                Net
              </Text>
              <Text
                variant="headlineSmall"
                style={{
                  color: totals.net >= 0 ? "#137333" : "#D93025",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {formatCurrency(totals.net, currency)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Spending by Category" />
        <Card.Content>
          {expenseByCategory.length === 0 ? (
            <Text
              variant="bodyMedium"
              style={{ textAlign: "center", padding: 16 }}
            >
              No expenses in selected range.
            </Text>
          ) : (
            <View style={{ alignItems: "center" }}>
              <PieChart data={expenseByCategory} size={240} />
            </View>
          )}
        </Card.Content>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Category</DataTable.Title>
            <DataTable.Title numeric>Amount</DataTable.Title>
          </DataTable.Header>
          {expenseByCategory.map((d) => (
            <DataTable.Row key={d.key}>
              <DataTable.Cell>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: d.color,
                    }}
                  />
                  <Text variant="bodyMedium">{d.label}</Text>
                </View>
              </DataTable.Cell>
              <DataTable.Cell numeric>
                <Text
                  variant="bodyMedium"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatCurrency(d.value, currency)}
                </Text>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Card>
    </ScrollView>
  );
}
