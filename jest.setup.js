/* global jest */

jest.mock('react-native-config', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('react-native-url-polyfill/auto', () => ({}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const storage = {};
  const remove = async keys => {
    keys.forEach(key => delete storage[key]);
  };
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async key => (key in storage ? storage[key] : null)),
      setItem: jest.fn(async (key, value) => {
        storage[key] = value;
      }),
      removeItem: jest.fn(async key => remove([key])),
      removeMany: jest.fn(remove),
      multiRemove: jest.fn(remove),
      multiGet: jest.fn(async keys => keys.map(key => [key, storage[key] ?? null])),
      multiSet: jest.fn(async pairs => {
        pairs.forEach(([key, value]) => {
          storage[key] = value;
        });
      }),
      getAllKeys: jest.fn(async () => Object.keys(storage)),
      clear: jest.fn(async () => remove(Object.keys(storage))),
    },
  };
});

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(),
    signOut: jest.fn(async () => undefined),
    getTokens: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

jest.mock('react-native-localize', () => ({
  getLocales: () => [
    { countryCode: 'PK', languageCode: 'en', languageTag: 'en-PK', isRTL: false },
  ],
  findBestAvailableLanguage: () => ({ languageTag: 'en', isRTL: false }),
}));

jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = props => React.createElement(Text, props, props.name ?? '');
  return { __esModule: true, default: Icon };
});

jest.mock('react-native-gifted-charts', () => ({
  LineChart: () => null,
}));

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Mock = ({ children, ...props }) => React.createElement(View, props, children);
  return {
    __esModule: true,
    default: Mock,
    Svg: Mock,
    Circle: Mock,
    Ellipse: Mock,
    G: Mock,
    Line: Mock,
    Path: Mock,
    Polygon: Mock,
    Polyline: Mock,
    Rect: Mock,
    Text: Mock,
    TSpan: Mock,
    Defs: Mock,
    LinearGradient: Mock,
    Stop: Mock,
  };
});
