import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ErrorScreen } from '@/components/ErrorScreen';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <ErrorScreen
      variant="404"
      title="Page not found"
      message="The page you are looking for has drifted off the map."
      primaryAction={{
        label: 'Go home',
        icon: 'home',
        onPress: () => router.replace('/(tabs)'),
      }}
      secondaryAction={{
        label: 'Go back',
        icon: 'arrow-back',
        onPress: () => router.back(),
      }}
    />
  );
}
