import * as React from 'react';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#F39C12', '#E74C3C', '#9B59B6', '#3498DB',
  '#1ABC9C', '#2ECC71', '#F1C40F', '#E67E22', '#95A5A6',
  '#34495E', '#FF1A6E', '#00C23F', '#DF3A31', '#00C2C8',
  '#A74EA0', '#E0B81A', '#42758A', '#EB595C', '#E58A18',
  '#81BF16', '#CCC618', '#E86F28', '#368E5C', '#E5A319'
];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value);

  const handleCustomColorChange = (text: string) => {
    setCustomColor(text);
    // Validate hex color format
    if (/^#[0-9A-F]{6}$/i.test(text)) {
      onChange(text);
    }
  };

  return (
    <View>
      <Text style={{ fontSize: 12, color: '#444', marginBottom: 8 }}>Choose a color</Text>
      
      {/* Preset colors grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {PRESET_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            onPress={() => {
              onChange(color);
              setCustomColor(color);
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: color,
              borderWidth: value === color ? 3 : 1,
              borderColor: value === color ? '#000' : '#ccc',
            }}
          />
        ))}
      </View>

      {/* Custom color input */}
      <View>
        <Text style={{ fontSize: 12, color: '#444', marginBottom: 4 }}>Custom color (hex)</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput
            value={customColor}
            onChangeText={handleCustomColorChange}
            placeholder="#FF0000"
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
            }}
            maxLength={7}
          />
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: /^#[0-9A-F]{6}$/i.test(customColor) ? customColor : '#f0f0f0',
              borderWidth: 1,
              borderColor: '#ccc',
            }}
          />
        </View>
      </View>
    </View>
  );
}
