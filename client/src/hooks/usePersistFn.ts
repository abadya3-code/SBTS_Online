import { useRef } from "react";

type PersistableFn = (...args: never[]) => unknown;

/**
 * usePersistFn instead of useCallback to reduce cognitive load.
 * Sprint 17.11: keeps the helper generic without unsafe broad casts.
 */
export function usePersistFn<T extends PersistableFn>(fn: T) {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const persistFn = useRef<T>(null);
  if (!persistFn.current) {
    persistFn.current = function (this: unknown, ...args: Parameters<T>) {
      return fnRef.current.apply(this, args) as ReturnType<T>;
    } as T;
  }

  return persistFn.current;
}
