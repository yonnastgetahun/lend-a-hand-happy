import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { History } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useLendlee, useFilteredLoans } from '@/providers/LendleeProvider';
import { LoanCard } from '@/components/LoanCard';
import { Loan } from '@/types';

type FilterType = 'all' | 'active' | 'returned';

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'returned', label: 'Returned' },
];

export default function HistoryScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const { isLoading } = useLendlee();
  const filteredLoans = useFilteredLoans(activeFilter);

  const renderItem = useCallback(({ item }: { item: Loan }) => (
    <LoanCard loan={item} />
  ), []);

  const keyExtractor = useCallback((item: Loan) => item.id, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              activeFilter === f.key && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === f.key && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredLoans}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <History size={48} color={Colors.mutedForeground} />
            <Text style={styles.emptyTitle}>No loans yet</Text>
            <Text style={styles.emptySubtitle}>
              When you lend an item, it will appear here
            </Text>
          </View>
        }
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.warmWhite,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.mutedForeground,
  },
  filterTextActive: {
    color: Colors.cream,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
});
