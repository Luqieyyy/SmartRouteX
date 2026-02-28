"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Route,
  Cpu,
  MapPin,
  ShieldCheck,
  BarChart3,
  Zap,
  Globe,
  Truck,
  Clock,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Navigation                                                */
/* ------------------------------------------------------------------ */

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-[#E10600] flex items-center justify-center">
            <span className="text-white text-xs font-bold tracking-tight">
              SR
            </span>
          </div>
          <span className="text-base font-bold tracking-tight text-gray-900">
            SmartRouteX
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Features
          </a>
          <a
            href="#routing"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            AI Routing
          </a>
          <a
            href="#tracking"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Tracking
          </a>
          <a
            href="#security"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Enterprise
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="bg-[#E10600] text-white text-sm font-medium px-5 py-2 hover:bg-[#B00000] transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Hero                                                      */
/* ------------------------------------------------------------------ */

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/ninjavan1.jpg"
          alt="Logistics operations"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-24">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block text-[#E10600] text-xs font-semibold uppercase tracking-[0.2em] mb-4">
              Enterprise Logistics Platform
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight"
          >
            AI-Powered
            <br />
            Last-Mile
            <br />
            <span className="text-[#E10600]">Delivery Intelligence</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-6 text-lg text-gray-300 leading-relaxed max-w-lg"
          >
            Optimize delivery routes, track riders in real-time, and reduce
            failed deliveries with machine learning — built for enterprise
            logistics operations at scale.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-8 flex items-center gap-4"
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-[#E10600] text-white font-medium px-7 py-3 text-sm hover:bg-[#B00000] transition-colors"
            >
              Access Dashboard
              <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors border border-gray-600 px-6 py-3 hover:border-gray-400"
            >
              Learn More
            </a>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="mt-16 flex gap-12"
          >
            {[
              { value: "99.7%", label: "Uptime SLA" },
              { value: "<2s", label: "Route Calc" },
              { value: "40%", label: "Cost Reduction" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Problem Statement                                         */
/* ------------------------------------------------------------------ */

function ProblemSection() {
  const problems = [
    {
      icon: Route,
      title: "Inefficient Routing",
      desc: "Manual route planning wastes fuel, time, and increases operational costs by up to 30%.",
    },
    {
      icon: Clock,
      title: "Failed Deliveries",
      desc: "Without predictive analytics, failed first-attempt rates exceed 15%, eroding customer trust.",
    },
    {
      icon: Globe,
      title: "No Visibility",
      desc: "Disconnected systems leave operations managers blind to real-time fleet performance.",
    },
  ];

  return (
    <section className="py-24 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <FadeUp>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[#E10600] text-xs font-semibold uppercase tracking-[0.2em]">
              The Challenge
            </span>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 tracking-tight">
              Last-mile delivery is broken
            </h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Traditional logistics operations rely on manual processes that
              cannot scale. SmartRouteX replaces guesswork with intelligence.
            </p>
          </div>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((p, i) => (
            <FadeUp key={p.title} delay={i * 0.15}>
              <div className="border border-gray-200 p-8 hover:border-[#E10600]/30 transition-colors group">
                <p.icon
                  size={28}
                  className="text-[#E10600] mb-5"
                  strokeWidth={1.5}
                />
                <h3 className="font-semibold text-gray-900 mb-2">
                  {p.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: AI Route Optimization                                     */
/* ------------------------------------------------------------------ */

function AIRoutingSection() {
  return (
    <section className="py-24 bg-[#F8F9FA]" id="routing">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeUp>
            <div>
              <span className="text-[#E10600] text-xs font-semibold uppercase tracking-[0.2em]">
                Core Intelligence
              </span>
              <h2 className="mt-3 text-3xl font-bold text-gray-900 tracking-tight">
                AI-powered route optimization
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Our machine learning engine processes real-time traffic, weather,
                delivery windows, and rider capacity to generate optimal routes
                that minimize distance and maximize first-attempt success.
              </p>

              <div className="mt-8 space-y-5">
                {[
                  {
                    icon: Cpu,
                    title: "ML-Driven Routing",
                    desc: "Dynamic route recalculation based on live conditions",
                  },
                  {
                    icon: Zap,
                    title: "Sub-2s Computation",
                    desc: "Enterprise-grade performance for thousands of parcels",
                  },
                  {
                    icon: Truck,
                    title: "Multi-Constraint Solver",
                    desc: "Vehicle capacity, time windows, priority levels, zone clustering",
                  },
                ].map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <div className="flex-shrink-0 h-10 w-10 bg-[#E10600]/10 flex items-center justify-center">
                      <f.icon size={18} className="text-[#E10600]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        {f.title}
                      </h4>
                      <p className="text-sm text-gray-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.2}>
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src="/images/ninjavan2.jpg"
                alt="AI Route optimization"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Real-Time Tracking                                        */
/* ------------------------------------------------------------------ */

function TrackingSection() {
  return (
    <section className="py-24 bg-white" id="tracking">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeUp delay={0.1}>
            <div className="relative aspect-[4/3] overflow-hidden order-2 lg:order-1">
              <Image
                src="/images/ninjavan3.jpg"
                alt="Real-time tracking"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </FadeUp>

          <FadeUp className="order-1 lg:order-2">
            <div>
              <span className="text-[#E10600] text-xs font-semibold uppercase tracking-[0.2em]">
                Live Operations
              </span>
              <h2 className="mt-3 text-3xl font-bold text-gray-900 tracking-tight">
                Real-time fleet visibility
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Monitor every rider, every parcel, every second. Our GPS
                tracking system provides live location updates, delivery status
                feeds, and instant alerts for operational anomalies.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { value: "10s", label: "GPS refresh interval" },
                  { value: "100%", label: "Fleet coverage" },
                  { value: "Real-time", label: "Status updates" },
                  { value: "Instant", label: "Anomaly alerts" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="border border-gray-200 p-4"
                  >
                    <p className="text-xl font-bold text-[#E10600]">
                      {s.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Automation Engine                                         */
/* ------------------------------------------------------------------ */

function AutomationSection() {
  const features = [
    {
      icon: Cpu,
      title: "Smart Assignment",
      desc: "Automatically assign parcels to the nearest available rider based on zone, capacity, and proximity.",
    },
    {
      icon: BarChart3,
      title: "Predictive Analytics",
      desc: "Forecast delivery volumes, identify failure-prone zones, and optimize staffing levels.",
    },
    {
      icon: MapPin,
      title: "Geofence Automation",
      desc: "Trigger actions when riders enter or exit defined delivery zones for hands-free operations.",
    },
    {
      icon: Zap,
      title: "Instant Re-routing",
      desc: "When conditions change, routes update automatically without manual dispatcher intervention.",
    },
  ];

  return (
    <section className="py-24 bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <FadeUp>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[#E10600] text-xs font-semibold uppercase tracking-[0.2em]">
              Automation Engine
            </span>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 tracking-tight">
              Operations on autopilot
            </h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Reduce manual workload by 60% with intelligent automation that
              handles assignment, routing, and exception management.
            </p>
          </div>
        </FadeUp>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <FadeUp key={f.title} delay={i * 0.1}>
              <div className="bg-white border border-gray-200 p-8 flex gap-5 hover:shadow-sm transition-shadow">
                <div className="flex-shrink-0 h-12 w-12 bg-[#E10600]/5 flex items-center justify-center">
                  <f.icon size={22} className="text-[#E10600]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {f.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Enterprise & Security                                     */
/* ------------------------------------------------------------------ */

function EnterpriseSection() {
  return (
    <section className="py-24 bg-gray-900" id="security">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeUp>
            <div>
              <span className="text-[#E10600] text-xs font-semibold uppercase tracking-[0.2em]">
                Enterprise Grade
              </span>
              <h2 className="mt-3 text-3xl font-bold text-white tracking-tight">
                Built for scale and security
              </h2>
              <p className="mt-4 text-gray-400 leading-relaxed">
                From startup fleets to enterprise networks — SmartRouteX scales
                with your operations while maintaining the highest security and
                compliance standards.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Role-based access control (RBAC)",
                  "End-to-end data encryption at rest and in transit",
                  "99.7% uptime SLA with redundant infrastructure",
                  "SOC 2 Type II compliance ready",
                  "Real-time audit logging for all operations",
                  "Multi-tenant architecture with data isolation",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <ShieldCheck
                      size={16}
                      className="text-[#E10600] mt-0.5 flex-shrink-0"
                    />
                    <p className="text-sm text-gray-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.2}>
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src="/images/ninjavan4.jpg"
                alt="Enterprise security"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent" />
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Image Gallery                                             */
/* ------------------------------------------------------------------ */

function GallerySection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <FadeUp>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[#E10600] text-xs font-semibold uppercase tracking-[0.2em]">
              In the Field
            </span>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 tracking-tight">
              Powering deliveries across the region
            </h2>
          </div>
        </FadeUp>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[5, 6, 7, 8, 9, 10, 11, 3].map((n, i) => (
            <FadeIn key={n} delay={i * 0.08}>
              <div className="relative aspect-square overflow-hidden group">
                <Image
                  src={`/images/ninjavan${n}.jpg`}
                  alt={`Operations ${n}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: CTA                                                       */
/* ------------------------------------------------------------------ */

function CTASection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/ninjavan2.jpg"
          alt="CTA background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#E10600]/90" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 text-center">
        <FadeUp>
          <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Ready to transform your delivery operations?
          </h2>
          <p className="mt-4 text-white/80 leading-relaxed">
            Join logistics leaders who have reduced delivery costs by 40% and
            improved first-attempt success rates to over 95%.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="bg-white text-[#E10600] font-medium px-8 py-3 text-sm hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight size={16} />
            </Link>
            <Link
              href="#features"
              className="text-white font-medium border border-white/40 px-6 py-3 text-sm hover:bg-white/10 transition-colors"
            >
              View Features
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Footer                                                    */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="bg-gray-900 py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-8 w-8 bg-[#E10600] flex items-center justify-center">
                <span className="text-white text-xs font-bold">SR</span>
              </div>
              <span className="text-base font-bold text-white">
                SmartRouteX
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              AI-powered last-mile delivery intelligence platform for enterprise
              logistics.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2">
              {["AI Routing", "Live Tracking", "Analytics", "Automation"].map(
                (l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-gray-500 hover:text-white transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Enterprise
            </h4>
            <ul className="space-y-2">
              {["Security", "Compliance", "SLA", "Support"].map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:text-white transition-colors"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2">
              {["About", "Careers", "Contact", "Blog"].map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:text-white transition-colors"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            {new Date().getFullYear()} SmartRouteX. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-gray-600 hover:text-gray-400">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-gray-600 hover:text-gray-400">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <main className="bg-white">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <AIRoutingSection />
      <TrackingSection />
      <AutomationSection />
      <EnterpriseSection />
      <GallerySection />
      <CTASection />
      <Footer />
    </main>
  );
}
