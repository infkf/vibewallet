import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from './theme';
import Main from './screens/Main';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <Main />
      </PaperProvider>
    </SafeAreaProvider>
  );
}