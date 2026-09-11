"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ServiceError, toServiceError } from "@/lib/errors";

export interface AsyncState<T> {
  data: T | undefined;
  error: ServiceError | undefined;
  loading: boolean;
  /** Re-runs the loader, e.g. after a mutation or from an error state. */
  reload: () => void;
  setData: (value: T) => void;
}

/**
 * Minimal async loader for service calls. Keeps every screen's loading /
 * error / empty handling consistent without pulling in a data library.
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: unknown[],
): AsyncState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<ServiceError>();
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);
  // Callers pass simple route IDs and filter keys. This keeps an inline loader
  // from triggering a new request after every state update.
  const dependencyKey = JSON.stringify(deps);

  useEffect(() => {
    let active = true;
    // Loading is reset only when explicit dependencies or the reload token changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(undefined);
    loaderRef
      .current()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((cause) => {
        if (active) setError(toServiceError(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dependencyKey, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { data, error, loading, reload, setData };
}
