import { useEffect, useRef, useState, useCallback } from "react";

export function useVisibility(options = {}) {
  const {
    threshold = 0,
    rootMargin = "100px",
    triggerOnce = true,
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, isVisible]);

  return [elementRef, isVisible];
}

export function useLazyAI(triggerRef, aiFunction, deps = [], options = {}) {
  const [elementRef, isVisible] = useVisibility(options);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let cancelled = false;
    let timeoutId;

    const execute = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await aiFunction();
        if (!cancelled && mountedRef.current) {
          setResult(data);
        }
      } catch (err) {
        if (!cancelled && mountedRef.current) {
          setError(err.message);
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false);
        }
      }
    };

    if (options.delay) {
      timeoutId = setTimeout(execute, options.delay);
    } else {
      execute();
    }

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isVisible, ...deps]);

  return { ref: elementRef, result, loading, error, isVisible };
}

export function useAIMatchScore(jobId, profile) {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchScore = useCallback(async () => {
    if (!jobId || !profile) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai/match-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobId, profileId: profile._id || profile.id }),
      });

      if (!response.ok) throw new Error("Failed to fetch match score");

      const data = await response.json();
      if (data.success) {
        setScore(data.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [jobId, profile]);

  return { score, loading, error, refetch: fetchScore };
}

export function useAIOnDemand(aiFunction, deps = []) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const execute = useCallback(async (...args) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const data = await aiFunction(...args, { signal: abortControllerRef.current.signal });
      setResult(data);
      return data;
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  }, []);

  return { execute, cancel, result, loading, error };
}