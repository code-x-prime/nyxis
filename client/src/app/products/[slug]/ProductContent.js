"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi, formatCurrency, getImageUrl } from "@/lib/utils";
import {
  FiStar,
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
} from "react-icons/fi";
import { BsStarFill, BsStarHalf, BsStar } from "react-icons/bs";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import ReviewSection from "./ReviewSection";
import { useAddVariantToCart } from "@/lib/cart-utils";
import ProducCard from "@/components/ProducCard";

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

  // Gather images
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

  // Loading
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-trayalife-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Loading product…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <FiAlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">{error ? "Error Loading Product" : "Product Not Found"}</h2>
        <Link href="/products" className="text-trayalife-500 underline text-sm">Browse Products</Link>
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

  // Rating breakdown
  const reviews = product.reviews || [];
  const totalReviews = product.reviewCount || reviews.length || 0;
  const avgRating = product.avgRating || 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const StarDisplay = ({ rating, size = "h-4 w-4" }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        i <= Math.floor(rating) ? (
          <BsStarFill key={i} className={`${size} text-amber-400`} />
        ) : i - 0.5 <= rating ? (
          <BsStarHalf key={i} className={`${size} text-amber-400`} />
        ) : (
          <BsStar key={i} className={`${size} text-amber-200`} />
        )
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-5 flex-wrap">
        <Link href="/" className="hover:text-trayalife-500 transition-colors">Shop</Link>
        <FiChevronRight className="h-3 w-3" />
        {(product.category || product.categories?.[0]?.category) && (
          <>
            <Link href={`/category/${product.category?.slug || product.categories[0]?.category?.slug}`}
              className="hover:text-trayalife-500 transition-colors">
              {product.category?.name || product.categories[0]?.category?.name}
            </Link>
            <FiChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="text-trayalife-500 font-medium truncate max-w-[240px]">{product.name}</span>
      </nav>

      {/* Main product section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-10">

        {/* ── Left: Image Gallery ── */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="relative aspect-square w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            {images.length > 0 ? (
              <Image
                src={resolveUrl(currentImg)}
                alt={product.name}
                fill
                className="object-contain p-4"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <FiShoppingCart className="h-16 w-16" />
              </div>
            )}
            {/* Badges */}
            {product.isBestseller && (
              <div className="absolute top-3 left-0 bg-[#166454] text-white text-[11px] font-bold px-3 py-1 flex items-center gap-1"
                style={{ clipPath: "polygon(0 0,100% 0,calc(100% - 6px) 50%,100% 100%,0 100%)" }}>
                ✦ Bestseller
              </div>
            )}
            {discount > 0 && (
              <div className="absolute top-3 right-3 bg-white border border-gray-200 text-gray-800 text-[11px] font-bold px-2 py-1 rounded-lg shadow-sm">
                {discount}% OFF
              </div>
            )}
            {/* Rating chip on image */}
            {avgRating > 0 && (
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm border border-gray-100">
                <BsStarFill className="h-3 w-3 text-amber-400" />
                <span className="text-xs font-bold text-gray-700">{avgRating}</span>
                {selectedVariant?.attributes?.[0] && (
                  <>
                    <span className="text-gray-300 text-xs">|</span>
                    <span className="text-xs text-gray-500">{selectedVariant.attributes[0].value}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => {
                const isActive = currentImg?.url === img.url;
                return (
                  <button
                    key={idx}
                    onClick={() => setMainImage(img)}
                    className={`flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border-2 transition-all bg-gray-50 ${isActive ? "border-trayalife-500 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <Image src={resolveUrl(img)} alt={`${product.name} ${idx + 1}`} width={72} height={72} className="w-full h-full object-contain p-1" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: Product Info ── */}
        <div className="flex flex-col gap-4">
          {/* Brand */}
          {product.brand && (
            <Link href={`/brand/${product.brand.slug || ""}`} className="text-trayalife-500 text-sm font-semibold hover:underline w-fit">
              {product.brand.name || product.brand}
            </Link>
          )}

          {/* Name + share */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug font-jost">{product.name}</h1>
            <button className="flex-shrink-0 p-2 text-gray-400 hover:text-trayalife-500 hover:bg-trayalife-50 rounded-full transition-colors">
              <FiShare2 className="h-4 w-4" />
            </button>
          </div>

          {/* Subtitle */}
          {product.shortDescription && (
            <p className="text-sm text-gray-500 leading-relaxed">{product.shortDescription}</p>
          )}

          {/* Rating row */}
          {avgRating > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-[#1a7a5e] text-white text-sm font-bold px-2.5 py-1 rounded-full">
                <BsStarFill className="h-3 w-3" />
                <span>{avgRating}</span>
              </div>
              <span className="text-sm text-gray-500">
                ({totalReviews} Rating{totalReviews !== 1 ? "s" : ""}{product.reviewCount ? ` | ${product.reviewCount} Review${product.reviewCount !== 1 ? "s" : ""}` : ""})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="py-3 border-y border-gray-100">
            {initialLoading ? (
              <div className="h-10 w-40 bg-gray-100 animate-pulse rounded" />
            ) : !showPrice ? (
              <p className="text-amber-600 font-medium text-sm">Login to view price</p>
            ) : (
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-bold text-gray-900 font-jost">{formatCurrency(currentPrice)}</span>
                {originalPrice > currentPrice && (
                  <>
                    <span className="text-lg text-gray-400 line-through">{formatCurrency(originalPrice)}</span>
                    <span className="text-sm font-bold text-emerald-600">{discount}% OFF</span>
                  </>
                )}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes</p>
          </div>

          {/* Attribute selectors */}
          {product.attributeOptions?.length > 0 && (
            <div className="space-y-4">
              {product.attributeOptions.map((attribute) => {
                const availableValues = getAvailableValuesForAttribute(attribute.id);
                const selectedValueId = selectedAttributes[attribute.id];
                return (
                  <div key={attribute.id}>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Select {attribute.name}
                      {selectedValueId && (
                        <span className="ml-2 font-normal text-gray-400 text-xs">
                          — {attribute.values?.find((v) => v.id === selectedValueId)?.value}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableValues.length > 0 ? availableValues.map((value) => {
                        const isSelected = selectedValueId === value.id;
                        return (
                          <button
                            key={value.id}
                            onClick={() => handleAttributeChange(attribute.id, value.id)}
                            className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition-all ${isSelected
                              ? "border-trayalife-500 bg-trayalife-50 text-trayalife-500"
                              : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                          >
                            {value.value}
                          </button>
                        );
                      }) : (
                        <p className="text-xs text-gray-400">No options available</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Stock */}
          {selectedVariant && (
            <div className="flex items-center gap-2">
              {(selectedVariant.stock > 0 || selectedVariant.quantity > 0) ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  <FiCheckCircle className="h-3 w-3" /> In Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                  <FiAlertCircle className="h-3 w-3" /> Out of Stock
                </span>
              )}
            </div>
          )}

          {/* Cart success */}
          {cartSuccess && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
              <FiCheckCircle className="h-4 w-4 flex-shrink-0" />
              Added to cart successfully!
            </div>
          )}

          {/* Quantity + CTAs */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Quantity */}
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= (selectedVariant?.moq || 1) || isAddingToCart}
                className="px-3 py-2.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <FiMinus className="h-4 w-4" />
              </button>
              <span className="px-4 py-2.5 font-semibold text-gray-800 min-w-[44px] text-center border-x border-gray-200">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(1)}
                disabled={isAddingToCart}
                className="px-3 py-2.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <FiPlus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart + Wishlist */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || (selectedVariant && (selectedVariant.stock === 0 && selectedVariant.quantity === 0))}
              className="flex-1 flex items-center justify-center gap-2 bg-trayalife-500 hover:bg-trayalife-600 text-white font-bold py-3.5 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed font-jost"
            >
              {isAddingToCart ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Adding…</>
              ) : (
                <>Add to Cart <span className="text-lg font-light">+</span></>
              )}
            </button>

            <button
              onClick={handleAddToWishlist}
              disabled={isAddingToWishlist}
              className={`flex items-center gap-2 border-2 rounded-2xl px-5 py-3.5 font-semibold text-sm transition-all duration-200 font-jost ${isInWishlist
                ? "border-red-400 text-red-500 bg-red-50 hover:bg-red-100"
                : "border-gray-200 text-gray-600 hover:border-trayalife-500 hover:text-trayalife-500 hover:bg-trayalife-50"}`}
            >
              <FiHeart className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`} />
              <span className="hidden sm:inline">{isInWishlist ? "Wishlisted" : "Add to Wishlist"}</span>
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mt-1">
            {[
              { icon: FiTruck, text: "Free delivery above ₹999" },
              { icon: FiRefreshCw, text: "Easy 30-day returns" },
              { icon: FiShield, text: "100% authentic" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-xl text-center border border-gray-100">
                <Icon className="h-4 w-4 text-trayalife-500" />
                <span className="text-[10px] text-gray-500 leading-tight">{text}</span>
              </div>
            ))}
          </div>

          {/* SKU / Category */}
          <div className="text-xs text-gray-400 space-y-1 pt-1 border-t border-gray-100">
            {selectedVariant?.sku && <p>SKU: <span className="text-gray-600">{selectedVariant.sku}</span></p>}
            {product.category && (
              <p>Category: <Link href={`/category/${product.category.slug}`} className="text-trayalife-500 hover:underline">{product.category.name}</Link></p>
            )}
          </div>
        </div>
      </div>

      {/* ── Product Description Tabs ── */}
      <div className="mb-10 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-white overflow-x-auto">
          {["about", "how-to-use", "ingredients", "more-info"].map((tab) => {
            const labels = { "about": "About", "how-to-use": "How to Use", "ingredients": "Ingredients", "more-info": "More Information" };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === tab
                  ? "border-trayalife-500 text-trayalife-500"
                  : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
        <div className="p-5 md:p-6 text-sm text-gray-700 leading-relaxed">
          {activeTab === "about" && (
            <div className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description || "<p>No description available.</p>" }} />
          )}
          {activeTab === "how-to-use" && (
            <div>
              {product.directions ? (
                <p className="leading-relaxed">{product.directions}</p>
              ) : (
                <p className="text-gray-400">No usage instructions provided.</p>
              )}
            </div>
          )}
          {activeTab === "ingredients" && (
            <div>
              {product.ingredients ? (
                <p className="leading-relaxed">{product.ingredients}</p>
              ) : (
                <p className="text-gray-400">Ingredient information not available.</p>
              )}
            </div>
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

      {/* ── Ratings & Reviews ── */}
      <div className="mb-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 font-jost">Ratings and Reviews</h2>

        {totalReviews > 0 ? (
          <>
            {/* Rating summary */}
            <div className="flex flex-col sm:flex-row gap-6 mb-8 p-5 bg-gray-50 rounded-2xl border border-gray-100">
              {/* Big number */}
              <div className="flex flex-col items-center justify-center sm:min-w-[120px] text-center">
                <span className="text-5xl font-bold text-gray-900 font-jost">{Number(avgRating).toFixed(1)}</span>
                <span className="text-gray-400 text-sm">/5</span>
                <StarDisplay rating={avgRating} size="h-4 w-4" />
                <p className="text-xs text-gray-400 mt-1">Rated by <strong className="text-gray-600">{totalReviews} verified</strong> customers</p>
              </div>

              {/* Bars */}
              <div className="flex-1 space-y-2">
                {ratingCounts.map(({ star, count }) => {
                  const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  const colors = { 5: "#1a7a5e", 4: "#2a9d6e", 3: "#f4a823", 2: "#f97316", 1: "#ef4444" };
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-8 justify-end">
                        <span className="text-xs font-semibold text-gray-600">{star}</span>
                        <BsStarFill className="h-3 w-3" style={{ color: colors[star] }} />
                      </div>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: colors[star] }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-5 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {reviews.slice(0, 6).map((review) => (
                <div key={review.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 bg-trayalife-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      <BsStarFill className="h-2.5 w-2.5" />
                      {review.rating}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  {review.title && (
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">{review.title}</h4>
                  )}
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

        {/* Write review */}
        <ReviewSection product={product} />
      </div>

      {/* ── Related Products ── */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-5 font-jost">Try Similar Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {relatedProducts.slice(0, 10).map((p) => (
              <ProducCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
