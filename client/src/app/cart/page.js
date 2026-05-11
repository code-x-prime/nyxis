"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { Input } from "@/components/ui/input";
import {
  FiTrash2,
  FiPlus,
  FiMinus,
  FiArrowRight,
  FiX,
  FiTag,
  FiTruck,
  FiEdit2,
  FiChevronDown,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { BsBoxSeam } from "react-icons/bs";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { toast } from "sonner";

const CartItem = React.memo(({ item, onUpdateQuantity, onRemove, isLoading }) => {
  const getProductImage = () => {
    if (item.variant?.images?.length > 0) {
      const primary = item.variant.images.find((i) => i.isPrimary);
      const url = primary?.url || item.variant.images[0]?.url;
      if (url) return getImageUrl(url);
    }
    if (item.product?.image) return getImageUrl(item.product.image);
    if (item.image) return getImageUrl(item.image);
    return "/placeholder.jpg";
  };

  const getVariantName = () => {
    if (item.variantName?.trim()) return item.variantName;
    if (item.variant?.attributes?.length > 0)
      return item.variant.attributes.map((a) => `${a.attribute}: ${a.value}`).join(" • ");
    const color = item.variant?.color?.name || item.color?.name;
    const size = item.variant?.size?.name || item.size?.name;
    if (color && size) return `${color} • ${size}`;
    return color || size || null;
  };

  const variantName = getVariantName();
  const productImage = getProductImage();
  const productName = item.productName || item.product?.name || "Product";
  const productSlug = item.productSlug || item.product?.slug || "#";

  const originalPrice = item.originalPrice && item.originalPrice !== item.price ? item.originalPrice : null;
  const discount = originalPrice ? Math.round(((originalPrice - item.price) / originalPrice) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4">
      {/* Image */}
      <Link href={`/products/${productSlug}`} className="flex-shrink-0">
        <div className="relative w-24 h-24 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
          <Image src={productImage} alt={productName} fill className="object-contain p-2" sizes="96px" />
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {item.product?.brand?.name && (
              <p className="text-xs font-bold text-trayalife-500 uppercase tracking-wide mb-0.5">
                {item.product.brand.name}
              </p>
            )}
            <Link href={`/products/${productSlug}`}>
              <h3 className="font-semibold text-gray-900 text-sm leading-snug hover:text-trayalife-500 transition-colors line-clamp-2">
                {productName}
              </h3>
            </Link>
            {variantName && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                {item.variant?.color?.hexCode && (
                  <span className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0" style={{ backgroundColor: item.variant.color.hexCode }} />
                )}
                {variantName}
              </p>
            )}
          </div>
          <button
            onClick={() => onRemove(item.id)}
            disabled={isLoading}
            className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
          >
            {isLoading ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiTrash2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Price row + Qty */}
        <div className="flex items-end justify-between mt-3 flex-wrap gap-2">
          <div>
            {item.hidePricesForGuests && !item.isAuthenticated ? (
              <span className="text-xs text-amber-600 font-medium">Login to view price</span>
            ) : (
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-lg font-bold text-gray-900 font-jost">{formatCurrency(item.price)}</span>
                {originalPrice && (
                  <span className="text-sm text-gray-400 line-through">{formatCurrency(originalPrice)}</span>
                )}
                {discount > 0 && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    {discount}% OFF
                  </span>
                )}
                {item.priceSource && item.priceSource !== "DEFAULT" && (
                  <span className="text-xs text-trayalife-500 font-medium">Bulk price</span>
                )}
              </div>
            )}
            {item.moq > 1 && (
              <p className="text-xs text-trayalife-500 font-medium mt-0.5">Min. order: {item.moq} units</p>
            )}
          </div>

          {/* Qty stepper */}
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity, -1)}
              disabled={isLoading || item.quantity <= (item.moq || 1)}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <FiMinus className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 h-8 flex items-center justify-center text-sm font-bold text-gray-800 border-x border-gray-200">
              {isLoading ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity, 1)}
              disabled={isLoading}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <FiPlus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Subtotal */}
        {!(item.hidePricesForGuests && !item.isAuthenticated) && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
            <span className="text-xs text-gray-400">Item total</span>
            <span className="text-sm font-bold text-gray-800 font-jost">{formatCurrency(item.subtotal)}</span>
          </div>
        )}
      </div>
    </div>
  );
});
CartItem.displayName = "CartItem";

export default function CartPage() {
  const {
    cart, loading, cartItemsLoading, error,
    removeFromCart, updateCartItem, clearCart,
    applyCoupon, removeCoupon, coupon, couponLoading,
    getCartTotals, isAuthenticated, mergeProgress, hidePricesForGuests,
  } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const router = useRouter();

  const handleQuantityChange = useCallback(async (cartItemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    const cartItem = cart.items.find((i) => i.id === cartItemId);
    const effectiveMOQ = cartItem?.moq || 1;
    if (newQuantity < effectiveMOQ) { toast.error(`Minimum order quantity is ${effectiveMOQ} units`); return; }
    if (newQuantity < 1) return;
    try { await updateCartItem(cartItemId, newQuantity); }
    catch (err) { toast.error(err.message || "Failed to update quantity"); }
  }, [updateCartItem, cart.items]);

  const handleRemoveItem = useCallback(async (cartItemId) => {
    try { await removeFromCart(cartItemId); }
    catch { toast.error("Failed to remove item"); }
  }, [removeFromCart]);

  const handleClearCart = useCallback(async () => {
    if (!window.confirm("Clear your entire cart?")) return;
    try { await clearCart(); toast.success("Cart cleared"); }
    catch { toast.error("Failed to clear cart"); }
  }, [clearCart]);

  const handleApplyCoupon = useCallback(async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) { setCouponError("Please enter a coupon code"); return; }
    setCouponError("");
    try { await applyCoupon(couponCode); setCouponCode(""); setCouponOpen(false); }
    catch (err) { setCouponError(err.message || "Invalid coupon code"); toast.error(err.message || "Invalid coupon code"); }
  }, [couponCode, applyCoupon]);

  const handleRemoveCoupon = useCallback(() => {
    removeCoupon(); setCouponCode(""); setCouponError("");
    toast.success("Coupon removed");
  }, [removeCoupon]);

  const totals = useMemo(() => getCartTotals(), [cart, coupon]);

  const handleCheckout = useCallback(() => {
    if (!isAuthenticated && hidePricesForGuests) { router.push("/auth?redirect=checkout"); return; }
    if (totals.subtotal - totals.discount < 1) { toast.info("Minimum order amount is ₹1"); return; }
    if (!isAuthenticated) router.push("/auth?redirect=checkout");
    else router.push("/checkout");
  }, [isAuthenticated, router, totals, hidePricesForGuests]);

  const totalSavings = totals.discount || 0;
  const mrpTotal = useMemo(() => {
    return cart.items?.reduce((sum, item) => {
      const orig = item.originalPrice || item.price;
      return sum + (orig * item.quantity);
    }, 0) || 0;
  }, [cart.items]);
  const productDiscount = mrpTotal - totals.subtotal;

  if (loading && (!cart.items || cart.items.length === 0)) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div className="w-12 h-12 border-4 border-trayalife-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading your cart…</p>
        </div>
      </div>
    );
  }

  if ((!cart.items || cart.items.length === 0) && !error) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 font-jost">My Cart</h1>
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-[#e8f5f2] rounded-full mx-auto flex items-center justify-center mb-5">
              <HiOutlineShoppingBag className="h-12 w-12 text-trayalife-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-jost">Your cart is empty</h3>
            <p className="text-gray-400 text-sm mb-7">Add some products to get started</p>
            <Link href="/products" className="inline-flex items-center gap-2 bg-trayalife-500 hover:bg-trayalife-600 text-white font-jost font-bold px-8 py-3.5 rounded-2xl transition-all shadow-sm">
              Continue Shopping <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-6 md:py-10">
      <div className="max-w-6xl mx-auto px-4">

        {/* Merge progress */}
        {mergeProgress && (
          <div className="bg-trayalife-50 border border-trayalife-500/20 rounded-2xl p-4 flex items-center gap-3 mb-5">
            <FiLoader className="text-trayalife-500 h-4 w-4 animate-spin flex-shrink-0" />
            <p className="text-sm text-trayalife-500 font-medium">{mergeProgress}</p>
          </div>
        )}

        {/* Guest notice */}
        {!isAuthenticated && cart.items?.length > 0 && (
          <div className="bg-white border border-amber-200 rounded-2xl p-4 flex items-center gap-4 mb-5">
            <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
              <HiOutlineShoppingBag className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Login to save your cart</p>
              <p className="text-xs text-gray-400 mt-0.5">Your items won&apos;t be saved if you leave without logging in</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link href="/auth?redirect=cart" className="bg-trayalife-500 text-white font-jost font-semibold text-xs px-4 py-2 rounded-xl hover:bg-trayalife-600 transition">Log In</Link>
              <Link href="/auth?tab=register&redirect=cart" className="border-2 border-trayalife-500 text-trayalife-500 font-jost font-semibold text-xs px-4 py-2 rounded-xl hover:bg-trayalife-50 transition">Register</Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Cart Items ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BsBoxSeam className="h-5 w-5 text-trayalife-500" />
                <h1 className="font-jost font-bold text-gray-900 text-lg">
                  Shop Items
                  <span className="ml-2 text-sm font-normal text-gray-400">: {cart.items?.length}</span>
                </h1>
              </div>

            </div>

            {/* Items */}
            <div className="space-y-3">
              {cart.items.map((item) => (
                <CartItem
                  key={item.id}
                  item={{ ...item, isAuthenticated, hidePricesForGuests }}
                  onUpdateQuantity={handleQuantityChange}
                  onRemove={handleRemoveItem}
                  isLoading={cartItemsLoading[item.id]}
                />
              ))}
            </div>

            {/* Bottom actions */}
            <div className="flex items-center justify-between pt-1">
              <Link href="/products" className="flex items-center gap-1.5 text-sm font-semibold text-trayalife-500 hover:text-trayalife-600 transition-colors">
                <FiArrowRight className="h-4 w-4 rotate-180" /> Continue Shopping
              </Link>
              <button onClick={handleClearCart} disabled={loading}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors disabled:opacity-40">
                {loading ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiTrash2 className="h-4 w-4" />}
                Clear Cart
              </button>
            </div>
          </div>

          {/* ── Right: Payment Summary ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Savings banner */}
            {totalSavings > 0 && (
              <div className="bg-trayalife-500 rounded-2xl px-5 py-3.5 flex items-center justify-between">
                <span className="text-white font-jost font-bold text-sm">Your total savings are</span>
                <div className="bg-white rounded-xl px-3 py-1.5 flex items-center gap-1">
                  <span className="font-jost font-bold text-trayalife-500 text-sm">{formatCurrency(totalSavings)}</span>
                  <FiChevronDown className="h-3.5 w-3.5 text-trayalife-500" />
                </div>
              </div>
            )}

            {/* Offers & Coupons */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setCouponOpen(!couponOpen)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center">
                    <FiTag className="h-4 w-4 text-orange-500" />
                  </div>
                  <span className="font-semibold text-gray-800 text-sm font-jost">Offers &amp; Coupons</span>
                  {coupon && (
                    <span className="text-xs bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                      {coupon.code} applied
                    </span>
                  )}
                </div>
                <span className="text-xs text-trayalife-500 font-semibold flex items-center gap-1">
                  {coupon ? "Change" : "View all"} <FiArrowRight className="h-3 w-3" />
                </span>
              </button>

              {/* Coupon form */}
              {(couponOpen || coupon) && (
                <div className="px-5 pb-4 border-t border-gray-50">
                  {coupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mt-3">
                      <div>
                        <span className="font-bold text-emerald-700 text-sm">{coupon.code}</span>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}
                        </p>
                      </div>
                      <button onClick={handleRemoveCoupon} disabled={couponLoading}
                        className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2 mt-3">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-trayalife-500 focus:ring-1 focus:ring-trayalife-500 transition-colors"
                      />
                      <button type="submit" disabled={couponLoading}
                        className="bg-trayalife-500 hover:bg-trayalife-600 text-white font-jost font-bold text-sm px-4 rounded-xl transition-colors disabled:opacity-50">
                        {couponLoading ? <FiLoader className="h-4 w-4 animate-spin" /> : "Apply"}
                      </button>
                    </form>
                  )}
                  {couponError && (
                    <div className="flex items-center gap-1.5 mt-2 text-red-500">
                      <FiAlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      <p className="text-xs">{couponError}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Summary card */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="font-jost font-bold text-gray-900 text-base">Payment Summary</h2>
              </div>

              <div className="px-5 py-4 space-y-3.5">
                {/* Shop order total */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shop Order Total ({cart.items?.length} Items)</span>
                  <span className="font-semibold text-gray-800">
                    {!isAuthenticated && hidePricesForGuests ? (
                      <Link href="/auth?redirect=cart" className="text-amber-500 text-xs hover:underline">Login to view</Link>
                    ) : formatCurrency(totals.subtotal)}
                  </span>
                </div>

                {/* MRP total */}
                {mrpTotal > totals.subtotal && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">MRP Total</span>
                    <span className="text-gray-500">{formatCurrency(mrpTotal)}</span>
                  </div>
                )}

                {/* Product discount */}
                {productDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Product Discount</span>
                    <span className="text-emerald-600 font-semibold">−{formatCurrency(productDiscount)}</span>
                  </div>
                )}

                {/* Product subtotal */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Product Subtotal</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(totals.subtotal)}</span>
                </div>

                {/* Coupon discount */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Coupon Discount</span>
                  {coupon && totals.discount > 0 ? (
                    <span className="text-emerald-600 font-semibold">−{formatCurrency(totals.discount)}</span>
                  ) : (
                    <button onClick={() => setCouponOpen(true)} className="text-trayalife-500 font-bold text-xs underline hover:text-trayalife-600">
                      Apply Coupon
                    </button>
                  )}
                </div>

                {/* Shipping */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping Fee</span>
                  {totals.shipping > 0 ? (
                    <span className="font-semibold text-gray-800">{formatCurrency(totals.shipping)}</span>
                  ) : (
                    <span className="text-emerald-600 font-bold">FREE</span>
                  )}
                </div>

                {/* Free shipping nudge */}
                {totals.shipping > 0 && cart.freeShippingThreshold > 0 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700 text-center">
                    Add <strong>{formatCurrency(cart.freeShippingThreshold - totals.subtotal)}</strong> more for <span className="text-emerald-600 font-bold">FREE shipping</span>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="font-jost font-bold text-gray-900 text-base">Grand Total</span>
                    <span className="font-jost font-bold text-gray-900 text-xl">
                      {!isAuthenticated && hidePricesForGuests ? (
                        <Link href="/auth?redirect=cart" className="text-amber-500 text-sm hover:underline">Login to view</Link>
                      ) : formatCurrency(totals.total)}
                    </span>
                  </div>
                  {totalSavings > 0 && (
                    <p className="text-xs text-emerald-600 font-medium mt-1 text-right">
                      You save {formatCurrency(totalSavings)} on this order
                    </p>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="px-5 pb-5">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-trayalife-500 hover:bg-trayalife-600 text-white font-jost font-bold py-4 rounded-2xl text-base transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  {!isAuthenticated && hidePricesForGuests ? "Login to Checkout" : (
                    <>Proceed to Checkout <FiArrowRight className="h-5 w-5" /></>
                  )}
                </button>
                <p className="text-center text-gray-400 text-xs mt-3">
                  Taxes and shipping calculated at checkout
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
