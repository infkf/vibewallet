# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vibewallet is a React Native expense tracking app built with Expo. It's designed as a minimal expense tracker with the following key features:

- Track income and expenses with categories
- Visual spending analysis via pie charts
- Import data from Money Tracker JSON files
- Export app data as JSON
- Monthly spending summaries

## Development Commands

**Start Development Server:**

```bash
npm start          # Start Expo development server
npm run android    # Start with Android emulator/device
npm run ios        # Start with iOS simulator/device
npm run web        # Start web version
```

**Build Commands:**

- Uses EAS Build (see eas.json configuration)
- No standard lint/test commands configured in package.json

## Architecture

### Core Components

- **App.tsx** - Main application component containing all UI logic and state management
- **index.ts** - Expo root component registration

### Data Structure

The app uses a simple in-memory data model with AsyncStorage persistence:

```typescript
type AppData = {
  schemaVersion: 1;
  categories: Category[]; // Income/expense categories
  wallets: Wallet[]; // Currency wallets
  transactions: Transaction[]; // All transactions
};
```

### Key Features Implementation

**Storage:** Uses `@react-native-async-storage/async-storage` for local data persistence with key `'rn-expense-tracker:data:v1'`

**Import/Export:**

- Supports Money Tracker JSON format import (handles `.mwbx` database.json files)
- Maps Money Tracker's direction field (0=expense, 1=income) and category types
- Exports app data as JSON via `expo-sharing`

**UI Architecture:**

- Tab-based navigation (Add, Chart, Import/Export)
- Custom SVG pie chart implementation using `react-native-svg`
- Modal-based category creation
- Month-based date range navigation

### Dependencies

- **Expo ~53.0.20** - React Native framework
- **React 19.0.0** - UI library
- **react-native-svg** - Custom pie chart rendering
- **expo-document-picker** - File import functionality
- **expo-file-system** - File operations for import/export
- **expo-sharing** - Share exported files

## Development Notes

- All business logic is contained within App.tsx (610 lines)
- No separate state management library - uses React useState/useEffect
- Currency formatting uses Intl.NumberFormat with fallback
- UUID generation uses custom implementation (not crypto-secure)
- Date handling assumes local timezone for Money Tracker imports
- App supports multiple wallets but UI primarily shows first wallet's currency

## File Structure

```
/
├── App.tsx           # Main application logic
├── index.ts          # Expo app registration
├── package.json      # Dependencies and scripts
├── app.json          # Expo configuration
├── eas.json          # EAS Build configuration
├── tsconfig.json     # TypeScript config (extends expo/tsconfig.base)
└── assets/           # App icons and splash screens
```
