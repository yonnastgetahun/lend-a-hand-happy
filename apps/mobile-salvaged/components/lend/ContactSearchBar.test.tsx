/**
 * Behavioral tests for LENDLEE-009: contacts search bar with debounced filter.
 *
 * Covers the AC:
 *  - ContactSearchBar is a controlled input that exposes a clear (X) button.
 *  - ContactPicker filters by name, case-insensitive substring match.
 *  - Filtering is debounced so fast typing doesn't re-filter on every keystroke.
 *  - Empty query shows the full contact list.
 *  - No-matches state renders the "No contacts match — Add new contact?" row
 *    which opens the inline ManualContactForm modal.
 *  - Clearing the query (X) restores the full list instantly, bypassing the
 *    debounce window.
 */
import '../../test-support/mock-react-native';

import { describe, test, expect, mock, beforeEach } from 'bun:test';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

// Internal-module mocks. These need to be registered before the first
// import of the component under test — Bun's test runner shares the
// module registry within a process, so the first mock wins.
mock.module('@/constants/colors', () => ({
  default: new Proxy({} as Record<string, string>, {
    get: (_, key) => (typeof key === 'string' ? `#${key}` : '#x'),
  }),
}));

mock.module('@/utils/categories', () => ({
  getInitials: (name: string) =>
    name
      .split(' ')
      .map((s) => s[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase(),
}));

// Lucide icon stubs. The first `mock.module('lucide-react-native', ...)`
// call wins for the whole test process, so the stub must enumerate every
// icon the component tree imports — including the X used by the clear
// button and UserPlus/ChevronRight used by ContactPicker rows.
mock.module('lucide-react-native', () => {
  const stub = (name: string) => (props: any) =>
    React.createElement('icon', { testID: `icon-${name}`, ...props });
  return {
    Search: stub('search'),
    ChevronRight: stub('chevron-right'),
    UserPlus: stub('user-plus'),
    X: stub('x'),
  };
});

const { default: ContactSearchBar } = await import('./ContactSearchBar');
const { default: ContactPicker } = await import('./ContactPicker');
const { useDebouncedValue } = await import('@/lib/useDebouncedValue');
import type { Contact } from '@/types';

// Helpers ---------------------------------------------------------------

function findByTestID(tree: TestRenderer.ReactTestInstance, id: string) {
  // Match host nodes only — our RN stub wraps primitives in forwardRef
  // components, which doubles every match in the tree.
  return tree.findAll(
    (node: TestRenderer.ReactTestInstance) =>
      node.props?.testID === id && typeof node.type === 'string'
  );
}

function press(node: TestRenderer.ReactTestInstance) {
  act(() => {
    node.props.onPress?.();
  });
}

function changeText(node: TestRenderer.ReactTestInstance, text: string) {
  act(() => {
    node.props.onChangeText?.(text);
  });
}

async function wait(ms: number) {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// Fixtures --------------------------------------------------------------

const contacts: Contact[] = [
  { id: 'c1', name: 'Sarah Chen', phone: '555-0001' },
  { id: 'c2', name: 'Marcus Johnson', phone: '555-0002' },
  { id: 'c3', name: 'Jamie Rivera', phone: '555-0003' },
  { id: 'c4', name: 'sam small', phone: '555-0004' },
];

// ContactSearchBar ------------------------------------------------------

describe('ContactSearchBar', () => {
  test('renders a controlled input showing the current value', () => {
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ContactSearchBar value="sar" onChangeText={() => {}} />
      );
    });
    const input = findByTestID(tree.root, 'contact-search-input')[0];
    expect(input.props.value).toBe('sar');
  });

  test('calls onChangeText for every keystroke (no internal debouncing)', () => {
    const onChange = mock((_: string) => {});
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ContactSearchBar value="" onChangeText={onChange} />
      );
    });
    const input = findByTestID(tree.root, 'contact-search-input')[0];
    changeText(input, 's');
    changeText(input, 'sa');
    changeText(input, 'sar');
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange.mock.calls.map((c: unknown[]) => c[0])).toEqual(['s', 'sa', 'sar']);
  });

  test('the clear button is hidden when value is empty', () => {
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ContactSearchBar value="" onChangeText={() => {}} />
      );
    });
    expect(findByTestID(tree.root, 'contact-search-clear')).toHaveLength(0);
  });

  test('the clear button appears once value is non-empty and calls onChangeText("")', () => {
    const onChange = mock((_: string) => {});
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ContactSearchBar value="sarah" onChangeText={onChange} />
      );
    });
    const clear = findByTestID(tree.root, 'contact-search-clear')[0];
    expect(clear).toBeDefined();
    press(clear);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toBe('');
  });
});

// useDebouncedValue -----------------------------------------------------

describe('useDebouncedValue', () => {
  // A tiny harness component that lets tests drive the hook's input value
  // and read out its current debounced output.
  function mkHarness() {
    const ref: { set: (v: string) => void; last: string } = {
      set: () => {},
      last: '',
    };
    const Harness = ({ delay }: { delay: number }) => {
      const [v, setV] = React.useState('');
      ref.set = setV;
      const d = useDebouncedValue(v, delay);
      ref.last = d;
      return null;
    };
    return { ref, Harness };
  }

  test('returns the initial value synchronously on first render', () => {
    const { ref, Harness } = mkHarness();
    act(() => {
      TestRenderer.create(<Harness delay={50} />);
    });
    expect(ref.last).toBe('');
  });

  test('delays updates until the timer elapses', async () => {
    const { ref, Harness } = mkHarness();
    act(() => {
      TestRenderer.create(<Harness delay={40} />);
    });
    act(() => {
      ref.set('a');
    });
    // Not yet — the debounce window hasn't elapsed.
    expect(ref.last).toBe('');
    await act(async () => {
      await wait(80);
    });
    expect(ref.last).toBe('a');
  });

  test('coalesces rapid changes into the last value', async () => {
    const { ref, Harness } = mkHarness();
    act(() => {
      TestRenderer.create(<Harness delay={30} />);
    });
    act(() => {
      ref.set('a');
    });
    act(() => {
      ref.set('ab');
    });
    act(() => {
      ref.set('abc');
    });
    await act(async () => {
      await wait(70);
    });
    expect(ref.last).toBe('abc');
  });

  test('delay=0 short-circuits the timer and updates on the next render', () => {
    const { ref, Harness } = mkHarness();
    act(() => {
      TestRenderer.create(<Harness delay={0} />);
    });
    act(() => {
      ref.set('hello');
    });
    expect(ref.last).toBe('hello');
  });
});

// ContactPicker + search integration ------------------------------------

describe('ContactPicker search integration', () => {
  let onSelect: ReturnType<typeof mock>;

  beforeEach(() => {
    onSelect = mock((_: Contact) => {});
  });

  function render(props?: Partial<React.ComponentProps<typeof ContactPicker>>) {
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ContactPicker
          contacts={contacts}
          onSelect={onSelect}
          // Disable debounce by default so assertions about filter output
          // don't race with real timers. Debounce behavior is covered in
          // its own test below.
          searchDebounceMs={0}
          {...props}
        />
      );
    });
    return tree;
  }

  test('shows the full contact list when the search is empty', () => {
    const tree = render();
    const list = findByTestID(tree.root, 'contact-picker-list')[0];
    expect(list.props.__data).toEqual(contacts);
  });

  test('renders the search bar in the list header slot (sticky)', () => {
    const tree = render();
    const list = findByTestID(tree.root, 'contact-picker-list')[0];
    expect(list.props.__hasListHeader).toBe(true);
    // The search input lives inside the header element.
    expect(findByTestID(tree.root, 'contact-search-input')).toHaveLength(1);
  });

  test('filters by case-insensitive substring match on name', () => {
    const tree = render();
    const input = findByTestID(tree.root, 'contact-search-input')[0];
    changeText(input, 'sar');
    const list = findByTestID(tree.root, 'contact-picker-list')[0];
    expect(list.props.__data.map((c: Contact) => c.name)).toEqual(['Sarah Chen']);
  });

  test('matches are case-insensitive in both directions', () => {
    const tree = render();
    const input = findByTestID(tree.root, 'contact-search-input')[0];
    // Uppercase query, lowercase-only name in the data ("sam small").
    changeText(input, 'SAM');
    const list = findByTestID(tree.root, 'contact-picker-list')[0];
    expect(list.props.__data.map((c: Contact) => c.name)).toEqual(['sam small']);
  });

  test('matches anywhere in the name, not just the prefix', () => {
    const tree = render();
    const input = findByTestID(tree.root, 'contact-search-input')[0];
    changeText(input, 'john'); // "Marcus Johnson"
    const list = findByTestID(tree.root, 'contact-picker-list')[0];
    expect(list.props.__data.map((c: Contact) => c.name)).toEqual(['Marcus Johnson']);
  });

  test('empty query (after typing) restores the full list instantly', () => {
    const tree = render();
    const input = findByTestID(tree.root, 'contact-search-input')[0];
    changeText(input, 'sarah');
    // Sanity: list is filtered.
    expect(
      findByTestID(tree.root, 'contact-picker-list')[0].props.__data
    ).toHaveLength(1);

    // Clear via empty text.
    changeText(input, '');

    const list = findByTestID(tree.root, 'contact-picker-list')[0];
    expect(list.props.__data).toEqual(contacts);
  });

  test('tapping the clear (X) button restores the full list instantly', () => {
    const tree = render();
    const input = findByTestID(tree.root, 'contact-search-input')[0];
    changeText(input, 'sarah');
    const clear = findByTestID(tree.root, 'contact-search-clear')[0];
    expect(clear).toBeDefined();
    press(clear);

    const list = findByTestID(tree.root, 'contact-picker-list')[0];
    expect(list.props.__data).toEqual(contacts);
    // And the input itself reflects the cleared value.
    expect(findByTestID(tree.root, 'contact-search-input')[0].props.value).toBe('');
  });

  test('clearing bypasses the debounce window (restore is immediate)', async () => {
    // Use a real debounce delay here; the clear path must short-circuit it.
    const tree = render({ searchDebounceMs: 150 });
    const input = findByTestID(tree.root, 'contact-search-input')[0];
    changeText(input, 'sar');
    // Let the debounce fire so the list actually narrows.
    await act(async () => {
      await wait(200);
    });
    expect(
      findByTestID(tree.root, 'contact-picker-list')[0].props.__data
    ).toHaveLength(1);

    // Clearing must restore without waiting another 150ms.
    press(findByTestID(tree.root, 'contact-search-clear')[0]);
    expect(
      findByTestID(tree.root, 'contact-picker-list')[0].props.__data
    ).toEqual(contacts);
  });

  test('no-match state shows the "Add new contact?" CTA only when query is non-empty', () => {
    const tree = render();
    const input = findByTestID(tree.root, 'contact-search-input')[0];
    changeText(input, 'zzzz-nothing-matches');

    const list = findByTestID(tree.root, 'contact-picker-list')[0];
    expect(list.props.__data).toEqual([]);

    // The no-match CTA is visible; the default empty-state copy is not.
    expect(findByTestID(tree.root, 'contact-picker-no-match')).toHaveLength(1);
    expect(findByTestID(tree.root, 'contact-picker-empty')).toHaveLength(0);
  });

  test('tapping the no-match CTA opens the Add-contact modal', () => {
    const tree = render();
    const input = findByTestID(tree.root, 'contact-search-input')[0];
    changeText(input, 'zzzz-nothing-matches');

    const modalBefore = findByTestID(tree.root, 'add-contact-modal')[0];
    expect(modalBefore.props.visible).toBe(false);

    press(findByTestID(tree.root, 'contact-picker-no-match')[0]);

    const modalAfter = findByTestID(tree.root, 'add-contact-modal')[0];
    expect(modalAfter.props.visible).toBe(true);
  });
});

describe('ContactPicker search — debounce timing', () => {
  test('does not filter the list until the debounce window elapses', async () => {
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ContactPicker
          contacts={contacts}
          onSelect={() => {}}
          searchDebounceMs={150}
        />
      );
    });
    const input = findByTestID(tree.root, 'contact-search-input')[0];

    // Type a query that would drastically narrow the list...
    changeText(input, 'sar');
    // ...but before 150ms, the data prop on the FlatList should still be
    // the full, un-filtered list.
    expect(
      findByTestID(tree.root, 'contact-picker-list')[0].props.__data
    ).toEqual(contacts);

    await act(async () => {
      await wait(200);
    });

    // Now the filter has run.
    expect(
      findByTestID(tree.root, 'contact-picker-list')[0].props.__data.map(
        (c: Contact) => c.name
      )
    ).toEqual(['Sarah Chen']);
  });
});
