import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import ProfileFormScreen from './src/screens/ProfileFormScreen';
import { theme } from './src/styles/theme';

const Stack = createStackNavigator();

const customTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.background,
    surface: theme.colors.surface,
    text: theme.colors.text,
    error: theme.colors.error,
  },
};

export default function App() {
  return (
    <PaperProvider theme={customTheme}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.text,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            // Hide the native stack header so the in-screen header is the only one displayed
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ProfileForm" 
            component={ProfileFormScreen}
            options={({ route }) => ({ 
              title: route.params?.profile ? 'Edit Profile' : 'Add Profile'
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}