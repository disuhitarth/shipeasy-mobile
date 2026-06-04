import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const noop = () => {};

export const light = Platform.OS === 'web' ? noop : () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
export const medium = Platform.OS === 'web' ? noop : () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
export const selection = Platform.OS === 'web' ? noop : () => Haptics.selectionAsync();
export const success = Platform.OS === 'web' ? noop : () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
export const error = Platform.OS === 'web' ? noop : () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
export const warning = Platform.OS === 'web' ? noop : () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
