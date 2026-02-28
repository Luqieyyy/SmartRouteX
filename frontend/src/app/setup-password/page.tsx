"use client";

import React, { useCallback, useEffect, useState } from "react";
import { validateSetupToken, setupPassword } from "@/services/riders";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type PageState = "loading" | "form" | "success" | "error";

export default function SetupPasswordPage() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [token, setToken] = useState("");
  const [riderName, setRiderName] = useState("");
  const [riderEmail, setRiderEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Form
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  /* ── Extract token from URL and validate ─────────────────── */

  const initializeToken = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");

    if (!t || t.length !== 64) {
      setErrorMessage("Invalid or missing setup token. Please check your email link.");
      setPageState("error");
      return;
    }

    setToken(t);

    try {
      const res = await validateSetupToken(t);
      if (res.valid && res.rider) {
        setRiderName(res.rider.name);
        setRiderEmail(res.rider.work_email);
        setPageState("form");
      } else {
        setErrorMessage(res.message || "This setup link is invalid or has expired.");
        setPageState("error");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        axiosErr.response?.data?.message ||
          "This setup link is invalid or has expired. Please contact your administrator to resend."
      );
      setPageState("error");
    }
  }, []);

  useEffect(() => {
    initializeToken();
  }, [initializeToken]);

  /* ── Password validation ─────────────────────────────────── */

  const passwordChecks = {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /[0-9]/.test(password),
    match: password.length > 0 && password === confirmPassword,
  };

  const allValid = passwordChecks.length && passwordChecks.letter && passwordChecks.number && passwordChecks.match;

  /* ── Submit ──────────────────────────────────────────────── */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors({});

    if (!allValid) {
      if (!passwordChecks.match) {
        setFormErrors({ password_confirmation: "Passwords do not match." });
      }
      return;
    }

    setSubmitting(true);
    try {
      await setupPassword(token, password, confirmPassword);
      setPageState("success");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { errors?: Record<string, string[]>; message?: string } };
      };
      if (axiosErr.response?.data?.errors) {
        const fe: Record<string, string> = {};
        for (const [k, v] of Object.entries(axiosErr.response.data.errors)) {
          fe[k] = v[0];
        }
        setFormErrors(fe);
      } else if (axiosErr.response?.data?.message) {
        setFormErrors({ token: axiosErr.response.data.message });
      } else {
        setFormErrors({ token: "An unexpected error occurred. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Render states ───────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Smart<span className="text-[#E10600]">RouteX</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Rider Account Activation</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 shadow-sm">
          {/* ── Loading ──────────────────────────────────── */}
          {pageState === "loading" && (
            <div className="p-8 text-center">
              <Loader2 className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
              <p className="text-sm text-gray-500 mt-3">Validating your setup link...</p>
            </div>
          )}

          {/* ── Error ────────────────────────────────────── */}
          {pageState === "error" && (
            <div className="p-8 text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-400" />
              <h2 className="text-base font-semibold text-gray-900 mt-4">Link Invalid</h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{errorMessage}</p>
              <p className="text-xs text-gray-400 mt-4">
                Need help? Contact your administrator to resend the activation email.
              </p>
            </div>
          )}

          {/* ── Form ─────────────────────────────────────── */}
          {pageState === "form" && (
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">
                  Welcome, <strong>{riderName}</strong>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{riderEmail}</p>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Set your password to activate your rider account.
                </p>

                {/* Token error */}
                {formErrors.token && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                    {formErrors.token}
                  </div>
                )}

                {/* Password field */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full border px-3 py-2 text-sm text-gray-900 pr-10 focus:border-[#E10600] focus:outline-none focus:ring-1 focus:ring-[#E10600] transition-colors ${
                        formErrors.password ? "border-red-400" : "border-gray-300"
                      }`}
                      placeholder="Min 8 characters"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <span className="text-xs text-red-600">{formErrors.password}</span>
                  )}
                </div>

                {/* Confirm password field */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full border px-3 py-2 text-sm text-gray-900 pr-10 focus:border-[#E10600] focus:outline-none focus:ring-1 focus:ring-[#E10600] transition-colors ${
                        formErrors.password_confirmation ? "border-red-400" : "border-gray-300"
                      }`}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formErrors.password_confirmation && (
                    <span className="text-xs text-red-600">{formErrors.password_confirmation}</span>
                  )}
                </div>

                {/* Password strength checklist */}
                {password.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <CheckItem ok={passwordChecks.length} text="At least 8 characters" />
                    <CheckItem ok={passwordChecks.letter} text="Contains a letter" />
                    <CheckItem ok={passwordChecks.number} text="Contains a number" />
                    {confirmPassword.length > 0 && (
                      <CheckItem ok={passwordChecks.match} text="Passwords match" />
                    )}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || !allValid}
                  className="w-full bg-[#E10600] text-white py-2.5 text-sm font-medium uppercase tracking-wide hover:bg-[#B00000] transition-colors disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Setting up...
                    </span>
                  ) : (
                    "Activate Account"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── Success ──────────────────────────────────── */}
          {pageState === "success" && (
            <div className="p-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="text-base font-semibold text-gray-900 mt-4">
                Account Activated!
              </h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Your password has been set successfully. You can now log in using
                the SmartRouteX mobile app.
              </p>
              <div className="mt-6 bg-gray-50 border border-gray-200 p-4 text-left">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
                  Your login credentials
                </p>
                <p className="text-sm text-gray-900">{riderEmail}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Use the password you just created
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} SmartRouteX. All rights reserved.
        </p>
      </div>
    </div>
  );
}

/* ── Small helper component ──────────────────────────────── */

function CheckItem({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {ok ? (
        <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
      ) : (
        <XCircle size={14} className="text-gray-300 flex-shrink-0" />
      )}
      <span className={ok ? "text-green-700" : "text-gray-400"}>{text}</span>
    </div>
  );
}
