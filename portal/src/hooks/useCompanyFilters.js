import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

const ARRAY_KEYS = ['industry', 'location', 'companyType'];

export default function useCompanyFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const result = {};
    for (const key of ARRAY_KEYS) {
      const val = searchParams.get(key);
      if (val) result[key] = val.split(',').filter(Boolean);
      else result[key] = [];
    }
    if (searchParams.get('sort')) result.sort = searchParams.get('sort');
    if (searchParams.get('page')) result.page = searchParams.get('page');
    if (searchParams.get('q')) result.q = searchParams.get('q');
    return result;
  }, [searchParams]);

  const mergeParams = useCallback((updates) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === '' || value === false) {
          next.delete(key);
        } else if (Array.isArray(value)) {
          if (value.length > 0) next.set(key, value.join(','));
          else next.delete(key);
        } else if (key === 'sort' && value === 'popular') {
          next.delete('sort');
        } else {
          next.set(key, String(value));
        }
      }
      if (!('page' in updates)) next.delete('page');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const toggleFilter = useCallback((key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const current = (next.get(key) || '').split(',').filter(Boolean);
      const idx = current.indexOf(value);
      if (idx >= 0) current.splice(idx, 1);
      else current.push(value);
      if (current.length > 0) next.set(key, current.join(','));
      else next.delete(key);
      next.delete('page');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const clearAll = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const hasActiveFilters = useMemo(() => {
    if (ARRAY_KEYS.some(k => filters[k]?.length > 0)) return true;
    if (filters.q) return true;
    if (filters.sort && filters.sort !== 'popular') return true;
    return false;
  }, [filters]);

  return { filters, mergeParams, toggleFilter, clearAll, hasActiveFilters, searchParams, setSearchParams };
}
