"use client";

import Image from "next/image";
import Link from "next/link";

const CARDS = [
  {
    src: "/card1.avif",
    title: "Brightening Vitamin C",
    offer: "UP TO 75% OFF",
    href: "/products?search=vitamin+c",
  },
  {
    src: "/card2.avif",
    title: "De-tan Coffee",
    offer: "MIN. 30% OFF",
    href: "/products?search=coffee",
  },
  {
    src: "/card3.avif",
    title: "Cooling Aloe Vera",
    offer: "UP TO 50% OFF",
    href: "/products?search=aloe+vera",
  },
  {
    src: "/card4.avif",
    title: "Hydrating Watermelon",
    offer: "UP TO 60% OFF",
    href: "/products?search=watermelon",
  },
];

export default function PromoCardBanner({ heading = "Summer Skin Saviours 🌟" }) {
  return (
    <section className="py-7 md:py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Heading */}
        <h2 className="text-center text-lg md:text-xl font-bold text-gray-900 mb-5 font-jost">
          {heading}
        </h2>

        {/* Cards grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {CARDS.map((card) => (
            <Link
              key={card.src}
              href={card.href}
              className="group flex flex-col items-center"
            >
              {/* Image */}
              <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-300">
                <Image
                  src={card.src}
                  alt={card.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>

              {/* Text below */}
              <div className="mt-2.5 text-center">
                <p className="text-xs md:text-sm font-bold text-gray-800 uppercase tracking-wide leading-snug">
                  {card.offer}
                </p>
                <p className="text-xs text-trayalife-500 font-semibold mt-0.5 group-hover:underline">
                  SHOP NOW
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
