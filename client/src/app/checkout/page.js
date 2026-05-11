"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { fetchApi, formatCurrency, loadScript, getImageUrl } from "@/lib/utils";
import { playSuccessSound, fireConfetti } from "@/lib/sound-utils";
import {
  FiCreditCard,
  FiAlertCircle,
  FiLoader,
  FiCheckCircle,
  FiMapPin,
  FiPlus,
  FiShoppingBag,
  FiGift,
  FiTruck,
  FiArrowRight,
  FiCheck,
} from "react-icons/fi";
import { FaRupeeSign, FaWallet } from "react-icons/fa";
import { toast } from "sonner";
import Link from "next/link";
import AddressForm from "@/components/AddressForm";
import Image from "next/image";

export default function CheckoutPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { cart, coupon, getCartTotals, clearCart, updateShippingOptions, selectShippingOption } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [paymentSettings, setPaymentSettings] = useState({ cashEnabled: true, razorpayEnabled: false, codCharge: 0 });
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [processing, setProcessing] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [razorpayKey, setRazorpayKey] = useState("");
  const [siteName, setSiteName] = useState("");
  const [error, setError] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(2);
  const [confettiCannon, setConfettiCannon] = useState(false);

  const totals = getCartTotals();

  useEffect(() => {
    if (!isAuthenticated) router.push("/auth?redirect=checkout");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && cart.items?.length === 0 && !orderCreated) router.push("/cart");
  }, [isAuthenticated, cart, router, orderCreated]);

  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const response = await fetchApi("/payment/settings", { credentials: "include" });
        if (response.success) {
          setPaymentSettings({
            cashEnabled: response.data.cashEnabled ?? true,
            razorpayEnabled: response.data.razorpayEnabled ?? false,
            codCharge: response.data.codCharge ?? 0,
          });
          if (response.data.cashEnabled) setPaymentMethod("CASH");
          else if (response.data.razorpayEnabled) setPaymentMethod("RAZORPAY");
        }
      } catch { setPaymentMethod("CASH"); }
    };
    fetchPaymentSettings();
  }, []);

  const fetchAddresses = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingAddresses(true);
    try {
      const response = await fetchApi("/users/addresses", { credentials: "include" });
      if (response.success) {
        setAddresses(response.data.addresses || []);
        if (response.data.addresses?.length > 0) {
          const def = response.data.addresses.find((a) => a.isDefault);
          setSelectedAddressId(def ? def.id : response.data.addresses[0].id);
        }
      }
    } catch { toast.error("Failed to load addresses"); }
    finally { setLoadingAddresses(false); }
  }, [isAuthenticated]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  useEffect(() => {
    if (selectedAddressId && addresses.length > 0) {
      const addr = addresses.find((a) => a.id === selectedAddressId);
      if (addr?.postalCode) updateShippingOptions(addr.postalCode);
    }
  }, [selectedAddressId, addresses, updateShippingOptions]);

  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const res = await fetchApi("/public/settings", { credentials: "include" });
        if (res?.success && res?.data?.siteName) setSiteName(res.data.siteName);
      } catch { }
    };
    fetchPublicSettings();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchKey = async () => {
      try {
        const res = await fetchApi("/payment/razorpay-key", { credentials: "include" });
        if (res?.success && res?.data?.key) setRazorpayKey(res.data.key);
      } catch { }
    };
    fetchKey();
  }, [isAuthenticated]);

  useEffect(() => {
    if (orderCreated && redirectCountdown > 0) {
      const t = setTimeout(() => setRedirectCountdown((x) => x - 1), 1000);
      return () => clearTimeout(t);
    } else if (orderCreated && redirectCountdown === 0) {
      router.push("/account/orders");
    }
  }, [orderCreated, redirectCountdown, router]);

  useEffect(() => {
    if (successAnimation) {
      fireConfetti.celebration();
      const t = setTimeout(() => { setConfettiCannon(true); fireConfetti.sides(); }, 1500);
      return () => clearTimeout(t);
    }
  }, [successAnimation]);

  const handleSuccessfulPayment = (paymentResponse = null, orderData = null) => {
    if (paymentResponse?.razorpay_payment_id) setPaymentId(paymentResponse.razorpay_payment_id);
    if (orderData?.orderNumber) setOrderNumber(orderData.orderNumber);
    setSuccessAnimation(true);
    playSuccessSound();
    clearCart();
    const orderNum = orderData?.orderNumber || orderNumber || "";
    toast.success("Order placed successfully!", {
      duration: 4000,
      icon: <FiGift className="h-5 w-5 text-green-500" />,
      description: orderNum ? `Order #${orderNum} confirmed. Redirecting…` : "Order confirmed. Redirecting…",
    });
    setTimeout(() => setOrderCreated(true), 100);
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) { toast.error("Please select a shipping address"); return; }
    setProcessing(true);
    setError("");
    try {
      const calculatedAmount = totals.total;
      const amount = Math.max(Math.round(calculatedAmount), 1);
      if (calculatedAmount < 1) toast.info("Minimum order amount is ₹1. Total adjusted.");

      if (paymentMethod === "CASH") {
        toast.loading("Creating your order…", { id: "order-creation", duration: 10000 });
        const orderResponse = await fetchApi("/payment/cash-order", {
          method: "POST", credentials: "include",
          body: JSON.stringify({
            shippingAddressId: selectedAddressId,
            billingAddressSameAsShipping: true,
            couponCode: coupon?.code || null,
            couponId: coupon?.id || null,
            discountAmount: totals.discount || 0,
            selectedShippingOption: cart.selectedShippingOption,
          }),
        });
        toast.dismiss("order-creation");
        if (!orderResponse.success) throw new Error(orderResponse.message || "Failed to create order");
        setOrderNumber(orderResponse.data.orderNumber);
        setOrderId(orderResponse.data.orderId || "");
        handleSuccessfulPayment(null, { orderNumber: orderResponse.data.orderNumber, orderId: orderResponse.data.orderId, paymentMethod: "CASH" });
        return;
      } else if (paymentMethod === "RAZORPAY") {
        if (!razorpayKey) {
          try {
            const keyResponse = await fetchApi("/payment/razorpay-key", { method: "GET", credentials: "include" });
            if (keyResponse.success && keyResponse.data?.key) setRazorpayKey(keyResponse.data.key);
            else throw new Error("Razorpay key not available.");
          } catch { throw new Error("Failed to fetch Razorpay key. Please configure payment settings."); }
        }
        toast.loading("Creating your order…", { id: "order-creation", duration: 10000 });
        const orderResponse = await fetchApi("/payment/checkout", {
          method: "POST", credentials: "include",
          body: JSON.stringify({
            amount, currency: "INR", paymentGateway: "RAZORPAY",
            couponCode: coupon?.code || null, couponId: coupon?.id || null,
            discountAmount: totals.discount || 0,
            selectedShippingOption: cart.selectedShippingOption,
          }),
        });
        toast.dismiss("order-creation");
        if (!orderResponse.success) throw new Error(orderResponse.message || "Failed to create order");
        toast.success("Order created! Opening payment gateway…", { duration: 2000 });
        const razorpayOrder = orderResponse.data;
        setOrderId(razorpayOrder.id);
        toast.loading("Loading payment gateway…", { id: "payment-gateway", duration: 5000 });
        const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        toast.dismiss("payment-gateway");
        if (!loaded) throw new Error("Razorpay SDK failed to load");
        let currentKey = razorpayKey;
        if (!currentKey) {
          try {
            const kr = await fetchApi("/payment/razorpay-key", { method: "GET", credentials: "include" });
            if (kr.success && kr.data?.key) { currentKey = kr.data.key; setRazorpayKey(currentKey); }
          } catch { }
        }
        if (!currentKey) throw new Error("Razorpay key missing. Please configure payment settings.");
        const options = {
          key: currentKey, amount: razorpayOrder.amount, currency: razorpayOrder.currency,
          name: siteName || "Your Store", description: "Order Payment", order_id: razorpayOrder.id,
          prefill: { name: user?.name || "", email: user?.email || "", contact: user?.phone || "" },
          handler: async function (response) {
            setProcessing(true);
            toast.loading("Verifying your payment…", { id: "payment-verification", duration: 10000 });
            try {
              const verificationResponse = await fetchApi("/payment/verify", {
                method: "POST", credentials: "include",
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  shippingAddressId: selectedAddressId,
                  billingAddressSameAsShipping: true,
                  couponCode: coupon?.code || null, couponId: coupon?.id || null,
                  discountAmount: totals.discount || 0,
                  selectedShippingOption: cart.selectedShippingOption, notes: "",
                }),
              });
              toast.dismiss("payment-verification");
              if (verificationResponse.success) {
                toast.success("Payment verified! 🎉", { duration: 3000 });
                setOrderId(verificationResponse.data.orderId);
                handleSuccessfulPayment(response, verificationResponse.data);
              } else {
                throw new Error(verificationResponse.message || "Payment verification failed");
              }
            } catch (err) {
              toast.dismiss("payment-verification");
              setError(err.message || "Payment verification failed");
              toast.error(err.message || "Payment verification failed. Please try again.");
              setProcessing(false);
            }
          },
          theme: { color: "#166454" },
          modal: { ondismiss: () => setProcessing(false) },
        };
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        toast.error("Please select a payment method");
      }
    } catch (err) {
      toast.dismiss("order-creation");
      toast.dismiss("payment-gateway");
      toast.dismiss("payment-verification");
      setError(err.message || "Checkout failed");
      toast.error(err.message || "Checkout failed");
    } finally {
      setProcessing(false);
    }
  };

  if (!isAuthenticated || loadingAddresses) {
    return (
      <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-trayalife-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (orderCreated) {
    return (
      <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-trayalife-500/5 to-transparent pointer-events-none" />
          <div className="relative">
            {/* Bouncing icon */}
            <div className="relative flex justify-center mb-6">
              <div className="w-28 h-28 bg-[#e8f5f2] rounded-full flex items-center justify-center mx-auto animate-bounce">
                <FiGift className={`h-14 w-14 text-trayalife-500 ${confettiCannon ? "animate-pulse" : ""}`} />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-ping absolute w-32 h-32 rounded-full bg-trayalife-500 opacity-10" />
                <div className="animate-ping absolute w-24 h-24 rounded-full bg-emerald-400 opacity-10 delay-150" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-1 font-jost">Woohoo!</h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-4 font-jost">Order Confirmed</h2>

            {orderNumber && (
              <div className="bg-[#e8f5f2] rounded-2xl px-5 py-2.5 inline-block mb-5">
                <p className="text-trayalife-500 font-bold font-jost">Order #{orderNumber}</p>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 bg-emerald-50 rounded-2xl px-5 py-3 mb-5 border border-emerald-100">
              <FiCheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="text-emerald-700 font-semibold">Payment Successful</p>
            </div>

            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              Thank you for your purchase! You&apos;ll receive an email confirmation shortly.
            </p>

            <div className="bg-blue-50 rounded-2xl px-5 py-3 mb-6 border border-blue-100">
              <div className="flex items-center justify-center gap-2 mb-1">
                <FiLoader className="h-3.5 w-3.5 text-blue-500 animate-spin" />
                <p className="text-sm text-blue-700">Redirecting in {redirectCountdown}s…</p>
              </div>
              <Link href="/account/orders" className="text-xs text-blue-500 hover:underline">
                Go to orders now →
              </Link>
            </div>

            <div className="flex gap-3 justify-center">
              <Link href="/account/orders">
                <button className="flex items-center gap-2 bg-trayalife-500 hover:bg-trayalife-600 text-white font-jost font-semibold px-5 py-2.5 rounded-2xl transition-colors text-sm">
                  <FiShoppingBag className="h-4 w-4" /> My Orders
                </button>
              </Link>
              <Link href="/products">
                <button className="flex items-center gap-2 border-2 border-gray-200 text-gray-600 hover:border-trayalife-500 hover:text-trayalife-500 font-jost font-semibold px-5 py-2.5 rounded-2xl transition-colors text-sm">
                  <FiGift className="h-4 w-4" /> Continue Shopping
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const grandTotal = totals.total + (paymentMethod === "CASH" ? (paymentSettings.codCharge || 0) : 0);

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      {/* Processing overlay */}
      {processing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-20 h-20 bg-[#e8f5f2] rounded-full flex items-center justify-center mx-auto mb-4">
              <FiLoader className="h-10 w-10 text-trayalife-500 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2 font-jost">Processing Payment</h3>
            <p className="text-sm text-gray-500 mb-4">Please don&apos;t close or refresh this page.</p>
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 bg-trayalife-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-7">
          <Link href="/cart" className="text-gray-400 hover:text-trayalife-500 transition-colors">
            <FiArrowRight className="h-5 w-5 rotate-180" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 font-jost">Checkout</h1>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <FiAlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 text-sm">Payment Failed</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">

            {/* ── Shipping Address ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#e8f5f2] rounded-full flex items-center justify-center">
                    <FiMapPin className="h-4 w-4 text-trayalife-500" />
                  </div>
                  <h2 className="font-bold text-gray-900 font-jost">Shipping Address</h2>
                </div>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="flex items-center gap-1.5 text-sm text-trayalife-500 font-semibold hover:text-trayalife-600 transition-colors"
                >
                  <FiPlus className="h-4 w-4" />
                  Add New
                </button>
              </div>

              <div className="p-5">
                {showAddressForm && (
                  <div className="mb-5">
                    <AddressForm
                      onSuccess={() => { setShowAddressForm(false); fetchAddresses(); }}
                      onCancel={() => setShowAddressForm(false)}
                      isInline={true}
                    />
                  </div>
                )}

                {addresses.length === 0 && !showAddressForm ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                    No saved addresses.{" "}
                    <button className="font-semibold underline" onClick={() => setShowAddressForm(true)}>
                      Add one
                    </button>{" "}
                    to continue.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {addresses.map((address) => {
                      const isSelected = selectedAddressId === address.id;
                      return (
                        <div
                          key={address.id}
                          onClick={() => setSelectedAddressId(address.id)}
                          className={`relative rounded-2xl border-2 p-4 cursor-pointer transition-all ${isSelected
                            ? "border-trayalife-500 bg-[#f0faf7]"
                            : "border-gray-200 hover:border-gray-300 bg-white"}`}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-5 h-5 bg-trayalife-500 rounded-full flex items-center justify-center">
                              <FiCheck className="h-3 w-3 text-white" />
                            </div>
                          )}
                          {address.isDefault && (
                            <span className="inline-block bg-[#e8f5f2] text-trayalife-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2">
                              Default
                            </span>
                          )}
                          <p className="font-semibold text-gray-800 text-sm mb-1">{address.name}</p>
                          <div className="text-xs text-gray-500 space-y-0.5">
                            <p>{address.street}</p>
                            <p>{address.city}, {address.state} {address.postalCode}</p>
                            <p>{address.country}</p>
                            {address.phone && <p className="text-gray-400">📞 {address.phone}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Payment Method ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
                <div className="w-8 h-8 bg-[#e8f5f2] rounded-full flex items-center justify-center">
                  <FiCreditCard className="h-4 w-4 text-trayalife-500" />
                </div>
                <h2 className="font-bold text-gray-900 font-jost">Payment Method</h2>
              </div>

              <div className="p-5">
                {!paymentSettings.cashEnabled && !paymentSettings.razorpayEnabled ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                    No payment methods available. Please contact support.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentSettings.cashEnabled && (
                      <div
                        onClick={() => setPaymentMethod("CASH")}
                        className={`flex items-start gap-4 rounded-2xl border-2 p-4 cursor-pointer transition-all ${paymentMethod === "CASH"
                          ? "border-trayalife-500 bg-[#f0faf7]"
                          : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${paymentMethod === "CASH" ? "border-trayalife-500 bg-trayalife-500" : "border-gray-300"}`}>
                          {paymentMethod === "CASH" && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FaWallet className="h-4 w-4 text-emerald-600" />
                            <span className="font-semibold text-gray-800 text-sm">Cash on Delivery (COD)</span>
                          </div>
                          <p className="text-xs text-gray-500">Pay with cash when your order arrives</p>
                          {paymentSettings.codCharge > 0 && (
                            <p className="text-xs text-trayalife-500 font-medium mt-1">
                              Extra {formatCurrency(paymentSettings.codCharge)} COD charge applies
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {paymentSettings.razorpayEnabled && (
                      <div
                        onClick={() => setPaymentMethod("RAZORPAY")}
                        className={`flex items-start gap-4 rounded-2xl border-2 p-4 cursor-pointer transition-all ${paymentMethod === "RAZORPAY"
                          ? "border-trayalife-500 bg-[#f0faf7]"
                          : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${paymentMethod === "RAZORPAY" ? "border-trayalife-500 bg-trayalife-500" : "border-gray-300"}`}>
                          {paymentMethod === "RAZORPAY" && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FaRupeeSign className="h-4 w-4 text-trayalife-500" />
                            <span className="font-semibold text-gray-800 text-sm">Pay Online (Razorpay)</span>
                          </div>
                          <p className="text-xs text-gray-500">Credit/Debit Card, UPI, NetBanking & more</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Shipping Options ── */}
            {cart.shippingOptions && cart.shippingOptions.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
                  <div className="w-8 h-8 bg-[#e8f5f2] rounded-full flex items-center justify-center">
                    <FiTruck className="h-4 w-4 text-trayalife-500" />
                  </div>
                  <h2 className="font-bold text-gray-900 font-jost">Shipping Options</h2>
                </div>
                <div className="p-5 space-y-3">
                  {cart.shippingOptions.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => selectShippingOption(option)}
                      className={`flex items-center gap-4 rounded-2xl border-2 p-4 cursor-pointer transition-all ${cart.selectedShippingOption?.id === option.id
                        ? "border-trayalife-500 bg-[#f0faf7]"
                        : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${cart.selectedShippingOption?.id === option.id ? "border-trayalife-500 bg-trayalife-500" : "border-gray-300"}`}>
                        {cart.selectedShippingOption?.id === option.id && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">{option.name}</p>
                        {(option.etd || option.estimatedDelivery) && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Est. delivery: {option.etd}{option.estimatedDelivery ? ` (${option.estimatedDelivery} days)` : ""}
                          </p>
                        )}
                      </div>
                      <p className="font-bold text-trayalife-500 text-sm">{formatCurrency(option.rate)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Order Summary sidebar ── */}
          <div className="lg:col-span-1">
            <div className="bg-[#0d1f1b] rounded-2xl p-6 sticky top-24">
              <h2 className="font-jost font-bold text-white text-lg mb-5">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-5 max-h-52 overflow-y-auto pr-1">
                {cart.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex-shrink-0 relative overflow-hidden">
                      {item.product?.image && (
                        <Image src={getImageUrl(item.product.image)} alt={item.product.name} fill className="object-contain p-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-xs font-medium truncate">{item.product?.name}</p>
                      <p className="text-white/40 text-xs">{item.quantity} × {formatCurrency(item.price)}</p>
                    </div>
                    <p className="text-white font-bold text-xs">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-white/10 mb-4" />

              {/* Totals */}
              <div className="space-y-2.5 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Subtotal</span>
                  <span className="text-white font-medium">{formatCurrency(totals.subtotal)}</span>
                </div>
                {coupon && totals.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Discount</span>
                    <span className="text-emerald-400 font-medium">−{formatCurrency(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Shipping</span>
                  {totals.shipping > 0 ? (
                    <span className="text-white font-medium">{formatCurrency(totals.shipping)}</span>
                  ) : (
                    <span className="text-emerald-400 font-bold">FREE</span>
                  )}
                </div>
                {paymentMethod === "CASH" && paymentSettings.codCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">COD Charge</span>
                    <span className="text-amber-400 font-medium">{formatCurrency(paymentSettings.codCharge)}</span>
                  </div>
                )}
              </div>

              {/* Free shipping nudge */}
              {totals.shipping > 0 && cart.freeShippingThreshold > 0 && (
                <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-2.5 mb-4 text-center">
                  <p className="text-amber-400 text-xs font-medium">
                    Add {formatCurrency(cart.freeShippingThreshold - totals.subtotal)} more for FREE shipping!
                  </p>
                </div>
              )}

              {/* Grand total */}
              <div className="flex justify-between items-baseline border-t border-white/10 pt-4 mb-5">
                <span className="font-jost font-bold text-white text-base">Total</span>
                <span className="font-jost font-bold text-[#C9A84C] text-xl">{formatCurrency(grandTotal)}</span>
              </div>

              {/* Place order button */}
              <button
                onClick={handleCheckout}
                disabled={processing || !selectedAddressId || !paymentMethod || addresses.length === 0}
                className="w-full bg-[#C9A84C] hover:bg-[#a88830] text-[#0d1f1b] font-jost font-bold py-4 rounded-2xl text-sm transition-all duration-200 shadow-[0_4px_16px_rgba(201,168,76,0.3)] hover:shadow-[0_6px_20px_rgba(201,168,76,0.45)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <><FiLoader className="h-4 w-4 animate-spin" /> Processing…</>
                ) : (
                  <>Place Order · {formatCurrency(grandTotal)} <FiArrowRight className="h-4 w-4" /></>
                )}
              </button>

              <p className="text-white/20 text-xs text-center mt-3">
                By placing your order, you agree to our terms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
