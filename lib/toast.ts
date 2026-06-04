export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastShowOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

type ToastHostFn = (opts: { message: string; type: ToastType; duration: number }) => number;

const host: { current: ToastHostFn | null } = { current: null };

export const toast = {
  success: (message: string, duration?: number) =>
    host.current?.({ message, type: 'success', duration: duration ?? 3000 }),
  error: (message: string, duration?: number) =>
    host.current?.({ message, type: 'error', duration: duration ?? 3000 }),
  info: (message: string, duration?: number) =>
    host.current?.({ message, type: 'info', duration: duration ?? 3000 }),
  warning: (message: string, duration?: number) =>
    host.current?.({ message, type: 'warning', duration: duration ?? 3000 }),
  show: (opts: ToastShowOptions) =>
    host.current?.({ message: opts.message, type: opts.type ?? 'info', duration: opts.duration ?? 3000 }),
};

export function registerToastHost(fn: ToastHostFn | null) {
  host.current = fn;
}
