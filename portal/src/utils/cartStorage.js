/**
 * cartStorage.js
 * Persistent client-side cart for employer products, plans, and add-ons using localStorage.
 * Keeps track of purchase attempts when a guest or employer user tries to buy but stops before completion.
 */

const CART_STORAGE_KEY = "maven_employer_cart";

/**
 * Safely retrieves all items currently in the cart from localStorage.
 * @returns {Array<Object>}
 */
export function getCartItems() {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("[cartStorage] Failed to parse cart from localStorage:", err);
    return [];
  }
}

/**
 * Computes totals (subtotal, tax, final total, count) for the cart.
 * @param {Array<Object>} [items] Optional cart items list, defaults to reading from storage.
 * @returns {{ subtotal: number, taxTotal: number, total: number, count: number }}
 */
export function getCartTotals(items = null) {
  const cart = items || getCartItems();
  let subtotal = 0;
  let taxTotal = 0;
  let total = 0;

  for (const item of cart) {
    const qty = Math.max(1, Number(item.quantity || 1));
    const itemTotal = Number(item.total ?? item.price ?? 0);
    const itemTax = Number(item.taxAmount ?? 0);
    const itemBase = Number(item.basePrice ?? (itemTotal - itemTax));

    subtotal += itemBase > 0 ? itemBase : itemTotal;
    taxTotal += itemTax;
    total += itemTotal;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    total: Math.round(total * 100) / 100,
    count: cart.length,
  };
}

/**
 * Dispatches a custom window event so all header icons and listeners across components update immediately.
 * @param {Array<Object>} items
 */
function broadcastCartUpdate(items) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent("employer-cart-updated", {
        detail: { items, totals: getCartTotals(items) },
      })
    );
  } catch (_) {}
}

/**
 * Adds an item or updates an existing item in the employer cart.
 * Used when a guest or employer user initiates checkout on a plan or product.
 * @param {Object} item The plan, product, or offer object.
 * @param {string} [itemType="PLAN"] "PLAN" | "PRODUCT" | "STANDALONE"
 * @returns {Array<Object>} The updated cart array.
 */
export function addToCart(item, itemType = "PLAN") {
  if (!item || typeof item !== "object") return getCartItems();

  const cart = getCartItems();
  const rawId = item._id || item.id || item.code || item.name || `cart_${Date.now()}`;
  const itemId = String(rawId);

  // Normalize pricing attributes
  const pricing = item.pricing || {};
  const quantity = Math.max(1, Number(item.quantity || 1));
  const basePrice = Number(pricing.base ?? item.basePrice ?? item.defaultPrice ?? item.price ?? 0);
  const discount = Number(pricing.discount ?? item.discount ?? 0);
  const currentPrice = Number(pricing.currentPrice ?? item.price ?? item.defaultPrice ?? 0);
  const taxPercent = Number(pricing.taxPercent ?? item.taxPercent ?? 18);
  const taxAmount = Number(pricing.taxAmount ?? item.taxAmount ?? 0);
  const total = Number(pricing.total ?? item.total ?? item.finalPrice ?? currentPrice);

  const normalizedItem = {
    id: itemId,
    _id: item._id ? String(item._id) : itemId,
    name: item.name || item.title || "Plan / Product",
    itemType: itemType || item.itemType || "PLAN",
    category: item.category || (itemType === "PLAN" ? "SUBSCRIPTION" : "JOB_POSTING"),
    code: item.code || "",
    planType: item.planType || "",
    quantity,
    unit: item.unit || (itemType === "PLAN" ? "Subscription" : "Item"),
    validity: item.validity || item.activeVersion?.validity || 30,
    description: item.description || item.desc || "",
    basePrice,
    discount,
    price: currentPrice,
    taxPercent,
    taxAmount,
    total,
    pricing: {
      base: basePrice,
      discount,
      currentPrice,
      taxPercent,
      taxAmount,
      total,
    },
    // Retain essential reference so Buyonline checkout can resume seamlessly
    activeVersion: item.activeVersion || null,
    addedAt: new Date().toISOString(),
  };

  // Check if item already exists in cart: update it, otherwise add to front
  const existingIndex = cart.findIndex(
    (c) => String(c.id) === itemId || (c.code && c.code === item.code && c.code !== "")
  );

  if (existingIndex >= 0) {
    cart[existingIndex] = {
      ...cart[existingIndex],
      ...normalizedItem,
      addedAt: new Date().toISOString(),
    };
  } else {
    cart.unshift(normalizedItem);
  }

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (err) {
    console.error("[cartStorage] Failed to save cart to localStorage:", err);
  }

  broadcastCartUpdate(cart);
  return cart;
}

/**
 * Removes an item from the cart by its id or code.
 * @param {string} itemId
 * @returns {Array<Object>} The updated cart array.
 */
export function removeFromCart(itemId) {
  if (!itemId) return getCartItems();
  const targetId = String(itemId);
  const cart = getCartItems().filter(
    (item) => String(item.id) !== targetId && String(item._id) !== targetId && String(item.code) !== targetId
  );

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (err) {
    console.error("[cartStorage] Failed to update cart in localStorage:", err);
  }

  broadcastCartUpdate(cart);
  return cart;
}

/**
 * Updates the quantity of a specific item in the cart.
 * @param {string} itemId
 * @param {number} newQuantity
 * @returns {Array<Object>}
 */
export function updateCartItemQuantity(itemId, newQuantity) {
  const qty = Math.max(1, Number(newQuantity) || 1);
  const cart = getCartItems().map((item) => {
    if (String(item.id) === String(itemId) || String(item._id) === String(itemId)) {
      const unitPrice = item.price || (item.total / (item.quantity || 1));
      const newTotal = unitPrice * qty;
      const taxAmount = (newTotal * (item.taxPercent || 18)) / 100;
      return {
        ...item,
        quantity: qty,
        total: Math.round((newTotal + taxAmount) * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
      };
    }
    return item;
  });

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (err) {
    console.error("[cartStorage] Failed to update item quantity in localStorage:", err);
  }

  broadcastCartUpdate(cart);
  return cart;
}

/**
 * Clears the entire cart from localStorage.
 */
export function clearCart() {
  try {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  } catch (err) {
    console.error("[cartStorage] Failed to clear cart:", err);
  }
  broadcastCartUpdate([]);
}
