// middleware.ts — proje kökünde olmalı
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ─── Korumalı rotalar ────────────────────────────────────────────────────────
const PROTECTED = ["/search", "/profile", "/log"];
const AUTH_PAGES = ["/auth/login", "/auth/register"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Token'ı yenile (session süresini uzatır)
  const { data: { session } } = await supabase.auth.getSession();
  const path = request.nextUrl.pathname;

  // Korumalı rota + oturum yok → login'e yönlendir
  const isProtected = PROTECTED.some((p) => path.startsWith(p));
  if (isProtected && !session) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", path); // giriş sonrası geri dön
    return NextResponse.redirect(loginUrl);
  }

  // Giriş sayfası + oturum var → ana sayfaya yönlendir
  const isAuthPage = AUTH_PAGES.some((p) => path.startsWith(p));
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/search", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // API rotaları ve statik dosyalar hariç her şey
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
