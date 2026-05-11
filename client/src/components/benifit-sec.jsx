import {
  FiStar,
  FiTruck,
  FiUsers,
  FiLock,
  FiCheckCircle,
  FiAward,
  FiRefreshCw,
  FiHeart,
} from "react-icons/fi";

const benefits = [
  {
    icon: FiAward,
    title: "Premium Quality",
    description: "Carefully curated beauty products with high-quality formulations for lasting results.",
    stat: "500+",
    statLabel: "Products",
  },
  {
    icon: FiTruck,
    title: "Fast Delivery",
    description: "Get your orders delivered to your doorstep within 2–3 business days across India.",
    stat: "2-3",
    statLabel: "Day Delivery",
  },
  {
    icon: FiUsers,
    title: "Expert Support",
    description: "Our team of beauty experts is available to help you choose the perfect products.",
    stat: "24/7",
    statLabel: "Support",
  },
  {
    icon: FiLock,
    title: "Secure Payments",
    description: "Shop with confidence with our 100% secure payment gateway and buyer protection.",
    stat: "100%",
    statLabel: "Secure",
  },
  {
    icon: FiCheckCircle,
    title: "100% Authentic",
    description: "Every product is sourced directly from authorized brands — zero counterfeits, ever.",
    stat: "0",
    statLabel: "Counterfeits",
  },
  {
    icon: FiRefreshCw,
    title: "Easy Returns",
    description: "Not satisfied? Return within 30 days, no questions asked. Hassle-free process.",
    stat: "30",
    statLabel: "Day Returns",
  },
  {
    icon: FiHeart,
    title: "Loyalty Rewards",
    description: "Earn points on every purchase and redeem them on your next order. Shop more, save more.",
    stat: "2x",
    statLabel: "Points",
  },
  {
    icon: FiStar,
    title: "Top Rated",
    description: "Consistently rated 4.9★ by over 50,000 happy customers across India.",
    stat: "4.9★",
    statLabel: "Rating",
  },
];

const BenefitsSec = () => (
  <section className="bg-[#0d1f1b] py-16 md:py-24 overflow-hidden relative">
    {/* Decorative blobs */}
    <div className="absolute top-0 left-0 w-96 h-96 bg-[#166454]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

    <div className="relative max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-14">
        <span className="inline-flex items-center gap-2 bg-[#166454]/20 border border-[#166454]/30 text-[#C9A84C] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
          <FiStar className="h-3 w-3" /> Why Traya Life
        </span>
        <h2 className="font-jost text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
          Why Choose <span className="text-[#C9A84C]">Traya Life</span>?
        </h2>
        <p className="text-white/50 text-base max-w-xl mx-auto leading-relaxed">
          We&apos;re committed to providing you with the best beauty & wellness experience — quality, trust, and care in every order.
        </p>
        <div className="flex items-center justify-center gap-2 mt-5">
          <div className="h-[2px] w-12 bg-[#166454] rounded-full" />
          <div className="h-[2px] w-5 bg-[#C9A84C] rounded-full" />
          <div className="h-[2px] w-2 bg-white/20 rounded-full" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { num: "50K+", label: "Happy Customers" },
          { num: "500+", label: "Products" },
          { num: "4.9★", label: "Average Rating" },
          { num: "99%", label: "On-time Delivery" },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
            <p className="font-jost font-bold text-2xl md:text-3xl text-[#C9A84C] mb-1">{s.num}</p>
            <p className="text-white/50 text-xs uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Benefits grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {benefits.map((b, i) => {
          const Icon = b.icon;
          return (
            <div key={i}
              className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 hover:border-[#166454]/50 hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-[#166454]/20 group-hover:bg-[#166454]/30 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                  <Icon className="h-5 w-5 text-[#C9A84C]" strokeWidth={1.5} />
                </div>
                <div className="text-right">
                  <p className="font-jost font-bold text-xl text-[#C9A84C]">{b.stat}</p>
                  <p className="text-white/30 text-[10px] uppercase tracking-wider">{b.statLabel}</p>
                </div>
              </div>
              <div>
                <h3 className="font-jost font-bold text-white text-base mb-1.5">{b.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{b.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default BenefitsSec;
