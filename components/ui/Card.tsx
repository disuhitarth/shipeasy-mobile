import { View, type ViewStyle } from 'react-native';
import { colors, borderRadius } from '@/lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export function Card({ children, style, padding = 18 }: CardProps) {
  return (
    <View
      style={[{
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding,
        shadowColor: 'rgba(10,10,25,0.04)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 2,
        elevation: 1,
      }, style]}
    >
      {children}
    </View>
  );
}
