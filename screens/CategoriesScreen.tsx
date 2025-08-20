import * as React from "react";
import { useState } from "react";
import { ScrollView, View, Alert } from "react-native";
import {
  Card,
  Text,
  Button,
  List,
  IconButton,
  Dialog,
  Portal,
  TextInput,
  Chip,
} from "react-native-paper";
import { AppData, Category, CategoryKind } from "../types";
import { saveData } from "../storage";
import { uid, stringToColor } from "../utils";
import { ColorPicker } from "../components";

interface CategoriesScreenProps {
  data: AppData;
  setData: (data: AppData) => void;
}

export default function CategoriesScreen({
  data,
  setData,
}: CategoriesScreenProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryKind, setNewCategoryKind] =
    useState<CategoryKind>("expense");
  const [newCategoryColor, setNewCategoryColor] = useState<string | undefined>(
    undefined,
  );

  const resetForm = () => {
    setNewCategoryName("");
    setNewCategoryKind("expense");
    setNewCategoryColor(undefined);
    setEditingCategory(null);
  };

  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryKind(category.kind);
    setNewCategoryColor(category.color);
    setShowEditDialog(true);
  };

  const closeDialogs = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    resetForm();
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Missing info", "Enter a category name.");
      return;
    }

    const category: Category = {
      id: uid(),
      name: newCategoryName.trim(),
      kind: newCategoryKind,
      color: newCategoryColor || stringToColor(newCategoryName.trim()),
    };

    const next = { ...data, categories: [...data.categories, category] };
    setData(next);
    await saveData(next);
    closeDialogs();
  };

  const updateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) {
      Alert.alert("Missing info", "Enter a category name.");
      return;
    }

    const updatedCategory: Category = {
      ...editingCategory,
      name: newCategoryName.trim(),
      kind: newCategoryKind,
      color: newCategoryColor || stringToColor(newCategoryName.trim()),
    };

    const next = {
      ...data,
      categories: data.categories.map((c) =>
        c.id === editingCategory.id ? updatedCategory : c,
      ),
    };
    setData(next);
    await saveData(next);
    closeDialogs();
  };

  const deleteCategory = async (categoryId: string) => {
    const category = data.categories.find((c) => c.id === categoryId);
    if (!category) return;

    // Check if category is used in transactions
    const hasTransactions = data.transactions.some(
      (t) => t.categoryId === categoryId,
    );
    if (hasTransactions) {
      Alert.alert(
        "Cannot delete category",
        "This category is used in transactions. Please remove or reassign the transactions first.",
      );
      return;
    }

    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const next = {
              ...data,
              categories: data.categories.filter((c) => c.id !== categoryId),
            };
            setData(next);
            await saveData(next);
          },
        },
      ],
    );
  };

  const expenseCategories = data.categories.filter((c) => c.kind === "expense");
  const incomeCategories = data.categories.filter((c) => c.kind === "income");

  const renderCategoryItem = (category: Category) => {
    const transactionCount = data.transactions.filter(
      (t) => t.categoryId === category.id,
    ).length;
    return (
      <List.Item
        key={category.id}
        title={category.name}
        description={`${transactionCount} transaction${transactionCount !== 1 ? "s" : ""}`}
        left={() => (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: category.color || stringToColor(category.name),
              marginLeft: 8,
              marginRight: 8,
              alignSelf: "center",
            }}
          />
        )}
        right={(props) => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <IconButton
              {...props}
              icon="pencil"
              size={20}
              onPress={() => openEditDialog(category)}
            />
            <IconButton
              {...props}
              icon="delete"
              size={20}
              onPress={() => deleteCategory(category.id)}
            />
          </View>
        )}
      />
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Button
        mode="contained"
        onPress={openAddDialog}
        style={{ marginBottom: 16 }}
        icon="plus"
      >
        Add Category
      </Button>

      <Card style={{ marginBottom: 16 }}>
        <Card.Title
          title="Expense Categories"
          subtitle={`${expenseCategories.length} categories`}
        />
        <Card.Content>
          {expenseCategories.length === 0 ? (
            <Text
              variant="bodyMedium"
              style={{ textAlign: "center", padding: 16 }}
            >
              No expense categories yet.
            </Text>
          ) : (
            expenseCategories.map(renderCategoryItem)
          )}
        </Card.Content>
      </Card>

      <Card>
        <Card.Title
          title="Income Categories"
          subtitle={`${incomeCategories.length} categories`}
        />
        <Card.Content>
          {incomeCategories.length === 0 ? (
            <Text
              variant="bodyMedium"
              style={{ textAlign: "center", padding: 16 }}
            >
              No income categories yet.
            </Text>
          ) : (
            incomeCategories.map(renderCategoryItem)
          )}
        </Card.Content>
      </Card>

      {/* Add Category Dialog */}
      <Portal>
        <Dialog visible={showAddDialog} onDismiss={closeDialogs}>
          <Dialog.Title>Add New Category</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Category Name"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="e.g., Groceries"
              mode="outlined"
              style={{ marginBottom: 16, backgroundColor: "transparent" }}
            />

            <Text variant="labelMedium" style={{ marginBottom: 8 }}>
              Type
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              <Chip
                selected={newCategoryKind === "expense"}
                onPress={() => setNewCategoryKind("expense")}
              >
                Expense
              </Chip>
              <Chip
                selected={newCategoryKind === "income"}
                onPress={() => setNewCategoryKind("income")}
              >
                Income
              </Chip>
            </View>

            <Text variant="labelMedium" style={{ marginBottom: 8 }}>
              Color
            </Text>
            <ColorPicker
              value={newCategoryColor || stringToColor(newCategoryName)}
              onChange={setNewCategoryColor}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialogs}>Cancel</Button>
            <Button onPress={addCategory}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Category Dialog */}
      <Portal>
        <Dialog visible={showEditDialog} onDismiss={closeDialogs}>
          <Dialog.Title>Edit Category</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Category Name"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="e.g., Groceries"
              mode="outlined"
              style={{ marginBottom: 16, backgroundColor: "transparent" }}
            />

            <Text variant="labelMedium" style={{ marginBottom: 8 }}>
              Type
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              <Chip
                selected={newCategoryKind === "expense"}
                onPress={() => setNewCategoryKind("expense")}
              >
                Expense
              </Chip>
              <Chip
                selected={newCategoryKind === "income"}
                onPress={() => setNewCategoryKind("income")}
              >
                Income
              </Chip>
            </View>

            <Text variant="labelMedium" style={{ marginBottom: 8 }}>
              Color
            </Text>
            <ColorPicker
              value={newCategoryColor || stringToColor(newCategoryName)}
              onChange={setNewCategoryColor}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialogs}>Cancel</Button>
            <Button onPress={updateCategory}>Update</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}
