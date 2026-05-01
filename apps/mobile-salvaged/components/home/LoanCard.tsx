/**
 * Home-screen LoanCard (LENDLEE-019).
 *
 * Renders a single active loan as a tappable card with a status badge:
 *   - green  / "On time"   → returnBy is 3+ days away
 *   - yellow / "Due soon"  → returnBy is in the next 1–2 days
 *   - red    / "Overdue"   → returnBy is today or earlier
 *   - blue   / "Active"    → no returnBy set
 *
 * `daysUntilDue` and `deriveStatus` are exported so they can be unit-tested
 * without rendering. Date math is intentionally done at *day* granularity
 * (start-of-day in local time) rather than on raw timestamps. Comparing
 * raw timestamps would make a card lent yesterday at 5pm and a card due
 * today at 9am land on different sides of the "due soon" threshold purely
 * because of clock time, which is what the LENDLEE-019 debug note warned
 * against ("If all badges show the same color: date comparison is off").
 */
import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { categoryConfig } from '@/utils/categories';
import type { LoanWithItem } from '@/lib/db/useLoansRealtime';

export type LoanStatusKind = 'active' | 'due-soon' | 'overdue' | 'no-due';

const MS_PER_DAY = 86_400_000;

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Whole days from `now` to `returnBy`, both normalised to the start of
 * their local calendar day. Today returns 0, tomorrow returns 1,
 * yesterday returns -1.
 */
export function daysUntilDue(returnBy: string, now: Date = new Date()): number {
  const due = new Date(returnBy);
  return Math.round((startOfLocalDay(due) - startOfLocalDay(now)) / MS_PER_DAY);
}

/**
 * Bucket a loan into a status by its return date.
 *
 * The thresholds match the LENDLEE-019 QA scenario:
 *   today (0)   → overdue   (deadline already at the boundary)
 *   2 days out  → due-soon
 *   10 days out → active
 */
export function deriveStatus(
  returnBy: string | null | undefined,
  now: Date = new Date(),
): LoanStatusKind {
  if (!returnBy) return 'no-due';
  const days = daysUntilDue(returnBy, now);
  if (days <= 0) return 'overdue';
  if (days < 3) return 'due-soon';
  return 'active';
}

const STATUS_THEME: Record<
  LoanStatusKind,
  { bg: string; fg: string; label: string }
> = {
  active: { bg: '#E8F5E9', fg: Colors.primaryDark, label: 'On time' },
  'due-soon': { bg: '#FFF8E1', fg: '#A06200', label: 'Due soon' },
  overdue: { bg: '#FDECEA', fg: Colors.destructive, label: 'Overdue' },
  'no-due': { bg: '#E3F2FD', fg: '#1565C0', label: 'Active' },
};

function formatDueLabel(returnBy: string | null | undefined): string {
  if (!returnBy) return 'No return date';
  const d = new Date(returnBy);
  return `Due ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export interface HomeLoanCardProps {
  loan: LoanWithItem;
  /** Injected for tests so badge colors are deterministic. Defaults to `new Date()`. */
  now?: Date;
  /** When provided, overrides the default router.push to a placeholder loan-detail route. */
  onPress?: (loan: LoanWithItem) => void;
}

function LoanCardComponent({ loan, now, onPress }: HomeLoanCardProps) {
  const router = useRouter();
  const status = useMemo(
    () => deriveStatus(loan.return_by, now),
    [loan.return_by, now],
  );
  const theme = STATUS_THEME[status];
  const item = loan.items;
  const emoji = item ? categoryConfig[item.category].emoji : '📦';
  const title = item?.title ?? 'Item';
  const borrowerName = loan.borrower_name?.trim() || 'Someone';

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(loan);
      return;
    }
    // Placeholder route — the detail screen is wired up in a later task.
    router.push({ pathname: '/loan-detail', params: { id: loan.id } });
  }, [router, loan, onPress]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={styles.card}
      testID={`home-loan-card-${loan.id}`}
    >
      <View style={styles.row}>
        <View style={styles.iconBubble}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            With {borrowerName}
          </Text>
          <Text style={styles.dueText} numberOfLines={1}>
            {formatDueLabel(loan.return_by)}
          </Text>
        </View>

        <View
          style={[styles.badge, { backgroundColor: theme.bg }]}
          testID={`home-loan-badge-${loan.id}`}
        >
          <Text style={[styles.badgeText, { color: theme.fg }]}>
            {theme.label}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const LoanCard = React.memo(LoanCardComponent);
export default LoanCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.warmWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.foreground,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.mutedForeground,
  },
  dueText: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
});
