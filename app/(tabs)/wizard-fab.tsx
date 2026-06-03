import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function WizardFab() {
  useFocusEffect(
    useCallback(() => {
      router.replace('/wizard');
    }, [])
  );
  return null;
}
