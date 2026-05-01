import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Package } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useLendlee } from '@/providers/LendleeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useLoansRealtime, type LoanWithItem } from '@/lib/db/useLoansRealtime';
import { ItemCard } from '@/components/ItemCard';
import LentItemsSection from '@/components/home/LentItemsSection';
import { SuccessToast } from '@/components/SuccessToast';
import { Item } from '@/types';

export default function HomeScreen() {
  const { items, stats, isLoading } = useLendlee();
  const { total, available, lent, given } = stats;
  const router = useRouter();
  const { user } = useAuth();

  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  const handleNewLoan = useCallback((loan: LoanWithItem) => {
    const itemName = loan.items?.title ?? 'Item';
    const borrower = loan.borrower_name?.trim();
    const message = borrower
      ? `Lent "${itemName}" to ${borrower}`
      : `Lent "${itemName}"`;
    setToast({ visible: true, message });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const { loans: lentLoans, loading: loansLoading } = useLoansRealtime(
    user?.id,
    { onInsert: handleNewLoan },
  );

  const handleItemPress = useCallback((item: Item) => {
    router.push({ pathname: '/item-detail', params: { id: item.id } });
  }, [router]);

  const handleAddItem = useCallback(() => {
    router.push('/add-item');
  }, [router]);

  const renderItem = useCallback(({ item }: { item: Item }) => (
    <ItemCard item={item} onPress={handleItemPress} />
  ), [handleItemPress]);

  const keyExtractor = useCallback((item: Item) => item.id, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{total}</Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.primary }]}>{available}</Text>
          <Text style={styles.statLabel}>Home</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#E65100' }]}>{lent}</Text>
          <Text style={styles.statLabel}>Lent</Text>
        </View>
        {given > 0 && (
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.accent }]}>{given}</Text>
            <Text style={styles.statLabel}>Given</Text>
          </View>
        )}
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <LentItemsSection loans={lentLoans} loading={loansLoading} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Package size={48} color={Colors.mutedForeground} />
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptySubtitle}>
              Start lending or giving away
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddItem}
        activeOpacity={0.85}
        testID="add-item-fab"
      >
        <Plus size={26} color={Colors.cream} />
      </TouchableOpacity>

      <SuccessToast
        visible={toast.visible}
        message={toast.message}
        onHide={hideToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cream,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.earth,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  separator: {
    height: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.earth,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
