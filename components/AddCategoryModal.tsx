import * as React from 'react';
import { useState } from 'react';
import { Button, Modal, Text, View } from 'react-native';
import { CategoryKind } from '../types';
import { LabeledInput } from './LabeledInput';

interface AddCategoryModalProps {
  visible: boolean;
  kind: CategoryKind;
  onClose: () => void;
  onAdd: (name: string) => void;
}

export function AddCategoryModal({ visible, kind, onClose, onAdd }: AddCategoryModalProps) {
  const [name, setName] = useState('');
  
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8 }}>New {kind} category</Text>
          <LabeledInput label="Name" value={name} onChangeText={setName} placeholder="e.g., Groceries" />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button title="Cancel" onPress={onClose} />
            <Button title="Add" onPress={() => { if (name.trim()) { onAdd(name.trim()); setName(''); onClose(); } }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
