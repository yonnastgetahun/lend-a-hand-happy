// Register the shared react-native mock before any import that transitively
// resolves `react-native`. Bun shares the module registry across test files,
// so this must come before importing the form.
import '../../test-support/mock-react-native';

import { describe, test, expect, mock, beforeEach } from 'bun:test';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

mock.module('@/constants/colors', () => ({
  default: new Proxy({} as Record<string, string>, {
    get: (_, key) => (typeof key === 'string' ? `#${key}` : '#x'),
  }),
}));

const {
  default: ManualContactForm,
  buildManualContact,
  isValidPhone,
  isValidName,
} = await import('./ManualContactForm');
import type { Contact } from '@/lib/types/contact';

// Helpers ---------------------------------------------------------------

function findByTestID(tree: TestRenderer.ReactTestInstance, id: string) {
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

function blur(node: TestRenderer.ReactTestInstance) {
  act(() => {
    node.props.onBlur?.();
  });
}

// Validators ------------------------------------------------------------

describe('isValidName', () => {
  test('rejects empty / whitespace-only names', () => {
    expect(isValidName('')).toBe(false);
    expect(isValidName('   ')).toBe(false);
  });

  test('accepts any non-empty trimmed name', () => {
    expect(isValidName('A')).toBe(true);
    expect(isValidName('  Ada Lovelace  ')).toBe(true);
  });
});

describe('isValidPhone', () => {
  test('accepts US-style 10-digit numbers in common formats', () => {
    expect(isValidPhone('5551234567')).toBe(true);
    expect(isValidPhone('555-123-4567')).toBe(true);
    expect(isValidPhone('(555) 123-4567')).toBe(true);
    expect(isValidPhone('+1 555 123 4567')).toBe(true);
  });

  test('rejects strings shorter than 10 digits', () => {
    expect(isValidPhone('555-1')).toBe(false);
    expect(isValidPhone('123456789')).toBe(false);
  });

  test('rejects non-numeric input', () => {
    expect(isValidPhone('abcdefghij')).toBe(false);
    expect(isValidPhone('not a phone')).toBe(false);
  });

  test('rejects punctuation-only that meets length but lacks digits', () => {
    expect(isValidPhone('----------')).toBe(false);
    expect(isValidPhone('(((((((((-')).toBe(false);
  });

  test('rejects empty / whitespace input', () => {
    expect(isValidPhone('')).toBe(false);
    expect(isValidPhone('   ')).toBe(false);
  });
});

// buildManualContact ----------------------------------------------------

describe('buildManualContact', () => {
  test('returns a Contact with trimmed name/phone, source=manual, and the injected uuid', () => {
    const c = buildManualContact('  Ada Lovelace  ', '  555-123-4567 ', () => 'uuid-1');
    expect(c).toEqual({
      id: 'uuid-1',
      name: 'Ada Lovelace',
      phone: '555-123-4567',
      source: 'manual',
    });
  });

  test('returns null when name is empty', () => {
    expect(buildManualContact('', '555-123-4567', () => 'x')).toBeNull();
    expect(buildManualContact('   ', '555-123-4567', () => 'x')).toBeNull();
  });

  test('returns null when phone is invalid (too short)', () => {
    expect(buildManualContact('Ada', '555-1', () => 'x')).toBeNull();
  });

  test('returns null when phone is non-numeric', () => {
    expect(buildManualContact('Ada', 'not a phone', () => 'x')).toBeNull();
  });

  test('uses the provided id generator (so tests can be deterministic)', () => {
    let n = 0;
    const a = buildManualContact('A', '555-123-4567', () => `id-${++n}`);
    const b = buildManualContact('A', '555-123-4567', () => `id-${++n}`);
    expect(a!.id).toBe('id-1');
    expect(b!.id).toBe('id-2');
  });
});

// Component behavior ----------------------------------------------------

describe('ManualContactForm rendering', () => {
  let onSubmit: ReturnType<typeof mock>;
  let onCancel: ReturnType<typeof mock>;

  beforeEach(() => {
    onSubmit = mock((_: Contact) => {});
    onCancel = mock(() => {});
  });

  function render(idGen: () => string = () => 'uuid-test') {
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ManualContactForm onSubmit={onSubmit} onCancel={onCancel} generateId={idGen} />
      );
    });
    return tree;
  }

  test('submit button starts disabled', () => {
    const tree = render();
    const submitBtn = findByTestID(tree.root, 'manual-contact-submit')[0];
    expect(submitBtn.props.disabled).toBe(true);
  });

  test('submit stays disabled with only a name (no phone)', () => {
    const tree = render();
    changeText(findByTestID(tree.root, 'manual-contact-name-input')[0], 'Ada');
    expect(findByTestID(tree.root, 'manual-contact-submit')[0].props.disabled).toBe(true);
  });

  test('submit stays disabled with an invalid phone', () => {
    const tree = render();
    changeText(findByTestID(tree.root, 'manual-contact-name-input')[0], 'Ada');
    changeText(findByTestID(tree.root, 'manual-contact-phone-input')[0], 'abc');
    expect(findByTestID(tree.root, 'manual-contact-submit')[0].props.disabled).toBe(true);
  });

  test('submit becomes enabled once both fields are valid', () => {
    const tree = render();
    changeText(findByTestID(tree.root, 'manual-contact-name-input')[0], 'Ada');
    changeText(findByTestID(tree.root, 'manual-contact-phone-input')[0], '555-123-4567');
    expect(findByTestID(tree.root, 'manual-contact-submit')[0].props.disabled).toBe(false);
  });

  test('pressing submit emits the built Contact with source=manual', () => {
    const tree = render(() => 'uuid-fixed');
    changeText(findByTestID(tree.root, 'manual-contact-name-input')[0], 'Jamie Rivera');
    changeText(findByTestID(tree.root, 'manual-contact-phone-input')[0], '+1 (555) 999-1234');

    press(findByTestID(tree.root, 'manual-contact-submit')[0]);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toEqual({
      id: 'uuid-fixed',
      name: 'Jamie Rivera',
      phone: '+1 (555) 999-1234',
      source: 'manual',
    });
  });

  test('pressing cancel calls onCancel and does not submit', () => {
    const tree = render();
    press(findByTestID(tree.root, 'manual-contact-cancel')[0]);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('ManualContactForm inline errors', () => {
  function render() {
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ManualContactForm onSubmit={() => {}} onCancel={() => {}} generateId={() => 'x'} />
      );
    });
    return tree;
  }

  test('does not show errors before the user has interacted with a field', () => {
    const tree = render();
    expect(findByTestID(tree.root, 'manual-contact-name-error')).toHaveLength(0);
    expect(findByTestID(tree.root, 'manual-contact-phone-error')).toHaveLength(0);
  });

  test('shows a name error after blurring an empty name field', () => {
    const tree = render();
    blur(findByTestID(tree.root, 'manual-contact-name-input')[0]);
    const errs = findByTestID(tree.root, 'manual-contact-name-error');
    expect(errs).toHaveLength(1);
    expect(errs[0].children.join('')).toMatch(/required/i);
  });

  test('shows "required" phone error after blurring an empty phone field', () => {
    const tree = render();
    blur(findByTestID(tree.root, 'manual-contact-phone-input')[0]);
    const errs = findByTestID(tree.root, 'manual-contact-phone-error');
    expect(errs).toHaveLength(1);
    expect(errs[0].children.join('')).toMatch(/required/i);
  });

  test('shows an "enter a valid phone" error when the entered phone is too short', () => {
    const tree = render();
    changeText(findByTestID(tree.root, 'manual-contact-phone-input')[0], '555-1');
    blur(findByTestID(tree.root, 'manual-contact-phone-input')[0]);
    const errs = findByTestID(tree.root, 'manual-contact-phone-error');
    expect(errs).toHaveLength(1);
    expect(errs[0].children.join('')).toMatch(/valid/i);
  });

  test('clears the phone error once a valid phone is typed', () => {
    const tree = render();
    changeText(findByTestID(tree.root, 'manual-contact-phone-input')[0], 'abc');
    blur(findByTestID(tree.root, 'manual-contact-phone-input')[0]);
    expect(findByTestID(tree.root, 'manual-contact-phone-error')).toHaveLength(1);

    changeText(findByTestID(tree.root, 'manual-contact-phone-input')[0], '555-123-4567');
    expect(findByTestID(tree.root, 'manual-contact-phone-error')).toHaveLength(0);
  });
});

describe('ManualContactForm keyboard handling', () => {
  test('wraps content in a KeyboardAvoidingView so the keyboard cannot cover inputs', () => {
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ManualContactForm onSubmit={() => {}} onCancel={() => {}} />
      );
    });
    // The mocked KeyboardAvoidingView renders as a host element with that
    // exact tag name, which is enough to assert it's present in the tree.
    const kavs = tree.root.findAll(
      (n: TestRenderer.ReactTestInstance) =>
        typeof n.type === 'string' && n.type === 'KeyboardAvoidingView'
    );
    expect(kavs.length).toBeGreaterThan(0);
  });
});
