import { DarkTheme } from '@react-navigation/native';
import { colors, gradients, radii, spacing } from './tokens';
import { typography } from './typography';
import { shadows } from './shadows';

export const theme = {
  colors,
  gradients,
  radii,
  spacing,
  typography,
  shadows
};

export const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bgPrimary,
    card: colors.bgSecondary,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.primary
  }
};
