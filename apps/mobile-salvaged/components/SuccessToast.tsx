/**
 * Lightweight auto-dismissing success toast.
 *
 * Used by the Home screen to confirm that a new loan was written
 * (including from another device in the same session). Uses the RN
 * Animated API to slide in from the top and fade out after a short
 * window. No native modules required — plays nicely with the current
 * expo-router / Tabs layout on both iOS and Android.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface SuccessToastProps {
  visible: boolean;
  message: string;
  onHide: () => void;
  /** Auto-dismiss delay, ms. */
  duration?: number;
}

export function SuccessToast({
  visible,
  message,
  onHide,
  duration = 2500,
}: SuccessToastProps) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 7,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const hideTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -80,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    }, duration);

    return () => clearTimeout(hideTimer);
  }, [visible, duration, onHide, translateY, opacity]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { transform: [{ translateY }], opacity },
      ]}
      testID="success-toast"
    >
      <View style={styles.inner}>
        <CheckCircle size={18} color={Colors.white} />
        <Text style={styles.text} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    zIndex: 50,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
    flexShrink: 1,
  },
});
