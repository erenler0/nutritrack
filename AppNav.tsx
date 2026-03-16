"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const NAV_LINKS = [
  { href: "/search",  label: "Ara" },
  { href: "/log",     label: "Günlük" },
  { href: "/profile", label: "Profil" },
];

export default function AppNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  // Auth sayfalarında navbar gösterme
  if (pathname.startsWith("/auth")) return null;

  return (
    <nav className="app-nav">
      <Link href="/search" className="nav-logo">
        <span className="logo-mark">◈</span>
        <span className="logo-text">NutriTrack</span>
      </Link>

      <div className="nav-links">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${pathname.startsWith(link.href) ? "active" : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="nav-user">
        {user && (
          <>
            <span>{user.email?.split("@")[0]}</span>
            <button className="signout-btn" onClick={signOut}>
              Çıkış
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
