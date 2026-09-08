import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

const ARRAY_KEYS = new Set([
  'location', 'department', 'skills', 'company', 'workMode', 'jobType',
  'education', 'language', 'experience',
]);

function parseArray(value) {
  if (!value || typeof value !== 'string') return [];
  return value.split(';').map(v => v.trim()).filter(Boolean);
}

// Converts human experience labels ("Fresher (less than 1 year)", "3 years", "5+ years")
// into the sidebar range buckets ("0-1", "1-2", "2-5", "5-8", "8-12", "12+").
// Existing buckets are passed through untouched.
function normalizeExpToRange(value) {
  const s = String(value || '').trim();
  if (/^\d+(\.\d+)?-\d+(\.\d+)?$/.test(s) || /^\d+(\.\d+)?\+$/.test(s)) return s;
  const m = /(\d+(?:\.\d+)?)/.exec(s);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (s.toLowerCase().includes('fresher')) return '0-1';
  if (n <= 1) return '0-1';
  if (n === 2) return '1-2';
  if (n <= 4) return '2-5';
  if (n <= 8) return '5-8';
  if (n <= 12) return '8-12';
  return '12+';
}

function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function useJobFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { filter: routeFilter = '' } = useParams();
  const navigate = useNavigate();

  const filters = useMemo(() => {
    const result = {};
    for (const [key, value] of searchParams.entries()) {
      if (ARRAY_KEYS.has(key)) {
        if (key === 'experience') {
          const exp = [];
          for (const v of parseArray(value)) {
            const norm = normalizeExpToRange(v);
            if (norm && !exp.includes(norm)) exp.push(norm);
          }
          if (exp.length > 0) result[key] = exp;
        } else {
          const arr = parseArray(value);
          if (arr.length > 0) result[key] = arr;
        }
      } else if (key === 'page') {
        result.page = Math.max(1, parseInt(value, 10) || 1);
      } else if (key === 'sort') {
        result.sort = value;
      } else if (key === 'salary') {
        result[key] = value;
      } else if (key === 'q') {
        result.q = value;
      }
    }
    return result;
  }, [searchParams]);

  const keyword = useMemo(() => {
    if (filters.q) return filters.q.trim();
    if (routeFilter) return routeFilter.replace(/-/g, ' ');
    return '';
  }, [routeFilter, filters.q]);

  const mergeParams = useCallback((updates) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        if (key === '_clear') {
          for (const k of [...next.keys()]) next.delete(k);
        } else if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
          next.delete(key);
        } else if (ARRAY_KEYS.has(key)) {
          const arr = Array.isArray(value) ? value.filter(Boolean) : [];
          if (arr.length > 0) {
            next.set(key, arr.join(';'));
          } else {
            next.delete(key);
          }
        } else if (key === 'page') {
          const p = Math.max(1, parseInt(value, 10) || 1);
          if (p > 1) next.set('page', String(p));
          else next.delete('page');
        } else if (key === 'experience' || key === 'salary') {
          if (value) next.set(key, value);
          else next.delete(key);
        } else if (key === 'sort') {
          if (value && value !== 'relevance') next.set('sort', value);
          else next.delete('sort');
        } else if (key === 'q') {
          if (value) next.set('q', value);
          else next.delete('q');
        }
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const toggleFilter = useCallback((key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const current = parseArray(next.get(key));
      const idx = current.indexOf(value);
      let updated;
      if (idx >= 0) {
        updated = current.filter(v => v !== value);
      } else {
        updated = [...current, value];
      }
      if (updated.length > 0) {
        next.set(key, updated.join(';'));
      } else {
        next.delete(key);
      }
      next.delete('page');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setKeyword = useCallback((kw) => {
    const slug = kw ? toSlug(kw) : '';
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    const qs = params.toString();
    navigate(`${slug ? `/jobs/${slug}` : '/jobs'}${qs ? `?${qs}` : ''}`, { replace: true });
  }, [navigate, searchParams]);

  const clearAll = useCallback(() => {
    navigate('/jobs', { replace: true });
  }, [navigate]);

  const hasActiveFilters = useMemo(() => {
    if (routeFilter) return true;
    for (const [, value] of searchParams.entries()) {
      if (value) return true;
    }
    return false;
  }, [searchParams, routeFilter]);

  return {
    filters,
    keyword,
    routeFilter,
    searchParams,
    setSearchParams,
    mergeParams,
    toggleFilter,
    setKeyword,
    clearAll,
    hasActiveFilters,
  };
}
