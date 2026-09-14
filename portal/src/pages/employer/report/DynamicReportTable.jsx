import React, { useMemo } from 'react';
import './DynamicReportTable.css';

/**
 * Helper to escape CSV cell contents safely
 */
const escapeCsvCell = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * DynamicReportTable component
 * 
 * Props:
 * - reportType: string (e.g. "User Wise", "Summary")
 * - durationLabel: string (e.g. "09-Sep-26 To 09-Sep-26")
 * - headers: Array<string | { key: string, label: string, align?: string }>
 * - rows: Array<Record<string, any> | Array<any>>
 * - showTotalRow: boolean (default true for numeric tables)
 * - showNote: boolean (default true)
 * - theme: 'blue' | 'gray' (default 'blue')
 * - onNewReport: () => void (handler to navigate back to configuration form)
 * - onDownloadExcel?: () => void (optional custom export handler, otherwise uses default CSV export)
 * - filename?: string (name for downloaded file)
 */
export default function DynamicReportTable({
  reportType = 'Summary',
  durationLabel = '',
  headers = [],
  rows = [],
  showTotalRow = false,
  showNote = true,
  theme = 'blue',
  onNewReport,
  onDownloadExcel,
  filename = 'Report',
}) {
  // Normalize header definitions into standard format { key, label, align }
  const normalizedColumns = useMemo(() => {
    return headers.map((col, index) => {
      if (typeof col === 'string') {
        return {
          key: `col_${index}`,
          label: col,
          align: index === 0 ? 'left' : 'center',
        };
      }
      return {
        key: col.key || `col_${index}`,
        label: col.label || '',
        align: col.align || (index === 0 ? 'left' : 'center'),
      };
    });
  }, [headers]);

  // Normalize row items into array of values matching normalizedColumns order
  const normalizedRows = useMemo(() => {
    return rows.map((row) => {
      if (Array.isArray(row)) {
        return row;
      }
      if (row && typeof row === 'object') {
        return normalizedColumns.map((col, idx) => {
          if (row[col.key] !== undefined) return row[col.key];
          if (row[col.label] !== undefined) return row[col.label];
          // fallback to index if available
          return row[`col_${idx}`] !== undefined ? row[`col_${idx}`] : '';
        });
      }
      return [];
    });
  }, [rows, normalizedColumns]);

  // Compute total row if showTotalRow is true
  const totalRowData = useMemo(() => {
    if (!showTotalRow || normalizedRows.length === 0) return null;

    const totals = normalizedColumns.map((col, colIdx) => {
      if (colIdx === 0) {
        return 'Total';
      }

      let isNumeric = true;
      let sum = 0;
      let hasValue = false;

      for (const row of normalizedRows) {
        const val = row[colIdx];
        if (val === null || val === undefined || val === '') continue;

        // Check if value is time duration like "00:00"
        if (typeof val === 'string' && /^\d+:\d+$/.test(val.trim())) {
          return '00:00';
        }

        const num = Number(val);
        if (Number.isFinite(num)) {
          sum += num;
          hasValue = true;
        } else {
          isNumeric = false;
          break;
        }
      }

      if (isNumeric && hasValue) {
        return sum;
      }
      return '';
    });

    return totals;
  }, [showTotalRow, normalizedRows, normalizedColumns]);

  // Default export to CSV
  const handleDefaultDownload = () => {
    if (onDownloadExcel) {
      onDownloadExcel();
      return;
    }

    const headerRow = normalizedColumns.map((c) => escapeCsvCell(c.label)).join(',');
    const dataRows = normalizedRows.map((r) =>
      r.map((val) => escapeCsvCell(val)).join(',')
    );

    const allCsvLines = [headerRow, ...dataRows];

    if (totalRowData) {
      allCsvLines.push(totalRowData.map((val) => escapeCsvCell(val)).join(','));
    }

    const csvContent = allCsvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanFilename = `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.download = cleanFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="drt-wrapper">
      {/* Top Header Bar */}
      <div className="drt-top-bar">
        <div className="drt-info-group">
          <div className="drt-info-item">
            <span className="drt-info-label">Report Type:</span>
            <span className="drt-info-value">{reportType}</span>
          </div>
          {durationLabel && (
            <div className="drt-info-item">
              <span className="drt-info-label">Duration:</span>
              <span className="drt-info-value">{durationLabel}</span>
            </div>
          )}
        </div>

        <div className="drt-actions">
          <button
            type="button"
            className="drt-btn-download"
            onClick={handleDefaultDownload}
          >
            Download in Excel
          </button>
          <button
            type="button"
            className="drt-btn-new"
            onClick={onNewReport}
          >
            New Report
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="drt-card">
        <div className="drt-table-scroll">
          <table className={`drt-table theme-${theme}`}>
            <thead>
              <tr>
                {normalizedColumns.map((col, idx) => (
                  <th
                    key={col.key || idx}
                    style={{ textAlign: col.align || 'left' }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {normalizedRows.length > 0 ? (
                normalizedRows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        style={{
                          textAlign: normalizedColumns[cellIdx]?.align || 'left',
                        }}
                        className={cellIdx === 0 ? 'drt-cell-primary' : ''}
                      >
                        {cell !== null && cell !== undefined ? String(cell) : ''}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={normalizedColumns.length || 1}
                    style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}
                  >
                    No data available for the selected period.
                  </td>
                </tr>
              )}

              {/* Total Row */}
              {totalRowData && (
                <tr className="drt-total-row">
                  {totalRowData.map((cell, cellIdx) => (
                    <td
                      key={`total_${cellIdx}`}
                      style={{
                        textAlign: normalizedColumns[cellIdx]?.align || 'left',
                      }}
                      className={cellIdx === 0 ? 'drt-total-label' : ''}
                    >
                      {cell !== null && cell !== undefined ? String(cell) : ''}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note footer */}
      {showNote && (
        <div className="drt-note-box">
          Note:
        </div>
      )}
    </div>
  );
}
