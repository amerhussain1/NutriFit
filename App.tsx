import React from 'react';
import { Provider } from 'react-redux';
import 'react-native-gesture-handler';
import { store } from './src/store';
import AppBootstrap from './src/AppBootstrap';
import RootNavigator from './src/navigation/RootNavigator';

export type { RootStackParamList } from './src/navigation/types';

export default function App() {
  return (
    <Provider store={store}>
      <AppBootstrap>
        <RootNavigator />
      </AppBootstrap>
    </Provider>
  );
}
