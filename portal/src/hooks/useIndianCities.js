import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { loadAllCities, searchCities } from "../utils/citySearch.jsx";

export default function useIndianCities(debounceMs = 250) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef(null);

  const allCities = useMemo(() => loadAllCities(), []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const search = useCallback(
    (term) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      if (!term || !term.trim()) {
        setSuggestions([]);
        setIsOpen(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      timerRef.current = setTimeout(() => {
        const results = searchCities(term);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setIsLoading(false);
      }, debounceMs);
    },
    [debounceMs]
  );

  const handleQueryChange = useCallback(
    (value) => {
      setQuery(value);
      search(value);
    },
    [search]
  );

  const handleSelect = useCallback((item) => {
    const displayValue = item.label || item.city;
    setQuery(displayValue);
    setSuggestions([]);
    setIsOpen(false);
    setIsLoading(false);
    return item;
  }, []);

  const handleOpen = useCallback(() => {
    if (query && query.trim()) {
      search(query);
    }
  }, [query, search]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isOpen,
    setIsOpen,
    isLoading,
    allCities,
    handleQueryChange,
    handleSelect,
    handleOpen,
    handleClose,
    search,
  };
}
