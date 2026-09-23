import { useCallback, useEffect, useRef, useState } from 'react';
import { readError } from '../services/api.js';

/* Data fetching with the three states every screen needs: loading, error, data.
   `deps` controls refetching; `refetch` re-runs on demand. */
export function useFetch(fetcher, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetcher();
      if (!mounted.current) return;
      setData(response?.data ?? null);
      setMeta(response?.meta ?? null);
    } catch (err) {
      if (mounted.current) setError(readError(err).message);
    } finally {
      if (mounted.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { if (immediate) run(); }, [run, immediate]);

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
