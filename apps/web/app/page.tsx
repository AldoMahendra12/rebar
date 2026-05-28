"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, BarChart3, TrendingUp, Building2, ShieldCheck, Zap } from "lucide-react";

const DotPattern = () => (
  <svg className="absolute inset-0 -z-10 h-full w-full stroke-slate-200 [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)]" aria-hidden="true">
    <defs>
      <pattern id="dot-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.5" className="fill-slate-200" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" strokeWidth="0" fill="url(#dot-pattern)" />
  </svg>
);

const GridPattern = () => (
  <svg className="absolute inset-0 -z-10 h-full w-full stroke-slate-200/50 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]" aria-hidden="true">
    <defs>
      <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M.5 40V.5H40" fill="none" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" strokeWidth="0" fill="url(#grid-pattern)" />
  </svg>
);

export default function LandingPage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-200 font-sans overflow-hidden">
      
      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* Using Black Logo for light theme */}
            <Image src="/logo-hitam.png" alt="Rebar Logo" width={240} height={80} className="h-14 w-auto object-contain" priority />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-slate-900 transition-colors">Fitur</Link>
            <Link href="#pricing" className="hover:text-slate-900 transition-colors">Harga</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden md:block">
              Masuk
            </Link>
            <Link href="/dashboard" className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-full transition-all shadow-md hover:shadow-lg">
              Mulai Gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="relative pt-16">
        {/* Aceternity Style Background */}
        <DotPattern />

        {/* Hero Section */}
        <section className="relative pt-24 pb-32 px-6 text-center">
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-blue-50 to-transparent -z-10" />
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-8 shadow-sm">
              <Zap className="w-3.5 h-3.5" />
              SaaS Konstruksi Terpercaya
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6 text-slate-900">
              Kendalikan Proyek <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Lebih Cepat & Akurat
              </span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Tinggalkan manual spreadsheet. Rebar membantu kontraktor membuat WBS, memantau S-Curve, dan menekan *cost overrun* secara real-time.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 flex items-center justify-center gap-2">
                Buka Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="#features" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-semibold rounded-full hover:bg-slate-50 border border-slate-200 transition-all shadow-sm flex items-center justify-center">
                Lihat Fitur
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Dashboard Preview Mockup (Aceternity style floating) */}
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-24 max-w-5xl mx-auto relative perspective-1000"
          >
            <div className="rounded-2xl border border-slate-200/50 bg-white/40 p-2 backdrop-blur-xl shadow-2xl shadow-blue-900/5 ring-1 ring-slate-900/5 transform-gpu rotate-x-2 scale-105 transition-transform duration-700 hover:rotate-x-0 hover:scale-100">
              <div className="rounded-xl overflow-hidden border border-slate-100 bg-white aspect-[16/9] flex items-center justify-center relative shadow-inner">
                 <GridPattern />
                 <BarChart3 className="w-24 h-24 text-blue-100 absolute" />
                 <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent"></div>
                 <div className="z-10 flex flex-col items-center">
                   <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-sm border border-emerald-200">
                     <ShieldCheck className="w-8 h-8" />
                   </div>
                   <p className="text-2xl font-bold text-slate-800 tracking-tight">Interactive S-Curve Dashboard</p>
                 </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-24 px-6 bg-slate-50 border-y border-slate-200 relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-slate-900">Segalanya Dalam Satu Platform</h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg">Alat profesional yang dirancang khusus untuk memenuhi standar industri konstruksi modern.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: TrendingUp, title: "S-Curve Otomatis", desc: "Pantau progress lapangan dengan kurva S yang di-generate langsung dari bobot WBS Anda secara real-time.", color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
                { icon: BarChart3, title: "Cost Control", desc: "Jangan sampai tekor. Catat pengeluaran aktual dan bandingkan dengan RAB untuk mendeteksi cost overrun sejak dini.", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                { icon: Building2, title: "WBS Bertingkat", desc: "Buat struktur rincian kerja sedalam yang Anda butuhkan tanpa batasan level hierarki.", color: "bg-orange-50 text-orange-600 border-orange-100" }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${feature.color}`}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-32 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-slate-900">Investasi Cerdas untuk Bisnis Anda</h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg">Satu kesalahan proyek lebih mahal dari berlangganan selamanya.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { name: "Starter", price: "Gratis", desc: "Ideal untuk mencoba dan kontraktor individu.", features: ["1 Proyek Aktif", "WBS & S-Curve", "Export PDF Terbatas"] },
                { name: "Professional", price: "Rp 499k", period: "/bln", desc: "Standard industri untuk perusahaan kontraktor.", features: ["Unlimited Proyek", "Budget & Cost Control", "Premium Support"], popular: true },
                { name: "Enterprise", price: "Custom", desc: "Skala masif dengan kustomisasi penuh.", features: ["White-label Dashboard", "Unlimited Storage", "Dedicated Server"] }
              ].map((plan, i) => (
                <div key={i} className={`p-8 rounded-3xl border transition-all duration-300 ${plan.popular ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-105' : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 hover:shadow-xl'} flex flex-col relative`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-blue-500 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg">
                      Paling Laris
                    </div>
                  )}
                  <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-black">{plan.price}</span>
                    {plan.period && <span className={plan.popular ? 'text-slate-400' : 'text-slate-500'}>{plan.period}</span>}
                  </div>
                  <p className={`text-sm mb-8 h-10 ${plan.popular ? 'text-slate-300' : 'text-slate-600'}`}>{plan.desc}</p>
                  
                  <ul className="space-y-4 mb-10 flex-1">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm font-medium">
                        <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.popular ? 'text-blue-400' : 'text-blue-600'}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link 
                    href="/dashboard" 
                    className={`w-full py-4 rounded-xl font-bold text-center transition-all ${
                      plan.popular 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                    }`}
                  >
                    Pilih {plan.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer using Black Logo as well because footer bg is white now */}
      <footer className="border-t border-slate-200 bg-slate-50 py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Image src="/logo-hitam.png" alt="Rebar Logo" width={160} height={48} className="h-10 w-auto opacity-80 grayscale object-contain" />
          </div>
          <p className="text-sm font-medium text-slate-500">© {new Date().getFullYear()} Rebar Construct SaaS. Built for Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}
