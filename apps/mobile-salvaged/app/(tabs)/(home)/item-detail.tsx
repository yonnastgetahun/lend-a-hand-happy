import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowRightLeft, RotateCcw, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useLendlee } from '@/providers/LendleeProvider';
import { categoryConfig } from '@/utils/categories';
import { formatDate, getInitials, timeAgo } from '@/utils/categories';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getItemById, getActiveLoanForItem, getContactById, markReturned } = useLendlee();

  const item = id ? getItemById(id) : undefined;
  const activeLoan = item ? getActiveLoanForItem(item.id) : undefined;
  const contact = activeLoan ? getContactById(activeLoan.contactId) : undefined;

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Item not found</Text>
      </View>
    );
  }

  const category = categoryConfig[item.category];

  const handleLend = () => {
    router.push({ pathname: '/select-contact', params: { itemId: item.id } });
  };

  const handleReturn = () => {
    if (!activeLoan) return;
    Alert.alert(
      'Mark as Returned',
      `Has ${contact?.name ?? 'the borrower'} returned "${item.title}"?`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes, returned!',
          onPress: () => {
            void markReturned(activeLoan.id);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: item.title }} />

      <View style={styles.photoSection}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.bigEmoji}>{category.emoji}</Text>
          </View>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryText}>{category.emoji} {category.label}</Text>
          <Text style={styles.dateText}>Added {timeAgo(item.createdAt)}</Text>
        </View>
      </View>

      {item.status === 'lent' && activeLoan && contact && (
        <View style={styles.loanSection}>
          <View style={styles.loanHeader}>
            <Clock size={16} color="#E65100" />
            <Text style={styles.loanHeaderText}>Currently lent out</Text>
          </View>
          <View style={styles.contactRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(contact.name)}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.lentDate}>Since {formatDate(activeLoan.lentAt)}</Text>
              {activeLoan.returnBy && (
                <Text style={styles.dueDate}>Due {formatDate(activeLoan.returnBy)}</Text>
              )}
            </View>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {item.status === 'available' && (
          <TouchableOpacity
            style={styles.lendButton}
            onPress={handleLend}
            activeOpacity={0.8}
            testID="lend-button"
          >
            <ArrowRightLeft size={20} color={Colors.cream} />
            <Text style={styles.lendButtonText}>Lend This Item</Text>
          </TouchableOpacity>
        )}

        {item.status === 'lent' && activeLoan && (
          <TouchableOpacity
            style={styles.returnButton}
            onPress={handleReturn}
            activeOpacity={0.8}
            testID="return-button"
          >
            <RotateCcw size={20} color={Colors.primary} />
            <Text style={styles.returnButtonText}>Mark as Returned</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    paddingBottom: 40,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 40,
    color: Colors.mutedForeground,
    fontSize: 16,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  photo: {
    width: 160,
    height: 160,
    borderRadius: 24,
  },
  photoPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 24,
    backgroundColor: Colors.warmWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bigEmoji: {
    fontSize: 64,
  },
  detailSection: {
    paddingHorizontal: 24,
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.earth,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 15,
    color: Colors.mutedForeground,
  },
  dateText: {
    fontSize: 13,
    color: Colors.mutedForeground,
  },
  loanSection: {
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: '#FFF8F0',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F5E6D8',
  },
  loanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loanHeaderText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#E65100',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.earth,
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.foreground,
  },
  lentDate: {
    fontSize: 13,
    color: Colors.mutedForeground,
  },
  dueDate: {
    fontSize: 13,
    color: '#E65100',
    fontWeight: '500' as const,
  },
  actions: {
    paddingHorizontal: 24,
    marginTop: 28,
    gap: 12,
  },
  lendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 18,
  },
  lendButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.cream,
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.warmWhite,
    borderRadius: 14,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  returnButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
