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

export default function CommercialProductsPage() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
    allowStandalone: true,
    defaultPrice: 0,
    validity: 30,
    validityUnit: "DAYS",
    minQuantity: 1,
    maxQuantity: 10000,
    autoRenewalAllowed: false,
    description: "",
    features: [],
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
    setProductForm({
      name: "",
      code: "",
      category: "JOB_POSTING",
      productType: "CREDIT_BASED",
      unit: "Job",
      allowStandalone: true,
      defaultPrice: 0,
      validity: 30,
      validityUnit: "DAYS",
      minQuantity: 1,
      maxQuantity: 10000,
      autoRenewalAllowed: false,
      description: "",
      features: [
        { key: "companyLogo", name: "Company Logo", enabled: false, value: true },
        { key: "candidateAlerts", name: "Candidate Alerts", enabled: false, value: true },
        { key: "topSearchPlacement", name: "Top Search Placement", enabled: false, value: true },
        { key: "multipleCities", name: "Multiple Cities Support", enabled: false, value: 3 },
        { key: "extendedDescription", name: "Extended Job Description", enabled: false, value: true },
      ],
    });
    setIsProductDrawerOpen(true);
  };

  // Open Edit Product Drawer
  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      code: prod.code,
      category: prod.category,
      productType: prod.productType,
      unit: prod.unit,
      allowStandalone: prod.allowStandalone,
      defaultPrice: prod.defaultPrice,
      validity: prod.validity,
      validityUnit: prod.validityUnit || "DAYS",
      minQuantity: prod.minQuantity || 1,
      maxQuantity: prod.maxQuantity || 10000,
      autoRenewalAllowed: Boolean(prod.autoRenewalAllowed),
      description: prod.description || "",
      features: Array.isArray(prod.features) && prod.features.length > 0 ? prod.features : [
        { key: "companyLogo", name: "Company Logo", enabled: false, value: true },
        { key: "candidateAlerts", name: "Candidate Alerts", enabled: false, value: true },
        { key: "topSearchPlacement", name: "Top Search Placement", enabled: false, value: true },
      ],
    });
    setIsProductDrawerOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateCommercialProduct(editingProduct._id, productForm);
        setSuccessMsg(`Product '${productForm.name}' updated successfully!`);
      } else {
        await createCommercialProduct(productForm);
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
    setOfferForm({
      sku: `${prod.code}_5`,
      name: `5 ${prod.unit}s Pack`,
      quantity: 5,
      price: (prod.defaultPrice || 500) * 4,
      validity: prod.validity || 30,
      discountPercent: 20,
      isPopular: false,
      description: `Pack of 5 ${prod.unit}s for ${prod.name}`,
    });
    setIsOfferModalOpen(true);
  };

  const handleSaveOffer = async (e) => {
    e.preventDefault();
    try {
      await createCommercialOffer({
        ...offerForm,
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

  const toggleFeature = (index) => {
    const updated = [...productForm.features];
    updated[index].enabled = !updated[index].enabled;
    setProductForm({ ...productForm, features: updated });
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
                      <div className="font-medium text-slate-800">{prod.productType.replace("_", " ")}</div>
                      <div className="text-[11px] text-slate-400">Unit: {prod.unit}</div>
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
                      ₹{prod.defaultPrice?.toLocaleString()}
                      <span className="text-[10px] text-slate-400 block font-normal">
                        per {prod.unit || "unit"} • {prod.validity} {prod.validityUnit?.toLowerCase()}
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Product Code * (Unique)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HOT_VACANCY"
                    value={productForm.code}
                    onChange={(e) => setProductForm({ ...productForm, code: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-semibold uppercase text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                    <option value="FEATURE_BASED">Feature Based</option>
                    <option value="USAGE_BASED">Usage Based</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Credit Unit *</label>
                  <input
                    type="text"
                    required
                    placeholder="Job, Resume View, AI Use"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Single Post / Unit Price (₹) *
                  </label>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Drives dynamic quantity counter on /buy-online
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={productForm.defaultPrice}
                    onChange={(e) => setProductForm({ ...productForm, defaultPrice: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={productForm.validity}
                    onChange={(e) => setProductForm({ ...productForm, validity: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={productForm.allowStandalone}
                      onChange={(e) => setProductForm({ ...productForm, allowStandalone: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    Allow Standalone Purchase
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

              {/* Configurable Capabilities / Feature Matrix */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Configurable Product Features / Capabilities
                </h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  These capabilities will automatically be granted when this product is purchased.
                </p>

                <div className="space-y-2">
                  {productForm.features.map((feat, idx) => (
                    <div
                      key={feat.key}
                      onClick={() => toggleFeature(idx)}
                      className={`flex items-center justify-between rounded-xl border p-2.5 text-xs cursor-pointer transition ${
                        feat.enabled
                          ? "border-indigo-200 bg-indigo-50/70 text-indigo-900"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100/60"
                      }`}
                    >
                      <span className="font-semibold">{feat.name}</span>
                      <span className="text-[11px] font-bold">
                        {feat.enabled ? "✓ Enabled" : "✗ Disabled"}
                      </span>
                    </div>
                  ))}
                </div>
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
                    <th className="px-4 py-2.5">Price</th>
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
                        <td className="px-4 py-3 font-bold text-slate-900">₹{offer.price?.toLocaleString()}</td>
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

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={offerForm.quantity}
                        onChange={(e) => setOfferForm({ ...offerForm, quantity: Number(e.target.value) })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">Price (₹) *</label>
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
                      <label className="block text-[11px] font-semibold text-slate-700">Validity (Days)</label>
                      <input
                        type="number"
                        min="1"
                        value={offerForm.validity}
                        onChange={(e) => setOfferForm({ ...offerForm, validity: Number(e.target.value) })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

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
