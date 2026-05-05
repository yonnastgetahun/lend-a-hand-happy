import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageIcon, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useLendlee } from '@/providers/LendleeProvider';
import { ItemCategory } from '@/types';
import { categoryConfig, categoryList } from '@/utils/categories';

export default function AddItemScreen() {
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ItemCategory>('book');
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const { addItem, isAddingItem } = useLendlee();
  const router = useRouter();

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    if (Platform.OS === 'web') {
      void handlePickImage();
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  }, [handlePickImage]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;
    try {
      await addItem({
        title: title.trim(),
        category,
        photo,
      });
      router.back();
    } catch (err) {
      console.log('Failed to add item:', err);
      Alert.alert('Error', 'Failed to save item. Please try again.');
    }
  }, [title, category, photo, addItem, router]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: 'Add Item',
          headerStyle: { backgroundColor: Colors.cream },
          headerTintColor: Colors.earth,
          headerShadowVisible: false,
        }}
      />

      <Text style={styles.sectionLabel}>Category</Text>
      <View style={styles.categoryGrid}>
        {categoryList.map((cat) => {
          const config = categoryConfig[cat];
          const isSelected = category === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
              onPress={() => setCategory(cat)}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryEmoji}>{config.emoji}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  isSelected && styles.categoryLabelSelected,
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Photo</Text>
      <View style={styles.photoSection}>
        {photo ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: photo }} style={styles.photoPreview} contentFit="cover" />
            <TouchableOpacity
              style={styles.removePhoto}
              onPress={() => setPhoto(undefined)}
              activeOpacity={0.7}
            >
              <X size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleTakePhoto}
              activeOpacity={0.7}
              testID="camera-button"
            >
              <Camera size={24} color={Colors.primary} />
              <Text style={styles.photoButtonText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handlePickImage}
              activeOpacity={0.7}
              testID="gallery-button"
            >
              <ImageIcon size={24} color={Colors.primary} />
              <Text style={styles.photoButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.sectionLabel}>Name it</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Name of item"
        placeholderTextColor={Colors.mutedForeground}
        testID="item-title-input"
      />

      <TouchableOpacity
        style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!title.trim() || isAddingItem}
        activeOpacity={0.8}
        testID="save-item-button"
      >
        {isAddingItem ? (
          <ActivityIndicator color={Colors.cream} />
        ) : (
          <Text style={styles.saveButtonText}>Save Item</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.earthLight,
    marginBottom: 10,
    paddingLeft: 4,
  },
  photoSection: {
    marginBottom: 24,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  photoPreviewContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  photoPreview: {
    width: 160,
    height: 160,
    borderRadius: 20,
  },
  removePhoto: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.foreground,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.earth,
  },
  categoryLabelSelected: {
    color: Colors.white,
    fontWeight: '600' as const,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: Colors.cream,
    fontSize: 17,
    fontWeight: '600' as const,
  },
});
