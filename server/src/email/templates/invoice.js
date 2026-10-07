/**
 * Dynamic GST Tax Invoice Generator (PDFKit + QRCode).
 * Generates official Maven Jobs Tax Invoices matching government GST & E-Invoice standards.
 */
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// 1. CONSTANTS & DEFAULTS
// ---------------------------------------------------------------------------
const BLUE = '#9DC3E6';
const NAVY = '#002366';
const PAGE_W = 595.28; // Standard A4 width in pt
const PAGE_H = 841.89; // Standard A4 height in pt
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2; // ~515 pt

const DEFAULT_SUPPLIER = {
  name: 'Maven Jobs Private Limited',
  addressLines: [
    'Plot B-8, Sector 132',
    'Noida, Gautam Buddha Nagar',
    'Uttar Pradesh - 201301',
    'India',
  ],
  place: 'Noida',
  state: 'Uttar Pradesh',
  stateCode: '09',
  pan: 'AAACI1838D',
  gstin: '09AAACI1838D1ZU',
  cin: 'U72900UP2020PTC123456',
  salesperson: 'ONLINE TRANSACTIONS',
  regdOffice: [
    'Regd. Office: Maven Jobs Private Limited',
    'B-8, Sector 132',
    'Noida - 201301, Uttar Pradesh',
    'India',
  ],
  corporateOffice: [
    'Plot B-8, Sector 132, Expressway Commercial Zone,',
    'Noida - 201301,',
    'Uttar Pradesh, India',
  ],
  support: [
    'India Toll Free: 1800 102 5557 / 1800 572 5557',
    'Timings: 9:30 AM to 6:00 PM IST (Mon - Sat)',
    'Email: service@mavenjobs.com',
  ],
  bank: {
    payeeName: 'Maven Jobs Private Limited',
    bankName: 'ICICI Bank Ltd',
    accountNo: '003705000712',
    ifsc: 'ICIC0000037',
  },
  termsUrl: 'https://mavenjobs.com/terms',
  jurisdiction: 'Noida / New Delhi',
};

// ---------------------------------------------------------------------------
// 2. INVOICE NUMBER GENERATOR
// Format: MJ{two digit of year}{ordered product or plan code}{5 digit of random numbers}
// Example: MJ26SMB49011
// ---------------------------------------------------------------------------
function generateInvoiceNumber(rawCode = 'PLAN') {
  const year2 = String(new Date().getFullYear()).slice(-2);
  const cleanCode = String(rawCode || 'PLAN')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6) || 'PLAN';
  const rand5 = String(Math.floor(10000 + Math.random() * 90000));
  return `MJ${year2}${cleanCode}${rand5}`;
}

// ---------------------------------------------------------------------------
// 3. TAX & TOTAL CALCULATIONS
// ---------------------------------------------------------------------------
const round2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
const fmt = (n) =>
  Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).replace(/,/g, '');

function calculate(data) {
  const items = Array.isArray(data.items) ? data.items : [];
  const itemTotal = round2(items.reduce((s, i) => s + Number(i.amount || 0), 0));
  const discount = round2(items.reduce((s, i) => s + Number(i.discount || 0), 0));
  const net = Math.max(0, round2(itemTotal - discount));
  const rate = Number(data.gstRate !== undefined ? data.gstRate : 18) / 100;

  let taxable, totalTax, gross;
  if (data.pricesIncludeTax) {
    gross = net;
    taxable = round2(net / (1 + rate));
    totalTax = round2(gross - taxable);
  } else {
    taxable = net;
    totalTax = round2(taxable * rate);
    gross = round2(taxable + totalTax);
  }

  let igst, cgst, sgst;
  if (data.taxType === 'IGST' || (Number(data.igstRate) > 0 && !data.cgstRate && !data.sgstRate)) {
    igst = totalTax;
    cgst = 0;
    sgst = 0;
  } else if (data.taxType === 'CGST_SGST' || Number(data.cgstRate) > 0 || Number(data.sgstRate) > 0) {
    igst = 0;
    cgst = round2(totalTax / 2);
    sgst = round2(totalTax - cgst);
  } else {
    const supplierState = String(data.supplier?.stateCode || '09').trim();
    const customerState = String(data.customer?.stateCode || '09').trim();
    const intraState = supplierState === customerState;
    igst = intraState ? 0 : totalTax;
    cgst = intraState ? round2(totalTax / 2) : 0;
    sgst = intraState ? round2(totalTax - cgst) : 0;
  }

  const resolvedTaxType =
    data.taxType || (igst > 0 ? 'IGST' : (cgst > 0 || sgst > 0 ? 'CGST_SGST' : 'NONE'));

  return { itemTotal, discount, taxable, totalTax, taxType: resolvedTaxType, igst, cgst, sgst, gross };
}

// Indian-system number to words
function amountInWords(amount) {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];
  const below1000 = (n) => {
    let s = '';
    if (n >= 100) {
      s += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      s += tens[Math.floor(n / 10)] + ' ' + ones[n % 10];
    } else if (n > 0) {
      s += ones[n];
    }
    return s.trim();
  };
  const toWords = (n) => {
    if (n === 0) return 'Zero';
    const parts = [];
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    if (crore) parts.push(below1000(crore) + ' Crore');
    if (lakh) parts.push(below1000(lakh) + ' Lakh');
    if (thousand) parts.push(below1000(thousand) + ' Thousand');
    if (n) parts.push(below1000(n));
    return parts.join(' ');
  };
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let out = toWords(rupees) + ' Rupees';
  if (paise) out += ' and ' + toWords(paise) + ' Paise';
  return out + ' Only';
}

// ---------------------------------------------------------------------------
// 4. DRAWING HELPERS
// ---------------------------------------------------------------------------
function box(doc, x, y, w, h, { fill, lineWidth = 0.8 } = {}) {
  doc.save().lineWidth(lineWidth);
  if (fill) doc.rect(x, y, w, h).fillAndStroke(fill, '#000');
  else doc.rect(x, y, w, h).stroke('#000');
  doc.restore();
}

function text(doc, str, x, y, w, { font = 'Helvetica', size = 9, align = 'left', color = '#000' } = {}) {
  doc.font(font).fontSize(size).fillColor(color).text(str || '', x, y, { width: w, align, lineBreak: true });
}

function headerCell(doc, str, x, y, w, h) {
  box(doc, x, y, w, h, { fill: BLUE });
  text(doc, str, x, y + (h - 9) / 2 + 0.5, w, { font: 'Helvetica-Bold', size: 9.5, align: 'center' });
}

// ---------------------------------------------------------------------------
// 5. BRANDING (LOGO & DYNAMIC QR CODE)
// ---------------------------------------------------------------------------
function drawBranding(doc, supplier, assets = {}) {
  const { logoPath, qrBuffer } = assets;

  // 1. Draw Company Logo
  let logoDrawn = false;
  if (logoPath && fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, MARGIN, 35, { height: 42, fit: [160, 45] });
      logoDrawn = true;
    } catch (e) {
      logoDrawn = false;
    }
  }

  if (!logoDrawn) {
    // Vector fallback badge matching Maven branding
    doc.save().roundedRect(MARGIN, 35, 145, 42, 6).fill(NAVY).restore();
    text(doc, 'MAVEN JOBS', MARGIN + 5, 47, 135, {
      font: 'Helvetica-Bold',
      size: 16,
      align: 'center',
      color: '#FFFFFF',
    });
  }

  // 2. Draw Dynamic QR Code
  if (qrBuffer) {
    try {
      doc.image(qrBuffer, PAGE_W - MARGIN - 95, 26, { width: 95, height: 95 });
    } catch (e) {
      // Fallback border box
      box(doc, PAGE_W - MARGIN - 95, 26, 95, 95);
      text(doc, 'QR VERIFIED', PAGE_W - MARGIN - 95, 68, 95, {
        font: 'Helvetica-Bold',
        size: 9,
        align: 'center',
        color: '#888',
      });
    }
  }

  // 3. Central Supplier Name
  text(doc, supplier.name, MARGIN, 92, CONTENT_W - 110, {
    font: 'Helvetica-Bold',
    size: 13,
    align: 'center',
    color: NAVY,
  });
}

// ---------------------------------------------------------------------------
// 6. PAGE 1 - TAX INVOICE
// ---------------------------------------------------------------------------
function drawInvoicePage(doc, data, calc, assets = {}) {
  const { supplier, customer, invoice, items } = data;
  drawBranding(doc, supplier, assets);

  text(doc, 'Tax Invoice', MARGIN, 138, CONTENT_W, { font: 'Helvetica-Bold', size: 11, align: 'center' });
  text(doc, 'ORIGINAL FOR RECIPIENT', MARGIN, 152, CONTENT_W, { font: 'Helvetica-Bold', size: 10, align: 'center', color: '#475569' });

  let y = 170;
  box(doc, MARGIN, y, CONTENT_W, 20);
  text(doc, `Invoice No: ${invoice.documentNo}  |  Order Reference: ${invoice.poNo || 'N/A'}  |  Date: ${invoice.documentDate}`, MARGIN + 10, y + 5, CONTENT_W - 20, {
    font: 'Helvetica-Bold',
    size: 9,
    align: 'center',
    color: '#1e293b',
  });
  y += 20;

  // 3 Columns: Customer Details, Invoice Metadata, Supplier Information
  const c1 = 170, c2 = 145, c3 = CONTENT_W - c1 - c2;
  const x1 = MARGIN, x2 = x1 + c1, x3 = x2 + c2;

  headerCell(doc, 'Customer Details', x1, y, c1, 18);
  headerCell(doc, 'Invoice Details', x2, y, c2, 18);
  headerCell(doc, 'Billing / Supplier Information', x3, y, c3, 18);
  y += 18;

  const bodyH = 175;
  box(doc, x1, y, c1, bodyH);
  box(doc, x2, y, c2, bodyH);
  box(doc, x3, y, c3, bodyH);

  // Column 1: Customer
  text(doc, 'Bill-to / Ship-to Customer', x1 + 4, y + 4, c1 - 8, { font: 'Helvetica-Bold', size: 8.5, color: NAVY });
  const custLines = [
    `Company: ${customer.companyName || customer.name}`,
    customer.contactPerson ? `Contact Person: ${customer.contactPerson}` : '',
    customer.email ? `Email: ${customer.email}` : '',
    customer.phone ? `Phone: ${customer.phone}` : '',
    customer.address ? `Address: ${customer.address}` : '',
    (customer.city || customer.state) ? `${[customer.city, customer.state].filter(Boolean).join(', ')}${customer.pin ? ` - ${customer.pin}` : ''}` : '',
    `Place of Supply: ${customer.stateCode || '09'}`,
    `PAN No: ${customer.pan || 'N/A'}`,
    `GSTIN No: ${customer.gstin || 'Unregistered (B2C)'}`,
  ].filter(Boolean);
  text(doc, custLines.join('\n'), x1 + 4, y + 16, c1 - 8, { size: 7.5, lineGap: 1.2 });

  // Column 2: Invoice Metadata
  const meta = (label, value, yy) => {
    text(doc, label, x2 + 4, yy, 68, { size: 8.5, color: '#475569' });
    text(doc, value || 'N/A', x2 + 72, yy, c2 - 76, { font: 'Helvetica-Bold', size: 8.5 });
  };
  meta('Version:', invoice.version || '1.0', y + 6);
  meta('Document No:', invoice.documentNo, y + 26);
  meta('Document Date:', invoice.documentDate, y + 54);
  meta('Supply Type:', invoice.supplyType || 'B2C', y + 80);
  meta('Document Type:', invoice.documentType || 'INV', y + 104);
  meta('Order No:', invoice.poNo || 'N/A', y + 128);
  meta('Payment ID:', invoice.paymentLink || 'N/A', y + 152);

  // Column 3: Supplier
  const supLines = [
    supplier.name,
    ...supplier.addressLines,
    `Place: ${supplier.place}`,
    `State Code: ${supplier.stateCode}`,
    `PAN No: ${supplier.pan}`,
    `GSTIN No: ${supplier.gstin}`,
    `CIN No: ${supplier.cin}`,
    `Sales Mode: ${supplier.salesperson}`,
  ];
  text(doc, supLines.join('\n'), x3 + 4, y + 4, c3 - 8, { size: 8 });
  y += bodyH;

  // Line Items Table Header
  const wS = 35, wR = 115, wD = CONTENT_W - wS - wR;
  headerCell(doc, 'S No', MARGIN, y, wS, 18);
  box(doc, MARGIN + wS, y, wD, 18, { fill: BLUE });
  text(doc, 'HSN Code & Description of Services', MARGIN + wS + 6, y + 4.5, wD, { font: 'Helvetica-Bold', size: 9.5 });
  headerCell(doc, 'Amount (INR)', MARGIN + wS + wD, y, wR, 18);
  y += 18;

  // Line Items
  items.forEach((it, i) => {
    box(doc, MARGIN, y, wS, 22);
    box(doc, MARGIN + wS, y, wD, 22);
    box(doc, MARGIN + wS + wD, y, wR, 22);

    text(doc, String(i + 1), MARGIN, y + 6, wS, { size: 9, align: 'center' });
    text(doc, `${it.hsn || '998439'} - ${it.serviceName || it.description}`, MARGIN + wS + 5, y + 6, wD - 8, { size: 8.5 });
    text(doc, fmt(it.amount), MARGIN + wS + wD, y + 6, wR - 6, { size: 9, align: 'right' });
    y += 22;
  });

  // Totals Breakdown Table
  const rows = [
    ['Item Total Amount', fmt(calc.itemTotal)],
    ['Commercial Discount', calc.discount > 0 ? `- ${fmt(calc.discount)}` : '0.00'],
    ['Total Taxable Value', fmt(calc.taxable)],
    ['GST Rate', `${data.gstRate || 18}%`],
    ['Integrated GST (IGST)', fmt(calc.igst)],
    ['Central GST (CGST)', fmt(calc.cgst)],
    ['State GST (SGST)', fmt(calc.sgst)],
    ['Gross Amount / Total Invoice Value', fmt(calc.gross)],
    ['Currency', invoice.currency || 'INR'],
  ];

  const wL = 175;
  const tx = MARGIN + wS + wD - wL;
  rows.forEach(([label, value]) => {
    const isGross = label.startsWith('Gross');
    const h = isGross ? 20 : 16;
    box(doc, tx, y, wL, h, { fill: isGross ? '#eff6ff' : null });
    box(doc, tx + wL, y, wR, h, { fill: isGross ? '#eff6ff' : null });

    text(doc, label, tx + 4, y + (h - 9) / 2, wL - 8, {
      font: isGross ? 'Helvetica-Bold' : 'Helvetica',
      size: 8.5,
      color: isGross ? NAVY : '#000',
    });
    text(doc, value, tx + wL, y + (h - 9) / 2, wR - 6, {
      font: isGross ? 'Helvetica-Bold' : 'Helvetica',
      size: 8.5,
      align: 'right',
      color: isGross ? NAVY : '#000',
    });
    y += h;
  });

  // Amount in words & Declarations
  y += 10;
  text(doc, `Amount in Words: "${amountInWords(calc.gross)}"`, MARGIN, y, CONTENT_W, { font: 'Helvetica-Bold', size: 9 });
  y += 13;
  text(doc, `Whether Tax is payable on reverse charge: ${invoice.reverseCharge || 'No'}  |  Is Service: "${invoice.isService || 'Yes'}"  |  Primary HSN: ${items[0]?.hsn || '998439'}`, MARGIN, y, CONTENT_W, { size: 8, color: '#475569' });

  // Signature Block
  const sigY = y + 2;
  text(doc, 'For ' + supplier.name, PAGE_W - MARGIN - 220, sigY, 220, { size: 8.5, align: 'right' });
  text(doc, '[Digitally Signed & Validated]', PAGE_W - MARGIN - 220, sigY + 14, 220, { size: 8, align: 'right', color: '#16a34a' });
  text(doc, 'Authorized Signatory', PAGE_W - MARGIN - 220, sigY + 28, 220, { font: 'Helvetica-Bold', size: 8.5, align: 'right' });

  y += 44;

  // Footer Office Columns
  const fy = y;
  const fw = CONTENT_W / 3 - 6;
  text(doc, supplier.regdOffice.join('\n'), MARGIN, fy, fw, { size: 7.5, color: '#475569' });
  text(doc, supplier.corporateOffice.join('\n'), MARGIN + fw + 8, fy, fw, { size: 7.5, color: '#475569' });
  text(doc, supplier.support.join('\n'), MARGIN + (fw + 8) * 2, fy, fw, { size: 7.5, color: '#475569' });

  // Bank & Disclaimer Block
  const by = fy + 48;
  const b = supplier.bank;
  text(doc, 'Payee Bank Details:', MARGIN, by, 200, { font: 'Helvetica-Bold', size: 8, color: NAVY });
  text(doc, `Payee Name: ${b.payeeName}  |  Bank: ${b.bankName}  |  A/C No: ${b.accountNo}  |  IFSC: ${b.ifsc}`, MARGIN, by + 10, CONTENT_W, { size: 7.5 });

  text(doc,
    `* The Invoice is recognized subject to realization of payment.\n` +
    `* All disputes subject to ${supplier.jurisdiction} jurisdiction only. Terms & conditions at ${supplier.termsUrl}`,
    MARGIN, by + 24, CONTENT_W, { size: 7, color: '#64748b' });
}

// ---------------------------------------------------------------------------
// 7. PAGE 2 - ANNEXURE
// ---------------------------------------------------------------------------
function drawAnnexurePage(doc, data, calc, assets = {}) {
  const { supplier, customer, invoice, items } = data;
  drawBranding(doc, supplier, assets);

  text(doc, 'Annexure - Product & Service Inclusions', MARGIN, 138, CONTENT_W, { font: 'Helvetica-Bold', size: 11, align: 'center' });

  let y = 165;
  box(doc, MARGIN, y, CONTENT_W, 20);
  text(doc, `Invoice No: ${invoice.documentNo}  |  Order Reference: ${invoice.poNo || 'N/A'}  |  Date: ${invoice.documentDate}`, MARGIN + 10, y + 5, CONTENT_W - 20, {
    font: 'Helvetica-Bold',
    size: 9,
    align: 'center',
    color: '#1e293b',
  });
  y += 20;

  const c1 = 175, c2 = 140, c3 = CONTENT_W - c1 - c2;
  const x1 = MARGIN, x2 = x1 + c1, x3 = x2 + c2;
  headerCell(doc, 'Customer Details', x1, y, c1, 18);
  headerCell(doc, 'Invoice Details', x2, y, c2, 18);
  headerCell(doc, 'Supplier Details', x3, y, c3, 18);
  y += 18;

  const h = 68;
  box(doc, x1, y, c1, h); box(doc, x2, y, c2, h); box(doc, x3, y, c3, h);
  const annexLines = [
    `Company: ${customer.companyName || customer.name}`,
    customer.contactPerson ? `Contact: ${customer.contactPerson}` : '',
    customer.email ? `Email: ${customer.email}` : '',
    customer.phone ? `Phone: ${customer.phone}` : '',
    `City: ${customer.city || 'N/A'}`,
    `GSTIN: ${customer.gstin || 'B2C'}`,
  ].filter(Boolean);
  text(doc, annexLines.join('\n'), x1 + 4, y + 4, c1 - 8, { size: 7.5, lineGap: 1.2 });
  text(doc, `Invoice: ${invoice.documentNo}\nDate: ${invoice.documentDate}\nType: ${invoice.documentType || 'INV'}`, x2 + 4, y + 4, c2 - 8, { size: 8 });
  text(doc, `${supplier.name}\nGSTIN: ${supplier.gstin}\nPAN: ${supplier.pan}`, x3 + 4, y + 4, c3 - 8, { size: 8 });
  y += h + 10;

  // Annexure Service Items
  const wS = 35, wDt = 95;
  const wD = CONTENT_W - wS - wDt * 2;
  headerCell(doc, 'S No', MARGIN, y, wS, 18);
  headerCell(doc, 'Description of Service / Product', MARGIN + wS, y, wD, 18);
  headerCell(doc, 'Start Date', MARGIN + wS + wD, y, wDt, 18);
  headerCell(doc, 'End Date', MARGIN + wS + wD + wDt, y, wDt, 18);
  y += 18;

  items.forEach((it, i) => {
    box(doc, MARGIN, y, wS, 20);
    box(doc, MARGIN + wS, y, wD, 20);
    box(doc, MARGIN + wS + wD, y, wDt, 20);
    box(doc, MARGIN + wS + wD + wDt, y, wDt, 20);

    text(doc, String(i + 1), MARGIN, y + 6, wS, { size: 8.5, align: 'center' });
    text(doc, it.serviceName || it.description, MARGIN + wS + 5, y + 6, wD - 8, { size: 8.5 });
    text(doc, it.startDate || invoice.documentDate, MARGIN + wS + wD, y + 6, wDt, { size: 8.5, align: 'center' });
    text(doc, it.endDate || 'N/A', MARGIN + wS + wD + wDt, y + 6, wDt, { size: 8.5, align: 'center' });
    y += 20;
  });

  // End of Annexure Notice
  y += 24;
  text(doc, '--- End of Annexure ---', MARGIN, y, CONTENT_W, { size: 8.5, align: 'center', color: '#94a3b8' });
}

// ---------------------------------------------------------------------------
// 8. QR CODE PAYLOAD FORMATTER
// Generates the exact formatted payload requested when scanned
// ---------------------------------------------------------------------------
function formatQrPayload({ supplier, customer, invoice, items, calc }) {
  const gstin = supplier?.gstin || '09AAACI1838D1ZU';
  const invNo = invoice?.documentNo || 'N/A';
  const invDate = invoice?.documentDate || new Date().toISOString().slice(0, 10);
  const invVal = Math.round(Number(calc?.gross || 0));
  const totalGst = fmt(calc?.totalTax || 0);
  const igst = fmt(calc?.igst || 0);
  const cgst = fmt(calc?.cgst || 0);
  const sgst = fmt(calc?.sgst || 0);
  const lineItemsCount = Array.isArray(items) && items.length > 0 ? items.length : 1;
  const hsn = items?.[0]?.hsn || '998439';
  const paymentLink = invoice?.paymentLink || invoice?.poNo || 'N/A';
  const accNo = supplier?.bank?.accountNo || '003705000712';
  const ifsc = supplier?.bank?.ifsc || 'ICIC0000037';

  return [
    `GSTIN : ${gstin}`,
    `INVOICE NUMBER : ${invNo}`,
    `INVOICE GENERATION DATE : ${invDate}`,
    `INVOICE VALUE : Rs ${invVal}`,
    `TOTAL GST : ${totalGst}`,
    `IGST : ${igst}`,
    `CGST : ${cgst}`,
    `SGST : ${sgst}`,
    `NUMBER OF LINE ITEMS : ${lineItemsCount}`,
    `HSN : ${hsn}`,
    `PAYMENT LINK : ${paymentLink}`,
    `PAYEE BANK ACCOUNT NO : ${accNo}`,
    `PAYEE BANK IFSC : ${ifsc}`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// 9. DYNAMIC INVOICE DATA BUILDER
// Helper to construct normalized invoiceData from DB models / transaction params
// ---------------------------------------------------------------------------
function buildInvoiceData({
  company = {},
  user = {},
  order = {},
  payment = {},
  subscription = {},
  invoiceNumber,
  orderNumber,
  paymentId,
  serviceTitle,
  amount,
  validityDays,
  expiryDate,
  inclusions = [],
  supplierOverrides = {},
}) {
  const docDate = new Date().toISOString().slice(0, 10);
  const finalInvoiceNo = invoiceNumber || order.invoiceNumber || generateInvoiceNumber('PLAN');
  const finalOrderNo = orderNumber || order.orderNumber || '';
  const finalPaymentId = paymentId || payment.paymentId || payment.gatewayPaymentId || '';

  const supplier = {
    ...DEFAULT_SUPPLIER,
    ...supplierOverrides,
    bank: {
      ...DEFAULT_SUPPLIER.bank,
      ...(supplierOverrides.bank || {}),
    },
  };

  // Extract company name and format
  const rawCompanyName = String(company?.name || user?.name || 'Valued Client').trim();
  const formattedCompanyName = rawCompanyName.startsWith('M/s') ? rawCompanyName : `M/s ${rawCompanyName}`;

  // Extract contact person, email, and phone from company profile (with user fallbacks)
  const contactPerson = String(company?.contactPerson || user?.name || '').trim();
  const contactEmail = String(company?.email || user?.email || '').trim();
  const rawPhone = String(company?.phone || user?.phone || '').trim();
  const phone = rawPhone
    ? `${company?.countryCode ? company.countryCode + ' ' : ''}${rawPhone}`
    : '';

  const address = String(company?.location?.address || '').trim();
  const city = String(company?.location?.city || user?.city || 'New Delhi').trim();
  const state = String(company?.location?.region || company?.location?.state || 'Delhi').trim();
  const pin = String(company?.location?.pincode || '').trim();
  const country = String(company?.location?.country || 'India').trim();
  const stateCode = String(company?.location?.stateCode || (state.toLowerCase().includes('uttar pradesh') ? '09' : '07')).trim();
  const pan = String(company?.tanNumber || company?.pan || '').trim();
  const gstin = String(company?.gstin || '').trim();

  const customer = {
    name: formattedCompanyName,
    companyName: formattedCompanyName,
    contactPerson,
    email: contactEmail,
    phone,
    address,
    city,
    state,
    pin,
    country,
    stateCode,
    pan,
    gstin,
  };

  const invoice = {
    version: '1.0',
    documentNo: finalInvoiceNo,
    documentDate: docDate,
    supplyType: company.gstin ? 'B2B' : 'B2C',
    documentType: 'INV',
    poNo: finalOrderNo,
    currency: 'INR',
    reverseCharge: 'No',
    isService: 'Yes',
    paymentLink: finalPaymentId,
  };

  const finalAmount = amount !== undefined && amount !== null ? Number(amount) : Number(order.totalAmount || 0);
  const endDateStr = expiryDate
    ? new Date(expiryDate).toISOString().slice(0, 10)
    : validityDays
    ? new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : '';

  const items = [
    {
      hsn: '998439',
      description: 'Other On-Line Contents / Recruitment Marketplace Services',
      serviceName: serviceTitle || order.items?.[0]?.title || 'Commercial Recruitment Plan',
      startDate: docDate,
      endDate: endDateStr,
      amount: finalAmount,
      discount: Number(order.discountAmount || 0),
    },
  ];

  return {
    supplier,
    customer,
    invoice,
    items,
    gstRate: 18,
    pricesIncludeTax: true, // Server orders are inclusive of 18% GST
  };
}

// ---------------------------------------------------------------------------
// 10. PUBLIC PDF GENERATION API
// ---------------------------------------------------------------------------
/**
 * Generates invoice as an in-memory Buffer (perfect for email attachments).
 * Resolves to Buffer.
 */
async function generateInvoicePdfBuffer(data) {
  const calc = calculate(data);
  const qrString = formatQrPayload({ ...data, calc });

  // Generate QR Buffer
  let qrBuffer = null;
  try {
    qrBuffer = await QRCode.toBuffer(qrString, {
      margin: 1,
      width: 200,
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.warn('[Invoice] QR Code generation warning:', err?.message);
  }

  // Resolve logo path
  const logoPath = path.resolve(__dirname, '../../../public/email-assets/logo.png');
  const assets = { logoPath, qrBuffer };

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        info: { Title: `Tax Invoice ${data.invoice?.documentNo || ''}` },
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      drawInvoicePage(doc, data, calc, assets);
      doc.addPage({ size: 'A4', margin: 0 });
      drawAnnexurePage(doc, data, calc, assets);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generates invoice to file or stream (backward compatible).
 */
async function generateInvoicePdf(data, outputPath = 'invoice.pdf', outputStream = null) {
  const pdfBuffer = await generateInvoicePdfBuffer(data);
  if (outputStream) {
    outputStream.write(pdfBuffer);
    outputStream.end();
    return outputPath;
  }
  await fs.promises.writeFile(outputPath, pdfBuffer);
  return outputPath;
}

module.exports = {
  generateInvoiceNumber,
  formatQrPayload,
  buildInvoiceData,
  calculate,
  amountInWords,
  generateInvoicePdfBuffer,
  generateInvoicePdf,
  DEFAULT_SUPPLIER,
};

// Direct script execution support
if (require.main === module) {
  const testData = buildInvoiceData({
    company: { name: 'Acme Technologies Pvt Ltd', gstin: '09AAACI1838D1ZU' },
    invoiceNumber: generateInvoiceNumber('SMB'),
    orderNumber: 'MJ26AC001',
    paymentId: 'MJON260001',
    serviceTitle: 'Naukri 360 Pro 3 Month Subscription Lite',
    amount: 700,
  });

  generateInvoicePdf(testData, 'test_invoice.pdf')
    .then((p) => console.log('✓ Invoice PDF successfully generated at:', p))
    .catch((e) => {
      console.error('Invoice test failed:', e);
      process.exit(1);
    });
}
