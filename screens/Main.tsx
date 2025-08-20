import * as React from 'react';
import { useEffect, useState } from 'react';
import { BottomNavigation } from 'react-native-paper';
import { AppData } from '../types';
import { startOfCurrentMonth, endOfCurrentMonth } from '../utils';
import { loadData, saveData } from '../storage';
import { getCurrencySymbol } from '../currencies';
import AddScreen from './AddScreen';
import ChartScreen from './ChartScreen';
import TransactionsScreen from './TransactionsScreen';
import WalletsScreen from './WalletsScreen';
import ImportExportScreen from './ImportExportScreen';

const Main = () => {
  const [data, setData] = useState<AppData>({ schemaVersion: 1, categories: [], wallets: [], transactions: [] });
  const [rangeStart, setRangeStart] = useState<Date>(startOfCurrentMonth());
  const [rangeEnd, setRangeEnd] = useState<Date>(endOfCurrentMonth());
  const [selectedWalletId, setSelectedWalletId] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const d = await loadData();
      
      // Create default wallet if none exists
      if (d.wallets.length === 0) {
        const defaultWallet = {
          id: 'main-wallet-' + Date.now(),
          name: 'Main Wallet',
          currency: 'USD',
          decimals: 2,
        };
        d.wallets = [defaultWallet];
        setSelectedWalletId(defaultWallet.id);
        await saveData(d);
      } else {
        setSelectedWalletId(d.wallets[0].id);
      }
      
      setData(d);
    })();
  }, []);

  const selectedWallet = data.wallets.find(w => w.id === selectedWalletId) || data.wallets[0];
  const currency = selectedWallet?.currency || 'USD';

  const handleRangeChange = (start: Date, end: Date) => {
    setRangeStart(start);
    setRangeEnd(end);
  };

  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'add', title: 'Add', focusedIcon: 'plus-box', unfocusedIcon: 'plus-box-outline'},
    { key: 'chart', title: 'Chart', focusedIcon: 'chart-pie', unfocusedIcon: 'chart-pie' },
    { key: 'transactions', title: 'Transactions', focusedIcon: 'format-list-bulleted', unfocusedIcon: 'format-list-bulleted' },
    { key: 'wallets', title: 'Wallets', focusedIcon: 'wallet', unfocusedIcon: 'wallet-outline' },
    { key: 'io', title: 'Import/Export', focusedIcon: 'swap-horizontal', unfocusedIcon: 'swap-horizontal' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    add: () => <AddScreen data={data} setData={setData} currency={currency} selectedWalletId={selectedWalletId} />,
    chart: () => <ChartScreen data={data} currency={currency} rangeStart={rangeStart} rangeEnd={rangeEnd} onRangeChange={handleRangeChange} />,
    transactions: () => <TransactionsScreen data={data} currency={currency} />,
    wallets: () => <WalletsScreen data={data} setData={setData} selectedWalletId={selectedWalletId} onWalletSelect={setSelectedWalletId} />,
    io: () => <ImportExportScreen data={data} setData={setData} />,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
    />
  );
};

export default Main;