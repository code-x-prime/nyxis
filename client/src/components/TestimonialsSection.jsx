"use client";

import { useState, useEffect } from "react";
import { BsStarFill, BsQuote } from "react-icons/bs";
import { FiCheckCircle } from "react-icons/fi";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

const testimonials = [
  {
    name: "Shweta Patel",
    location: "Ahmedabad, India",
    quote: "Received so many compliments at the family get-together. Loved how comfortable yet festive it looked! Traya Life never disappoints.",
    rating: 5,
    verified: true,
    daysAgo: 12,
    avatar: "SP",
    avatarColor: "from-[#166454] to-[#0d8f6e]",
    product: "Vitamin C Serum",
  },
  {
    name: "Aarohi Singh",
    location: "Noida, Delhi NCR",
    quote: "Traya Life has become my one-stop shop — from skincare to haircare to wellness, I find everything here! Quality is top-notch.",
    rating: 5,
    verified: true,
    daysAgo: 8,
    avatar: "AS",
    avatarColor: "from-purple-500 to-purple-700",
    product: "Hair Care Bundle",
  },
  {
    name: "Neha Sharma",
    location: "Delhi, India",
    quote: "Perfect formula and gorgeous results — used it for my best friend's wedding. Absolutely loved the glow it gave me!",
    rating: 5,
    verified: true,
    daysAgo: 5,
    avatar: "NS",
    avatarColor: "from-pink-500 to-rose-600",
    product: "Glow Face Mask",
  },
  {
    name: "Priyanka Desai",
    location: "Jaipur, Rajasthan",
    quote: "This serum looks and feels amazing. Lightweight and the results were visible within a week. Highly recommend!",
    rating: 5,
    verified: true,
    daysAgo: 3,
    avatar: "PD",
    avatarColor: "from-amber-500 to-orange-600",
    product: "Niacinamide Serum",
  },
  {
    name: "Kavita Menon",
    location: "Mumbai, Maharashtra",
    quote: "Been shopping here for 2 years. The quality is exceptional and delivery is always super quick. My go-to beauty store!",
    rating: 5,
    verified: true,
    daysAgo: 1,
    avatar: "KM",
    avatarColor: "from-teal-500 to-teal-700",
    product: "SPF Sunscreen",
  },
  {
    name: "Anjali Gupta",
    location: "Surat, Gujarat",
    quote: "Customer support is so helpful and products are top-notch. Everything fits perfectly and quality is amazing. 10/10!",
    rating: 5,
    verified: true,
    daysAgo: 2,
    avatar: "AG",
    avatarColor: "from-indigo-500 to-indigo-700",
    product: "Moisturizer",
  },
];

export default function TestimonialsSection() {
  const [api, setApi] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrentSlide(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => api.off("select", onSelect);
  }, [api]);

  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-16 md:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-trayalife-50 border border-trayalife-500/20 text-trayalife-500 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
            <BsStarFill className="h-3 w-3 text-amber-400" /> Verified Reviews
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 font-jost">
            What Our Customers Say
          </h2>
          <p className="text-gray-400 text-base max-w-md mx-auto">
            Real reviews from real customers who love Traya Life
          </p>

          {/* Overall rating */}
          <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <BsStarFill key={i} className="h-5 w-5 text-amber-400" />
              ))}
            </div>
            <span className="text-2xl font-bold text-gray-900 font-jost">4.9</span>
            <span className="text-gray-400 text-sm">out of 5 · <strong className="text-gray-600">50,000+</strong> happy customers</span>
          </div>

          {/* Rating breakdown mini bars */}
          <div className="flex items-center justify-center gap-6 mt-5 flex-wrap">
            {[
              { stars: 5, pct: 92 },
              { stars: 4, pct: 6 },
              { stars: 3, pct: 2 },
            ].map((r) => (
              <div key={r.stars} className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{r.stars}★</span>
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${r.pct}%` }} />
                </div>
                <span className="text-xs text-gray-400">{r.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: true, slidesToScroll: 1 }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((t, i) => (
                <CarouselItem key={i} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <div className="bg-white rounded-3xl border border-gray-100 p-6 h-full flex flex-col gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">

                    {/* Quote icon */}
                    <div className="flex items-start justify-between">
                      <BsQuote className="h-8 w-8 text-trayalife-500/20 flex-shrink-0" />
                      <div className="flex gap-1">
                        {[...Array(t.rating)].map((_, i) => (
                          <BsStarFill key={i} className="h-3.5 w-3.5 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    {/* Review text */}
                    <p className="text-gray-700 text-sm leading-relaxed flex-1">
                      &ldquo;{t.quote}&rdquo;
                    </p>

                    {/* Product tag */}
                    <div className="bg-trayalife-50 border border-trayalife-500/15 rounded-xl px-3 py-1.5 w-fit">
                      <span className="text-trayalife-500 text-xs font-semibold">📦 {t.product}</span>
                    </div>

                    {/* Reviewer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatarColor} text-white flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                          {t.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                            {t.verified && (
                              <FiCheckCircle className="h-3.5 w-3.5 text-trayalife-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-gray-400 text-xs">{t.location}</p>
                        </div>
                      </div>
                      <span className="text-gray-300 text-xs">{t.daysAgo}d ago</span>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            <CarouselPrevious className="w-11 h-11 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-trayalife-50 hover:border-trayalife-500 text-gray-600 hover:text-trayalife-500 transition-all" />
            <CarouselNext className="w-11 h-11 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-trayalife-50 hover:border-trayalife-500 text-gray-600 hover:text-trayalife-500 transition-all" />
          </Carousel>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? "bg-trayalife-500 w-7" : "bg-gray-200 hover:bg-gray-300 w-2"}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
