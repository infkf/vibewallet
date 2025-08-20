import { MD3LightTheme } from "react-native-paper";

// Modern typography configuration
const typography = {
  // Font families - using system fonts for better performance
  fontFamily: {
    regular: "System",
    medium: "System",
    bold: "System",
    thin: "System",
    light: "System",
  },
  // Custom text styles for consistent usage
  textStyles: {
    // Headings
    displayLarge: {
      fontSize: 57,
      lineHeight: 64,
      letterSpacing: -0.25,
      fontWeight: "400" as const,
    },
    displayMedium: {
      fontSize: 45,
      lineHeight: 52,
      letterSpacing: 0,
      fontWeight: "400" as const,
    },
    displaySmall: {
      fontSize: 36,
      lineHeight: 44,
      letterSpacing: 0,
      fontWeight: "400" as const,
    },
    headlineLarge: {
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: 0,
      fontWeight: "600" as const,
    },
    headlineMedium: {
      fontSize: 28,
      lineHeight: 36,
      letterSpacing: 0,
      fontWeight: "600" as const,
    },
    headlineSmall: {
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: 0,
      fontWeight: "600" as const,
    },
    // Titles
    titleLarge: {
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: 0,
      fontWeight: "500" as const,
    },
    titleMedium: {
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0.15,
      fontWeight: "500" as const,
    },
    titleSmall: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.1,
      fontWeight: "500" as const,
    },
    // Labels
    labelLarge: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.1,
      fontWeight: "500" as const,
    },
    labelMedium: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.5,
      fontWeight: "500" as const,
    },
    labelSmall: {
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 0.5,
      fontWeight: "500" as const,
    },
    // Body text
    bodyLarge: {
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0.15,
      fontWeight: "400" as const,
    },
    bodyMedium: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.25,
      fontWeight: "400" as const,
    },
    bodySmall: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.4,
      fontWeight: "400" as const,
    },
    // Custom styles for financial data
    currency: {
      fontSize: 18,
      lineHeight: 24,
      letterSpacing: 0,
      fontWeight: "600" as const,
      fontVariant: ["tabular-nums"] as const,
    },
    currencyLarge: {
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: 0,
      fontWeight: "700" as const,
      fontVariant: ["tabular-nums"] as const,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.4,
      fontWeight: "400" as const,
      opacity: 0.6,
    },
  },
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#1976D2", // Modern blue
    primaryContainer: "#E3F2FD",
    secondary: "#4CAF50", // Keep the green accent
    secondaryContainer: "#E8F5E8",
    tertiary: "#FF9800", // Warm orange for highlights
    tertiaryContainer: "#FFF3E0",
    surface: "#FAFAFA", // Slightly off-white for better readability
    surfaceVariant: "#F5F5F5",
    background: "#FFFFFF",
    outline: "#E0E0E0",
    outlineVariant: "#F0F0F0",
    // Text colors for better hierarchy
    onSurface: "#1A1A1A", // Slightly softer than pure black
    onSurfaceVariant: "#5F6368", // Modern gray for secondary text
    onBackground: "#1A1A1A",
    // Financial colors
    success: "#137333", // Green for income
    error: "#D93025", // Red for expenses
    warning: "#F57C00", // Orange for warnings
  },
  // Typography configuration
  fonts: {
    ...MD3LightTheme.fonts,
    displayLarge: typography.textStyles.displayLarge,
    displayMedium: typography.textStyles.displayMedium,
    displaySmall: typography.textStyles.displaySmall,
    headlineLarge: typography.textStyles.headlineLarge,
    headlineMedium: typography.textStyles.headlineMedium,
    headlineSmall: typography.textStyles.headlineSmall,
    titleLarge: typography.textStyles.titleLarge,
    titleMedium: typography.textStyles.titleMedium,
    titleSmall: typography.textStyles.titleSmall,
    labelLarge: typography.textStyles.labelLarge,
    labelMedium: typography.textStyles.labelMedium,
    labelSmall: typography.textStyles.labelSmall,
    bodyLarge: typography.textStyles.bodyLarge,
    bodyMedium: typography.textStyles.bodyMedium,
    bodySmall: typography.textStyles.bodySmall,
  },
  // Custom typography extensions
  typography,
};

// Type declarations for better TypeScript support
declare module "react-native-paper" {
  interface ThemeColors {
    success: string;
    warning: string;
  }

  interface Theme {
    typography: typeof typography;
  }
}
