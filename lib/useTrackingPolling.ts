import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from './api';
import type { TrackingEvent } from '@/types';
import { useSettings } from '@/store/settings';
import { useConnectionState } from './connection';

export type TrackingConnectionStatus = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'offline' | 'disabled';

interface UseTrackingPollingOptions {
  shipCode: string;
  intervalMs?: number;
  enabled?: boolean;
}

interface UseTrackingPollingResult {
  events: TrackingEvent[];
  status: string | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  dataUpdatedAt: number;
  refetch: () => Promise<unknown>;
  connectionStatus: TrackingConnectionStatus;
  isPolling: boolean;
  lastFetchedAt: number | null;
}

const ACTIVE_STATUSES = ['pending', 'label-created', 'picked-up', 'in-transit', 'out-for-delivery'];
const TERMINAL_STATUSES = ['delivered', 'voided', 'void-requested', 'failed'];

function isActive(status?: string): boolean {
  if (!status) return true;
  return ACTIVE_STATUSES.includes(status);
}

export function useTrackingPolling({
  shipCode,
  intervalMs = 30_000,
  enabled = true,
}: UseTrackingPollingOptions): UseTrackingPollingResult {
  const autoRefresh = useSettings((s) => s.notificationPrefs);
  const connection = useConnectionState();
  const appActiveRef = useRef(true);
  const [appActive, setAppActive] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const active = next === 'active';
      appActiveRef.current = active;
      setAppActive(active);
    });
    return () => sub.remove();
  }, []);

  const shouldPoll =
    enabled &&
    appActive &&
    (autoRefresh as any).autoRefreshTracking !== false &&
    connection !== 'offline';

  const query = useQuery({
    queryKey: ['tracking', shipCode],
    queryFn: async () => {
      const res = await api.get(`/shipments/${shipCode}/track`);
      return res.data;
    },
    enabled: !!shipCode && enabled,
    refetchInterval: shouldPoll ? intervalMs : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (query.dataUpdatedAt && query.dataUpdatedAt > 0) {
      setLastFetchedAt(query.dataUpdatedAt);
    }
  }, [query.dataUpdatedAt]);

  const events: TrackingEvent[] = (query.data as any)?.events ?? query.data ?? [];
  const status: string | undefined = (query.data as any)?.status;

  const isActiveShipment = isActive(status);

  let connectionStatus: TrackingConnectionStatus = 'idle';
  if (!enabled) {
    connectionStatus = 'disabled';
  } else if (connection === 'offline') {
    connectionStatus = 'offline';
  } else if (!isActiveShipment) {
    connectionStatus = 'idle';
  } else if (query.isError) {
    connectionStatus = 'reconnecting';
  } else if (query.isFetching) {
    connectionStatus = 'connecting';
  } else if (query.data) {
    connectionStatus = 'live';
  }

  return {
    events,
    status,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    dataUpdatedAt: query.dataUpdatedAt,
    refetch: query.refetch,
    connectionStatus,
    isPolling: shouldPoll && isActiveShipment,
    lastFetchedAt,
  };
}

export { isActive, ACTIVE_STATUSES, TERMINAL_STATUSES };
