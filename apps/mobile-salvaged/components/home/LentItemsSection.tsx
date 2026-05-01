/**
 * Home-screen "Lent" section (LENDLEE-019).
 *
 * Three render states:
 *   - loading: a small stack of skeleton placeholders. Important: we
 *     render skeletons while loading instead of the empty state, so the
 *     "You haven't lent anything yet" copy doesn't flash for users who
 *     do have loans (per LENDLEE-019 debug note).
 *   - empty:   a card explaining the section + a CTA into the Lend tab.
 *   - list:    one LoanCard per active loan.
 */
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import LoanCard from './LoanCard';
import type { LoanWithItem } from '@/lib/db/useLoansRealtime';

const SKELETON_COUNT = 2;

export interface LentItemsSectionProps {
  loans: LoanWithItem[];
  loading?: boolean;
  /** Pinned "now" for deterministic badge rendering in tests. */
  now?: Date;
  /** Override the default loan-detail navigation on card tap. */
  onPressLoan?: (loan: LoanWithItem) => void;
  /** Override the default empty-state CTA navigation. */
  onPressLendCta?: () => void;
}

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard} testID="lent-skeleton-card">
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonBody}>
        <View style={[styles.skeletonLine, { width: '70%' }]} />
        <View style={[styles.skeletonLine, { width: '40%' }]} />
      </View>
    </View>
  );
}

export default function LentItemsSection({
  loans,
  loading = false,
  now,
  onPressLoan,
  onPressLendCta,
}: LentItemsSectionProps) {
  const router = useRouter();

  const handleCta = useCallback(() => {
    if (onPressLendCta) {
      onPressLendCta();
      return;
    }
    router.push('/(tabs)/lend');
  }, [router, onPressLendCta]);

  return (
    <View style={styles.container} testID="lent-items-section">
      <Text style={styles.header}>Lent</Text>

      {loading ? (
        <View style={styles.list} testID="lent-section-loading">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : loans.length === 0 ? (
        <View style={styles.emptyState} testID="lent-empty-state">
          <Text style={styles.emptyTitle}>
            You haven&apos;t lent anything yet
          </Text>
          <Text style={styles.emptySubtitle}>
            Lend something to a friend and we&apos;ll keep track of it for you.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleCta}
            activeOpacity={0.85}
            testID="lent-empty-cta"
          >
            <Plus size={18} color={Colors.white} />
            <Text style={styles.ctaLabel}>Lend something</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list} testID="lent-section-list">
          {loans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              now={now}
              onPress={onPressLoan}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
    paddingBottom: 16,
    gap: 10,
  },
  header: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.earth,
    paddingHorizontal: 4,
  },
  list: {
    gap: 10,
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.foreground,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  ctaButton: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  ctaLabel: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.warmWhite,
  },
  skeletonBody: {
    flex: 1,
    gap: 8,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 6,
    backgroundColor: Colors.warmWhite,
  },
});
