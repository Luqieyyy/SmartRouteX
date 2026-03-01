"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { access_token, user, hub_context } = res.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      // Store initial hub context from login response
      if (hub_context) {
        if (hub_context.active_hub_id) {
          localStorage.setItem("activeHubId", String(hub_context.active_hub_id));
        } else {
          localStorage.removeItem("activeHubId");
        }
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : axios.isAxiosError(err) && err.response?.data?.errors?.email
            ? err.response.data.errors.email[0]
            : "Invalid credentials. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <Image
          src="/images/ninjavan5.jpg"
          alt="SmartRouteX Operations"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-[#E10600] flex items-center justify-center">
              <span className="text-white text-xs font-bold">SR</span>
            </div>
            <span className="text-base font-bold text-white">SmartRouteX</span>
          </Link>

          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <blockquote className="max-w-md">
              <p className="text-xl text-white font-medium leading-relaxed">
                &ldquo;SmartRouteX reduced our delivery costs by 38% and
                improved first-attempt success to 96% within three months.&rdquo;
              </p>
              <footer className="mt-4">
                <p className="text-sm text-white font-medium">
                  Operations Director
                </p>
                <p className="text-sm text-gray-400">
                  Regional Logistics Partner
                </p>
              </footer>
            </blockquote>
          </motion.div>

          <p className="text-xs text-gray-600">
            {new Date().getFullYear()} SmartRouteX
          </p>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-16 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="h-8 w-8 bg-[#E10600] flex items-center justify-center">
              <span className="text-white text-xs font-bold">SR</span>
            </div>
            <span className="text-base font-bold text-gray-900">
              SmartRouteX
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Sign in
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Access your operations dashboard
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-gray-700 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smartroutex.com"
                autoComplete="email"
                className="w-full border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#E10600] focus:ring-1 focus:ring-[#E10600] transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-gray-700"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-[#E10600] hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#E10600] focus:ring-1 focus:ring-[#E10600] transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E10600] text-white font-medium py-2.5 text-sm hover:bg-[#B00000] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Protected by enterprise-grade security.
            <br />
            <Link
              href="/"
              className="text-[#E10600] hover:underline font-medium"
            >
              Back to home
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
