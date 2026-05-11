"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  FiInstagram,
  FiYoutube,
  FiMail,
  FiPhone,
  FiMapPin,
  FiShield,
  FiTruck,
  FiRefreshCw,
  FiArrowRight,
  FiHeart,
} from "react-icons/fi";
import { FaFacebookF, FaTwitter, FaPinterestP, FaWhatsapp } from "react-icons/fa";
import { BsStarFill } from "react-icons/bs";
import { fetchApi } from "@/lib/utils";
import Image from "next/image";

export function Footer() {
  const [socialLinks, setSocialLinks] = useState({});
  const [contactInfo, setContactInfo] = useState({});
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetchApi("/public/settings", { credentials: "include" });
        if (res?.success) {
          setSocialLinks(res.data?.socialLinks || {});
          setContactInfo({
            email: res.data?.contactEmail || "support@trayalife.com",
            phone: res.data?.contactPhone || "+91 9876543210",
            address: res.data?.contactAddress || "India",
          });
        }
      } catch { }
    };
    fetchSettings();
  }, []);

  const shopLinks = [
    { name: "New Arrivals", href: "/products?productType=new" },
    { name: "Best Sellers", href: "/products?productType=bestseller" },
    { name: "Trending Now", href: "/products?productType=trending" },
    { name: "All Products", href: "/products" },
    { name: "Sale & Offers", href: "/products?sale=true" },
  ];

  const helpLinks = [
    { name: "Contact Us", href: "/contact" },
    { name: "About Us", href: "/about" },
    { name: "FAQs", href: "/faqs" },
    { name: "Track Order", href: "/account/orders" },
    { name: "My Account", href: "/account" },
  ];

  const policyLinks = [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Refund Policy", href: "/refund-policy" },
    { name: "Shipping Policy", href: "/shipping-policy" },
    { name: "Terms & Conditions", href: "/terms-conditions" },
  ];

  const socialIcons = [
    { key: "facebook", Icon: FaFacebookF, label: "Facebook" },
    { key: "twitter", Icon: FaTwitter, label: "Twitter" },
    { key: "instagram", Icon: FiInstagram, label: "Instagram" },
    { key: "youtube", Icon: FiYoutube, label: "YouTube" },
    { key: "pinterest", Icon: FaPinterestP, label: "Pinterest" },
    { key: "whatsapp", Icon: FaWhatsapp, label: "WhatsApp" },
  ];

  const trustBadges = [
    { Icon: FiShield, title: "100% Authentic", desc: "Genuine products only" },
    { Icon: FiTruck, title: "Free Shipping", desc: "Orders above ₹999" },
    { Icon: FiRefreshCw, title: "Easy Returns", desc: "30-day hassle-free" },
    { Icon: BsStarFill, title: "4.9★ Rated", desc: "50,000+ happy customers" },
  ];

  return (
    <footer className="mt-auto mb-14 lg:mb-0">

      {/* ── Trust Bar ── */}
      <div className="bg-white border-t border-b border-gray-100 py-5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {trustBadges.map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 justify-center md:justify-start">
                <div className="w-10 h-10 bg-trayalife-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-trayalife-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{title}</p>
                  <p className="text-gray-400 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Newsletter Bar ── */}
      <div className="bg-trayalife-500 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="text-center md:text-left">
              <h3 className="font-jost font-bold text-white text-xl mb-1">Stay in the loop</h3>
              <p className="text-white/70 text-sm">Get exclusive deals, beauty tips & new launches in your inbox.</p>
            </div>
            {subscribed ? (
              <div className="flex items-center gap-2 bg-white/20 text-white font-semibold px-6 py-3 rounded-2xl text-sm">
                <FiHeart className="h-4 w-4" /> Thanks for subscribing!
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true); }}
                className="flex gap-2 w-full md:w-auto"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 md:w-64 px-4 py-3 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 border-0"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-[#0d1f1b] hover:bg-black text-white font-jost font-bold px-5 py-3 rounded-xl text-sm transition-colors flex-shrink-0"
                >
                  Subscribe <FiArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Footer ── */}
      <div className="bg-[#0D1F1B]">
        <div className="max-w-7xl mx-auto px-4 pt-14 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">

            {/* Brand Column */}
            <div className="lg:col-span-2">
              <Link href="/" className="inline-block mb-5">
                <Image src="/logo-2.png" alt="Traya Life" width={120} height={120} className="h-16 w-auto brightness-0 invert" />
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6">
                Premium hair and wellness products, curated for quality and authenticity. Experience the holistic power of Traya Life — nature meets science.
              </p>

              {/* Contact */}
              <div className="space-y-3 mb-7">
                <a href={`mailto:${contactInfo.email}`}
                  className="flex items-center gap-3 text-gray-400 hover:text-white text-sm transition-colors group">
                  <div className="w-8 h-8 bg-white/5 group-hover:bg-trayalife-500/20 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                    <FiMail className="h-3.5 w-3.5" />
                  </div>
                  {contactInfo.email}
                </a>
                <a href={`tel:${contactInfo.phone}`}
                  className="flex items-center gap-3 text-gray-400 hover:text-white text-sm transition-colors group">
                  <div className="w-8 h-8 bg-white/5 group-hover:bg-trayalife-500/20 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                    <FiPhone className="h-3.5 w-3.5" />
                  </div>
                  {contactInfo.phone}
                </a>
                <div className="flex items-center gap-3 text-gray-400 text-sm">
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiMapPin className="h-3.5 w-3.5" />
                  </div>
                  {contactInfo.address}
                </div>
              </div>

              {/* Social icons */}
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Follow Us</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {socialIcons.map(({ key, Icon, label }) => {
                    const url = socialLinks[key];
                    if (!url) return null;
                    return (
                      <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
                        className="w-9 h-9 bg-white/8 hover:bg-trayalife-500 border border-white/10 hover:border-trayalife-500 text-gray-400 hover:text-white rounded-xl flex items-center justify-center transition-all duration-200">
                        <Icon className="h-3.5 w-3.5" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Links columns */}
            {[
              { title: "Shop", links: shopLinks },
              { title: "Help", links: helpLinks },
              { title: "Policies", links: policyLinks },
            ].map(({ title, links }) => (
              <div key={title}>
                <h3 className="font-jost font-bold text-white text-sm mb-5 uppercase tracking-wider">
                  {title}
                </h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}
                        className="text-gray-400 hover:text-[#C9A84C] text-sm transition-colors duration-200 inline-flex items-center gap-1 group">
                        <span className="w-0 group-hover:w-3 overflow-hidden transition-all duration-200">
                          <FiArrowRight className="h-3 w-3 flex-shrink-0" />
                        </span>
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* ── Bottom Bar ── */}
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-gray-500 text-xs text-center md:text-left">
              © {new Date().getFullYear()} <span className="text-gray-400 font-medium">Traya Life</span>. All rights reserved. Made with{" "}
              <FiHeart className="inline h-3 w-3 text-red-400" /> in India.
            </p>
            {/* Payment icons text */}
            <div className="flex items-center gap-3">
              {["Visa", "Mastercard", "UPI", "PhonePe", "Paytm", "COD"].map((p) => (
                <span key={p} className="text-gray-500 text-[10px] border border-white/10 px-2 py-1 rounded-md">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
