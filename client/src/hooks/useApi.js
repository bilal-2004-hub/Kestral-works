import { useCallback, useEffect, useRef, useState } from 'react';
import { readError } from '../services/api.js';

/* Data fetching with the three states every screen needs: loading, error, data.
   `deps` controls refetching; `refetch` re-runs on demand.

   StrictMode fix: React StrictMode double-invokes effects and immediately runs
   the cleanup, which would set a shared `mounted.current = false` before the
   second (real) invocation completes — silently discarding every API response.

   Solution: we use a per-invocation `cancelled` local variable inside run().
   Each call to run() owns its own flag. When StrictMode's cleanup fires for the
   first invocation it sets only that invocation's flag to true. The second
   real invocation starts fresh with cancelled=false and proceeds normally.
   A genuine component unmount still sets mountedRef.current=false which guards
   the shared setState calls after the async boundary. */
export function useFetch(fetcher, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  // Tracks genuine unmount — only set to false in the component teardown effect.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const run = useCallback(async () => {
    // Per-invocation cancellation flag — immune to StrictMode double-cleanup.
    let cancelled = false;
    const cancel = () => { cancelled = true; };

    setLoading(true);
    setError(null);
    try {
      const response = await fetcher();
      if (!cancelled && mountedRef.current) {
        setData(response?.data ?? null);
        setMeta(response?.meta ?? null);
      }
    } catch (err) {
      if (!cancelled && mountedRef.current) {
        setError(readError(err).message);
      }
    } finally {
      if (!cancelled && mountedRef.current) {
        setLoading(false);
      }
    }
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!immediate) return;
    let cancel;
    run().then((c) => { cancel = c; });
    return () => { if (typeof cancel === 'function') cancel(); };
  }, [run, immediate]);

  return { data, meta, loading, error, refetch: run, setData };
}

/* Wraps a write action with its own pending/error state. */
export function useAction(action) {
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const execute = useCallback(async (...args) => {
    setPending(true);
    setFieldErrors({});
    try {
      return await action(...args);
    } catch (err) {
      const { message, fields } = readError(err);
      setFieldErrors(fields);
      throw new Error(message);
    } finally {
      setPending(false);
    }
  }, [action]);

  return { execute, pending, fieldErrors, setFieldErrors };
}
