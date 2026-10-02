import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiX
} from 'react-icons/fi';
import './CustomDatePicker.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Helpers for YYYY-MM-DD
const parseYMD = (ymdStr) => {
  if (!ymdStr) return null;
  const parts = String(ymdStr).split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month, day);
};

const formatToYMD = (dateObj) => {
  if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDisplayDate = (ymdStr) => {
  const d = parseYMD(ymdStr);
  if (!d) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function CustomDatePicker({
  value,
  onChange,
  max,
  min,
  placeholder = 'Select date',
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const initialDate = useMemo(() => parseYMD(value) || new Date(), [value]);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  useEffect(() => {
    if (value) {
      const d = parseYMD(value);
      if (d) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value, isOpen]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const maxDate = useMemo(() => (max ? parseYMD(max) : null), [max]);
  const minDate = useMemo(() => (min ? parseYMD(min) : null), [min]);
  const selectedDate = useMemo(() => parseYMD(value), [value]);
  const today = useMemo(() => new Date(), []);

  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];

    // Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(viewYear, viewMonth - 1, dayNum);
      cells.push({
        date: prevDate,
        dayNum,
        isCurrentMonth: false,
        isPrev: true,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const curDate = new Date(viewYear, viewMonth, day);
      cells.push({
        date: curDate,
        dayNum: day,
        isCurrentMonth: true,
      });
    }

    // Next month leading days
    const totalCellsNeeded = cells.length > 35 ? 42 : 35;
    const remaining = totalCellsNeeded - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const nextDate = new Date(viewYear, viewMonth + 1, day);
      cells.push({
        date: nextDate,
        dayNum: day,
        isCurrentMonth: false,
        isNext: true,
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const handlePrevYear = (e) => {
    e.stopPropagation();
    setViewYear((y) => y - 1);
  };

  const handleNextYear = (e) => {
    e.stopPropagation();
    setViewYear((y) => y + 1);
  };

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isDateDisabled = (dateObj) => {
    if (maxDate) {
      const endOfMax = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate(), 23, 59, 59);
      if (dateObj > endOfMax) return true;
    }
    if (minDate) {
      const startOfMin = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate(), 0, 0, 0);
      if (dateObj < startOfMin) return true;
    }
    return false;
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const handleSelectDate = (dateObj) => {
    if (isDateDisabled(dateObj)) return;
    const ymd = formatToYMD(dateObj);
    onChange(ymd);
    setIsOpen(false);
  };

  const handleQuickYesterday = () => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    handleSelectDate(y);
  };

  const handleQuickToday = () => {
    handleSelectDate(new Date());
  };

  return (
    <div className={`cdp-container ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        className={`cdp-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <div className="cdp-trigger-left">
          <FiCalendar className="cdp-cal-icon" size={15} />
          <span className={`cdp-value-text ${!value ? 'placeholder' : ''}`}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="cdp-popover">
          {/* Calendar Navigation Header */}
          <div className="cdp-header">
            <div className="cdp-nav-group">
              <button
                type="button"
                className="cdp-nav-btn"
                onClick={handlePrevYear}
                title="Previous year"
              >
                <FiChevronsLeft size={14} />
              </button>
              <button
                type="button"
                className="cdp-nav-btn"
                onClick={handlePrevMonth}
                title="Previous month"
              >
                <FiChevronLeft size={14} />
              </button>
            </div>

            <div className="cdp-month-year">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>

            <div className="cdp-nav-group">
              <button
                type="button"
                className="cdp-nav-btn"
                onClick={handleNextMonth}
                title="Next month"
              >
                <FiChevronRight size={14} />
              </button>
              <button
                type="button"
                className="cdp-nav-btn"
                onClick={handleNextYear}
                title="Next year"
              >
                <FiChevronsRight size={14} />
              </button>
            </div>
          </div>

          {/* Day Names Header */}
          <div className="cdp-weekdays">
            {DAYS_OF_WEEK.map((d) => (
              <span key={d} className="cdp-weekday">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="cdp-grid">
            {calendarCells.map((cell, idx) => {
              const disabledCell = isDateDisabled(cell.date);
              const selected = isSameDay(cell.date, selectedDate);
              const isToday = isSameDay(cell.date, today);

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabledCell}
                  className={`cdp-day-btn ${
                    !cell.isCurrentMonth ? 'other-month' : ''
                  } ${selected ? 'selected' : ''} ${
                    isToday ? 'today' : ''
                  } ${disabledCell ? 'disabled' : ''}`}
                  onClick={() => handleSelectDate(cell.date)}
                >
                  {cell.dayNum}
                </button>
              );
            })}
          </div>

          {/* Quick Action Buttons Footer */}
          <div className="cdp-footer">
            <button
              type="button"
              className="cdp-quick-btn"
              onClick={handleQuickYesterday}
            >
              Yesterday
            </button>
            {(!maxDate || today <= maxDate) && (
              <button
                type="button"
                className="cdp-quick-btn"
                onClick={handleQuickToday}
              >
                Today
              </button>
            )}
            <button
              type="button"
              className="cdp-close-btn"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
