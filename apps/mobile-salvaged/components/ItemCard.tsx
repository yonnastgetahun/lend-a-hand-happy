import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ArrowRightLeft, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Item } from '@/types';
import { categoryConfig } from '@/utils/categories';
import { useLendlee } from '@/providers/LendleeProvider';

interface ItemCardProps {
  item: Item;
  onPress: (item: Item) => void;
}

function ItemCardComponent({ item, onPress }: ItemCardProps) {
  const { getActiveLoanForItem, getContactById } = useLendlee();
  const activeLoan = item.status === 'lent' ? getActiveLoanForItem(item.id) : null;
  const contact = activeLoan ? getContactById(activeLoan.contactId) : null;
  const category = categoryConfig[item.category];

  const statusColors: Record<string, { bg: string; text: string }> = {
    available: { bg: '#E8F5E9', text: Colors.primaryDark },
    lent: { bg: '#FFF3E0', text: '#E65100' },
    returned: { bg: '#E3F2FD', text: '#1565C0' },
  };

  const statusStyle = statusColors[item.status] ?? statusColors.available;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
      testID={`item-card-${item.id}`}
    >
      <View style={styles.photoContainer}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.emoji}>{category.emoji}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <View style={styles.meta}>
          <Text style={styles.category}>{category.emoji} {category.label}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            {item.status === 'lent' ? (
              <ArrowRightLeft size={10} color={statusStyle.text} />
            ) : item.status === 'available' ? (
              <Check size={10} color={statusStyle.text} />
            ) : null}
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status === 'lent' ? 'Lent' : item.status === 'available' ? 'Home' : 'Returned'}
            </Text>
          </View>
        </View>
        {contact && (
          <Text style={styles.lentTo} numberOfLines={1}>
            With {contact.name}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export const ItemCard = React.memo(ItemCardComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: 60,
    height: 60,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: Colors.warmWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  emoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.foreground,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  category: {
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  lentTo: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '500' as const,
  },
});
