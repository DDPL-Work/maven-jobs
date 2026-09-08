import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLazyAI } from "../hooks/useLazyAI";

export function LazyAIMatchScore({ jobId, profile, children, fallback }) {
  const { ref, result, loading, error, isVisible } = useLazyAI(
    ref => ref,
    async () => {
      const response = await fetch(`/api/ai/match-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobId, profileId: profile._id || profile.id }),
      });
      if (!response.ok) throw new Error("Failed to fetch match score");
      const data = await response.json();
      return data.data;
    },
    [jobId, profile],
    { rootMargin: "200px", triggerOnce: true }
  );

  if (!isVisible) {
    return (
      <div ref={ref} style={{ minHeight: 60 }}>
        {fallback || <MatchScoreSkeleton />}
      </div>
    );
  }

  if (loading) {
    return (
      <div ref={ref}>
        {fallback || <MatchScoreSkeleton />}
      </div>
    );
  }

  if (error) {
    return (
      <div ref={ref} style={{ color: "#dc2626", fontSize: 12 }}>
        Failed to load match score
      </div>
    );
  }

  return (
    <div ref={ref}>
      {children(result)}
    </div>
  );
}

function MatchScoreSkeleton() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#e2e8f0", animation: "pulse 1.5s infinite" }} />
      <div style={{ width: 40, height: 12, borderRadius: 4, background: "#e2e8f0", animation: "pulse 1.5s infinite" }} />
    </div>
  );
}

export function LazyAIComponent({ triggerRef, aiFunction, deps = [], children, loading, error: ErrorComponent, delay }) {
  const [elementRef, isVisible] = useVisibility({ rootMargin: "200px", triggerOnce: true });
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState(null);
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
      setIsLoading(true);
      setErr(null);

      try {
        const data = await aiFunction();
        if (!cancelled && mountedRef.current) {
          setResult(data);
        }
      } catch (err) {
        if (!cancelled && mountedRef.current) {
          setErr(err.message);
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    if (delay) {
      timeoutId = setTimeout(execute, delay);
    } else {
      execute();
    }

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isVisible, ...deps]);

  const combinedRef = useCallback((node) => {
    if (triggerRef && typeof triggerRef === "function") triggerRef(node);
    else if (triggerRef && typeof triggerRef === "object") triggerRef.current = node;
    elementRef.current = node;
  }, [triggerRef]);

  if (!isVisible && !result) {
    return <div ref={combinedRef}>{loading || <div style={{ minHeight: 100 }} />}</div>;
  }

  if (isLoading && !result) {
    return <div ref={combinedRef}>{loading || <div style={{ minHeight: 100 }} />}</div>;
  }

  if (err && ErrorComponent) {
    return <div ref={combinedRef}><ErrorComponent error={err} onRetry={() => setResult(null)} /></div>;
  }

  return <div ref={combinedRef}>{children(result, { loading: isLoading, error: err })}</div>;
}

function useVisibility({ threshold = 0, rootMargin = "100px", triggerOnce = true }) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) observer.unobserve(element);
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

export function AITrigger({ children, rootMargin = "100px", triggerOnce = true, onTrigger }) {
  const [isTriggered, setIsTriggered] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || isTriggered) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsTriggered(true);
          if (onTrigger) onTrigger();
          if (triggerOnce) observer.unobserve(element);
        }
      },
      { threshold: 0, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, triggerOnce, isTriggered, onTrigger]);

  return (
    <div ref={elementRef} style={{ minHeight: 1 }}>
      {children(isTriggered)}
    </div>
  );
}