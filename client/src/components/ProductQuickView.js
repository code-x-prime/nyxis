"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchApi, formatCurrency, getImageUrl } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  FiStar as Star,
  FiShoppingCart as ShoppingCart,
  FiCheckCircle as CheckCircle,
  FiAlertCircle as AlertCircle,
  FiChevronLeft as ChevronLeft,
  FiChevronRight as ChevronRight,
  FiPlus as Plus,
  FiMinus as Minus,
} from "react-icons/fi";
import { useAddVariantToCart } from "@/lib/cart-utils";

export default function ProductQuickView({ product, open, onOpenChange }) {
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({}); // For other attributes
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [effectivePriceInfo, setEffectivePriceInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [success, setSuccess] = useState(false);
  const { addVariantToCart } = useAddVariantToCart();
  const [productDetails, setProductDetails] = useState(null);
  const [imgSrc, setImgSrc] = useState("");
  const [availableCombinations, setAvailableCombinations] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [priceVisibilitySettings, setPriceVisibilitySettings] = useState(null);
  const { isAuthenticated } = useAuth();

  // Reset states when product changes or dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedColor(null);
      setSelectedSize(null);
      setSelectedAttributes({});
      setSelectedVariant(null);
      setQuantity(1);
      setError(null);
      setSuccess(false);
      setProductDetails(null);
      setImgSrc("");
      setAvailableCombinations([]);
      setInitialLoading(true);
      return;
    }

    if (product) {
      setImgSrc(product.image || "/placeholder.jpg");
    }
  }, [product, open]);

  // Fetch price visibility settings
  useEffect(() => {
    const fetchPriceVisibilitySettings = async () => {
      try {
        const response = await fetchApi("/public/price-visibility-settings");
        if (response?.data) {
          setPriceVisibilitySettings(response.data);
        }
      } catch (error) {
        console.error("Error fetching price visibility settings:", error);
      }
    };

    fetchPriceVisibilitySettings();
  }, []);

  // Note: Order maps are no longer needed with dynamic attributes system
  // Attributes are now handled through the product's attributeOptions

  // Fetch product details when product changes
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!product || !open) {
        setProductDetails(null);
        return;
      }

      setLoading(true);
      setInitialLoading(true);
      setError(null);

      try {
        const response = await fetchApi(`/public/products/${product.slug}`);

        if (response?.data?.product) {
          const productData = response.data.product;

          // Extract colorOptions and sizeOptions from attributeOptions
          if (
            productData.attributeOptions &&
            Array.isArray(productData.attributeOptions)
          ) {
            const colorAttr = productData.attributeOptions.find(
              (attr) => attr.name === "Color"
            );
            const sizeAttr = productData.attributeOptions.find(
              (attr) => attr.name === "Size"
            );

            if (colorAttr && colorAttr.values) {
              productData.colorOptions = colorAttr.values.map((val) => ({
                id: val.id,
                name: val.value,
                hexCode: val.hexCode || null,
                image: val.image || null,
              }));
            }

            if (sizeAttr && sizeAttr.values) {
              productData.sizeOptions = sizeAttr.values.map((val) => ({
                id: val.id,
                name: val.value,
                display: val.value,
              }));
            }
          }

          setProductDetails(productData);

          // Set initial image
          if (productData.images && productData.images.length > 0) {
            const firstImage =
              productData.images.find((img) => img.isPrimary) ||
              productData.images[0];
            setImgSrc(getImageUrl(firstImage.url) || "/placeholder.jpg");
          } else if (productData.image) {
            setImgSrc(getImageUrl(productData.image) || "/placeholder.jpg");
          }

          // Extract all available combinations from variants using attributes
          if (productData.variants && productData.variants.length > 0) {
            const combinations = productData.variants
              .filter(
                (v) =>
                  v.isActive !== false &&
                  (v.quantity > 0 || v.quantity === undefined)
              )
              .map((variant) => {
                // Extract all attributes dynamically - store as attributeId -> attributeValueId mapping
                const attributeMap = {};
                let colorId = null;
                let sizeId = null;

                if (variant.attributes && Array.isArray(variant.attributes)) {
                  variant.attributes.forEach((attr) => {
                    // Find attributeId from attributeOptions
                    const attrOption = productData.attributeOptions?.find(
                      (opt) => opt.name === attr.attribute
                    );
                    if (attrOption) {
                      attributeMap[attrOption.id] = attr.attributeValueId;
                    }

                    // Also store Color and Size separately for backward compatibility
                    if (attr.attribute === "Color") {
                      colorId = attr.attributeValueId;
                    } else if (attr.attribute === "Size") {
                      sizeId = attr.attributeValueId;
                    }
                  });
                }

                // Fallback to legacy colorId/sizeId for backward compatibility
                if (!colorId)
                  colorId = variant.colorId || variant.color?.id || null;
                if (!sizeId)
                  sizeId = variant.sizeId || variant.size?.id || null;

                // Ensure price is a number
                const price =
                  typeof variant.price === "string"
                    ? parseFloat(variant.price)
                    : variant.price;
                const salePrice = variant.salePrice
                  ? typeof variant.salePrice === "string"
                    ? parseFloat(variant.salePrice)
                    : variant.salePrice
                  : null;

                return {
                  colorId,
                  sizeId,
                  attributeMap, // Store all attributes
                  variant: {
                    ...variant,
                    price,
                    salePrice,
                  },
                };
              });

            setAvailableCombinations(combinations);

            // Set default selections - prioritize color then size
            if (productData.colorOptions?.length > 0) {
              const firstColor = productData.colorOptions[0];
              setSelectedColor(firstColor);

              // Find matching variant for first color
              const matchingVariant = combinations.find(
                (combo) => combo.colorId === firstColor.id
              );

              if (matchingVariant && productData.sizeOptions?.length > 0) {
                const matchingSize = productData.sizeOptions.find(
                  (size) => size.id === matchingVariant.sizeId
                );

                if (matchingSize) {
                  setSelectedSize(matchingSize);
                  setSelectedVariant(matchingVariant.variant);
                } else if (productData.sizeOptions.length > 0) {
                  // If no exact match, try to find any available size for this color
                  const availableSizes = combinations
                    .filter((c) => c.colorId === firstColor.id)
                    .map((c) => c.sizeId);

                  const firstAvailableSize = productData.sizeOptions.find(
                    (size) => availableSizes.includes(size.id)
                  );

                  if (firstAvailableSize) {
                    setSelectedSize(firstAvailableSize);
                    const variantMatch = combinations.find(
                      (c) =>
                        c.colorId === firstColor.id &&
                        c.sizeId === firstAvailableSize.id
                    );
                    if (variantMatch) {
                      setSelectedVariant(variantMatch.variant);
                    }
                  }
                }
              } else if (matchingVariant) {
                // No sizes, just set the variant
                setSelectedVariant(matchingVariant.variant);
              }
            } else if (
              productData.sizeOptions?.length > 0 &&
              combinations.length > 0
            ) {
              // No colors, but has sizes - select first available size
              // Sizes are already sorted by order in productData.sizeOptions
              const firstSize = productData.sizeOptions[0];
              setSelectedSize(firstSize);
              const matchingVariant = combinations.find(
                (combo) => combo.sizeId === firstSize.id
              );
              if (matchingVariant) {
                setSelectedVariant(matchingVariant.variant);
                const moq = matchingVariant.variant.moq || 1;
                setQuantity(moq);
                const priceInfo = getEffectivePrice(matchingVariant.variant, moq);
                setEffectivePriceInfo(priceInfo);
              } else {
                // Fallback: find any variant with this size
                const variantMatch = productData.variants.find(
                  (v) =>
                    (v.size?.id === firstSize.id ||
                      v.sizeId === firstSize.id) &&
                    v.isActive
                );
                if (variantMatch) {
                  setSelectedVariant(variantMatch);
                  const moq = variantMatch.moq || 1;
                  setQuantity(moq);
                }
              }
            } else if (productData.variants.length > 0) {
              // Just set first available variant
              const firstAvailableVariant =
                productData.variants.find(
                  (v) =>
                    v.isActive !== false &&
                    (v.stock > 0 || v.quantity > 0 || v.quantity === undefined)
                ) || productData.variants[0];
              setSelectedVariant(firstAvailableVariant);
              const moq = firstAvailableVariant.moq || 1;
              setQuantity(moq);
              const priceInfo = getEffectivePrice(firstAvailableVariant, moq);
              setEffectivePriceInfo(priceInfo);
            }
          }
        } else {
          setError("Product details not available");
        }
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError(err?.message || "Failed to load product details");
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    fetchProductDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.slug, product?.id, open]);

  // Get available sizes for a specific color
  const getAvailableSizesForColor = (colorId) => {
    if (!colorId) {
      // If no color, return all available sizes
      return availableCombinations
        .filter((combo) => combo.sizeId)
        .map((combo) => combo.sizeId)
        .filter((id, index, self) => self.indexOf(id) === index);
    }
    return availableCombinations
      .filter((combo) => combo.colorId === colorId && combo.sizeId)
      .map((combo) => combo.sizeId)
      .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
  };

  // Get available colors for a specific size
  const getAvailableColorsForSize = (sizeId) => {
    if (!sizeId) return [];
    return availableCombinations
      .filter((combo) => combo.sizeId === sizeId && combo.colorId)
      .map((combo) => combo.colorId)
      .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
  };

  // Handle color change
  const handleColorChange = (color) => {
    setSelectedColor(color);
    const availableSizeIds = getAvailableSizesForColor(color.id);

    if (
      productDetails?.sizeOptions?.length > 0 &&
      availableSizeIds.length > 0
    ) {
      if (selectedSize && availableSizeIds.includes(selectedSize.id)) {
        const matchingVariant = availableCombinations.find(
          (combo) =>
            combo.colorId === color.id && combo.sizeId === selectedSize.id
        );
        if (matchingVariant) {
          setSelectedVariant(matchingVariant.variant);
        }
      } else {
        const firstAvailableSize = productDetails.sizeOptions.find((size) =>
          availableSizeIds.includes(size.id)
        );
        if (firstAvailableSize) {
          setSelectedSize(firstAvailableSize);
          const matchingVariant = availableCombinations.find(
            (combo) =>
              combo.colorId === color.id &&
              combo.sizeId === firstAvailableSize.id
          );
          if (matchingVariant) {
            setSelectedVariant(matchingVariant.variant);
          }
        }
      }
    } else {
      setSelectedSize(null);
      setSelectedVariant(null);
    }
  };

  // Handle size change
  const handleSizeChange = (size) => {
    setSelectedSize(size);

    if (productDetails?.colorOptions?.length > 0) {
      const availableColorIds = getAvailableColorsForSize(size.id);
      if (selectedColor && availableColorIds.includes(selectedColor.id)) {
        const matchingVariant = availableCombinations.find(
          (combo) =>
            combo.sizeId === size.id && combo.colorId === selectedColor.id
        );
        if (matchingVariant) {
          setSelectedVariant(matchingVariant.variant);
        }
      } else {
        const firstAvailableColor = productDetails.colorOptions.find((color) =>
          availableColorIds.includes(color.id)
        );
        if (firstAvailableColor) {
          setSelectedColor(firstAvailableColor);
          const matchingVariant = availableCombinations.find(
            (combo) =>
              combo.sizeId === size.id &&
              combo.colorId === firstAvailableColor.id
          );
          if (matchingVariant) {
            setSelectedVariant(matchingVariant.variant);
            const moq = matchingVariant.variant.moq || 1;
            const newQty = quantity < moq ? moq : quantity;
            if (quantity < moq) setQuantity(newQty);
            const priceInfo = getEffectivePrice(matchingVariant.variant, newQty);
            setEffectivePriceInfo(priceInfo);
          }
        }
      }
    } else {
      const matchingVariant = availableCombinations.find(
        (combo) => combo.sizeId === size.id
      );
      if (matchingVariant) {
        setSelectedVariant(matchingVariant.variant);
        const moq = matchingVariant.variant.moq || 1;
        if (quantity < moq) setQuantity(moq);
      }
    }
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    setAddingToCart(true);
    setError(null);
    setSuccess(false);

    let variantToAdd = selectedVariant;

    if (!variantToAdd && productDetails?.variants?.length > 0) {
      variantToAdd = productDetails.variants[0];
    }

    if (!variantToAdd) {
      setError("No product variant available");
      setAddingToCart(false);
      return;
    }

    try {
      const result = await addVariantToCart(
        variantToAdd,
        quantity,
        productDetails?.name || product?.name
      );
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      } else {
        setError("Failed to add to cart. Please try again.");
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      setError("Failed to add to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  // Helper to parse price (handle Decimal types from API)
  const parsePrice = (price) => {
    if (!price) return 0;
    if (typeof price === "number") return price;
    if (typeof price === "string") return parseFloat(price) || 0;
    return 0;
  };

  // Calculate effective price based on quantity and pricing slabs
  const getEffectivePrice = (variant, qty) => {
    if (!variant) return null;

    const baseSalePrice = parsePrice(variant.salePrice);
    const basePrice = parsePrice(variant.price);
    const originalPrice = baseSalePrice > 0 && baseSalePrice < basePrice ? baseSalePrice : basePrice;

    // Check pricing slabs
    if (variant.pricingSlabs && variant.pricingSlabs.length > 0) {
      // Sort slabs by minQty descending to find the best match
      const sortedSlabs = [...variant.pricingSlabs].sort((a, b) => b.minQty - a.minQty);

      for (const slab of sortedSlabs) {
        if (qty >= slab.minQty && (slab.maxQty === null || qty <= slab.maxQty)) {
          return {
            price: slab.price,
            originalPrice: originalPrice,
            source: 'SLAB',
            slab: slab
          };
        }
      }
    }

    // Return default price
    return {
      price: originalPrice,
      originalPrice: originalPrice,
      source: 'DEFAULT',
      slab: null
    };
  };

  // Get price data - single source of truth
  const getPriceData = () => {
    if (initialLoading || loading) {
      return { loading: true };
    }

    // Priority 1: Selected variant with quantity-based pricing
    if (selectedVariant) {
      // Use cached price info or calculate fresh
      const priceInfo = effectivePriceInfo || getEffectivePrice(selectedVariant, quantity);

      if (priceInfo) {
        const baseSalePrice = parsePrice(selectedVariant.salePrice);
        const basePrice = parsePrice(selectedVariant.price);
        const originalBasePrice = baseSalePrice > 0 && baseSalePrice < basePrice ? basePrice : baseSalePrice || basePrice;

        return {
          currentPrice: priceInfo.price,
          originalPrice: priceInfo.source === 'SLAB' && priceInfo.originalPrice > priceInfo.price
            ? priceInfo.originalPrice
            : (baseSalePrice > 0 && baseSalePrice < basePrice ? basePrice : null),
          loading: false,
          isSlabPrice: priceInfo.source === 'SLAB',
        };
      }

      // Fallback to original logic
      const salePrice = parsePrice(selectedVariant.salePrice);
      const price = parsePrice(selectedVariant.price);
      return {
        currentPrice: salePrice > 0 && salePrice < price ? salePrice : price,
        originalPrice: salePrice > 0 && salePrice < price ? price : null,
        loading: false,
        isSlabPrice: false,
      };
    }

    // Priority 2: Product details from API
    if (productDetails) {
      const basePrice = parsePrice(productDetails.basePrice);
      const regularPrice = parsePrice(productDetails.regularPrice);
      const hasSale =
        productDetails.hasSale && basePrice > 0 && regularPrice > basePrice;
      return {
        currentPrice: basePrice,
        originalPrice: hasSale ? regularPrice : null,
        loading: false,
      };
    }

    // Priority 3: Fallback to product prop
    if (product) {
      const basePrice = parsePrice(product.basePrice);
      const regularPrice = parsePrice(product.regularPrice);
      const hasSale =
        product.hasSale && basePrice > 0 && regularPrice > basePrice;
      return {
        currentPrice: basePrice,
        originalPrice: hasSale ? regularPrice : null,
        loading: false,
      };
    }

    return { loading: false, currentPrice: 0, originalPrice: null };
  };

  // Format price display - single display
  const getPriceDisplay = () => {
    // Check price visibility settings
    if (priceVisibilitySettings?.hidePricesForGuests && !isAuthenticated) {
      return (
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold text-gray-400">
            Login to view price
          </span>
          <p className="text-sm text-gray-500">Please log in to see pricing information</p>
        </div>
      );
    }

    // If settings are still loading, hide prices to prevent flash
    if (priceVisibilitySettings === null) {
      return (
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold text-gray-400">
            Login to view price
          </span>
          <p className="text-sm text-gray-500">Please log in to see pricing information</p>
        </div>
      );
    }

    const priceData = getPriceData();

    if (priceData.loading) {
      return <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>;
    }

    if (
      priceData.originalPrice &&
      priceData.originalPrice > priceData.currentPrice
    ) {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold text-[#136C5B]">
              {formatCurrency(priceData.currentPrice)}
            </span>
            <span className="text-lg text-gray-500 line-through">
              {formatCurrency(priceData.originalPrice)}
            </span>
          </div>
          {priceData.isSlabPrice && (
            <p className="text-xs text-green-600 font-medium">
              Bulk pricing applied for {quantity} units
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-bold text-[#136C5B]">
          {formatCurrency(priceData.currentPrice || 0)}
        </span>
        {priceData.isSlabPrice && (
          <p className="text-xs text-green-600 font-medium">
            Bulk pricing applied for {quantity} units
          </p>
        )}
      </div>
    );
  };

  // Get all product images - using useMemo to avoid recalculating
  const allImages = useMemo(() => {
    if (!product) return [];

    const displayProduct = productDetails || product;
    const images = [];

    // Priority 1: Selected variant images
    if (selectedVariant?.images?.length > 0) {
      selectedVariant.images
        .sort((a, b) => {
          // Sort by isPrimary first, then by order
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return (a.order || 0) - (b.order || 0);
        })
        .forEach((img) => {
          const url = getImageUrl(img.url);
          if (url && !images.includes(url)) images.push(url);
        });
    }

    // Priority 2: Product images
    if (displayProduct?.images?.length > 0) {
      displayProduct.images
        .sort((a, b) => {
          // Sort by isPrimary first, then by order
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return (a.order || 0) - (b.order || 0);
        })
        .forEach((img) => {
          const url = getImageUrl(img.url);
          if (url && !images.includes(url)) images.push(url);
        });
    }

    // Priority 3: Variant images from other variants
    if (displayProduct?.variants?.length > 0 && images.length === 0) {
      for (const variant of displayProduct.variants) {
        if (variant.images?.length > 0) {
          variant.images
            .sort((a, b) => {
              if (a.isPrimary && !b.isPrimary) return -1;
              if (!a.isPrimary && b.isPrimary) return 1;
              return (a.order || 0) - (b.order || 0);
            })
            .forEach((img) => {
              const url = getImageUrl(img.url);
              if (url && !images.includes(url)) images.push(url);
            });
          break; // Just get images from first variant with images
        }
      }
    }

    // Priority 4: Fallback images
    if (images.length === 0) {
      if (displayProduct?.image) {
        const url = getImageUrl(displayProduct.image);
        if (url) images.push(url);
      } else if (imgSrc) {
        images.push(imgSrc);
      } else {
        images.push("/placeholder.jpg");
      }
    }

    return images; // Already deduplicated
  }, [productDetails, selectedVariant, product, imgSrc]);

  // Reset image index when variant or product changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedVariant?.id, productDetails?.id, product?.id]);

  if (!product) return null;

  const displayProduct = productDetails || product;

  // Calculate discount percentage - using single source of truth
  const getDiscountPercentage = () => {
    const priceData = getPriceData();

    if (
      priceData.loading ||
      !priceData.originalPrice ||
      !priceData.currentPrice
    ) {
      return null;
    }

    if (priceData.originalPrice > priceData.currentPrice) {
      return Math.round(
        ((priceData.originalPrice - priceData.currentPrice) /
          priceData.originalPrice) *
        100
      );
    }

    return null;
  };

  const discountPercentage = getDiscountPercentage();
  const priceData = getPriceData();

  // Strip HTML tags from description
  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").trim();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-w-[96vw] max-h-[92vh] overflow-hidden p-0 gap-0 rounded-2xl border-0 shadow-2xl">
        {loading && !productDetails ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-trayalife-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading product…</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row h-full max-h-[92vh]">

            {/* ── Left: Image ── */}
            <div className="relative md:w-[45%] bg-gray-50 flex-shrink-0 flex flex-col">
              {/* Discount badge */}
              {discountPercentage && (
                <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                  {discountPercentage}% OFF
                </div>
              )}

              {/* Main image */}
              <div className="relative flex-1 min-h-[280px] md:min-h-0 bg-white">
                <Image
                  src={allImages[currentImageIndex] || "/placeholder.jpg"}
                  alt={displayProduct.name}
                  fill
                  className="object-contain p-6"
                  sizes="(max-width: 768px) 100vw, 45vw"
                  priority
                />
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((p) => p === 0 ? allImages.length - 1 : p - 1)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md transition-all z-10"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((p) => p === allImages.length - 1 ? 0 : p + 1)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md transition-all z-10"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail strip */}
              {allImages.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto border-t border-gray-100 bg-white">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all bg-gray-50 ${currentImageIndex === idx ? "border-trayalife-500 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <Image src={img} alt={`${displayProduct.name} ${idx + 1}`} fill className="object-contain p-1" sizes="56px" />
                    </button>
                  ))}
                </div>
              )}

              {/* Rating chip bottom-left */}
              {displayProduct.avgRating > 0 && (
                <div className="absolute bottom-[4.5rem] left-4 bg-white/95 border border-gray-100 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm">
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-gray-700">{displayProduct.avgRating}</span>
                  <span className="text-gray-300 text-xs">|</span>
                  <span className="text-xs text-gray-500">{displayProduct.reviewCount || 0} reviews</span>
                </div>
              )}
            </div>

            {/* ── Right: Details ── */}
            <div className="flex-1 flex flex-col overflow-y-auto bg-white">
              <div className="p-5 md:p-7 space-y-4 flex-1">

                {/* Success / Error */}
                {success && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    Added to cart!
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Brand */}
                {displayProduct.brand && (
                  <p className="text-xs font-bold text-trayalife-500 uppercase tracking-wider">
                    {displayProduct.brand.name || displayProduct.brand}
                  </p>
                )}

                {/* Name */}
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug font-jost uppercase tracking-tight">
                  {displayProduct.name}
                </h2>

                {/* Price */}
                <div>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    {getPriceDisplay()}
                    {discountPercentage > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {discountPercentage}% OFF
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes</p>
                </div>

                {/* Short description — strip HTML */}
                {displayProduct.description && (
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
                    {stripHtml(displayProduct.shortDescription || displayProduct.description)}
                  </p>
                )}

                {/* Stock */}
                {selectedVariant && (
                  <div>
                    {(selectedVariant.stock > 0 || selectedVariant.quantity > 0) ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        In Stock available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full">
                        <AlertCircle className="h-3 w-3" />
                        Out of Stock
                      </span>
                    )}
                  </div>
                )}

                {/* Color Selection */}
                {productDetails?.colorOptions?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Select Color</p>
                    <div className="flex flex-wrap gap-3">
                      {productDetails.colorOptions.map((color) => {
                        const isAvailable = getAvailableSizesForColor(color.id).length > 0 || availableCombinations.some(c => c.colorId === color.id);
                        const isSelected = selectedColor?.id === color.id;
                        return (
                          <button key={color.id} type="button" onClick={() => handleColorChange(color)} disabled={!isAvailable}
                            className={`flex flex-col items-center gap-1.5 transition-all disabled:opacity-40`}>
                            <div className={`w-10 h-10 rounded-full border-2 transition-all ${isSelected ? "border-trayalife-500 shadow-md scale-110" : "border-gray-300 hover:border-gray-400"}`}
                              style={{ backgroundColor: color.hexCode || "#ccc" }} />
                            <span className={`text-[10px] font-medium ${isSelected ? "text-trayalife-500" : "text-gray-600"}`}>{color.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size Selection */}
                {productDetails?.sizeOptions?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Select Size</p>
                    <div className="flex flex-wrap gap-2">
                      {productDetails.sizeOptions.map((size) => {
                        const isAvailable = selectedColor
                          ? availableCombinations.some(c => c.colorId === selectedColor.id && c.sizeId === size.id)
                          : availableCombinations.some(c => c.sizeId === size.id);
                        const isSelected = selectedSize?.id === size.id;
                        return (
                          <button key={size.id} type="button" onClick={() => handleSizeChange(size)} disabled={!isAvailable}
                            className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${isSelected
                              ? "border-trayalife-500 bg-trayalife-50 text-trayalife-500"
                              : isAvailable ? "border-gray-200 text-gray-700 hover:border-gray-400 bg-white"
                                : "border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed"}`}>
                            {size.display || size.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Other dynamic attributes */}
                {productDetails?.attributeOptions?.filter(a => a.name !== "Color" && a.name !== "Size" && a.values?.length > 0).map((attribute) => {
                  const checkAvailability = (attrValueId) => availableCombinations.some((combo) => {
                    const matchesColor = !selectedColor || combo.colorId === selectedColor.id;
                    const matchesSize = !selectedSize || combo.sizeId === selectedSize.id;
                    const matchesThisAttr = combo.attributeMap?.[attribute.id] === attrValueId;
                    const matchesOtherAttrs = Object.keys(selectedAttributes).every(attrId =>
                      attrId === attribute.id ? true : combo.attributeMap?.[attrId] === selectedAttributes[attrId]
                    );
                    return matchesColor && matchesSize && matchesThisAttr && matchesOtherAttrs;
                  });

                  const handleAttributeChange = (attrValueId) => {
                    setSelectedAttributes(prev => ({ ...prev, [attribute.id]: attrValueId }));
                    const matchingVariant = availableCombinations.find(combo => {
                      const newAttrs = { ...selectedAttributes, [attribute.id]: attrValueId };
                      return (!selectedColor || combo.colorId === selectedColor.id) &&
                        (!selectedSize || combo.sizeId === selectedSize.id) &&
                        combo.attributeMap?.[attribute.id] === attrValueId &&
                        Object.keys(newAttrs).every(id => combo.attributeMap?.[id] === newAttrs[id]);
                    });
                    if (matchingVariant) setSelectedVariant(matchingVariant.variant);
                  };

                  return (
                    <div key={attribute.id}>
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Select {attribute.name}</p>
                      <div className="flex flex-wrap gap-2">
                        {attribute.values.map((attrValue) => {
                          const isAvailable = checkAvailability(attrValue.id);
                          const isSelected = selectedAttributes[attribute.id] === attrValue.id;
                          return (
                            <button key={attrValue.id} type="button" onClick={() => handleAttributeChange(attrValue.id)} disabled={!isAvailable}
                              className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${isSelected
                                ? "border-trayalife-500 bg-trayalife-50 text-trayalife-500"
                                : isAvailable ? "border-gray-200 text-gray-700 hover:border-gray-400"
                                  : "border-gray-100 text-gray-300 cursor-not-allowed"}`}>
                              {attrValue.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* MOQ notice */}
                {selectedVariant?.moq > 1 && (
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 font-medium">Min. order: {selectedVariant.moq} units</p>
                  </div>
                )}

                {/* QUANTITY */}
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Quantity</p>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden w-fit">
                    <button type="button"
                      className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                      onClick={() => {
                        const moq = selectedVariant?.moq || 1;
                        if (quantity > moq) {
                          const n = quantity - 1;
                          setQuantity(n);
                          if (selectedVariant) setEffectivePriceInfo(getEffectivePrice(selectedVariant, n));
                        }
                      }}
                      disabled={quantity <= (selectedVariant?.moq || 1) || addingToCart}>
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-12 h-10 flex items-center justify-center text-sm font-bold text-gray-800 border-x border-gray-200">
                      {quantity}
                    </span>
                    <button type="button"
                      className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                      onClick={() => {
                        const stock = selectedVariant?.stock || selectedVariant?.quantity || 0;
                        if (!stock || quantity < stock) {
                          const n = quantity + 1;
                          setQuantity(n);
                          if (selectedVariant) setEffectivePriceInfo(getEffectivePrice(selectedVariant, n));
                        }
                      }}
                      disabled={(selectedVariant && (selectedVariant.stock > 0 || selectedVariant.quantity > 0) && quantity >= (selectedVariant.stock || selectedVariant.quantity)) || addingToCart}>
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Sticky CTA ── */}
              <div className="p-5 md:p-7 pt-0 space-y-3 border-t border-gray-50 bg-white">
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={loading || addingToCart || (!selectedVariant && !productDetails?.variants?.length) || (selectedVariant && selectedVariant.stock < 1 && selectedVariant.quantity < 1)}
                    className="flex items-center justify-center gap-2 bg-trayalife-500 hover:bg-trayalife-600 text-white font-jost font-bold py-3.5 rounded-2xl text-sm uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingToCart ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding…</>
                    ) : (
                      <><ShoppingCart className="h-4 w-4" /> Add to Bag</>
                    )}
                  </button>

                </div>
                <Link href={`/products/${displayProduct.slug}`} onClick={() => onOpenChange(false)}
                  className="block text-center text-xs text-trayalife-500 hover:underline font-semibold uppercase tracking-wider">
                  View Full Product Details →
                </Link>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
