import { View, type ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: '#fff',
          borderRadius: 22,
          padding: 18,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
