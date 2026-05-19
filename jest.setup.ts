import '@testing-library/jest-native/extend-expect';

// ─── React Navigation ─────────────────────────────────────────────────────────
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    NavigationContainer: ({ children }: any) => React.createElement(View, null, children),
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), reset: jest.fn(), setOptions: jest.fn() }),
    useFocusEffect: jest.fn((cb: () => void) => { const cleanup = cb(); return cleanup; }),
    useRoute: () => ({ params: {}, name: 'Screen' }),
    DarkTheme: {
      dark: true,
      colors: { primary: '#c9a84c', background: '#0b0d12', card: '#13161e', text: '#fff', border: 'rgba(255,255,255,0.07)', notification: '#c9a84c' },
    },
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: any) => React.createElement(View, null, children),
      Screen: ({ component: Comp, ...props }: any) => React.createElement(Comp, props),
    }),
  };
});

// ─── Expo: SecureStore ────────────────────────────────────────────────────────
jest.mock('expo-secure-store', () => ({
  getItemAsync:    jest.fn().mockResolvedValue(null),
  setItemAsync:    jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// ─── Expo: Haptics ────────────────────────────────────────────────────────────
jest.mock('expo-haptics', () => ({
  impactAsync:       jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync:    jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle:   { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// ─── Expo: Clipboard ─────────────────────────────────────────────────────────
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
  getStringAsync: jest.fn().mockResolvedValue(''),
}));

// ─── Expo: DocumentPicker ────────────────────────────────────────────────────
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));

// ─── Expo: ImagePicker ───────────────────────────────────────────────────────
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync:      jest.fn().mockResolvedValue({ granted: true }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchCameraAsync:                  jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchImageLibraryAsync:            jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos', All: 'All' },
}));

// ─── Expo: ImageManipulator ───────────────────────────────────────────────────
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({ uri: 'file://mock.jpg', base64: 'mockBase64Data' }),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));

// ─── Expo: WebBrowser ────────────────────────────────────────────────────────
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn().mockResolvedValue({ type: 'dismiss' }),
  WebBrowserPresentationStyle: { FULL_SCREEN: 'fullScreen', FORM_SHEET: 'formSheet' },
}));

// ─── react-native-url-polyfill ────────────────────────────────────────────────
jest.mock('react-native-url-polyfill/auto', () => {});

// ─── react-native-reanimated ──────────────────────────────────────────────────
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// ─── react-native-svg ────────────────────────────────────────────────────────
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const mk = (name: string) => {
    const C = (props: any) => React.createElement(View, { testID: name, ...props });
    C.displayName = name;
    return C;
  };
  const Svg = mk('Svg');
  return {
    __esModule: true,
    default: Svg,
    Svg,
    Circle:  mk('Circle'),
    Path:    mk('Path'),
    Rect:    mk('Rect'),
    G:       mk('G'),
    Line:    mk('Line'),
    Text:    mk('SvgText'),
  };
});

// ─── @expo/vector-icons ───────────────────────────────────────────────────────
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Ionicons = ({ name, testID, size, color, ...rest }: any) =>
    React.createElement(Text, { testID: testID ?? `icon-${name}`, ...rest }, name);
  return { Ionicons, MaterialIcons: Ionicons, FontAwesome: Ionicons, Feather: Ionicons };
});

// ─── react-native-safe-area-context ──────────────────────────────────────────
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView:      ({ children, ...p }: any) => React.createElement(View, p, children),
    SafeAreaProvider:  ({ children, ...p }: any) => React.createElement(View, p, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame:  () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// ─── react-native-gesture-handler ────────────────────────────────────────────
jest.mock('react-native-gesture-handler', () => {
  const { View, ScrollView } = require('react-native');
  return { GestureHandlerRootView: View, ScrollView };
});

// ─── Supabase (auth service) ──────────────────────────────────────────────────
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp:               jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword:   jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
      signOut:              jest.fn().mockResolvedValue({ error: null }),
      getSession:           jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange:    jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
  })),
}));
