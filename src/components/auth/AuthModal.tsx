"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/cn";
import {
  X,
  LogIn,
  UserPlus,
  Phone,
  Lock,
  User,
  KeyRound,
  Loader2,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

/**
 * AUTH MODAL (BOSQICH 2 — chat ichida login/register)
 * ----------------------------------------------------
 * Foydalanuvchi mentalaba.uz saytiga o'tmay, chat'ning O'ZIDA:
 *   - Login (telefon + parol)      → POST /api/v1/auth/login
 *   - Register (ism + telefon + parol) → SMS kod → POST /api/v1/auth/verify
 * Tokenlar chat domenining localStorage'iga saqlanadi — keyingi barcha
 * so'rovlar avtomatik autentifikatsiya qilinadi.
 */

/** Telefon raqamni formatlaydi: 901234567 → +998 90 123 45 67 */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // 998 prefiksli yoki prefikssiz
  let d = digits;
  if (d.startsWith("998")) d = d.slice(3);
  if (d.length > 9) d = d.slice(0, 9);
  if (!d) return "";
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return `+998 ${parts.join(" ")}`;
}

/** Normalize: "+998 90 123 45 67" → "+998901234567" */
function normalizePhone(raw: string): string {
  return "+998" + raw.replace(/\D/g, "").replace(/^998/, "").slice(0, 9);
}

function Field({
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  autoFocus,
  inputMode,
}: {
  icon: React.ElementType;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  inputMode?: "tel" | "numeric" | "text";
}) {
  return (
    <div className="relative group">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-primary-500 transition-colors" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        inputMode={inputMode}
        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/70 border-2 border-gray-100 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-primary-400 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
      />
    </div>
  );
}

export function AuthModal() {
  const {
    authModalOpen,
    authModalTab,
    authModalStep,
    authPhone,
    closeAuthModal,
    openAuthModal,
    login,
    register,
    verifyCode,
    resendCode,
  } = useChatStore();

  const [tab, setTab] = useState<"login" | "register">("login");
  const [firstName, setFirstName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [success, setSuccess] = useState(false);

  // Modal ochilganda holatni sinxronlash
  useEffect(() => {
    if (authModalOpen) {
      setTab(authModalTab);
      setError(null);
      setSuccess(false);
      if (authModalStep === "verify" && authPhone) {
        setPhoneInput(authPhone);
      }
    }
  }, [authModalOpen, authModalTab, authModalStep, authPhone]);

  // Resend timer: har soniyada kamayadi, 0 ga yetganda to'xtaydi
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Escape → yopish
  useEffect(() => {
    if (!authModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuthModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authModalOpen, closeAuthModal]);

  if (!authModalOpen) return null;

  const phone = normalizePhone(phoneInput);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      setError("Telefon raqam va parolni kiriting");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await login(phone, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Login amalga oshmadi");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError("Ismingizni kiriting");
      return;
    }
    if (!phone) {
      setError("Telefon raqamni kiriting");
      return;
    }
    if (password.length < 8) {
      setError("Parol kamida 8 ta belgidan iborat bo'lishi kerak");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await register(firstName.trim(), phone, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Ro'yxatdan o'tish amalga oshmadi");
    } else {
      setResendTimer(60);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.replace(/\D/g, "").length < 4) {
      setError("Tasdiqlash kodini kiriting");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await verifyCode(phone || authPhone || "", code);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Kod noto'g'ri");
    } else {
      setSuccess(true);
      setTimeout(() => closeAuthModal(), 1200);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError(null);
    const res = await resendCode(phone || authPhone || "");
    setLoading(false);
    if (res.ok) {
      setResendTimer(60);
    } else {
      setError(res.error || "Kodni qayta yuborib bo'lmadi");
    }
  };

  // ===== MUVOFFAQIYAT ekrani =====
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm overlay-fade" onClick={closeAuthModal} />
        <div className="relative w-full max-w-sm pop-in rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25 mb-4">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
            Muvaffaqiyatli!
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tizimga kirdingiz — endi barcha ma'lumotlar ochiq.
          </p>
        </div>
      </div>
    );
  }

  // ===== SMS KOD ekrani =====
  if (authModalStep === "verify") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm overlay-fade" onClick={closeAuthModal} />
        <div className="relative w-full max-w-sm pop-in rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                SMS tasdiqlash
              </span>
            </div>
            <button onClick={closeAuthModal} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleVerify} className="p-5 space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              <strong className="text-gray-700 dark:text-gray-200">{phone || authPhone}</strong>{" "}
              raqamiga SMS orqali tasdiqlash kodi yuborildi. Kodni kiriting:
            </p>

            <Field
              icon={KeyRound}
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
              placeholder="Tasdiqlash kodi"
              autoFocus
            />

            {error && (
              <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-xl px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.replace(/\D/g, "").length < 4}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-md shadow-primary-500/25 hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Tasdiqlash
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendTimer > 0 || loading}
                className="inline-flex items-center gap-1.5 text-xs text-primary-500 dark:text-primary-400 font-medium hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", resendTimer > 0 && "animate-spin")} />
                {resendTimer > 0 ? `Kodni qayta yuborish (${resendTimer}s)` : "Kodni qayta yuborish"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ===== LOGIN / REGISTER formasi =====
  const isLogin = tab === "login";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm overlay-fade" onClick={closeAuthModal} />

      <div className="relative w-full max-w-sm pop-in rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
        {/* Dekorativ glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-400/20 dark:bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
              {isLogin ? "Tizimga kirish" : "Ro'yxatdan o'tish"}
            </span>
          </div>
          <button onClick={closeAuthModal} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="relative flex items-center bg-gray-50 dark:bg-gray-800/70 rounded-xl p-1 mx-5 mt-4">
          <div
            className={cn(
              "absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
              tab === "register" && "translate-x-full"
            )}
          />
          <button
            onClick={() => setTab("login")}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-200",
              isLogin ? "text-gray-800 dark:text-gray-100" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            )}
          >
            <LogIn className="w-3.5 h-3.5" />
            Kirish
          </button>
          <button
            onClick={() => setTab("register")}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-200",
              !isLogin ? "text-gray-800 dark:text-gray-100" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            )}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Ro'yxatdan o'tish
          </button>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleRegister} className="relative p-5 pt-4 space-y-3">
          {!isLogin && (
            <Field
              icon={User}
              value={firstName}
              onChange={setFirstName}
              placeholder="Ismingiz"
              autoFocus
            />
          )}

          <Field
            icon={Phone}
            type="tel"
            inputMode="tel"
            value={phoneInput}
            onChange={(v) => {
              setPhoneInput(formatPhone(v));
              setError(null);
            }}
            placeholder="+998 90 123 45 67"
            autoFocus={isLogin}
          />

          <Field
            icon={Lock}
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={isLogin ? "Parol" : "Parol (kamida 8 belgi)"}
          />

          {error && (
            <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-xl px-3 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-md shadow-primary-500/25 hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLogin ? (
              <LogIn className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {isLogin ? "Kirish" : "Ro'yxatdan o'tish"}
          </button>

          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center leading-relaxed">
            {isLogin
              ? "Accountingiz yo'qmi? "
              : "Allaqachon ro'yxatdan o'tganmisiz? "}
            <button
              type="button"
              onClick={() => {
                setTab(isLogin ? "register" : "login");
                setError(null);
              }}
              className="text-primary-500 dark:text-primary-400 font-semibold hover:underline"
            >
              {isLogin ? "Ro'yxatdan o'ting" : "Kirish"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
