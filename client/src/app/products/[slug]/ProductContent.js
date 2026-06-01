"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi, formatCurrency, getImageUrl } from "@/lib/utils";
import {
  FiMinus,
  FiPlus,
  FiAlertCircle,
  FiHeart,
  FiChevronRight,
  FiCheckCircle,
  FiShoppingCart,
  FiShare2,
  FiTruck,
  FiRefreshCw,
  FiShield,
  FiChevronLeft,
} from "react-icons/fi";
import { BsStarFill, BsStarHalf, BsStar } from "react-icons/bs";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import ReviewSection from "./ReviewSection";
import { useAddVariantToCart } from "@/lib/cart-utils";
import ProducCard from "@/components/ProducCard";

const BADGE_CONFIG = {
  "badge:bestseller": { label: "Bestseller", color: "#166454", textColor: "#fff" },
  "badge:new": { label: "New Arrival", color: "#1d4ed8", textColor: "#fff" },
  "badge:sale": { label: "On Sale", color: "#dc2626", textColor: "#fff" },
  "badge:trending": { label: "Trending", color: "#7c3aed", textColor: "#fff" },
  "badge:limited": { label: "Limited Edition", color: "#b45309", textColor: "#fff" },
};

function StarDisplay({ rating, size = "h-4 w-4" }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= Math.floor(rating) ? (
          <BsStarFill key={i} className={`${size} text-amber-400`} />
        ) : i - 0.5 <= rating ? (
          <BsStarHalf key={i} className={`${size} text-amber-400`} />
        ) : (
          <BsStar key={i} className={`${size} text-amber-200`} />
        )
      )}
    </div>
  );
}

export default function ProductContent({ slug }) {
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [effectivePriceInfo, setEffectivePriceInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("about");
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [availableCombinations, setAvailableCombinations] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [priceVisibilitySettings, setPriceVisibilitySettings] = useState(null);
  const [thumbStart, setThumbStart] = useState(0);

  const { addVariantToCart } = useAddVariantToCart();

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setInitialLoading(true);
      try {
        const response = await fetchApi(`/public/products/${slug}`);
        const productData = response.data.product;
        setProduct(productData);
        setRelatedProducts(response.data.relatedProducts || []);

        if (productData.images && productData.images.length > 0) {
          setMainImage(productData.images[0]);
        }

        if (productData.variants && productData.variants.length > 0) {
          const combinations = productData.variants
            .filter((v) => v.isActive && (v.stock > 0 || v.quantity > 0))
            .map((variant) => ({
              attributeValueIds: variant.attributes ? variant.attributes.map((a) => a.attributeValueId) : [],
              variant,
            }));
          setAvailableCombinations(combinations);

          if (productData.attributeOptions && productData.attributeOptions.length > 0) {
            const defaultSelections = {};
            productData.attributeOptions.forEach((attr) => {
              if (attr.values && attr.values.length > 0) {
                defaultSelections[attr.id] = attr.values[0].id;
              }
            });
            setSelectedAttributes(defaultSelections);

            const matchingVariant = combinations.find((combo) => {
              const comboIds = combo.attributeValueIds.sort().join(",");
              const selectedIds = Object.values(defaultSelections).sort().join(",");
              return comboIds === selectedIds;
            });

            if (matchingVariant) {
              setSelectedVariant(matchingVariant.variant);
              const moq = matchingVariant.variant.moq || 1;
              setQuantity(moq);
              setEffectivePriceInfo(getEffectivePrice(matchingVariant.variant, moq));
            } else if (productData.variants.length > 0) {
              setSelectedVariant(productData.variants[0]);
              const moq = productData.variants[0].moq || 1;
              setQuantity(moq);
              setEffectivePriceInfo(getEffectivePrice(productData.variants[0], moq));
            }
          } else if (productData.variants.length > 0) {
            setSelectedVariant(productData.variants[0]);
            const moq = productData.variants[0].moq || 1;
            setQuantity(moq);
            setEffectivePriceInfo(getEffectivePrice(productData.variants[0], moq));
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };
    if (slug) fetchProductDetails();
  }, [slug]);

  useEffect(() => {
    const fetchPriceVisibilitySettings = async () => {
      try {
        const response = await fetchApi("/public/price-visibility-settings");
        if (response.success) setPriceVisibilitySettings(response.data);
      } catch {
        setPriceVisibilitySettings({ hidePricesForGuests: false });
      }
    };
    fetchPriceVisibilitySettings();
  }, []);

  const handleAttributeChange = (attributeId, attributeValueId) => {
    const newSelections = { ...selectedAttributes, [attributeId]: attributeValueId };
    setSelectedAttributes(newSelections);
    const selectedValueIds = Object.values(newSelections).sort();
    const matchingVariant = availableCombinations.find((combo) => {
      const comboIds = combo.attributeValueIds.sort();
      return comboIds.length === selectedValueIds.length && comboIds.every((id, idx) => id === selectedValueIds[idx]);
    });
    if (matchingVariant) {
      setSelectedVariant(matchingVariant.variant);
      const moq = matchingVariant.variant.moq || 1;
      const newQty = quantity < moq ? moq : quantity;
      if (quantity < moq) setQuantity(newQty);
      setEffectivePriceInfo(getEffectivePrice(matchingVariant.variant, newQty));
    } else {
      setSelectedVariant(null);
      setEffectivePriceInfo(null);
    }
  };

  const getAvailableValuesForAttribute = (attributeId) => {
    if (!product?.attributeOptions) return [];
    const attribute = product.attributeOptions.find((attr) => attr.id === attributeId);
    if (!attribute?.values) return [];
    const otherSelections = { ...selectedAttributes };
    delete otherSelections[attributeId];
    const availableValueIds = new Set();
    availableCombinations.forEach((combo) => {
      const comboValueIds = combo.attributeValueIds;
      const otherSelectedIds = Object.values(otherSelections);
      const matchesOther = otherSelectedIds.length === 0 || otherSelectedIds.every((id) => comboValueIds.includes(id));
      if (matchesOther) {
        combo.variant.attributes?.forEach((attr) => {
          if (attr.attributeId === attributeId) availableValueIds.add(attr.attributeValueId);
        });
      }
    });
    return attribute.values.filter((val) => availableValueIds.has(val.id));
  };

  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!isAuthenticated || !product) return;
      try {
        const response = await fetchApi("/users/wishlist", { credentials: "include" });
        const wishlistItems = response.data.wishlistItems || [];
        setIsInWishlist(wishlistItems.some((item) => item.productId === product.id));
      } catch { }
    };
    checkWishlistStatus();
  }, [isAuthenticated, product]);

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    const effectiveMOQ = selectedVariant?.moq || 1;
    if (newQuantity < effectiveMOQ) return;
    const availableStock = selectedVariant?.stock || selectedVariant?.quantity || 0;
    if (availableStock > 0 && newQuantity > availableStock) return;
    setQuantity(newQuantity);
    if (selectedVariant) setEffectivePriceInfo(getEffectivePrice(selectedVariant, newQuantity));
  };

  const handleAddToCart = async () => {
    const variantToUse = selectedVariant || product?.variants?.[0];
    if (!variantToUse) return;
    setIsAddingToCart(true);
    setCartSuccess(false);
    try {
      const result = await addVariantToCart(variantToUse, quantity, product.name);
      if (result.success) {
        setCartSuccess(true);
        setTimeout(() => setCartSuccess(false), 3000);
      }
    } catch { } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    const variantToUse = selectedVariant || product?.variants?.[0];
    if (!variantToUse) return;
    setIsAddingToCart(true);
    try {
      const result = await addVariantToCart(variantToUse, quantity, product.name);
      if (result.success) router.push("/checkout");
    } catch { } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      router.push(`/auth?redirect=/products/${slug}`);
      return;
    }
    setIsAddingToWishlist(true);
    try {
      if (isInWishlist) {
        const res = await fetchApi("/users/wishlist", { credentials: "include" });
        const item = res.data.wishlistItems.find((i) => i.productId === product.id);
        if (item) {
          await fetchApi(`/users/wishlist/${item.id}`, { method: "DELETE", credentials: "include" });
          setIsInWishlist(false);
        }
      } else {
        await fetchApi("/users/wishlist", {
          method: "POST", credentials: "include",
          body: JSON.stringify({ productId: product.id }),
        });
        setIsInWishlist(true);
      }
    } catch { } finally {
      setIsAddingToWishlist(false);
    }
  };

  const getEffectivePrice = (variant, qty) => {
    if (!variant) return null;
    const hasFlashSale = variant.flashSalePrice != null;
    const baseSalePrice = variant.salePrice ? parseFloat(variant.salePrice) : null;
    const basePrice = variant.price ? parseFloat(variant.price) : 0;
    const originalPrice = hasFlashSale ? parseFloat(variant.flashSaleOriginalPrice) : (baseSalePrice || basePrice);
    const displayBasePrice = hasFlashSale ? parseFloat(variant.flashSalePrice) : (baseSalePrice || basePrice);

    if (variant.pricingSlabs?.length > 0) {
      const sortedSlabs = [...variant.pricingSlabs].sort((a, b) => b.minQty - a.minQty);
      for (const slab of sortedSlabs) {
        if (qty >= slab.minQty && (slab.maxQty === null || qty <= slab.maxQty)) {
          return { price: slab.price, originalPrice, source: "SLAB", slab };
        }
      }
    }
    return { price: displayBasePrice, originalPrice, source: "DEFAULT", slab: null };
  };

  const calculateDiscount = (orig, curr) => {
    if (!orig || !curr || orig <= curr) return 0;
    return Math.round(((orig - curr) / orig) * 100);
  };

  const getImages = () => {
    let imgs = [];
    if (selectedVariant?.images?.length > 0) imgs = selectedVariant.images;
    else if (product?.images?.length > 0) imgs = product.images;
    else if (product?.variants?.length > 0) {
      const v = product.variants.find((v) => v.images?.length > 0);
      if (v) imgs = v.images;
    }
    return imgs;
  };

  const resolveUrl = (img) => {
    if (!img) return "/placeholder.jpg";
    const url = img.url || img;
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http")) return url;
    return `https://desirediv-storage.blr1.digitaloceanspaces.com/${url}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-trayalife-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading product…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <FiAlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold mb-2">{error ? "Error Loading Product" : "Product Not Found"}</h2>
        <Link href="/products" className="text-trayalife-500 text-sm underline">Browse Products</Link>
      </div>
    );
  }

  const images = getImages();
  const primaryImage = images.find((i) => i.isPrimary) || images[0];
  const currentImg = mainImage && images.some((i) => i.url === mainImage.url) ? mainImage : primaryImage;
  const priceInfo = effectivePriceInfo || (selectedVariant ? getEffectivePrice(selectedVariant, quantity) : null);
  const currentPrice = priceInfo?.price || product.basePrice || 0;
  const originalPrice = priceInfo?.originalPrice || product.regularPrice || 0;
  const discount = calculateDiscount(originalPrice, currentPrice);
  const showPrice = !priceVisibilitySettings?.hidePricesForGuests || isAuthenticated;

  const reviews = product.reviews || [];
  const totalReviews = product.reviewCount || reviews.length || 0;
  const avgRating = product.avgRating || 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const activeBadges = (product.tags || []).filter((t) => t.startsWith("badge:"));
  const THUMB_VISIBLE = 4;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 flex-wrap">
          <Link href="/" className="hover:text-trayalife-500 transition-colors">Home</Link>
          <FiChevronRight className="h-3 w-3 flex-shrink-0" />
          <Link href="/products" className="hover:text-trayalife-500 transition-colors">Products</Link>
          {(product.category || product.categories?.[0]?.category) && (
            <>
              <FiChevronRight className="h-3 w-3 flex-shrink-0" />
              <Link
                href={`/category/${product.category?.slug || product.categories[0]?.category?.slug}`}
                className="hover:text-trayalife-500 transition-colors"
              >
                {product.category?.name || product.categories[0]?.category?.name}
              </Link>
            </>
          )}
          <FiChevronRight className="h-3 w-3 flex-shrink-0" />
          <span className="text-gray-700 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-14">

          {/* ── LEFT: Gallery ── */}
          <div className="flex flex-col gap-4">
            {/* Main image wrapper — relative but NO overflow-hidden so badges not clipped */}
            <div className="relative w-full aspect-square">
              {/* Actual image box */}
              <div className="w-full h-full bg-[#f7f8f5] rounded-2xl overflow-hidden border border-gray-100">
                {images.length > 0 ? (
                  <Image
                    src={resolveUrl(currentImg)}
                    alt={product.name}
                    fill
                    className="object-contain p-6"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-200">
                    <FiShoppingCart className="h-20 w-20" />
                  </div>
                )}
              </div>

              {/* SVG ribbon badges — outside overflow-hidden, stacked top-left */}
              {activeBadges.slice(0, 3).map((tag, i) => {
                const cfg = BADGE_CONFIG[tag];
                if (!cfg) return null;
                return (
                  <div
                    key={tag}
                    className="absolute left-0 z-20 flex items-center"
                    style={{ top: `${12 + i * 32}px` }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 130 28"
                      width="130"
                      height="28"
                      className="drop-shadow-sm"
                    >
                      <polygon
                        points="0,0 120,0 130,14 120,28 0,28"
                        fill={cfg.color}
                      />
                      <text
                        x="10"
                        y="19"
                        fontFamily="Arial, sans-serif"
                        fontSize="10"
                        fontWeight="bold"
                        fill="#ffffff"
                        letterSpacing="0.5"
                      >
                        {cfg.label}
                      </text>
                    </svg>
                  </div>
                );
              })}

              {/* Discount pill — top right */}
              {discount > 0 && (
                <div className="absolute top-3 right-3 z-20 bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                  {discount}% OFF
                </div>
              )}

              {/* Wishlist — bottom right */}
              <button
                onClick={handleAddToWishlist}
                disabled={isAddingToWishlist}
                className={`absolute bottom-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center shadow-md border transition-all ${
                  isInWishlist
                    ? "bg-red-50 border-red-200 text-red-500"
                    : "bg-white border-gray-100 text-gray-400 hover:text-red-400 hover:border-red-200"
                }`}
              >
                <FiHeart className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Thumbnails with prev/next arrows */}
            {images.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setThumbStart((s) => Math.max(0, s - 1))}
                  disabled={thumbStart === 0}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-trayalife-500 hover:text-trayalife-500 disabled:opacity-30 flex-shrink-0 transition-colors"
                >
                  <FiChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex gap-2 flex-1 overflow-hidden">
                  {images.slice(thumbStart, thumbStart + THUMB_VISIBLE).map((img, idx) => {
                    const realIdx = thumbStart + idx;
                    const isActive = currentImg?.url === img.url;
                    return (
                      <button
                        key={realIdx}
                        onClick={() => setMainImage(img)}
                        className={`flex-1 aspect-square rounded-xl overflow-hidden border-2 transition-all bg-[#f7f8f5] min-w-0 ${
                          isActive
                            ? "border-trayalife-500 shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Image
                          src={resolveUrl(img)}
                          alt={`${product.name} ${realIdx + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-full object-contain p-1.5"
                        />
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setThumbStart((s) => Math.min(images.length - THUMB_VISIBLE, s + 1))}
                  disabled={thumbStart + THUMB_VISIBLE >= images.length}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-trayalife-500 hover:text-trayalife-500 disabled:opacity-30 flex-shrink-0 transition-colors"
                >
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT: Product Info ── */}
          <div className="flex flex-col">

            {/* Brand */}
            {product.brand && (
              <Link
                href={`/brand/${product.brand.slug || ""}`}
                className="text-xs font-semibold text-trayalife-500 uppercase tracking-widest mb-2 hover:underline w-fit"
              >
                {product.brand.name || product.brand}
              </Link>
            )}

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug font-jost mb-3">
              {product.name}
            </h1>

            {/* Rating row */}
            {avgRating > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <StarDisplay rating={avgRating} size="h-4 w-4" />
                <span className="text-sm font-semibold text-gray-700">{Number(avgRating).toFixed(1)}</span>
                <span className="text-sm text-gray-400">({totalReviews} {totalReviews === 1 ? "review" : "reviews"})</span>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100 mb-4" />

            {/* Price */}
            <div className="mb-4">
              {initialLoading ? (
                <div className="h-9 w-36 bg-gray-100 animate-pulse rounded" />
              ) : !showPrice ? (
                <p className="text-amber-600 font-medium text-sm">Login to view price</p>
              ) : (
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl font-bold text-gray-900 font-jost">
                    {formatCurrency(currentPrice)}
                  </span>
                  {originalPrice > currentPrice && (
                    <>
                      <span className="text-lg text-gray-400 line-through">{formatCurrency(originalPrice)}</span>
                      <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes · Free Shipping</p>
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{product.shortDescription}</p>
            )}

            {/* Attribute selectors */}
            {product.attributeOptions?.length > 0 && (
              <div className="space-y-4 mb-5">
                {product.attributeOptions.map((attribute) => {
                  const availableValues = getAvailableValuesForAttribute(attribute.id);
                  const selectedValueId = selectedAttributes[attribute.id];
                  const selectedValueLabel = attribute.values?.find((v) => v.id === selectedValueId)?.value;
                  return (
                    <div key={attribute.id}>
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        {attribute.name}
                        {selectedValueLabel && (
                          <span className="ml-2 font-normal text-gray-400 text-xs">— {selectedValueLabel}</span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {availableValues.length > 0 ? (
                          availableValues.map((value) => {
                            const isSelected = selectedValueId === value.id;
                            return (
                              <button
                                key={value.id}
                                onClick={() => handleAttributeChange(attribute.id, value.id)}
                                className={`min-w-[52px] px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                                  isSelected
                                    ? "border-gray-900 bg-gray-900 text-white"
                                    : "border-gray-300 text-gray-700 hover:border-gray-500"
                                }`}
                              >
                                {value.value}
                              </button>
                            );
                          })
                        ) : (
                          <p className="text-xs text-gray-400">No options available</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Stock status */}
            {selectedVariant && (
              <div className="mb-4">
                {(selectedVariant.stock > 0 || selectedVariant.quantity > 0) ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    In Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                    Out of Stock
                  </span>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-sm text-gray-600 font-medium">Qty:</span>
              <div className="flex items-center border border-gray-300 rounded-full overflow-hidden">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= (selectedVariant?.moq || 1) || isAddingToCart}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <FiMinus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-semibold text-gray-800 text-sm">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={isAddingToCart}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <FiPlus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Cart success */}
            {cartSuccess && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mb-4">
                <FiCheckCircle className="h-4 w-4 flex-shrink-0" />
                Added to cart successfully!
              </div>
            )}

            {/* CTA buttons — Trayalife style */}
            <div className="flex flex-col gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || (selectedVariant && selectedVariant.stock === 0 && selectedVariant.quantity === 0)}
                className="w-full h-13 flex items-center justify-center gap-2 border-2 border-gray-900 text-gray-900 font-bold text-sm rounded-full py-3.5 hover:bg-gray-900 hover:text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed font-jost"
              >
                {isAddingToCart ? (
                  <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Adding…</>
                ) : (
                  "Add to cart"
                )}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isAddingToCart || (selectedVariant && selectedVariant.stock === 0 && selectedVariant.quantity === 0)}
                className="w-full h-13 flex items-center justify-center gap-2 bg-gray-900 text-white font-bold text-sm rounded-full py-3.5 hover:bg-trayalife-500 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed font-jost"
              >
                Buy it now
              </button>
            </div>

            {/* Product Feature Icons — from admin-selected tags */}
            {(() => {
              const FEATURE_SVG = {
                "feature:formulated-by-experts": { label: "Formulated by Experts",              icon: "/icons/icon-formulated.svg" },
                "feature:quality-assurance":     { label: "Quality Assurance with Lab Testing", icon: "/icons/icon-quality.svg"    },
                "feature:easy-refunds":          { label: "Easy Refunds Process",               icon: "/icons/icon-refunds.svg"    },
                "feature:natural-ingredients":   { label: "Natural Ingredients",                icon: "/icons/icon-natural.svg"    },
                "feature:dermatologist-tested":  { label: "Dermatologist Tested",               icon: "/icons/icon-derm.svg"       },
                "feature:no-harmful-chemicals":  { label: "No Harmful Chemicals",               icon: "/icons/icon-no-chemicals.svg"},
                "feature:cruelty-free":          { label: "Cruelty Free",                       icon: "/icons/icon-cruelty.svg"    },
                "feature:fssai-approved":        { label: "FSSAI Approved",                     icon: "/icons/icon-fssai.svg"      },
                "feature:gmp-certified":         { label: "GMP Certified",                      icon: "/icons/icon-gmp.svg"        },
              };

              const featureTags = (product.tags || []).filter((t) => t.startsWith("feature:"));
              if (featureTags.length === 0) return null;

              return (
                <div className={`grid gap-4 py-5 border-t border-gray-100 ${featureTags.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                  {featureTags.slice(0, 3).map((tag) => {
                    const cfg = FEATURE_SVG[tag];
                    if (!cfg) return null;
                    return (
                      <div key={tag} className="flex flex-col items-center text-center gap-2">
                        <div className="w-14 h-14 rounded-full bg-[#f0faf7] border border-[#d0ede6] flex items-center justify-center p-3">
                          <img
                            src={cfg.icon}
                            alt={cfg.label}
                            className="w-full h-full object-contain"
                            style={{filter: "brightness(0) saturate(100%) invert(26%) sepia(50%) saturate(600%) hue-rotate(120deg) brightness(90%)"}}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-gray-700 leading-tight">{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* SKU */}
            {selectedVariant?.sku && (
              <p className="text-xs text-gray-400 mt-3">SKU: <span className="text-gray-600 font-medium">{selectedVariant.sku}</span></p>
            )}
          </div>
        </div>

        {/* ── DESCRIPTION TABS ── */}
        <div className="mb-14">
          <div className="flex border-b border-gray-200 overflow-x-auto gap-1">
            {[
              { key: "about", label: "Description" },
              { key: "how-to-use", label: "How to Use" },
              { key: "ingredients", label: "Ingredients" },
              { key: "more-info", label: "More Info" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${
                  activeTab === key
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="py-6 text-sm text-gray-700 leading-relaxed">
            {activeTab === "about" && (
              <div className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description || "<p>No description available.</p>" }} />
            )}
            {activeTab === "how-to-use" && (
              product.directions
                ? <p className="leading-relaxed">{product.directions}</p>
                : <p className="text-gray-400">No usage instructions provided.</p>
            )}
            {activeTab === "ingredients" && (
              product.ingredients
                ? <p className="leading-relaxed">{product.ingredients}</p>
                : <p className="text-gray-400">Ingredient information not available.</p>
            )}
            {activeTab === "more-info" && (
              <div className="space-y-3">
                {selectedVariant?.sku && <div className="flex gap-4"><span className="font-semibold w-32 text-gray-600">SKU</span><span>{selectedVariant.sku}</span></div>}
                {product.category && <div className="flex gap-4"><span className="font-semibold w-32 text-gray-600">Category</span><span>{product.category.name}</span></div>}
                {product.brand && <div className="flex gap-4"><span className="font-semibold w-32 text-gray-600">Brand</span><span>{product.brand.name || product.brand}</span></div>}
                {(selectedVariant?.shippingWeight || product.shippingWeight) && (
                  <div className="flex gap-4"><span className="font-semibold w-32 text-gray-600">Weight</span><span>{selectedVariant?.shippingWeight || product.shippingWeight} kg</span></div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RATINGS & REVIEWS ── */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-gray-900 mb-6 font-jost">Ratings & Reviews</h2>

          {totalReviews > 0 ? (
            <>
              {/* Summary row */}
              <div className="flex flex-col sm:flex-row gap-8 mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex flex-col items-center justify-center sm:w-32 text-center flex-shrink-0">
                  <span className="text-5xl font-bold text-gray-900 font-jost">{Number(avgRating).toFixed(1)}</span>
                  <span className="text-gray-400 text-xs mb-1">out of 5</span>
                  <StarDisplay rating={avgRating} size="h-3.5 w-3.5" />
                  <p className="text-[11px] text-gray-400 mt-2">{totalReviews} verified ratings</p>
                </div>
                <div className="flex-1 space-y-2">
                  {ratingCounts.map(({ star, count }) => {
                    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    const colors = { 5: "#1a7a5e", 4: "#2a9d6e", 3: "#f4a823", 2: "#f97316", 1: "#ef4444" };
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-8 justify-end">
                          <span className="text-xs text-gray-600">{star}</span>
                          <BsStarFill className="h-3 w-3" style={{ color: colors[star] }} />
                        </div>
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: colors[star] }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-4 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {reviews.slice(0, 6).map((review) => (
                  <div key={review.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 bg-trayalife-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        <BsStarFill className="h-2.5 w-2.5" />
                        {review.rating}
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    {review.title && <h4 className="font-semibold text-gray-800 text-sm mb-1">{review.title}</h4>}
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{review.comment}</p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">{review.user?.name || "Verified Customer"}</p>
                    {review.adminReply && (
                      <div className="mt-3 p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-xs font-semibold text-blue-600 mb-0.5">Seller Response</p>
                        <p className="text-xs text-gray-600">{review.adminReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm mb-6">No reviews yet. Be the first to review!</p>
          )}

          <ReviewSection product={product} />
        </div>

        {/* ── RELATED PRODUCTS ── */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-5 font-jost">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {relatedProducts.slice(0, 10).map((p) => (
                <ProducCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
