import { useState, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const A4_WIDTH_PX = 595;
const A4_HEIGHT_PX = 842;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const CAPTURE_SCALE = 3;

export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const exportRef = useRef(null);

  const capturePage = useCallback(async (element) => {
    return html2canvas(element, {
      scale: CAPTURE_SCALE,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      width: A4_WIDTH_PX,
      height: A4_HEIGHT_PX,
      onclone: (doc) => {
        const allEls = doc.querySelectorAll('*');
        allEls.forEach((el) => {
          if (el instanceof HTMLElement) {
            el.style.setProperty('--rb-overflow', 'visible');
          }
        });
      },
    });
  }, []);

  const exportPdf = useCallback(async (pageElements, filename = 'resume.pdf') => {
    setIsExporting(true);
    setError(null);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let i = 0; i < pageElements.length; i++) {
        const canvas = await capturePage(pageElements[i]);
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, 'FAST');
      }

      pdf.save(filename);
    } catch (err) {
      const msg = err.message || 'PDF generation failed';
      setError(msg);
      throw err;
    } finally {
      setIsExporting(false);
    }
  }, [capturePage]);

  return { exportPdf, isExporting, error, exportRef };
}
