"use client";
import { useApiKeyStore, useBillStore } from "@/lib/stores";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";

const subscribe = (onStoreChange: () => void) => {
  const unsubscribeBill = useBillStore.persist.onFinishHydration(onStoreChange);
  const unsubscribeKey =
    useApiKeyStore.persist.onFinishHydration(onStoreChange);
  return () => {
    unsubscribeBill();
    unsubscribeKey();
  };
};

const getSnapshot = () =>
  useBillStore.persist.hasHydrated() && useApiKeyStore.persist.hasHydrated();

const getServerSnapshot = () => false;

/**
 * The persisted stores are created with `skipHydration`, so persisted values
 * are only read after this gate has rehydrated them on the client. Server and
 * first client render both show nothing, which keeps hydration consistent.
 */
export function HydrationGate({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    void useBillStore.persist.rehydrate();
    void useApiKeyStore.persist.rehydrate();
  }, []);

  if (!hydrated) return null;
  return <>{children}</>;
}
