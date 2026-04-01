// ============================================================
// Eventure — Typography Tokens
// Font: Inter (loaded via @expo-google-fonts/inter)
// ============================================================

import { StyleSheet } from 'react-native';

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const typography = StyleSheet.create({
  // --- Headings ---
  h1: {
    fontFamily: fontFamily.semiBold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: 0,
  },
  h2: {
    fontFamily: fontFamily.semiBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 0,
  },
  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: 28,
    letterSpacing: 0,
  },
  h4: {
    fontFamily: fontFamily.semiBold,
    fontSize: 24,
    letterSpacing: 0,
  },
  h5: {
    fontFamily: fontFamily.semiBold,
    fontSize: 22,
    letterSpacing: 0,
  },

  // --- Body ---
  body1: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  body2: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0,
  },
  body3: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 22,
    letterSpacing: 0,
  },

  // --- Buttons ---
  button1: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 18,
    letterSpacing: 0,
  },
  button2: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    letterSpacing: 0,
  },

  // --- Captions ---
  caption1: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0,
  },
  caption2: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    letterSpacing: 0,
  },
  caption3: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 24,
    letterSpacing: 0,
  },
  caption4: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    letterSpacing: 0,
  },
  caption5: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    letterSpacing: 0,
  },
});
