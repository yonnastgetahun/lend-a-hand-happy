// Register the shared react-native mock before any import that transitively
// resolves `react-native`. Bun shares the module registry across test files,
// so the first `mock.module('react-native', ...)` call in the suite wins —
// centralising this stops tests from fighting each other over RN shape.
import '../../test-support/mock-react-native';

import { describe, test, expect, mock, beforeEach } from 'bun:test';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

// Mock Lendlee's internal modules so we can render ContactPicker with
// react-test-renderer under bun without pulling the full RN native runtime.
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

// Lucide icons: render as stub hosts so react-test-renderer doesn't try to
// reach into native SVG bindings.
mock.module('lucide-react-native', () => {
  const stub = (name: string) => (props: any) =>
    React.createElement('icon', { testID: `icon-${name}`, ...props });
  return {
    Search: stub('search'),
    ChevronRight: stub('chevron-right'),
    UserPlus: stub('user-plus'),
    // X is used by the embedded ContactSearchBar's clear button.
    X: stub('x'),
  };
});

const { default: ContactPicker } = await import('./ContactPicker');
const { buildManualContact, default: ManualContactForm } = await import('./ManualContactForm');
import type { Contact } from '@/types';

const sampleContacts: Contact[] = [
  { id: 'c1', name: 'Sarah Chen', phone: '555-0001' },
  { id: 'c2', name: 'Marcus Johnson', phone: '555-0002' },
];

// Helpers ---------------------------------------------------------------

function findByTestID(tree: TestRenderer.ReactTestInstance, id: string) {
  // Match only host nodes (string type). Our RN stub wraps most primitives in
  // forwardRef components, so each matching element shows up twice in the
  // rendered tree — once for the wrapper, once for the host. Filtering by
  // string type collapses those to a single canonical match per element.
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

// Tests -----------------------------------------------------------------

describe('buildManualContact', () => {
  test('returns a contact with the name/phone trimmed and source=manual', () => {
    const c = buildManualContact('  Ada Lovelace  ', '  555-123-4567 ', () => 'uuid-42');
    expect(c).toEqual({
      id: 'uuid-42',
      name: 'Ada Lovelace',
      phone: '555-123-4567',
      source: 'manual',
    });
  });

  test('returns null when name is empty', () => {
    expect(buildManualContact('', '555-123-4567', () => 'x')).toBeNull();
    expect(buildManualContact('   ', '555-123-4567', () => 'x')).toBeNull();
  });

  test('returns null when phone is empty or invalid', () => {
    expect(buildManualContact('Ada', '', () => 'x')).toBeNull();
    expect(buildManualContact('Ada', '   ', () => 'x')).toBeNull();
    // Stricter validation: phones shorter than 10 digits are rejected.
    expect(buildManualContact('Ada', '555-1', () => 'x')).toBeNull();
  });

  test('generated ids are unique across calls', () => {
    let n = 0;
    const a = buildManualContact('A', '555-123-4567', () => `id-${++n}`);
    const b = buildManualContact('A', '555-123-4567', () => `id-${++n}`);
    expect(a!.id).not.toBe(b!.id);
  });
});

describe('ContactPicker — add-new-contact row', () => {
  let onSelect: ReturnType<typeof mock>;

  beforeEach(() => {
    onSelect = mock((_: Contact) => {});
  });

  function render(props?: Partial<React.ComponentProps<typeof ContactPicker>>) {
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ContactPicker contacts={sampleContacts} onSelect={onSelect} {...props} />
      );
    });
    return tree;
  }

  test('pins an "Add new contact" row at the top of the list', () => {
    const tree = render();
    const rows = findByTestID(tree.root, 'add-new-contact-row');
    expect(rows).toHaveLength(1);
    // The row must be inside the FlatList's ListHeaderComponent slot —
    // i.e. it renders regardless of the filtered contacts below it.
    const listRoot = findByTestID(tree.root, 'contact-picker-list')[0];
    expect(listRoot).toBeDefined();
    expect(listRoot.props.__hasListHeader).toBe(true);
  });

  test('the add row is visible when permission is denied', () => {
    const tree = render({ contacts: [], permissionStatus: 'denied' });
    expect(findByTestID(tree.root, 'add-new-contact-row')).toHaveLength(1);
    // And no search bar is shown because there are no contacts.
    expect(findByTestID(tree.root, 'contact-search-input')).toHaveLength(0);
  });

  test('the add row is visible when permission is undetermined', () => {
    const tree = render({ contacts: [], permissionStatus: 'undetermined' });
    expect(findByTestID(tree.root, 'add-new-contact-row')).toHaveLength(1);
  });

  test('the add row is visible when permission is granted', () => {
    const tree = render({ permissionStatus: 'granted' });
    expect(findByTestID(tree.root, 'add-new-contact-row')).toHaveLength(1);
  });

  test('tapping the add row opens the modal', () => {
    const tree = render();
    // Modal starts hidden.
    const modalBefore = findByTestID(tree.root, 'add-contact-modal')[0];
    expect(modalBefore.props.visible).toBe(false);

    press(findByTestID(tree.root, 'add-new-contact-row')[0]);

    const modalAfter = findByTestID(tree.root, 'add-contact-modal')[0];
    expect(modalAfter.props.visible).toBe(true);
  });

  test('submitting the manual form selects the new contact and closes the picker modal', () => {
    const tree = render();
    // Open modal.
    press(findByTestID(tree.root, 'add-new-contact-row')[0]);
    expect(findByTestID(tree.root, 'add-contact-modal')[0].props.visible).toBe(true);

    // Fill the form and submit. Phone must satisfy the stricter
    // 10+ digit validation enforced by the form.
    changeText(findByTestID(tree.root, 'manual-contact-name-input')[0], 'Jamie Rivera');
    changeText(findByTestID(tree.root, 'manual-contact-phone-input')[0], '555-999-1234');
    press(findByTestID(tree.root, 'manual-contact-submit')[0]);

    // onSelect was called with the manually-entered contact.
    expect(onSelect).toHaveBeenCalledTimes(1);
    const selected = onSelect.mock.calls[0][0] as Contact & { source?: string };
    expect(selected.name).toBe('Jamie Rivera');
    expect(selected.phone).toBe('555-999-1234');
    // Manual contacts are tagged with source='manual' (per the lend-flow Contact type).
    expect(selected.source).toBe('manual');

    // Modal is closed again.
    expect(findByTestID(tree.root, 'add-contact-modal')[0].props.visible).toBe(false);
  });

  test('cancelling the manual form closes the modal without selecting anything', () => {
    const tree = render();
    press(findByTestID(tree.root, 'add-new-contact-row')[0]);
    expect(findByTestID(tree.root, 'add-contact-modal')[0].props.visible).toBe(true);

    press(findByTestID(tree.root, 'manual-contact-cancel')[0]);

    expect(onSelect).not.toHaveBeenCalled();
    expect(findByTestID(tree.root, 'add-contact-modal')[0].props.visible).toBe(false);
  });

  test('the manually-entered contact is not added to the contacts prop list', () => {
    const tree = render();
    press(findByTestID(tree.root, 'add-new-contact-row')[0]);
    changeText(findByTestID(tree.root, 'manual-contact-name-input')[0], 'Transient Person');
    changeText(findByTestID(tree.root, 'manual-contact-phone-input')[0], '555-000-0000');
    press(findByTestID(tree.root, 'manual-contact-submit')[0]);

    // The FlatList data still reflects only the props-passed contacts;
    // the component does not mutate its input, persist to device, or push
    // the new contact into the list.
    const listRoot = findByTestID(tree.root, 'contact-picker-list')[0];
    expect(listRoot.props.__data).toEqual(sampleContacts);
  });
});

describe('ContactPicker — ManualContactForm contract', () => {
  test('submit is disabled until both name and phone are filled', () => {
    const onSubmit = mock(() => {});
    const onCancel = mock(() => {});
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ManualContactForm onSubmit={onSubmit} onCancel={onCancel} />
      );
    });

    const submitBtn = findByTestID(tree.root, 'manual-contact-submit')[0];
    expect(submitBtn.props.disabled).toBe(true);

    changeText(findByTestID(tree.root, 'manual-contact-name-input')[0], 'Ada');
    expect(findByTestID(tree.root, 'manual-contact-submit')[0].props.disabled).toBe(true);

    // Stricter validation: short phones still leave submit disabled.
    changeText(findByTestID(tree.root, 'manual-contact-phone-input')[0], '555-1');
    expect(findByTestID(tree.root, 'manual-contact-submit')[0].props.disabled).toBe(true);

    // A 10+ digit phone enables submit.
    changeText(findByTestID(tree.root, 'manual-contact-phone-input')[0], '555-123-4567');
    expect(findByTestID(tree.root, 'manual-contact-submit')[0].props.disabled).toBe(false);

    press(findByTestID(tree.root, 'manual-contact-submit')[0]);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
