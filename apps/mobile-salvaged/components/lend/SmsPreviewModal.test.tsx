/**
 * Behavioural tests for SmsPreviewModal (LENDLEE-013).
 *
 * Covers the AC:
 *  - bubble renders the rendered SMS body
 *  - tone segmented control swaps the bubble live
 *  - Send fires onSend(finalMessage, tone)
 *  - Cancel fires onClose
 *  - Initial tone defaults to last-used tone from AsyncStorage,
 *    falling back to 'friendly' when nothing is stored.
 *  - Persist-on-Send (not on render or tone-tap), per the task's
 *    debug note.
 */
import '../../test-support/mock-react-native';

import { describe, test, expect, mock, beforeEach } from 'bun:test';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

// --- AsyncStorage mock ----------------------------------------------------
// The modal reads `lendlee.lastTone` on mount and writes it on Send.
// The mock is shared across tests; reset both the backing store and the
// "throw on next call" flags between cases.
const storage = new Map<string, string>();
const storageThrows = { getItem: false, setItem: false };

const getItem = mock(async (key: string) => {
  if (storageThrows.getItem) throw new Error('getItem failed');
  return storage.has(key) ? storage.get(key)! : null;
});
const setItem = mock(async (key: string, value: string) => {
  if (storageThrows.setItem) throw new Error('setItem failed');
  storage.set(key, value);
});

mock.module('@react-native-async-storage/async-storage', () => ({
  default: { getItem, setItem },
}));

// Mock lenderExperience to avoid pulling in supabase + react-native internals.
const mockSetSkipPreviewSetting = mock(async (_skip: boolean) => {});
mock.module('@/lib/sms/lenderExperience', () => ({
  setSkipPreviewSetting: mockSetSkipPreviewSetting,
}));

// Colors are referenced via static lookup; a Proxy keeps the test
// agnostic to which fields the modal happens to use.
mock.module('@/constants/colors', () => ({
  default: new Proxy({} as Record<string, string>, {
    get: (_, key) => (typeof key === 'string' ? `#${key}` : '#x'),
  }),
}));

const { default: SmsPreviewModal, LAST_TONE_KEY, DEFAULT_TONE } = await import(
  './SmsPreviewModal'
);
import { renderSmsTemplate, type SmsRenderTone } from '@/lib/sms/templates';

// --- Helpers -------------------------------------------------------------

function findByTestID(tree: TestRenderer.ReactTestInstance, id: string) {
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

function bubbleText(tree: TestRenderer.ReactTestInstance): string {
  const bubble = findByTestID(tree, 'sms-preview-bubble')[0];
  // The bubble has one child <Text>; flatten its children to a string.
  const flatten = (n: any): string => {
    if (n == null) return '';
    if (typeof n === 'string') return n;
    if (Array.isArray(n)) return n.map(flatten).join('');
    return flatten(n.props?.children);
  };
  return flatten(bubble?.props?.children).trim();
}

// `act(async () => { await Promise.resolve(); })` flushes the
// AsyncStorage promise inside the on-mount effect so the rendered tree
// reflects the loaded tone before assertions run.
async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

const baseProps = {
  visible: true,
  onClose: () => {},
  onSend: (_: string, __: SmsRenderTone) => {},
  borrower: 'Jamie',
  item: 'drill',
  returnBy: new Date('2026-05-06T17:00:00.000Z'),
  lenderName: 'Yonnas',
};

beforeEach(() => {
  storage.clear();
  storageThrows.getItem = false;
  storageThrows.setItem = false;
  getItem.mockClear();
  setItem.mockClear();
  mockSetSkipPreviewSetting.mockClear();
});

// --- Tests ---------------------------------------------------------------

describe('SmsPreviewModal — initial render', () => {
  test('defaults tone to DEFAULT_TONE when AsyncStorage has nothing stored', async () => {
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<SmsPreviewModal {...baseProps} />);
    });
    await flush();

    const expected = renderSmsTemplate({
      tone: DEFAULT_TONE,
      borrowerName: baseProps.borrower,
      lenderName: baseProps.lenderName,
      itemTitle: baseProps.item,
      returnBy: baseProps.returnBy,
    });

    expect(DEFAULT_TONE).toBe('friendly');
    expect(bubbleText(tree.root)).toBe(expected);
  });

  test('hydrates tone from AsyncStorage on mount when a valid tone is stored', async () => {
    storage.set(LAST_TONE_KEY, 'casual');

    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<SmsPreviewModal {...baseProps} />);
    });
    await flush();

    const expected = renderSmsTemplate({
      tone: 'casual',
      borrowerName: baseProps.borrower,
      lenderName: baseProps.lenderName,
      itemTitle: baseProps.item,
      returnBy: baseProps.returnBy,
    });
    expect(bubbleText(tree.root)).toBe(expected);
  });

  test('ignores garbage values in AsyncStorage and falls back to default', async () => {
    storage.set(LAST_TONE_KEY, 'mood');

    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<SmsPreviewModal {...baseProps} />);
    });
    await flush();

    const expected = renderSmsTemplate({
      tone: DEFAULT_TONE,
      borrowerName: baseProps.borrower,
      lenderName: baseProps.lenderName,
      itemTitle: baseProps.item,
      returnBy: baseProps.returnBy,
    });
    expect(bubbleText(tree.root)).toBe(expected);
  });

  test('survives an AsyncStorage read failure (defaults to friendly)', async () => {
    storageThrows.getItem = true;

    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<SmsPreviewModal {...baseProps} />);
    });
    await flush();

    expect(bubbleText(tree.root)).toContain('Hi Jamie'); // friendly variant
  });
});

describe('SmsPreviewModal — tone swap', () => {
  test('tapping a tone updates the bubble text without touching storage', async () => {
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<SmsPreviewModal {...baseProps} />);
    });
    await flush();

    const formalChip = findByTestID(tree.root, 'sms-preview-tone-formal')[0];
    press(formalChip);

    const expected = renderSmsTemplate({
      tone: 'formal',
      borrowerName: baseProps.borrower,
      lenderName: baseProps.lenderName,
      itemTitle: baseProps.item,
      returnBy: baseProps.returnBy,
    });
    expect(bubbleText(tree.root)).toBe(expected);
    // No persist on tone-tap — that's the LENDLEE-013 debug guidance.
    expect(setItem).not.toHaveBeenCalled();
  });

  test('renders all three tone chips', async () => {
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<SmsPreviewModal {...baseProps} />);
    });
    await flush();

    expect(findByTestID(tree.root, 'sms-preview-tone-casual')).toHaveLength(1);
    expect(findByTestID(tree.root, 'sms-preview-tone-friendly')).toHaveLength(1);
    expect(findByTestID(tree.root, 'sms-preview-tone-formal')).toHaveLength(1);
  });
});

describe('SmsPreviewModal — Send', () => {
  test('fires onSend with (finalMessage, tone) and persists the chosen tone', async () => {
    const onSend = mock((_message: string, _tone: SmsRenderTone) => {});

    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <SmsPreviewModal {...baseProps} onSend={onSend} />,
      );
    });
    await flush();

    // Switch to casual before sending so the captured tone is non-default.
    press(findByTestID(tree.root, 'sms-preview-tone-casual')[0]);

    await act(async () => {
      findByTestID(tree.root, 'sms-preview-send')[0].props.onPress?.();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onSend).toHaveBeenCalledTimes(1);
    const [message, tone] = onSend.mock.calls[0] as [string, SmsRenderTone];
    expect(tone).toBe('casual');
    expect(message).toBe(
      renderSmsTemplate({
        tone: 'casual',
        borrowerName: baseProps.borrower,
        lenderName: baseProps.lenderName,
        itemTitle: baseProps.item,
        returnBy: baseProps.returnBy,
      }),
    );

    // Persist happens on Send, not on tone-tap.
    expect(setItem).toHaveBeenCalledWith(LAST_TONE_KEY, 'casual');
  });

  test('still fires onSend even if the AsyncStorage write throws', async () => {
    storageThrows.setItem = true;
    const onSend = mock(() => {});

    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <SmsPreviewModal {...baseProps} onSend={onSend} />,
      );
    });
    await flush();

    await act(async () => {
      findByTestID(tree.root, 'sms-preview-send')[0].props.onPress?.();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onSend).toHaveBeenCalledTimes(1);
  });
});

describe('SmsPreviewModal — Cancel', () => {
  test('Cancel button calls onClose without firing onSend', async () => {
    const onClose = mock(() => {});
    const onSend = mock(() => {});

    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <SmsPreviewModal {...baseProps} onClose={onClose} onSend={onSend} />,
      );
    });
    await flush();

    press(findByTestID(tree.root, 'sms-preview-cancel')[0]);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSend).not.toHaveBeenCalled();
  });
});

describe('SmsPreviewModal — submitting state', () => {
  test('Send and Cancel are disabled while submitting', async () => {
    const onSend = mock(() => {});
    const onClose = mock(() => {});

    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <SmsPreviewModal
          {...baseProps}
          onSend={onSend}
          onClose={onClose}
          submitting
        />,
      );
    });
    await flush();

    press(findByTestID(tree.root, 'sms-preview-send')[0]);
    press(findByTestID(tree.root, 'sms-preview-cancel')[0]);

    expect(onSend).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
