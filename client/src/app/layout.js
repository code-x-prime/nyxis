import { Lato } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Toaster } from "sonner";
import { RouteGuard } from "@/components/route-guard";
import { ClientOnly } from "@/components/client-only";
import { ScrollToTop } from "@/components/ScrollToTop";
import TawkToWidget from "@/components/TawkToWidget";

/* ── Body font: Lato (Google) ── */
const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-lato",
  display: "swap",
});

/* ── Display / UI font: Assistant (local variable font) ── */
const assistant = localFont({
  src: "./fonts/Assistant-VariableFont_wght.ttf",
  variable: "--font-assistant",
  display: "swap",
  weight: "200 800",
});

export const metadata = {
  title: "Traya Life – Holistic Hair & Wellness Solutions",
  description:
    "Experience the power of Ayurveda and science with Traya Life. Shop personalized hair growth, skincare, and wellness products. Authentic solutions for a healthier you.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${lato.variable} ${assistant.variable} font-lato antialiased`}
      >
        <AuthProvider>
          <CartProvider>
            <ScrollToTop />
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">
                <ClientOnly>
                  <RouteGuard>{children}</RouteGuard>
                </ClientOnly>
              </main>
              <Footer />
            </div>
            <Toaster position="top-center" richColors closeButton />
            <TawkToWidget />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}