import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { hydrateStore, initPersistence } from '@/store/persist';
import { palette } from '@/theme/colors';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let teardown: (() => void) | undefined;
    (async () => {
      await hydrateStore();
      teardown = initPersistence();
      setReady(true);
    })();
    return () => teardown?.();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {ready ? (
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: palette.background },
              headerTintColor: palette.text,
              contentStyle: { backgroundColor: palette.background },
            }}
          >
            <Stack.Screen name="index" options={{ title: 'Tier Lists' }} />
            <Stack.Screen name="template/[id]" options={{ title: 'Template' }} />
            <Stack.Screen name="editor/[id]" options={{ title: 'Editor' }} />
          </Stack>
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={palette.primary} size="large" />
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
  },
});
