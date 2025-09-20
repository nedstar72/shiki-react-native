import { StyleSheet } from 'react-native-unistyles';

const gap = (value: number) => value * 8;

const utils = {
  gap,
};

export const lightTheme = {
  colors: {
    primary: '#007AFF',
    red: '#ed3e3e',
    background: '#ffffff',
  },
  ...utils,
};

export const darkTheme = {
  colors: {
    primary: '#4da6ff',
    red: '#fa645c',
    background: '#3E3E3E',
  },
  ...utils,
};

StyleSheet.configure({
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  settings: {
    adaptiveThemes: true,
  },
});

type AppThemes = {
  light: typeof lightTheme;
  dark: typeof darkTheme;
};

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
}
