"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi, fetchProductsByType } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FiArrowRight, FiZap, FiStar } from "react-icons/fi";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { motion } from "framer-motion";
import BenefitsSec from "@/components/benifit-sec";
import TestimonialsSection from "@/components/TestimonialsSection";
import { useRouter } from "next/navigation";
import SupplementStoreUI from "@/components/SupplementStoreUI";
import CategoryGrid from "@/components/CategoryGrid";
import BrandCarousel from "@/components/BrandCarousel";
import ProducCard from "@/components/ProducCard";
import { DynamicIcon } from "@/components/dynamic-icon";
import ShoppableVideoCarousel from "@/components/ShoppableVideoCarousel";

/* ─────────────────────────────────────────────
   trayalife Section Heading — reusable across all sections
───────────────────────────────────────────── */
const SectionHeading = ({
  title,
  subtitle,
  icon: Icon,
  dark = false,
  align = "center",
}) => (
  <div className={`mb-6 ${align === "center" ? "text-center" : "text-left"}`}>
    {Icon && (
      <span
        className={`inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] mb-2
        ${dark ? "text-trayalife-gold" : "text-trayalife-500"}`}
      >
        <Icon className="h-3 w-3" />
        {title}
        <span
          className={`inline-block w-7 h-[2px] rounded-full ml-1
          ${dark ? "bg-trayalife-gold" : "bg-gradient-to-r from-trayalife-500 to-trayalife-gold"}`}
        />
      </span>
    )}
    <h2
      className={`font-jost font-bold tracking-tight leading-tight
        text-2xl md:text-3xl
        ${dark ? "text-white" : "text-trayalife-dark"}`}
    >
      {title}
    </h2>
    {subtitle && (
      <p
        className={`mt-1.5 text-sm max-w-xl ${align === "center" ? "mx-auto" : ""}
        ${dark ? "text-white/60" : "text-trayalife-gray-400"}`}
      >
        {subtitle}
      </p>
    )}
    <div
      className={`mt-3 h-[3px] w-10 rounded-full ${align === "center" ? "mx-auto" : ""}
      bg-gradient-to-r from-trayalife-500 to-trayalife-gold`}
    />
  </div>
);

/* ─────────────────────────────────────────────
   Hero Carousel
───────────────────────────────────────────── */
// Normalise banner image paths — handles Next.js static imports, full URLs, and CDN-relative paths
const normaliseBannerSrc = (src) => {
  if (!src) return null;
  if (typeof src === "object") return src; // Next.js static import (StaticImageData)
  if (src.startsWith("http")) return src;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${src}`;
};

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [api, setApi] = useState(null);
  const [autoplay, setAutoplay] = useState(true);
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setIsLoading(true);
        const response = await fetchApi("/public/banners");
        if (response?.success && response?.data?.banners?.length > 0) {
          setBanners(response.data.banners);
        } else {
          setBanners([]);
        }
      } catch {
        setBanners([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Fallback slides use local assets — all paths/objects are already valid
  const fallbackSlides = [
    {
      ctaLink: "/products",
      img: "/hero.webp",
      smimg: "/hero-mobile-1.jpg",
      title: "MIN. 50% OFF",
      subtitle: "Premium Beauty Products"
    },
    {
      ctaLink: "/products",
      img: "/hero2.webp",
      smimg: "/hero-mobile-2.jpg",
      title: "BUY 2 GET 2 FREE",
      subtitle: "Goodness Lab Collection"
    },
  ];

  // API banners: normalise both desktop and mobile image paths
  const slides =
    banners.length > 0
      ? banners.map((b, idx) => ({
        ctaLink: b.link || "/products",
        img: normaliseBannerSrc(b.desktopImage) || (idx === 0 ? "/hero-banner-1.jpg" : "/hero-banner-2.jpg"),
        smimg: (normaliseBannerSrc(b.mobileImage) || normaliseBannerSrc(b.desktopImage)) || (idx === 0 ? "/hero-banner-mobile-1.jpg" : "/hero-banner-mobile-2.jpg"),
        title: b.title || "New Collection",
        subtitle: b.subtitle || "Explore Now",
      }))
      : fallbackSlides;

  useEffect(() => {
    if (!api || !autoplay) return;
    const id = setInterval(() => api.scrollNext(), 5000);
    return () => clearInterval(id);
  }, [api, autoplay]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrentSlide(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => api.off("select", onSelect);
  }, [api]);

  if (isLoading) {
    return (
      <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div className="aspect-[4/5] md:aspect-[21/9] w-full bg-gradient-to-br from-trayalife-dark via-trayalife-700 to-trayalife-500 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-14 h-14 border-[3px] border-trayalife-gold border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-white/70 text-sm font-medium tracking-wide font-jost">Loading…</p>
          </div>
        </div>
      </div>
    );
  }

  if (slides.length === 0) return null;

  return (
    <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="relative overflow-hidden w-full">
        <Carousel setApi={setApi} className="w-full" opts={{ loop: true, align: "start" }}>
          <CarouselContent className="-ml-0">
            {slides.map((slide, index) => (
              <CarouselItem key={index} className="pl-0 basis-full">
                {/* Mobile slide — portrait ratio 4:5 */}
                {/* Dimensions: 540 × 675px (optimal for mobile) */}
                <div
                  className="relative w-full cursor-pointer overflow-hidden  md:hidden bg-gradient-to-br from-gray-100 to-gray-200"
                  onClick={() => router.push(slide.ctaLink || "/products")}
                >
                  <Image
                    src={slide.smimg}
                    alt={slide.title || "Banner"}
                    width={1920}
                    height={823}
                    priority={index === 0}
                    className="object-contain w-full h-full"

                  />
                </div>

                {/* Desktop slide — proper banner ratio 16:6 */}
                {/* Dimensions: Optimized horizontal banner */}
                <div
                  className="relative w-full cursor-pointer overflow-hidden hidden md:block aspect-[16/4] bg-gradient-to-br from-gray-100 to-gray-200"
                  onClick={() => router.push(slide.ctaLink || "/products")}
                >
                  <Image
                    src={slide.img}
                    alt={slide.title || "Banner"}
                    priority={index === 0}
                    className="object-contain w-full h-full"
                    width={1920}
                    height={823}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="absolute left-3 top-1/2 hidden md:flex -translate-y-1/2 h-10 w-10 z-30 bg-black/20 hover:bg-black/40 border-white/20 text-white backdrop-blur-sm rounded-full" />
          <CarouselNext className="absolute right-3 top-1/2 hidden md:flex -translate-y-1/2 h-10 w-10 z-30 bg-black/20 hover:bg-black/40 border-white/20 text-white backdrop-blur-sm rounded-full" />

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={`rounded-full transition-all duration-300 ${i === currentSlide
                  ? "bg-trayalife-gold w-5 h-2"
                  : "bg-white/40 hover:bg-white/60 w-2 h-2"
                  }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Autoplay toggle */}
          <div className="absolute top-4 right-4 z-30 hidden md:flex">
            <button
              className="h-8 w-8 flex items-center justify-center bg-black/20 hover:bg-black/40 border border-white/20 text-white backdrop-blur-sm rounded-full transition"
              onClick={() => setAutoplay(!autoplay)}
              aria-label={autoplay ? "Pause" : "Play"}
            >
              {autoplay ? (
                <div className="flex gap-0.5">
                  <div className="w-[3px] h-3 bg-white rounded-sm" />
                  <div className="w-[3px] h-3 bg-white rounded-sm" />
                </div>
              ) : (
                <div className="w-0 h-0 border-t-[5px] border-b-[5px] border-l-[8px] border-transparent border-l-white ml-0.5" />
              )}
            </button>
          </div>
        </Carousel>
      </div>
    </div>
  );
};


/* ─────────────────────────────────────────────
   Announcement Banner
───────────────────────────────────────────── */
const AnnouncementBanner = () => (
  <div className="bg-trayalife-dark py-2.5 overflow-hidden">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-center gap-3 text-center">
        <span className="text-trayalife-gold text-sm">✦</span>
        <p className="text-white text-xs md:text-sm font-medium tracking-wide font-jost">
          Spend ₹999 or more and unlock a scratch card — win exciting goodies!
        </p>
        <span className="text-trayalife-gold text-sm">✦</span>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Flash Sale Countdown
───────────────────────────────────────────── */
const FlashSaleCountdown = ({ endTime }) => {
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const end = new Date(endTime).getTime();
    const id = setInterval(() => {
      const dist = end - Date.now();
      if (dist < 0) { setTime({ hours: 0, minutes: 0, seconds: 0 }); clearInterval(id); return; }
      setTime({
        hours: Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((dist % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const Unit = ({ val, label }) => (
    <div className="flex flex-col items-center">
      <div className="bg-trayalife-dark border border-trayalife-gold/30 rounded-lg px-4 py-2.5 min-w-[64px] text-center shadow-gold">
        <div className="text-2xl font-bold text-white font-jost tabular-nums">
          {String(val).padStart(2, "0")}
        </div>
        <div className="text-[0.6rem] text-trayalife-gold uppercase tracking-widest mt-0.5">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="flex justify-center items-center gap-2 md:gap-3 mb-6">
      <Unit val={time.hours} label="Hrs" />
      <span className="text-trayalife-gold font-bold text-xl pb-4">:</span>
      <Unit val={time.minutes} label="Min" />
      <span className="text-trayalife-gold font-bold text-xl pb-4">:</span>
      <Unit val={time.seconds} label="Sec" />
    </div>
  );
};

/* ─────────────────────────────────────────────
   Featured Products Carousel
───────────────────────────────────────────── */
const ProductSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden border border-trayalife-gray-200 animate-pulse">
    <div className="aspect-square bg-trayalife-gray-100" />
    <div className="p-3 space-y-2">
      <div className="h-3.5 bg-trayalife-gray-100 rounded w-3/4" />
      <div className="h-3.5 bg-trayalife-gray-100 rounded w-1/2" />
      <div className="h-8 bg-trayalife-gray-100 rounded mt-3" />
    </div>
  </div>
);

const FeaturedProducts = ({ products = [], isLoading = false, error = null }) => {
  const [api, setApi] = useState(null);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => { };
    api.on("select", onSelect);
    return () => api.off("select", onSelect);
  }, [api]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
      </div>
    );
  }

  if (error) return <p className="text-center py-8 text-red-500 text-sm">Failed to load products.</p>;
  if (products.length === 0) return <p className="text-center py-8 text-trayalife-gray-400 text-sm">No products found.</p>;

  return (
    <>
      <div className="relative">
        <Carousel setApi={setApi} opts={{ align: "start", loop: true }} className="w-full">
          <CarouselContent className="-ml-3 md:-ml-4">
            {products.map((product, index) => (
              <CarouselItem
                key={product.id || product.slug || index}
                className="pl-3 md:pl-4 basis-1/2 md:basis-1/4 lg:basis-1/6 py-4"
              >
                <ProducCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-1 top-1/2 -translate-y-1/2 h-9 w-9 bg-white hover:bg-trayalife-50 border-trayalife-gray-200 text-trayalife-500 shadow-card rounded-full" />
          <CarouselNext className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 bg-white hover:bg-trayalife-50 border-trayalife-gray-200 text-trayalife-500 shadow-card rounded-full" />
        </Carousel>
      </div>

      <div className="text-center mt-4">
        <Link href="/products">
          <Button
            variant="outline"
            className="font-jost font-semibold text-sm border-trayalife-500 text-trayalife-500 hover:bg-trayalife-500 hover:text-white rounded-full px-7 py-2.5 transition-all duration-200 group"
          >
            View All Products
            <FiArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </Link>
      </div>
    </>
  );
};

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail("");
    }
  };

  return (
    <section className="py-16 md:py-24 bg-white border-t border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4">
        {subscribed ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank you for subscribing</h3>
            <p className="text-gray-600">Check your inbox for exclusive updates and offers</p>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Stay in the loop
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Get exclusive deals, beauty tips, and product recommendations delivered to your inbox.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 max-w-xl mx-auto mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
              >
                Subscribe
              </button>
            </form>

            <p className="text-sm text-gray-500">
              No spam, just great content. Unsubscribe anytime.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────
   Reusable Product Section wrapper
───────────────────────────────────────────── */
const ProductSection = ({
  title,
  subtitle,
  products,
  isLoading,
  error,
  icon,
  variant = "light", // "light" | "tint" | "dark"
}) => {
  const bg = {
    light: "bg-white",
    tint: "bg-trayalife-50",
    dark: "bg-trayalife-dark",
  }[variant];

  return (
    <section className={`py-8 md:py-12 ${bg}`}>
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeading
          title={title}
          subtitle={subtitle}
          icon={icon}
          dark={variant === "dark"}
        />
        <FeaturedProducts products={products} isLoading={isLoading} error={error} />
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────
   HOME PAGE
───────────────────────────────────────────── */
export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestsellerProducts, setBestsellerProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [kurtisProducts, setKurtisProducts] = useState([]);
  const [suitsProducts, setSuitsProducts] = useState([]);
  const [sareesProducts, setSareesProducts] = useState([]);
  const [westernProducts, setWesternProducts] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [premiumProducts, setPremiumProducts] = useState([]);
  const [summerProducts, setSummerProducts] = useState([]);
  const [winterProducts, setWinterProducts] = useState([]);
  const [partyProducts, setPartyProducts] = useState([]);
  const [casualProducts, setCasualProducts] = useState([]);
  const [formalProducts, setFormalProducts] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [productSections, setProductSections] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        const r = await fetchApi("/public/flash-sales", { credentials: "include" });
        if (r.success) setFlashSales(r.data.flashSales || []);
      } catch { }
    };
    fetchFlashSales();

    const fetchProductSections = async () => {
      try {
        const r = await fetchApi("/public/product-sections", { credentials: "include" });
        if (r?.success && r?.data?.sections) setProductSections(r.data.sections);
      } catch { }
    };
    fetchProductSections();

    const fetchData = async () => {
      try {
        setProductsLoading(true);
        const [featuredRes, bestsellerRes, trendingRes, newRes] = await Promise.allSettled([
          fetchProductsByType("featured", 8),
          fetchProductsByType("bestseller", 8),
          fetchProductsByType("trending", 8),
          fetchProductsByType("new", 8),
        ]);

        if (featuredRes.status === "fulfilled") {
          setFeaturedProducts(featuredRes.value?.data?.products || []);
        } else {
          const fb = await fetchApi("/public/products?featured=true&limit=8");
          setFeaturedProducts(fb?.data?.products || []);
        }
        if (bestsellerRes.status === "fulfilled") setBestsellerProducts(bestsellerRes.value?.data?.products || []);
        if (trendingRes.status === "fulfilled") setTrendingProducts(trendingRes.value?.data?.products || []);
        if (newRes.status === "fulfilled") setNewProducts(newRes.value?.data?.products || []);
      } catch (err) {
        setError(err?.message || "Failed to fetch data");
      } finally {
        setProductsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="w-full">

      {/* HERO */}
      <div className="w-full overflow-hidden">
        <HeroCarousel />
      </div>

      {/* ANNOUNCEMENT */}
      <AnnouncementBanner />

      {/* SHOPPABLE VIDEOS */}
      <ShoppableVideoCarousel />

      {/* ── FLASH SALES ── */}
      {flashSales.length > 0 && (
        <section className="py-10 md:py-14 bg-trayalife-dark relative overflow-hidden">
          {/* Decorative glows */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-trayalife-gold/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-trayalife-500/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4">
            {flashSales.map((sale) => (
              <div key={sale.id} className="mb-12 last:mb-0">
                <div className="text-center mb-8">
                  {/* Badge */}
                  <span className="inline-flex items-center gap-2 bg-gradient-to-r from-trayalife-gold-dark to-trayalife-gold text-trayalife-dark px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-gold mb-5">
                    <FiZap className="h-3.5 w-3.5" /> Flash Sale
                  </span>

                  <h2 className="font-jost text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                    {sale.name}
                  </h2>
                  <p className="text-trayalife-gold font-semibold text-lg mb-1">
                    {sale.discountPercentage}% OFF on All Products
                  </p>
                  <p className="text-white/40 text-sm mb-7">
                    Limited time — grab the best deals before they&apos;re gone
                  </p>

                  <FlashSaleCountdown endTime={sale.endTime} />
                </div>

                {sale.products?.length > 0 && (
                  <Carousel opts={{ align: "start", loop: true }} className="w-full">
                    <CarouselContent className="-ml-3 md:-ml-4">
                      {sale.products.map((product, i) => (
                        <CarouselItem
                          key={product.id || i}
                          className="pl-3 md:pl-4 basis-[260px] md:basis-[280px] lg:basis-[300px]"
                        >
                          <ProducCard
                            product={{
                              ...product,
                              hasSale: true,
                              price: product.basePrice,
                              salePrice: product.salePrice,
                              basePrice: product.salePrice,
                              regularPrice: product.basePrice,
                            }}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute -left-1 md:left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-trayalife-800 border-trayalife-gold/20 hover:bg-trayalife-700 text-white shadow-lg z-10" />
                    <CarouselNext className="absolute -right-1 md:right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-trayalife-800 border-trayalife-gold/20 hover:bg-trayalife-700 text-white shadow-lg z-10" />
                  </Carousel>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TOP BRANDS */}
      <BrandCarousel tag="TOP" title="TOP BRANDS" />

      {/* FEATURED */}
      {featuredProducts.length > 0 && (
        <ProductSection
          title="Featured Products"
          subtitle="Curated picks across beauty & wellness"
          products={featuredProducts}
          isLoading={productsLoading}
          error={error}
          variant="light"
        />
      )}

      {/* BEST SELLERS */}
      {bestsellerProducts.length > 0 && (
        <ProductSection
          title="Best Sellers"
          subtitle="Most loved products by our community"
          products={bestsellerProducts}
          isLoading={productsLoading}
          error={error}
          variant="tint"
        />
      )}

      {/* TRENDING */}
      {trendingProducts.length > 0 && (
        <ProductSection
          title="Trending Now"
          subtitle="What everyone is talking about this season"
          products={trendingProducts}
          isLoading={productsLoading}
          error={error}
          variant="light"
        />
      )}

      <SupplementStoreUI />

      {/* NEW BRANDS */}
      <BrandCarousel tag="NEW" title="NEW BRANDS" />

      <CategoryGrid />

      {/* NEW ARRIVALS */}
      {newProducts.length > 0 && (
        <ProductSection
          title="New Arrivals"
          subtitle="Fresh products just added to our collection"
          products={newProducts}
          isLoading={productsLoading}
          error={error}
          variant="tint"
        />
      )}

      {/* ── CATEGORY SECTIONS ── */}
      {kurtisProducts.length > 0 && <ProductSection title="Kurtis" subtitle="Elegant kurtis for every occasion" products={kurtisProducts} isLoading={productsLoading} error={error} variant="light" />}
      {suitsProducts.length > 0 && <ProductSection title="Suits" subtitle="Stylish suit sets for women" products={suitsProducts} isLoading={productsLoading} error={error} variant="tint" />}
      {sareesProducts.length > 0 && <ProductSection title="Sarees" subtitle="Traditional sarees for special occasions" products={sareesProducts} isLoading={productsLoading} error={error} variant="light" />}
      {westernProducts.length > 0 && <ProductSection title="Western" subtitle="Modern wear for the contemporary woman" products={westernProducts} isLoading={productsLoading} error={error} variant="tint" />}
      {premiumProducts.length > 0 && <ProductSection title="Premium Collection" subtitle="Exclusive high-quality clothing" products={premiumProducts} isLoading={productsLoading} error={error} variant="light" />}
      {summerProducts.length > 0 && <ProductSection title="Summer Collection" subtitle="Light & breezy summer essentials" products={summerProducts} isLoading={productsLoading} error={error} variant="tint" />}
      {winterProducts.length > 0 && <ProductSection title="Winter Collection" subtitle="Warm and cozy winter wear" products={winterProducts} isLoading={productsLoading} error={error} variant="light" />}
      {partyProducts.length > 0 && <ProductSection title="Party Wear" subtitle="Stand out at every occasion" products={partyProducts} isLoading={productsLoading} error={error} variant="tint" />}
      {casualProducts.length > 0 && <ProductSection title="Casual Wear" subtitle="Comfortable everyday clothing" products={casualProducts} isLoading={productsLoading} error={error} variant="light" />}
      {formalProducts.length > 0 && <ProductSection title="Formal Wear" subtitle="Professional & elegant attire" products={formalProducts} isLoading={productsLoading} error={error} variant="tint" />}

      {/* Sale section — dark variant */}
      {saleProducts.length > 0 && (
        <ProductSection
          title="Sale & Offers"
          subtitle="Great deals on selected items — today only"
          products={saleProducts}
          isLoading={productsLoading}
          error={error}
          variant="dark"
        />
      )}

      {/* ── DYNAMIC ADMIN SECTIONS ── */}
      {productSections.map((section, index) => {
        if (!section.products?.length) return null;
        const isDark = section.color?.includes("black") || section.color?.includes("dark");
        return (
          <ProductSection
            key={section.id}
            title={section.name}
            subtitle={section.description}
            products={section.products}
            isLoading={productsLoading}
            error={error}
            icon={section.icon ? () => <DynamicIcon name={section.icon} className="h-3.5 w-3.5" /> : undefined}
            variant={isDark ? "dark" : index % 2 === 0 ? "light" : "tint"}
          />
        );
      })}

      {/* HOT BRANDS */}
      <BrandCarousel tag="HOT" title="HOT BRANDS" />

      <NewsletterSection />

      <BenefitsSec />
      <TestimonialsSection />
    </div>
  );
}