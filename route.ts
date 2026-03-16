// app/auth/callback/route.ts
// Supabase e-posta doğrulama ve OAuth geri dönüş noktası

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/auth";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/search";

  if (code) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Başarılı doğrulama → hedef sayfaya yönlendir
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Hata durumunda login sayfasına yönlendir
  return NextResponse.redirect(
    `${origin}/auth/login?error=auth_callback_failed`
  );
}
