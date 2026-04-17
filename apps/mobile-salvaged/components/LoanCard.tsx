import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { RotateCcw, Clock, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Loan } from '@/types';
import { useLendlee } from '@/providers/LendleeProvider';
import { categoryConfig } from '@/utils/categories';
import { formatDate, getInitials } from '@/utils/categories';

interface LoanCardProps {
  loan: Loan;
}

function LoanCardComponent({ loan }: LoanCardProps) {
  const { getItemById, getContactById, markReturned } = useLendlee();
  const item = getItemById(loan.itemId);
  const contact = getContactById(loan.contactId);

  if (!item || !contact) return null;

  const category = categoryConfig[item.category];
  const isActive = loan.status === 'active';

  const handleMarkReturned = () => {
    Alert.alert(
      'Mark as Returned',
      `Has ${contact.name} returned "${item.title}"?`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes, returned!',
          onPress: () => {
            markReturned(loan.id).catch((err) => {
              console.log('Failed to mark as returned:', err);
            });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.card, !isActive && styles.cardReturned]} testID={`loan-card-${loan.id}`}>
      <View style={styles.top}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{getInitials(contact.name)}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {category.emoji} {item.title}
          </Text>
          <Text style={styles.contactName}>
            {isActive ? 'With' : 'Was with'} {contact.name}
          </Text>
        </View>
        {isActive ? (
          <View style={styles.activeBadge}>
            <Clock size={12} color="#E65100" />
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        ) : (
          <View style={styles.returnedBadge}>
            <CheckCircle size={12} color={Colors.primaryDark} />
            <Text style={styles.returnedBadgeText}>Returned</Text>
          </View>
        )}
      </View>

      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>Lent {formatDate(loan.lentAt)}</Text>
        {loan.returnBy && (
          <Text style={styles.dateLabel}>Due {formatDate(loan.returnBy)}</Text>
        )}
        {loan.returnedAt && (
          <Text style={styles.returnedDate}>Back {formatDate(loan.returnedAt)}</Text>
        )}
      </View>

      {isActive && (
        <TouchableOpacity
          style={styles.returnButton}
          onPress={handleMarkReturned}
          activeOpacity={0.7}
          testID={`return-button-${loan.id}`}
        >
          <RotateCcw size={16} color={Colors.primary} />
          <Text style={styles.returnButtonText}>Mark as Returned</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export const LoanCard = React.memo(LoanCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardReturned: {
    opacity: 0.7,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.earth,
  },
  details: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.foreground,
  },
  contactName: {
    fontSize: 13,
    color: Colors.mutedForeground,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#E65100',
  },
  returnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  returnedBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 16,
    paddingLeft: 56,
  },
  dateLabel: {
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  returnedDate: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '500' as const,
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: Colors.warmWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  returnButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
