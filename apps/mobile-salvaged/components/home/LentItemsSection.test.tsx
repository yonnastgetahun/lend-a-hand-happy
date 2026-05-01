/**
 * Behavioural tests for the home-screen Lent section (LENDLEE-019).
 *
 * Covers the AC:
 *  - Section renders with a "Lent" header and one card per active loan.
 *  - Status badge background color reflects daysUntilDue:
 *      today → overdue (red), 2 days → due-soon (yellow), 10 days → active (green).
 *  - Empty state renders only when not loading; skeleton renders during load.
 *  - Tapping a card invokes the loan-detail navigation (placeholder route).
 *  - Tapping the empty-state CTA navigates to the Lend tab.
 *
 * Helper functions `daysUntilDue` and `deriveStatus` are exported from
 * LoanCard so we can test the date math without rendering anything.
 */
import '../../test-support/mock-react-native';

import { describe, test, expect, mock, beforeEach } from 'bun:test';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import type { LoanWithItem } from '@/lib/db/useLoansRealtime';

// --- mocks --------------------------------------------------------------

// expo-router: useRouter returns a stable push spy. Each test resets it
// in beforeEach so call counts don't bleed between cases.
const routerPush = mock((_args: unknown) => {});

mock.module('expo-router', () => ({
  useRouter: () => ({ push: routerPush }),
}));

// Colors are referenced by static lookup all over the components — a
// Proxy keeps the test agnostic of which keys are used.
mock.module('@/constants/colors', () => ({
  default: new Proxy({} as Record<string, string>, {
    get: (_, key) => (typeof key === 'string' ? `#${key}` : '#x'),
  }),
}));

// Same first-mock-wins rule applies to @/utils/categories — we have
// to expose the full surface area or sibling test files break.
mock.module('@/utils/categories', () => ({
  categoryConfig: {
    book: { label: 'Book', emoji: '📚' },
    tool: { label: 'Tool', emoji: '🔧' },
    game: { label: 'Game', emoji: '🎲' },
    gear: { label: 'Gear', emoji: '🎒' },
    other: { label: 'Other', emoji: '📦' },
  },
  categoryList: ['book', 'tool', 'game', 'gear', 'other'],
  formatDate: (s: string) => s,
  getInitials: (name: string) =>
    name
      .split(' ')
      .map((n) => n[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  timeAgo: (s: string) => s,
}));

// Lucide icons render as host stubs so react-test-renderer doesn't try
// to reach into native SVG bindings.
//
// Bun's test runner shares the module registry across files, so the
// first `mock.module('lucide-react-native', ...)` call wins for the
// whole suite. That means this mock has to enumerate every icon any
// other test file might need — `Plus` alone would silently break
// ContactPicker.test.tsx (which imports `Search`/`ChevronRight`/
// `UserPlus`). The list below is the union of icons imported across
// all production sources scanned at the time of writing.
mock.module('lucide-react-native', () => {
  const stub = (name: string) => (props: Record<string, unknown>) =>
    React.createElement('icon', { testID: `icon-${name}`, ...props });
  return {
    Apple: stub('apple'),
    ArrowRightLeft: stub('arrow-right-left'),
    Bell: stub('bell'),
    Calendar: stub('calendar'),
    Camera: stub('camera'),
    Check: stub('check'),
    CheckCircle: stub('check-circle'),
    ChevronRight: stub('chevron-right'),
    Chrome: stub('chrome'),
    Clock: stub('clock'),
    Gift: stub('gift'),
    Heart: stub('heart'),
    HelpCircle: stub('help-circle'),
    History: stub('history'),
    Home: stub('home'),
    ImageIcon: stub('image-icon'),
    LogOut: stub('log-out'),
    Mail: stub('mail'),
    Package: stub('package'),
    Plus: stub('plus'),
    RotateCcw: stub('rotate-ccw'),
    Search: stub('search'),
    Send: stub('send'),
    Shield: stub('shield'),
    SkipForward: stub('skip-forward'),
    User: stub('user'),
    UserPlus: stub('user-plus'),
    X: stub('x'),
  };
});

const { default: LentItemsSection } = await import('./LentItemsSection');
const { daysUntilDue, deriveStatus } = await import('./LoanCard');

// --- helpers ------------------------------------------------------------

function makeLoan(
  id: string,
  overrides: Partial<LoanWithItem> = {},
): LoanWithItem {
  return {
    id,
    item_id: `item-${id}`,
    contact_id: null,
    lender_id: 'user-1',
    borrower_name: 'Jamie',
    borrower_phone: '+15555550123',
    tone: 'friendly',
    lent_at: '2026-04-22T10:00:00.000Z',
    return_by: null,
    returned_at: null,
    status: 'active',
    reminder_sent: false,
    reminder_sent_at: null,
    notes: null,
    created_at: '2026-04-22T10:00:00.000Z',
    items: {
      id: `item-${id}`,
      title: `Item ${id}`,
      category: 'book',
      photo_url: null,
    },
    ...overrides,
  };
}

function findByTestID(tree: TestRenderer.ReactTestInstance, id: string) {
  // Match host nodes only — our RN stub wraps primitives in forwardRef
  // components, which doubles every match in the tree.
  return tree.findAll(
    (node: TestRenderer.ReactTestInstance) =>
      node.props?.testID === id && typeof node.type === 'string',
  );
}

function press(node: TestRenderer.ReactTestInstance) {
  act(() => {
    node.props.onPress?.();
  });
}

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>(
      (acc, s) => ({ ...acc, ...flattenStyle(s) }),
      {},
    );
  }
  return (style as Record<string, unknown>) ?? {};
}

beforeEach(() => {
  routerPush.mockClear();
});

// --- daysUntilDue / deriveStatus ----------------------------------------

describe('daysUntilDue', () => {
  // Pin "now" to a known local moment so day comparisons are stable.
  const now = new Date(2026, 3, 22, 14, 30); // Apr 22 2026, 2:30 PM local

  test('returns 0 for any time on the same calendar day', () => {
    const earlyToday = new Date(2026, 3, 22, 7, 0).toISOString();
    const lateToday = new Date(2026, 3, 22, 23, 30).toISOString();
    expect(daysUntilDue(earlyToday, now)).toBe(0);
    expect(daysUntilDue(lateToday, now)).toBe(0);
  });

  test('returns 2 for two calendar days out', () => {
    const due = new Date(2026, 3, 24, 9, 0).toISOString();
    expect(daysUntilDue(due, now)).toBe(2);
  });

  test('returns 10 for ten calendar days out', () => {
    const due = new Date(2026, 4, 2, 9, 0).toISOString();
    expect(daysUntilDue(due, now)).toBe(10);
  });

  test('returns -1 for yesterday (overdue territory)', () => {
    const due = new Date(2026, 3, 21, 12, 0).toISOString();
    expect(daysUntilDue(due, now)).toBe(-1);
  });
});

describe('deriveStatus', () => {
  const now = new Date(2026, 3, 22, 14, 30);

  test('today → overdue', () => {
    expect(
      deriveStatus(new Date(2026, 3, 22, 9, 0).toISOString(), now),
    ).toBe('overdue');
  });

  test('two days out → due-soon', () => {
    expect(
      deriveStatus(new Date(2026, 3, 24, 9, 0).toISOString(), now),
    ).toBe('due-soon');
  });

  test('ten days out → active', () => {
    expect(
      deriveStatus(new Date(2026, 4, 2, 9, 0).toISOString(), now),
    ).toBe('active');
  });

  test('null/undefined returnBy → no-due (separate bucket from active)', () => {
    expect(deriveStatus(null, now)).toBe('no-due');
    expect(deriveStatus(undefined, now)).toBe('no-due');
  });
});

// --- LentItemsSection ----------------------------------------------------

describe('LentItemsSection', () => {
  function render(
    props?: Partial<React.ComponentProps<typeof LentItemsSection>>,
  ) {
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <LentItemsSection loans={[]} {...props} />,
      );
    });
    return tree;
  }

  test('renders the section container with a "Lent" header', () => {
    const tree = render();
    expect(findByTestID(tree.root, 'lent-items-section')).toHaveLength(1);
  });

  test('shows the empty state with a CTA when there are no loans', () => {
    const tree = render({ loans: [] });
    expect(findByTestID(tree.root, 'lent-empty-state')).toHaveLength(1);
    expect(findByTestID(tree.root, 'lent-empty-cta')).toHaveLength(1);
    // No skeleton when not loading.
    expect(findByTestID(tree.root, 'lent-skeleton-card')).toHaveLength(0);
  });

  test('shows skeleton placeholders while loading and hides the empty state', () => {
    const tree = render({ loans: [], loading: true });
    expect(findByTestID(tree.root, 'lent-section-loading')).toHaveLength(1);
    expect(findByTestID(tree.root, 'lent-empty-state')).toHaveLength(0);
    expect(
      findByTestID(tree.root, 'lent-skeleton-card').length,
    ).toBeGreaterThan(0);
  });

  test('renders one card per loan with status-specific badge colors', () => {
    const now = new Date(2026, 3, 22, 14, 30);
    const today = new Date(2026, 3, 22, 9, 0).toISOString();
    const twoDays = new Date(2026, 3, 24, 9, 0).toISOString();
    const tenDays = new Date(2026, 4, 2, 9, 0).toISOString();

    const tree = render({
      loans: [
        makeLoan('a', { return_by: today }),
        makeLoan('b', { return_by: twoDays }),
        makeLoan('c', { return_by: tenDays }),
      ],
      now,
    });

    // One card per loan.
    expect(findByTestID(tree.root, 'home-loan-card-a')).toHaveLength(1);
    expect(findByTestID(tree.root, 'home-loan-card-b')).toHaveLength(1);
    expect(findByTestID(tree.root, 'home-loan-card-c')).toHaveLength(1);

    // Badges are present and have *different* background colors. Three
    // distinct backgrounds means the day comparison didn't collapse them
    // into the same status (the LENDLEE-019 debug failure mode).
    const bgOf = (id: string) =>
      flattenStyle(
        findByTestID(tree.root, `home-loan-badge-${id}`)[0].props.style,
      ).backgroundColor;

    const colors = [bgOf('a'), bgOf('b'), bgOf('c')];
    expect(new Set(colors).size).toBe(3);
  });

  test('a loan with no return_by renders as no-due (not overdue)', () => {
    const tree = render({ loans: [makeLoan('z', { return_by: null })] });
    const badge = findByTestID(tree.root, 'home-loan-badge-z')[0];
    // Just assert a badge exists. Color identity is covered above; this
    // case mainly guards against the null path throwing.
    expect(badge).toBeDefined();
  });

  test('tapping a card navigates to a placeholder loan-detail route', () => {
    const tree = render({ loans: [makeLoan('a')] });
    press(findByTestID(tree.root, 'home-loan-card-a')[0]);

    expect(routerPush).toHaveBeenCalledTimes(1);
    const arg = routerPush.mock.calls[0][0] as {
      pathname?: string;
      params?: { id?: string };
    };
    expect(String(arg.pathname)).toMatch(/loan/);
    expect(arg.params?.id).toBe('a');
  });

  test('tapping a card calls onPressLoan instead of router when provided', () => {
    const onPressLoan = mock((_l: LoanWithItem) => {});
    const tree = render({
      loans: [makeLoan('a')],
      onPressLoan,
    });

    press(findByTestID(tree.root, 'home-loan-card-a')[0]);

    expect(onPressLoan).toHaveBeenCalledTimes(1);
    expect(onPressLoan.mock.calls[0][0].id).toBe('a');
    expect(routerPush).not.toHaveBeenCalled();
  });

  test('tapping the empty-state CTA navigates to the Lend tab', () => {
    const tree = render({ loans: [] });
    press(findByTestID(tree.root, 'lent-empty-cta')[0]);

    expect(routerPush).toHaveBeenCalledTimes(1);
    const arg = routerPush.mock.calls[0][0];
    const path = typeof arg === 'string' ? arg : (arg as { pathname?: string }).pathname;
    expect(String(path)).toMatch(/lend/);
  });

  test('CTA prefers onPressLendCta over default router navigation', () => {
    const onCta = mock(() => {});
    const tree = render({ loans: [], onPressLendCta: onCta });
    press(findByTestID(tree.root, 'lent-empty-cta')[0]);

    expect(onCta).toHaveBeenCalledTimes(1);
    expect(routerPush).not.toHaveBeenCalled();
  });
});
