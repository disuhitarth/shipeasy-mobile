import React, { Children, ReactNode, isValidElement, useMemo } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import { AnimatedItem } from './AnimatedScreen';

interface StaggeredProps {
  children: ReactNode;
  delayStep?: number;
  initialDelay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
}

export function Staggered({
  children,
  delayStep = 60,
  initialDelay = 0,
  duration = 420,
  style,
  itemStyle,
}: StaggeredProps) {
  const items = useMemo(() => {
    const arr: ReactNode[] = [];
    Children.forEach(children, (child) => {
      if (child === null || child === undefined || child === false) return;
      arr.push(child);
    });
    return arr;
  }, [children]);

  return (
    <React.Fragment>
      {items.map((child, index) => {
        const key = isValidElement(child) && child.key != null ? String(child.key) : String(index);
        return (
        <AnimatedItem
          key={key}
          index={index}
          delayStep={delayStep}
          initialDelay={initialDelay}
          duration={duration}
          style={itemStyle}
        >
          {child}
        </AnimatedItem>
        );
      })}
    </React.Fragment>
  );
}

interface StaggeredItemProps {
  index: number;
  children: ReactNode;
  delayStep?: number;
  initialDelay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export function StaggeredItem({
  index,
  children,
  delayStep = 60,
  initialDelay = 0,
  duration = 420,
  style,
}: StaggeredItemProps) {
  return (
    <AnimatedItem
      index={index}
      delayStep={delayStep}
      initialDelay={initialDelay}
      duration={duration}
      style={style}
    >
      {children}
    </AnimatedItem>
  );
}

export default Staggered;
