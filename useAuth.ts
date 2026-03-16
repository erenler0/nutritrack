"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

interface UseAuthReturn extends AuthState {
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
  });

  useEffect(() => {
    const supabase = getSupabaseClient();

    // İlk yüklemede mevcut oturumu al
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, isLoading: false });
    });

    // Auth değişikliklerini dinle (login, logout, token yenileme)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({ user: session?.user ?? null, session, isLoading: false });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Kayıt ────────────────────────────────────────────────────────────────
  const signUp = useCallback(
    async (email: string, password: string, fullName?: string) => {
      const supabase = getSupabaseClient();

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName ?? "" },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) return { error: translateAuthError(error.message) };

      // handle_new_user trigger'ı otomatik profil oluşturur
      router.push("/auth/verify-email");
      return { error: null };
    },
    [router]
  );

  // ── Giriş ────────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string) => {
      const supabase = getSupabaseClient();

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) return { error: translateAuthError(error.message) };

      router.push("/search");
      router.refresh(); // Server Component'leri yenile
      return { error: null };
    },
    [router]
  );

  // ── Çıkış ────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }, [router]);

  // ── Şifre sıfırlama ──────────────────────────────────────────────────────
  const resetPassword = useCallback(async (email: string) => {
    const supabase = getSupabaseClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) return { error: translateAuthError(error.message) };
    return { error: null };
  }, []);

  return { ...state, signUp, signIn, signOut, resetPassword };
}

// ─── Hata mesajlarını Türkçeleştir ───────────────────────────────────────────

function translateAuthError(msg: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials":
      "E-posta veya şifre hatalı.",
    "Email not confirmed":
      "E-posta adresiniz henüz doğrulanmamış. Gelen kutunuzu kontrol edin.",
    "User already registered":
      "Bu e-posta adresiyle zaten bir hesap var.",
    "Password should be at least 6 characters":
      "Şifre en az 6 karakter olmalı.",
    "For security purposes, you can only request this after":
      "Güvenlik nedeniyle bu işlemi biraz sonra tekrar deneyin.",
    "Email rate limit exceeded":
      "Çok fazla istek gönderildi. Lütfen bekleyin.",
  };

  for (const [key, val] of Object.entries(map)) {
    if (msg.includes(key)) return val;
  }
  return "Bir hata oluştu. Lütfen tekrar deneyin.";
}
