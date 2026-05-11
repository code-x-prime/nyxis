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
} from "react-icons/fi";
import {
  FaFacebookF,
  FaTwitter,
  FaPinterestP,
} from "react-icons/fa";
import { fetchApi } from "@/lib/utils";
import Image from "next/image";

export function Footer() {
  const [socialLinks, setSocialLinks] = useState({});
  const [contactInfo, setContactInfo] = useState({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetchApi("/public/settings", {
          credentials: "include",
        });
        if (res?.success) {
          setSocialLinks(res.data?.socialLinks || {});
          setContactInfo({
            email: res.data?.contactEmail || "support@trayalife.com",
            phone: res.data?.contactPhone || "+91 9876543210",
            address: res.data?.contactAddress || "India",
          });
        }
      } catch (error) {
        console.log("Failed to fetch settings", error);
      }
    };
    fetchSettings();
  }, []);



  const shopLinks = [
    { name: "New Arrivals", href: "/products?productType=new" },
    { name: "Best Sellers", href: "/products?productType=bestseller" },
    { name: "Trending Now", href: "/products?productType=trending" },
    { name: "All Products", href: "/products" },
    { name: "Sale", href: "/products?sale=true" },
  ];

  const helpLinks = [
    { name: "Contact Us", href: "/contact" },
    { name: "About Us", href: "/about" },
    { name: "FAQs", href: "/faqs" },
    { name: "Track Order", href: "/account/orders" },
  ];

  const policyLinks = [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Refund Policy", href: "/refund-policy" },
    { name: "Shipping Policy", href: "/shipping-policy" },
    { name: "Terms & Conditions", href: "/terms-conditions" },
  ];

  const trustItems = [
    { Icon: FiShield, title: "Authentic Products", desc: "100% genuine" },
    { Icon: FiTruck, title: "Free Shipping", desc: "Orders over ₹999" },
    { Icon: FiRefreshCw, title: "30-Day Returns", desc: "Hassle-free returns" },
  ];

  const socialIcons = [
    { key: "facebook", Icon: FaFacebookF },
    { key: "twitter", Icon: FaTwitter },
    { key: "instagram", Icon: FiInstagram },
    { key: "youtube", Icon: FiYoutube },
    { key: "pinterest", Icon: FaPinterestP },
  ];

  const FooterSection = ({ title, links }) => (
    <div>
      <h3 className="font-semibold text-sm text-white mb-4 md:mb-6 uppercase tracking-wider">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-gray-400 hover:text-trayalife-gold text-sm transition-colors duration-200 inline-block"
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="mt-auto mb-14 lg:mb-0">
      {/* ── Trust Bar ── */}
      <div className="bg-gray-50 border-t border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center gap-8 md:gap-16 flex-wrap">
            {trustItems.map((item) => {
              const { Icon } = item;
              return (
                <div key={item.title} className="flex items-center gap-3">
                  <div className="text-gray-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-gray-600 text-xs">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Footer ── */}
      <div className="bg-[#0D1F1B] text-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <Image
                  src="/logo-2.png"
                  alt="Traya Life"
                  width={100}
                  height={100}
                  className="h-20 w-auto brightness-0 invert"
                />
              </Link>
              <p className="text-gray-300 text-sm leading-relaxed max-w-sm mb-6">
                Premium hair and wellness products, curated for quality and authenticity. Experience the holistic power of Traya Life.
              </p>

              {/* Contact info */}
              <div className="space-y-3">
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="flex items-center gap-3 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  <FiMail className="h-4 w-4 flex-shrink-0" />
                  {contactInfo.email}
                </a>
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="flex items-center gap-3 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  <FiPhone className="h-4 w-4 flex-shrink-0" />
                  {contactInfo.phone}
                </a>
                <p className="flex items-center gap-3 text-gray-400 text-sm">
                  <FiMapPin className="h-4 w-4 flex-shrink-0" />
                  {contactInfo.address}
                </p>
              </div>
            </div>

            {/* Link Columns */}
            <FooterSection
              title="Shop"
              links={shopLinks}
            />
            <FooterSection
              title="Help"
              links={helpLinks}
            />
            <FooterSection
              title="Policies"
              links={policyLinks}
            />
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="bg-gray-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs text-center">
            © {new Date().getFullYear()} All rights reserved.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            {socialIcons.map(({ key, Icon }) => {
              const url = socialLinks[key];
              if (!url) return null;
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={key}
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
