import React, { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { FiMapPin, FiSearch, FiHome, FiGlobe } from "react-icons/fi";
import useIndianCities from "../hooks/useIndianCities";
import { highlightMatch } from "../utils/citySearch.jsx";
import "./LocationAutocomplete.css";

const FIXED_ICONS = {
  Remote: FiSearch,
  "Work From Home": FiHome,
  "Anywhere in India": FiGlobe,
};

const DROPDOWN_MAX_HEIGHT = 320;
const DROPDOWN_MAX_HEIGHT_MOBILE = 220;
const VIEWPORT_PADDING = 8;

function getInputPosition(inputEl) {
  if (!inputEl) return null;
  const rect = inputEl.getBoundingClientRect();
  const viewportH = window.innerHeight;
  const spaceBelow = viewportH - rect.bottom;
  const openAbove = spaceBelow < DROPDOWN_MAX_HEIGHT + VIEWPORT_PADDING * 2;

  return {
    top: openAbove
      ? rect.top - DROPDOWN_MAX_HEIGHT - 6
      : rect.bottom + 6,
    left: rect.left,
    width: rect.width,
    openAbove,
  };
}

export default function LocationAutocomplete({
  value = "",
  onChange,
  onSelect,
  placeholder = "City, state or remote",
  className = "",
  id,
  name,
  "aria-label": ariaLabel,
}) {
  const {
    query,
    setQuery,
    suggestions,
    isOpen,
    setIsOpen,
    isLoading,
    handleQueryChange,
    handleSelect: selectItem,
    handleClose,
  } = useIndianCities(250);

  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [hasFocus, setHasFocus] = useState(false);
  const [dropdownPos, setDropdownPos] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const containerRef = useRef(null);
  const justSelected = useRef(false);
  const posRaf = useRef(null);

  const isMobile = useMemo(
    () => typeof window !== "undefined" && window.innerWidth <= 768,
    []
  );
  const maxH = isMobile ? DROPDOWN_MAX_HEIGHT_MOBILE : DROPDOWN_MAX_HEIGHT;

  useEffect(() => {
    if (value && value !== query) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  const updatePosition = useCallback(() => {
    if (posRaf.current) cancelAnimationFrame(posRaf.current);
    posRaf.current = requestAnimationFrame(() => {
      const pos = getInputPosition(inputRef.current);
      setDropdownPos(pos);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (posRaf.current) cancelAnimationFrame(posRaf.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setDropdownPos(null);
      return;
    }
    updatePosition();

    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen, updatePosition]);

  const listboxId = id ? `${id}-listbox` : "location-autocomplete-listbox";

  const selectOption = useCallback(
    (item) => {
      const result = selectItem(item);
      justSelected.current = true;
      if (onSelect) onSelect(result);
      if (onChange) onChange(result.label || result.city);
      setIsOpen(false);
      setDropdownPos(null);
      setTimeout(() => {
        justSelected.current = false;
        inputRef.current?.focus();
      }, 0);
    },
    [selectItem, onSelect, onChange, setIsOpen]
  );

  const handleInputChange = useCallback(
    (e) => {
      const val = e.target.value;
      handleQueryChange(val);
      if (onChange) onChange(val);
    },
    [handleQueryChange, onChange]
  );

  const handleFocus = useCallback(() => {
    setHasFocus(true);
    if (query && query.trim()) {
      handleQueryChange(query);
    }
  }, [query, handleQueryChange]);

  const handleBlur = useCallback(() => {
    setHasFocus(false);
    setTimeout(() => {
      if (!justSelected.current) {
        handleClose();
        setDropdownPos(null);
      }
    }, 150);
  }, [handleClose]);

  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen || suggestions.length === 0) {
        if (e.key === "Escape") {
          inputRef.current?.blur();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;

        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;

        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
            selectOption(suggestions[highlightedIndex]);
          }
          break;

        case "Escape":
          e.preventDefault();
          handleClose();
          setDropdownPos(null);
          inputRef.current?.blur();
          break;

        case "Tab":
          handleClose();
          setDropdownPos(null);
          break;

        default:
          break;
      }
    },
    [isOpen, suggestions, highlightedIndex, selectOption, handleClose]
  );

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex];
      if (item) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const inContainer = containerRef.current && containerRef.current.contains(e.target);
      const inDropdown = listRef.current && listRef.current.contains(e.target);
      if (!inContainer && !inDropdown) {
        handleClose();
        setDropdownPos(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClose]);

  const renderOption = (item, index) => {
    const isFixed = item.isFixed;
    const IconComponent = isFixed ? FIXED_ICONS[item.city] || FiMapPin : FiMapPin;
    const isHighlighted = index === highlightedIndex;

    return (
      <li
        key={`${item.city}-${item.state}-${index}`}
        id={`${listboxId}-option-${index}`}
        role="option"
        aria-selected={isHighlighted}
        className={`la-option ${isFixed ? "la-option--fixed" : ""} ${
          isHighlighted ? "la-option--highlighted" : ""
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          selectOption(item);
        }}
        onMouseEnter={() => setHighlightedIndex(index)}
      >
        <span className="la-option__icon">
          <IconComponent size={14} />
        </span>
        <span className="la-option__text">
          {isFixed ? (
            <span className="la-option__label">{item.city}</span>
          ) : (
            <>
              <span className="la-option__city">
                {highlightMatch(item.city, query)}
              </span>
              <span className="la-option__state">
                , {highlightMatch(item.state, query)}
              </span>
            </>
          )}
        </span>
      </li>
    );
  };

  const dropdownContent =
    (isOpen || dropdownPos) &&
    (suggestions.length > 0 || (query && query.trim() && !isLoading)) ? (
      <div
        className="la-portal-dropdown"
        style={{
          position: "fixed",
          top: dropdownPos ? dropdownPos.top : 0,
          left: dropdownPos ? dropdownPos.left : 0,
          width: dropdownPos ? dropdownPos.width : 0,
          zIndex: 99999,
          pointerEvents: isOpen ? "auto" : "none",
          opacity: dropdownPos ? 1 : 0,
        }}
      >
        {isOpen && suggestions.length > 0 && (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="la-dropdown"
            style={{ maxHeight: maxH }}
            aria-label="Location suggestions"
          >
            {suggestions.map((item, index) => renderOption(item, index))}
          </ul>
        )}

        {isOpen && query && query.trim() && !isLoading && suggestions.length === 0 && (
          <div className="la-empty" role="status">
            No cities found for "{query}"
          </div>
        )}
      </div>
    ) : null;

  return (
    <div
      ref={containerRef}
      className={`la-container ${className} ${hasFocus ? "la-container--focused" : ""}`}
    >
      <div className="la-input-wrapper">
        <FiMapPin className="la-input-icon" size={16} />
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          className="la-input"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined
          }
          aria-label={ariaLabel || "Location search"}
          aria-autocomplete="list"
          autoComplete="off"
        />
        {isLoading && (
          <span className="la-spinner" aria-label="Loading suggestions">
            <span className="la-spinner__dot" />
          </span>
        )}
      </div>

      {createPortal(dropdownContent, document.body)}
    </div>
  );
}
