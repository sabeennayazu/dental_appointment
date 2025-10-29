import { ReactNode } from 'react';

export interface AnimatedProps {
  isMobile: boolean;
  animProps: (props: Record<string, unknown>) => Record<string, unknown>;
  children?: ReactNode;
}