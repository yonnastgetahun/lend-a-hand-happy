/**
 * Shared `react-native` mock for Bun tests.
 *
 * Bun's test runner shares the module registry across test files within a
 * single process. That means the first `mock.module('react-native', ...)`
 * call effectively wins for the whole suite. To avoid test files fighting
 * each other over RN's mock shape, every test file that needs RN should
 * import this helper — it registers one mock shape that is a superset of
 * what any of our tests need (Platform + the primitives used by
 * ContactPicker and friends).
 *
 * Register the mock by importing this module for its side effect:
 *     import './path/to/test-support/mock-react-native';
 *
 * Or pass a platformOS ref getter to make Platform.OS dynamic (used by
 * the session tests that flip the platform between cases):
 *     import { registerReactNativeMock } from '.../mock-react-native';
 *     registerReactNativeMock(() => state.platformOS);
 */
import React from 'react';
import { mock } from 'bun:test';

export type PlatformGetter = () => 'ios' | 'android' | 'web';

let currentPlatformGetter: PlatformGetter = () => 'ios';

export function setPlatform(getter: PlatformGetter) {
  currentPlatformGetter = getter;
}

export function registerReactNativeMock(platformGetter?: PlatformGetter) {
  if (platformGetter) currentPlatformGetter = platformGetter;

  mock.module('react-native', () => {
    const host = (name: string) =>
      React.forwardRef((props: any, ref: any) =>
        React.createElement(name, { ...props, ref })
      );

    const FlatList = (props: any) => {
      const {
        data = [],
        renderItem,
        keyExtractor,
        ListHeaderComponent,
        ListEmptyComponent,
        ItemSeparatorComponent: _ItemSeparator,
        ...rest
      } = props;

      const header =
        typeof ListHeaderComponent === 'function'
          ? React.createElement(ListHeaderComponent)
          : ListHeaderComponent ?? null;

      const items = (data as any[]).map((item, index) =>
        React.createElement(
          React.Fragment,
          { key: keyExtractor ? keyExtractor(item, index) : String(index) },
          renderItem ? renderItem({ item, index }) : null
        )
      );

      const body =
        data.length === 0
          ? typeof ListEmptyComponent === 'function'
            ? React.createElement(ListEmptyComponent)
            : ListEmptyComponent ?? null
          : items;

      return React.createElement(
        'FlatList',
        {
          ...rest,
          __data: data,
          __hasListHeader: Boolean(ListHeaderComponent),
        },
        header,
        body
      );
    };

    return {
      View: host('View'),
      Text: host('Text'),
      TextInput: host('TextInput'),
      TouchableOpacity: host('TouchableOpacity'),
      Modal: host('Modal'),
      KeyboardAvoidingView: host('KeyboardAvoidingView'),
      ActivityIndicator: host('ActivityIndicator'),
      FlatList,
      StyleSheet: {
        create: <T,>(styles: T) => styles,
      },
      Platform: {
        get OS() {
          return currentPlatformGetter();
        },
        select: (obj: any) => obj.ios ?? obj.default,
      },
      LayoutAnimation: {
        configureNext: () => {},
        Presets: { easeInEaseOut: {} },
      },
      UIManager: { setLayoutAnimationEnabledExperimental: () => {} },
    };
  });
}

// Register on import so plain `import './mock-react-native'` is enough.
registerReactNativeMock();
