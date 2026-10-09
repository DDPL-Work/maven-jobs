import { useEffect, useState } from "react";
import {
  LuPlus,
  LuSearch,
  LuFilter,
  LuRefreshCw,
  LuPackage,
  LuTag,
  LuLayers,
  LuPencil,
  LuCircleCheck,
  LuCircleX,
  LuArchive,
  LuTriangleAlert,
  LuX,
  LuEye,
  LuTrash2,
  LuCircleAlert,
} from "react-icons/lu";
import {
  getCommercialProducts,
  createCommercialProduct,
  updateCommercialProduct,
  setCommercialProductStatus,
  deleteCommercialProduct,
  getCommercialOffers,
  createCommercialOffer,
  updateCommercialOffer,
  deleteCommercialOffer,
} from "../../services/adminApi";

export const STANDARD_PRODUCT_CODES = [
  { code: "SMB_JOB",          label: "SMB_JOB — SMB Job Posting" },
  { code: "HOT_VACANCY",      label: "HOT_VACANCY — Hot Vacancy Job" },
  { code: "INTERNSHIP_JOB",   label: "INTERNSHIP_JOB — Internship Job" },
  { code: "RESDEX",           label: "RESDEX — Max CV Access" },
  { code: "MIVITE",           label: "MIVITE — Max NVite Credits" },
  { code: "JOB_BOOSTER",      label: "JOB_BOOSTER — Job Booster" },
  { code: "AI_CREDIT",        label: "AI_CREDIT — AI Credits" },
  { code: "RESDEX_SEAT",      label: "RESDEX_SEAT — ResDex User Seat" },
  { code: "JOB_POSTING_SEAT", label: "JOB_POSTING_SEAT — Job Posting User Seat" },
];

// Auto-fill defaults per product code: category, productType, unit, and form labels
export const PRODUCT_CODE_DEFAULTS = {
  SMB_JOB:          { name: "SMB Job Posting",            category: "JOB_POSTING",   productType: "CREDIT_BASED", unit: "Job",          unitLabel: "Job Unit",         priceLabel: "Per SMB Job Post Price (\u20b9)" },
  HOT_VACANCY:      { name: "Hot Vacancy Job",            category: "JOB_POSTING",   productType: "CREDIT_BASED", unit: "Job",          unitLabel: "Job Unit",         priceLabel: "Per Hot Vacancy Post Price (\u20b9)" },
  INTERNSHIP_JOB:   { name: "Internship Job",             category: "JOB_POSTING",   productType: "CREDIT_BASED", unit: "Job",          unitLabel: "Job Unit",         priceLabel: "Per Internship Post Price (\u20b9)" },
  JOB_POSTING:      { name: "Standard Job Posting",       category: "JOB_POSTING",   productType: "CREDIT_BASED", unit: "Job",          unitLabel: "Job Unit",         priceLabel: "Per Job Post Price (\u20b9)" },
  RESDEX:           { name: "Max CV Access",              category: "RESUME_SEARCH", productType: "CREDIT_BASED", unit: "Resume View",  unitLabel: "Resume View Unit", priceLabel: "Per Resume View Price (\u20b9)" },
  AI_CREDIT:        { name: "AI Credits",                 category: "AI",            productType: "CREDIT_BASED", unit: "AI Use",       unitLabel: "AI Credit Unit",   priceLabel: "Per AI Credit Price (\u20b9)" },
  MIVITE:           { name: "Max NVite Credits",          category: "MIVITES",       productType: "CREDIT_BASED", unit: "Invite",       unitLabel: "Invite Unit",      priceLabel: "Per Invite Price (\u20b9)" },
  JOB_BOOSTER:      { name: "Job Booster",                category: "ADD_ONS",       productType: "CREDIT_BASED", unit: "Boost",        unitLabel: "Boost Unit",       priceLabel: "Per Boost Price (\u20b9)" },
  RESDEX_SEAT:      { name: "ResDex User Seat",           category: "USER_SEATS",    productType: "SEAT_BASED",   unit: "Seat",         unitLabel: "Seat Unit",        priceLabel: "Per ResDex Seat Price (\u20b9)" },
  JOB_POSTING_SEAT: { name: "Job Posting User Seat",      category: "USER_SEATS",    productType: "SEAT_BASED",   unit: "Seat",         unitLabel: "Seat Unit",        priceLabel: "Per Job Posting Seat Price (\u20b9)" },
};

export default function CommercialProductsPage() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isCustomProductCode, setIsCustomProductCode] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [productType, setProductType] = useState("");
  const [status, setStatus] = useState("");

  // Drawers / Modals
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    code: "",
    category: "JOB_POSTING",
    productType: "CREDIT_BASED",
    unit: "Job",
    validity: 30,
    validityUnit: "DAYS",
    allowStandalone: true,
    defaultPrice: "",
    discount: 0,
    discountPercent: 0,
    taxType: "IGST",
    igstRate: 18,
    cgstRate: 0,
    sgstRate: 0,
    taxPercent: 18,
    minQuantity: 1,
    maxQuantity: 10000,
    autoRenewalAllowed: false,
    description: "",
  });

  // Offers Modal State
  const [managingOffersProduct, setManagingOffersProduct] = useState(null);
  const [offersList, setOffersList] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerForm, setOfferForm] = useState({
    sku: "",
    name: "",
    quantity: 5,
    price: 1000,
    validity: 30,
    discountPercent: 0,
    discount: 0,
    taxType: "IGST",
    igstRate: 18,
    cgstRate: 0,
    sgstRate: 0,
    taxPercent: 18,
    isPopular: false,
    description: "",
  });

  // Custom UI Dialog / Alert / Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "danger", // "danger" | "warning" | "info"
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    isAlertOnly: false,
    onConfirm: null,
  });

  const showAlert = (message, title = "Notification") => {
    setConfirmModal({
      isOpen: true,
      type: "info",
      title,
      message: String(message || ""),
      confirmText: "Okay",
      cancelText: "",
      isAlertOnly: true,
      onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const showConfirm = ({
    title = "Confirm Action",
    message = "",
    type = "danger",
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
  }) => {
    setConfirmModal({
      isOpen: true,
      type,
      title,
      message: String(message || ""),
      confirmText,
      cancelText,
      isAlertOnly: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        if (onConfirm) await onConfirm();
      },
    });
  };

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCommercialProducts({
        search,
        category,
        productType,
        status,
      });
      if (res.success) {
        setProducts(res.products || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [category, productType, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProducts();
  };

  // Open Create Product Drawer
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setIsCustomProductCode(false);
    setProductForm({
      name: "",
      code: "",
      category: "JOB_POSTING",
      productType: "CREDIT_BASED",
      unit: "Job",
      validity: 30,
      validityUnit: "DAYS",
      allowStandalone: true,
      defaultPrice: "",
      discount: 0,
      discountPercent: 0,
      taxType: "IGST",
      igstRate: 18,
      cgstRate: 0,
      sgstRate: 0,
      taxPercent: 18,
      minQuantity: 1,
      maxQuantity: 10000,
      autoRenewalAllowed: false,
      description: "",
    });
    setIsProductDrawerOpen(true);
  };

  // Open Edit Product Drawer
  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setIsCustomProductCode(Boolean(prod.code && !STANDARD_PRODUCT_CODES.some((c) => c.code === prod.code)));
    const prodTaxType = prod.taxType || (Number(prod.cgstRate) > 0 || Number(prod.sgstRate) > 0 ? "CGST_SGST" : "IGST");
    const rawTaxPercent = Number(prod.taxPercent !== undefined ? prod.taxPercent : 18);
    const prodIgst = prodTaxType === "IGST" ? Number(prod.igstRate !== undefined ? prod.igstRate : rawTaxPercent) : 0;
    const prodCgst = prodTaxType === "CGST_SGST" ? Number(prod.cgstRate !== undefined ? prod.cgstRate : 9) : 0;
    const prodSgst = prodTaxType === "CGST_SGST" ? Number(prod.sgstRate !== undefined ? prod.sgstRate : 9) : 0;

    setProductForm({
      name: prod.name || "",
      code: prod.code || "",
      category: prod.category || "JOB_POSTING",
      productType: prod.productType || "CREDIT_BASED",
      unit: prod.unit || "Unit",
      validity: prod.validity !== undefined ? prod.validity : 30,
      validityUnit: prod.validityUnit || "DAYS",
      allowStandalone: Boolean(prod.allowStandalone),
      defaultPrice: prod.defaultPrice ?? prod.basePrice ?? "",
      discount: prod.discount ?? 0,
      discountPercent: prod.discountPercent ?? 0,
      taxType: prodTaxType,
      igstRate: prodIgst,
      cgstRate: prodCgst,
      sgstRate: prodSgst,
      taxPercent: prodIgst + prodCgst + prodSgst,
      minQuantity: prod.minQuantity || 1,
      maxQuantity: prod.maxQuantity || 10000,
      autoRenewalAllowed: Boolean(prod.autoRenewalAllowed),
      description: prod.description || "",
    });
    setIsProductDrawerOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const prodBasePrice = Number(productForm.defaultPrice || 0);
      const prodDiscount = Number(productForm.discount || 0);
      const prodTaxable = Math.max(0, prodBasePrice - prodDiscount);

      const isIgst = productForm.taxType === "IGST";
      const igstRate = isIgst ? Number(productForm.igstRate || 0) : 0;
      const cgstRate = !isIgst ? Number(productForm.cgstRate || 0) : 0;
      const sgstRate = !isIgst ? Number(productForm.sgstRate || 0) : 0;

      const igstAmount = Math.round((prodTaxable * igstRate) / 100);
      const cgstAmount = Math.round((prodTaxable * cgstRate) / 100);
      const sgstAmount = Math.round((prodTaxable * sgstRate) / 100);
      const prodTaxAmount = igstAmount + cgstAmount + sgstAmount;
      const prodTotal = Math.round(prodTaxable + prodTaxAmount);
      const totalTaxPercent = igstRate + cgstRate + sgstRate;

      const payload = {
        ...productForm,
        validity: Number(productForm.validity) || 30,
        validityUnit: "DAYS",
        defaultPrice: prodBasePrice,
        basePrice: prodBasePrice,
        discount: prodDiscount,
        discountPercent: prodBasePrice > 0 ? Math.round((prodDiscount / prodBasePrice) * 100) : 0,
        taxType: isIgst ? "IGST" : "CGST_SGST",
        igstRate,
        cgstRate,
        sgstRate,
        igstAmount,
        cgstAmount,
        sgstAmount,
        taxPercent: totalTaxPercent,
        taxAmount: prodTaxAmount,
        finalPrice: prodTotal,
      };

      if (editingProduct) {
        await updateCommercialProduct(editingProduct._id, payload);
        setSuccessMsg(`Product '${productForm.name}' updated successfully!`);
      } else {
        await createCommercialProduct(payload);
        setSuccessMsg(`Product '${productForm.name}' created successfully!`);
      }
      setIsProductDrawerOpen(false);
      loadProducts();
    } catch (err) {
      showAlert(err.message || "Failed to save product", "Save Failed");
    }
  };

  const handleToggleStatus = (product, newStatus) => {
    const isActivating = newStatus === "ACTIVE";
    showConfirm({
      title: `${isActivating ? "Activate" : "Deactivate"} Product`,
      message: `Are you sure you want to mark '${product.name}' (${product.code}) as ${newStatus}?`,
      type: isActivating ? "info" : "warning",
      confirmText: isActivating ? "Activate" : "Deactivate",
      onConfirm: async () => {
        try {
          await setCommercialProductStatus(product._id, newStatus);
          setSuccessMsg(`Product status updated to ${newStatus}`);
          loadProducts();
        } catch (err) {
          showAlert(err.message || "Failed to update product status", "Status Update Failed");
        }
      },
    });
  };

  const handleDeleteProduct = (product) => {
    showConfirm({
      title: "Delete Product",
      message: `Are you sure you want to permanently delete '${product.name}' (${product.code})?\n\nThis will also remove any standalone offers created for this product. If this product is in use by any published plans, deletion will be safely rejected.`,
      type: "danger",
      confirmText: "Delete Product",
      onConfirm: async () => {
        try {
          await deleteCommercialProduct(product._id);
          setSuccessMsg(`Product '${product.name}' deleted successfully!`);
          loadProducts();
        } catch (err) {
          showAlert(err.message || "Failed to delete product", "Cannot Delete Product");
        }
      },
    });
  };

  // Open Offers Manager Modal for a specific product
  const handleOpenOffers = async (prod) => {
    setManagingOffersProduct(prod);
    setOffersLoading(true);
    try {
      const res = await getCommercialOffers({ productId: prod._id });
      if (res.success) {
        setOffersList(res.offers || []);
      }
    } catch (err) {
      showAlert(err.message || "Failed to load offers", "Offers Load Failed");
    } finally {
      setOffersLoading(false);
    }
  };

  const handleOpenCreateOffer = () => {
    const prod = managingOffersProduct;
    const baseP = (prod.defaultPrice || 500) * 4;
    const prodTaxType = prod.taxType || "IGST";
    const prodIgst = prodTaxType === "IGST" ? Number(prod.igstRate !== undefined ? prod.igstRate : (prod.taxPercent ?? 18)) : 0;
    const prodCgst = prodTaxType === "CGST_SGST" ? Number(prod.cgstRate !== undefined ? prod.cgstRate : 9) : 0;
    const prodSgst = prodTaxType === "CGST_SGST" ? Number(prod.sgstRate !== undefined ? prod.sgstRate : 9) : 0;

    setOfferForm({
      sku: `${prod.code}_5`,
      name: `5 ${prod.unit}s Pack`,
      quantity: 5,
      price: baseP,
      validity: prod.validity || 30,
      discountPercent: 20,
      discount: Math.round((baseP * 20) / 100),
      taxType: prodTaxType,
      igstRate: prodIgst,
      cgstRate: prodCgst,
      sgstRate: prodSgst,
      taxPercent: prodIgst + prodCgst + prodSgst,
      isPopular: false,
      description: `Pack of 5 ${prod.unit}s for ${prod.name}`,
    });
    setIsOfferModalOpen(true);
  };

  const handleSaveOffer = async (e) => {
    e.preventDefault();
    try {
      const offerBasePrice = Number(offerForm.price || 0);
      const offerDiscountPct = Number(offerForm.discountPercent || 0);
      const offerDiscount = Math.round((offerBasePrice * offerDiscountPct) / 100);
      const offerTaxable = Math.max(0, offerBasePrice - offerDiscount);

      const isIgst = offerForm.taxType === "IGST";
      const igstRate = isIgst ? Number(offerForm.igstRate || 0) : 0;
      const cgstRate = !isIgst ? Number(offerForm.cgstRate || 0) : 0;
      const sgstRate = !isIgst ? Number(offerForm.sgstRate || 0) : 0;

      const igstAmount = Math.round((offerTaxable * igstRate) / 100);
      const cgstAmount = Math.round((offerTaxable * cgstRate) / 100);
      const sgstAmount = Math.round((offerTaxable * sgstRate) / 100);
      const offerTaxAmount = igstAmount + cgstAmount + sgstAmount;
      const offerTotal = Math.round(offerTaxable + offerTaxAmount);
      const totalTaxPercent = igstRate + cgstRate + sgstRate;

      await createCommercialOffer({
        ...offerForm,
        basePrice: offerBasePrice,
        price: offerBasePrice,
        discount: offerDiscount,
        discountPercent: offerDiscountPct,
        taxType: isIgst ? "IGST" : "CGST_SGST",
        igstRate,
        cgstRate,
        sgstRate,
        igstAmount,
        cgstAmount,
        sgstAmount,
        taxPercent: totalTaxPercent,
        taxAmount: offerTaxAmount,
        finalPrice: offerTotal,
        productId: managingOffersProduct._id,
      });
      setIsOfferModalOpen(false);
      handleOpenOffers(managingOffersProduct);
      loadProducts();
    } catch (err) {
      showAlert(err.message || "Failed to create offer", "Offer Creation Failed");
    }
  };

  const handleDeleteOffer = (offerId) => {
    showConfirm({
      title: "Archive Offer SKU",
      message: "Are you sure you want to archive this offer SKU from the catalog?",
      type: "danger",
      confirmText: "Archive Offer",
      onConfirm: async () => {
        try {
          await deleteCommercialOffer(offerId);
          handleOpenOffers(managingOffersProduct);
          loadProducts();
        } catch (err) {
          showAlert(err.message || "Failed to delete offer", "Delete Failed");
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Commercial Products
          </h1>
          <p className="text-sm text-slate-500">
            Define independent sellable capabilities, units, feature capabilities, and pricing SKUs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadProducts}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <LuRefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={handleOpenCreateProduct}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <LuPlus className="h-4 w-4" /> Create Product
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-700 hover:text-emerald-900">
            <LuX className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <LuSearch className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name, code, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="JOB_POSTING">Job Posting</option>
            <option value="MIVITES">MIvites</option>
            <option value="RESUME_SEARCH">Resume Search</option>
            <option value="AI">AI</option>
            <option value="USER_SEATS">User Seats</option>
            <option value="ADD_ONS">Add-ons</option>
          </select>

          <select
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="CREDIT_BASED">Credit Based</option>
            <option value="SEAT_BASED">Seat Based</option>
            <option value="FEATURE_BASED">Feature Based</option>
            <option value="USAGE_BASED">Usage Based</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5">Product & Code</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Type & Unit</th>
                <th className="px-4 py-3.5">Standalone</th>
                <th className="px-4 py-3.5">Single / Unit Price</th>
                <th className="px-4 py-3.5">Offers (SKUs)</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    {loading ? "Loading products..." : "No products found matching filters."}
                  </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod._id} className="transition hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{prod.name}</div>
                      <div className="font-mono text-[11px] text-slate-400 font-semibold">{prod.code}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {prod.category}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-800">{(prod.productType || "CREDIT_BASED").replace(/_/g, " ")}</div>
                      <div className="text-[11px] text-slate-400">Unit: {prod.unit || "Unit"} • <span className="font-semibold text-slate-600">{prod.validity || 30}d live</span></div>
                    </td>
                    <td className="px-4 py-4">
                      {prod.allowStandalone ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                          Bundle only
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      <div>₹{prod.defaultPrice?.toLocaleString() ?? 0}</div>
                      {prod.discount > 0 && (
                        <span className="text-[10px] text-emerald-600 block font-medium">
                          -₹{prod.discount.toLocaleString()} Discount
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 block font-normal">
                        GST: {prod.taxPercent ?? 18}% • Total: ₹{(prod.finalPrice || (Math.max(0, (prod.defaultPrice || 0) - (prod.discount || 0)) + Math.round((Math.max(0, (prod.defaultPrice || 0) - (prod.discount || 0)) * (prod.taxPercent ?? 18)) / 100))).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        per {prod.unit || "unit"}
                      </span>
                      {prod.category === "JOB_POSTING" && (
                        <span className="inline-block mt-1 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                          Drives /buy-online counter
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleOpenOffers(prod)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/60 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-100"
                      >
                        <LuTag className="h-3 w-3" />
                        {prod.activeOffersCount || 0} Offers
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          prod.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : prod.status === "INACTIVE"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {prod.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditProduct(prod)}
                          title="Edit Product"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        >
                          <LuPencil className="h-4 w-4" />
                        </button>
                        {prod.status === "ACTIVE" ? (
                          <button
                            onClick={() => handleToggleStatus(prod, "INACTIVE")}
                            title="Deactivate Product"
                            className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-50 transition"
                          >
                            <LuCircleX className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(prod, "ACTIVE")}
                            title="Activate Product"
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition"
                          >
                            <LuCircleCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteProduct(prod)}
                          title="Delete Product"
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                        >
                          <LuTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Product Drawer Modal */}
      {isProductDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingProduct ? "Edit Product" : "Create New Product"}
                </h2>
                <p className="text-xs text-slate-500">
                  Define commercial parameters, units, and configurable capabilities.
                </p>
              </div>
              <button
                onClick={() => setIsProductDrawerOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-5 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Product Code * (Unique)</label>
                  <select
                    required
                    value={isCustomProductCode ? "CUSTOM" : productForm.code}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "CUSTOM") {
                        setIsCustomProductCode(true);
                        setProductForm({ ...productForm, code: "" });
                      } else {
                        setIsCustomProductCode(false);
                        // Auto-fill name, category, productType, and unit from the defaults map
                        const defaults = PRODUCT_CODE_DEFAULTS[val] || {};
                        setProductForm({
                          ...productForm,
                          code: val,
                          ...(defaults.name        && { name:        defaults.name }),
                          ...(defaults.category    && { category:    defaults.category }),
                          ...(defaults.productType && { productType: defaults.productType }),
                          ...(defaults.unit        && { unit:        defaults.unit }),
                        });
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Select Product Code --</option>
                    {STANDARD_PRODUCT_CODES.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                    <option value="CUSTOM">Custom / Other Product Code...</option>
                  </select>

                  {isCustomProductCode && (
                    <input
                      type="text"
                      required
                      placeholder="ENTER CUSTOM PRODUCT CODE (e.g. CAMPUS_HIRE)"
                      value={productForm.code}
                      onChange={(e) => {
                        const rawUpper = e.target.value.toUpperCase().replace(/\s+/g, "_");
                        const words = rawUpper.split("_").filter(Boolean);
                        const suggestedName = words
                          .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
                          .join(" ");
                        setProductForm((prev) => ({
                          ...prev,
                          code: rawUpper,
                          ...(suggestedName ? { name: suggestedName } : {}),
                        }));
                      }}
                      className="mt-2 w-full rounded-xl border border-indigo-300 bg-indigo-50/30 px-3 py-2 text-xs font-mono font-bold uppercase text-indigo-950 focus:border-indigo-500 focus:outline-none"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hot Vacancy Job"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="JOB_POSTING">Job Posting</option>
                    <option value="MIVITES">MIvites</option>
                    <option value="RESUME_SEARCH">Resume Search</option>
                    <option value="AI">AI</option>
                    <option value="USER_SEATS">User Seats</option>
                    <option value="ADD_ONS">Add-ons</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Product Type *</label>
                  <select
                    value={productForm.productType}
                    onChange={(e) => setProductForm({ ...productForm, productType: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="CREDIT_BASED">Credit Based</option>
                    <option value="SEAT_BASED">Seat Based</option>
                  </select>
                </div>
                <div>
                  {/* Label derives from selected code, falls back to generic */}
                  <label className="block text-xs font-semibold text-slate-700">
                    {(PRODUCT_CODE_DEFAULTS[productForm.code]?.unitLabel || "Credit Unit")} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Job, Resume View, AI Use, Seat"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Live Duration (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    required
                    placeholder="e.g. 30"
                    value={productForm.validity}
                    onChange={(e) => setProductForm({ ...productForm, validity: e.target.value === "" ? "" : Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Live days on candidate portal
                  </span>
                </div>
              </div>

              {/* Commercial Pricing, Taxes & Discounts */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Commercial Pricing & Tax Configuration
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Applied per {productForm.unit || "unit"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    {/* Price label derives from selected code */}
                    <label className="block text-xs font-semibold text-slate-700">
                      {PRODUCT_CODE_DEFAULTS[productForm.code]?.priceLabel || "Base Unit Price (₹)"} *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 500"
                      value={productForm.defaultPrice}
                      onChange={(e) => setProductForm({ ...productForm, defaultPrice: e.target.value === "" ? "" : Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Discount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 50"
                      value={productForm.discount || ""}
                      onChange={(e) => setProductForm({ ...productForm, discount: e.target.value === "" ? 0 : Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Promotional deduction
                    </span>
                  </div>
                </div>

                {/* GST Taxation Mode: IGST vs (CGST + SGST) */}
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      GST Type & Distribution Rule
                    </label>
                    <span className="text-[10px] text-slate-500">
                      {productForm.taxType === "IGST" ? "Inter-State Supply" : "Intra-State Supply"}
                    </span>
                  </div>

                  {/* Mode Selector */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() =>
                        setProductForm({
                          ...productForm,
                          taxType: "IGST",
                          igstRate: productForm.igstRate > 0 ? productForm.igstRate : 18,
                          cgstRate: 0,
                          sgstRate: 0,
                          taxPercent: productForm.igstRate > 0 ? productForm.igstRate : 18,
                        })
                      }
                      className={`rounded-lg py-1.5 px-2 text-center transition border ${
                        productForm.taxType === "IGST"
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      IGST (Inter-State)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setProductForm({
                          ...productForm,
                          taxType: "CGST_SGST",
                          igstRate: 0,
                          cgstRate: productForm.cgstRate > 0 ? productForm.cgstRate : 9,
                          sgstRate: productForm.sgstRate > 0 ? productForm.sgstRate : 9,
                          taxPercent: (productForm.cgstRate > 0 ? productForm.cgstRate : 9) + (productForm.sgstRate > 0 ? productForm.sgstRate : 9),
                        })
                      }
                      className={`rounded-lg py-1.5 px-2 text-center transition border ${
                        productForm.taxType === "CGST_SGST"
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      CGST + SGST (Intra-State)
                    </button>
                  </div>

                  {/* Tax Rate Inputs with Mutual Exclusion Auto-Zero */}
                  {productForm.taxType === "IGST" ? (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-indigo-900">
                          IGST Rate (%) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={productForm.igstRate}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : Number(e.target.value);
                            setProductForm({
                              ...productForm,
                              taxType: "IGST",
                              igstRate: val,
                              cgstRate: 0,
                              sgstRate: 0,
                              taxPercent: val,
                            });
                          }}
                          className="mt-1 w-full rounded-lg border border-indigo-300 bg-indigo-50/30 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400">
                          CGST Rate (%)
                        </label>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs text-slate-400 font-mono">
                          0% (Auto 0)
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400">
                          SGST Rate (%)
                        </label>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs text-slate-400 font-mono">
                          0% (Auto 0)
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400">
                          IGST Rate (%)
                        </label>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs text-slate-400 font-mono">
                          0% (Auto 0)
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-indigo-900">
                          CGST Rate (%) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={productForm.cgstRate}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : Number(e.target.value);
                            setProductForm({
                              ...productForm,
                              taxType: "CGST_SGST",
                              igstRate: 0,
                              cgstRate: val,
                              taxPercent: val + Number(productForm.sgstRate || 0),
                            });
                          }}
                          className="mt-1 w-full rounded-lg border border-indigo-300 bg-indigo-50/30 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-indigo-900">
                          SGST Rate (%) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={productForm.sgstRate}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : Number(e.target.value);
                            setProductForm({
                              ...productForm,
                              taxType: "CGST_SGST",
                              igstRate: 0,
                              sgstRate: val,
                              taxPercent: Number(productForm.cgstRate || 0) + val,
                            });
                          }}
                          className="mt-1 w-full rounded-lg border border-indigo-300 bg-indigo-50/30 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Computation Summary Card */}
                {(() => {
                  const dp = Number(productForm.defaultPrice || 0);
                  const disc = Number(productForm.discount || 0);
                  const taxable = Math.max(0, dp - disc);
                  const isIgst = productForm.taxType === "IGST";
                  const igstR = isIgst ? Number(productForm.igstRate || 0) : 0;
                  const cgstR = !isIgst ? Number(productForm.cgstRate || 0) : 0;
                  const sgstR = !isIgst ? Number(productForm.sgstRate || 0) : 0;
                  const igstAmt = Math.round((taxable * igstR) / 100);
                  const cgstAmt = Math.round((taxable * cgstR) / 100);
                  const sgstAmt = Math.round((taxable * sgstR) / 100);
                  const taxAmt = igstAmt + cgstAmt + sgstAmt;
                  const total = Math.round(taxable + taxAmt);
                  return (
                    <div className="mt-2 rounded-xl border border-indigo-200/80 bg-indigo-50/70 p-3 text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-600">
                        <span>Base Price:</span>
                        <span className="font-semibold text-slate-800">₹{dp.toLocaleString()}</span>
                      </div>
                      {disc > 0 && (
                        <div className="flex justify-between text-emerald-700 font-medium">
                          <span>Discount:</span>
                          <span>- ₹{disc.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-600">
                        <span>Taxable Amount:</span>
                        <span>₹{taxable.toLocaleString()}</span>
                      </div>
                      {isIgst ? (
                        <div className="flex justify-between text-slate-600">
                          <span>IGST ({igstR}%):</span>
                          <span>+ ₹{igstAmt.toLocaleString()}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-slate-600">
                            <span>CGST ({cgstR}%):</span>
                            <span>+ ₹{cgstAmt.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>SGST ({sgstR}%):</span>
                            <span>+ ₹{sgstAmt.toLocaleString()}</span>
                          </div>
                        </>
                      )}
                      <div className="border-t border-indigo-200/80 pt-1.5 flex justify-between font-bold text-slate-900 text-sm">
                        <span>Total Payable / Unit:</span>
                        <span className="text-indigo-700">₹{total.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={productForm.allowStandalone}
                      onChange={(e) => setProductForm({ ...productForm, allowStandalone: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    Allow Standalone Purchase on /buy-online marketplace
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows="2"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Describe this product and who it is suitable for..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductDrawerOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  {editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offers Sub-Modal */}
      {managingOffersProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-700">
                    {managingOffersProduct.code}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    Standalone Offers & SKUs for {managingOffersProduct.name}
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Configure standalone pricing packages customers can buy directly without bundles.
                </p>
              </div>
              <button
                onClick={() => setManagingOffersProduct(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>

            {managingOffersProduct.category === "JOB_POSTING" && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-900">
                <LuTriangleAlert className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Dynamic Customer Counter Notice:</span>
                  <p className="mt-0.5 text-[11px] text-blue-800">
                    On the recruiter portal (<code className="font-mono bg-blue-100 px-1 py-0.5 rounded">/portal/buy-online</code>), Job Posting displays as two single-product cards (SMB Job & Hot Vacancy) powered by the Product's Single Post Price (<strong>₹{managingOffersProduct.defaultPrice?.toLocaleString()} / {managingOffersProduct.unit}</strong>) with a real-time quantity counter. Pre-packaged SKU bundles are bypassed in favor of dynamic quantities.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs font-medium text-slate-600">
                {offersList.length} offers configured
              </span>
              <button
                onClick={handleOpenCreateOffer}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <LuPlus className="h-3.5 w-3.5" /> + New Offer SKU
              </button>
            </div>

            {/* Offers Table */}
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 font-semibold text-slate-500">
                    <th className="px-4 py-2.5">SKU</th>
                    <th className="px-4 py-2.5">Offer Title</th>
                    <th className="px-4 py-2.5">Quantity</th>
                    <th className="px-4 py-2.5">Price & GST</th>
                    <th className="px-4 py-2.5">Validity</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {offersList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        {offersLoading ? "Loading offers..." : "No standalone offers created yet for this product."}
                      </td>
                    </tr>
                  ) : (
                    offersList.map((offer) => (
                      <tr key={offer._id}>
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">{offer.sku}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{offer.name}</td>
                        <td className="px-4 py-3 font-semibold text-indigo-700">{offer.quantity} {managingOffersProduct.unit}s</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">
                            ₹{(offer.finalPrice || (offer.price + Math.round((offer.price * (offer.taxPercent ?? 18)) / 100))).toLocaleString()} Total
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Base: ₹{offer.price?.toLocaleString()}
                            {offer.discountPercent > 0 && ` (-${offer.discountPercent}%)`}
                            {` • GST: ${offer.taxPercent ?? 18}%`}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{offer.validity} Days</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            {offer.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteOffer(offer._id)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                          >
                            Archive
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Inner modal to create new offer */}
            {isOfferModalOpen && (
              <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-3">
                  Create Standalone SKU Offer
                </h4>
                <form onSubmit={handleSaveOffer} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">SKU Code *</label>
                      <input
                        type="text"
                        required
                        value={offerForm.sku}
                        onChange={(e) => setOfferForm({ ...offerForm, sku: e.target.value.toUpperCase() })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">Offer Title *</label>
                      <input
                        type="text"
                        required
                        value={offerForm.name}
                        onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={offerForm.quantity}
                        onChange={(e) => setOfferForm({ ...offerForm, quantity: Number(e.target.value) })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">Base Price (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={offerForm.price}
                        onChange={(e) => setOfferForm({ ...offerForm, price: Number(e.target.value) })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">Discount (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={offerForm.discountPercent || 0}
                        onChange={(e) => setOfferForm({ ...offerForm, discountPercent: Number(e.target.value) })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  {/* GST Taxation Mode for Offers */}
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">GST Type & Distribution Rule</span>
                      <span className="text-slate-500">
                        {offerForm.taxType === "IGST" ? "Inter-State Supply" : "Intra-State Supply"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() =>
                          setOfferForm({
                            ...offerForm,
                            taxType: "IGST",
                            igstRate: offerForm.igstRate > 0 ? offerForm.igstRate : 18,
                            cgstRate: 0,
                            sgstRate: 0,
                            taxPercent: offerForm.igstRate > 0 ? offerForm.igstRate : 18,
                          })
                        }
                        className={`rounded-lg py-1 px-2 text-center text-xs transition border ${
                          offerForm.taxType === "IGST"
                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        IGST (Inter-State)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setOfferForm({
                            ...offerForm,
                            taxType: "CGST_SGST",
                            igstRate: 0,
                            cgstRate: offerForm.cgstRate > 0 ? offerForm.cgstRate : 9,
                            sgstRate: offerForm.sgstRate > 0 ? offerForm.sgstRate : 9,
                            taxPercent: (offerForm.cgstRate > 0 ? offerForm.cgstRate : 9) + (offerForm.sgstRate > 0 ? offerForm.sgstRate : 9),
                          })
                        }
                        className={`rounded-lg py-1 px-2 text-center text-xs transition border ${
                          offerForm.taxType === "CGST_SGST"
                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        CGST + SGST (Intra-State)
                      </button>
                    </div>

                    {offerForm.taxType === "IGST" ? (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div>
                          <label className="block text-[10px] font-bold text-indigo-900">
                            IGST Rate (%) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            required
                            value={offerForm.igstRate}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : Number(e.target.value);
                              setOfferForm({
                                ...offerForm,
                                taxType: "IGST",
                                igstRate: val,
                                cgstRate: 0,
                                sgstRate: 0,
                                taxPercent: val,
                              });
                            }}
                            className="mt-0.5 w-full rounded-md border border-indigo-300 bg-indigo-50/30 px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-400">
                            CGST Rate (%)
                          </label>
                          <div className="mt-0.5 rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs text-slate-400 font-mono">
                            0% (Auto 0)
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-400">
                            SGST Rate (%)
                          </label>
                          <div className="mt-0.5 rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs text-slate-400 font-mono">
                            0% (Auto 0)
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-400">
                            IGST Rate (%)
                          </label>
                          <div className="mt-0.5 rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs text-slate-400 font-mono">
                            0% (Auto 0)
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-indigo-900">
                            CGST Rate (%) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            required
                            value={offerForm.cgstRate}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : Number(e.target.value);
                              setOfferForm({
                                ...offerForm,
                                taxType: "CGST_SGST",
                                igstRate: 0,
                                cgstRate: val,
                                taxPercent: val + Number(offerForm.sgstRate || 0),
                              });
                            }}
                            className="mt-0.5 w-full rounded-md border border-indigo-300 bg-indigo-50/30 px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-indigo-900">
                            SGST Rate (%) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            required
                            value={offerForm.sgstRate}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : Number(e.target.value);
                              setOfferForm({
                                ...offerForm,
                                taxType: "CGST_SGST",
                                igstRate: 0,
                                sgstRate: val,
                                taxPercent: Number(offerForm.cgstRate || 0) + val,
                              });
                            }}
                            className="mt-0.5 w-full rounded-md border border-indigo-300 bg-indigo-50/30 px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">Validity (Days) *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={offerForm.validity}
                        onChange={(e) => setOfferForm({ ...offerForm, validity: Number(e.target.value) })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div className="flex items-center pt-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                        <input
                          type="checkbox"
                          checked={offerForm.isPopular}
                          onChange={(e) => setOfferForm({ ...offerForm, isPopular: e.target.checked })}
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        Mark as "Popular" SKU
                      </label>
                    </div>
                  </div>

                  {/* Live Calculation for Offer */}
                  {(() => {
                    const op = Number(offerForm.price || 0);
                    const discPct = Number(offerForm.discountPercent || 0);
                    const disc = Math.round((op * discPct) / 100);
                    const taxable = Math.max(0, op - disc);
                    const isIgst = offerForm.taxType === "IGST";
                    const igstR = isIgst ? Number(offerForm.igstRate || 0) : 0;
                    const cgstR = !isIgst ? Number(offerForm.cgstRate || 0) : 0;
                    const sgstR = !isIgst ? Number(offerForm.sgstRate || 0) : 0;
                    const igstAmt = Math.round((taxable * igstR) / 100);
                    const cgstAmt = Math.round((taxable * cgstR) / 100);
                    const sgstAmt = Math.round((taxable * sgstR) / 100);
                    const taxAmt = igstAmt + cgstAmt + sgstAmt;
                    const total = Math.round(taxable + taxAmt);
                    return (
                      <div className="rounded-lg border border-indigo-200 bg-white p-2.5 text-xs space-y-1">
                        <div className="flex justify-between text-slate-600">
                          <span>Base SKU Price:</span>
                          <span className="font-semibold text-slate-800">₹{op.toLocaleString()}</span>
                        </div>
                        {discPct > 0 && (
                          <div className="flex justify-between text-emerald-700 font-medium">
                            <span>Discount ({discPct}%):</span>
                            <span>- ₹{disc.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-600">
                          <span>Taxable Amount:</span>
                          <span>₹{taxable.toLocaleString()}</span>
                        </div>
                        {isIgst ? (
                          <div className="flex justify-between text-slate-600">
                            <span>IGST ({igstR}%):</span>
                            <span>+ ₹{igstAmt.toLocaleString()}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between text-slate-600">
                              <span>CGST ({cgstR}%):</span>
                              <span>+ ₹{cgstAmt.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>SGST ({sgstR}%):</span>
                              <span>+ ₹{sgstAmt.toLocaleString()}</span>
                            </div>
                          </>
                        )}
                        <div className="border-t border-slate-100 pt-1 flex justify-between font-bold text-slate-900">
                          <span>Total Payable Offer Price:</span>
                          <span className="text-indigo-700">₹{total.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsOfferModalOpen(false)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Save SKU Offer
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Custom UI Confirmation & Alert Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 transition-all">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  confirmModal.type === "danger"
                    ? "bg-rose-50 text-rose-600"
                    : confirmModal.type === "warning"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {confirmModal.type === "danger" ? (
                  <LuTrash2 className="h-6 w-6" />
                ) : confirmModal.type === "warning" ? (
                  <LuTriangleAlert className="h-6 w-6" />
                ) : (
                  <LuCircleAlert className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1 pt-0.5">
                <h3 className="text-base font-bold text-slate-900">
                  {confirmModal.title}
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              {!confirmModal.isAlertOnly && (
                <button
                  type="button"
                  onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  {confirmModal.cancelText || "Cancel"}
                </button>
              )}
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm transition ${
                  confirmModal.type === "danger"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : confirmModal.type === "warning"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
