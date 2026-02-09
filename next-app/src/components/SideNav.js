"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const navItems = [
  { href: "/", label: "Hello World" },
  { href: "/captions", label: "Captions List" },
];

export default function SideNav() {
  const pathname = usePathname();
  const [session, setSession] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session ?? null);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession ?? null);
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="side-nav">
      <div className="side-nav__title">Anya's Crack'd</div>
      <div className="side-nav__links">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`side-nav__link${isActive ? " is-active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <div
        className="side-nav__profile"
        onMouseEnter={() => {
          if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
          }
          setMenuOpen(true);
        }}
        onMouseLeave={() => {
          closeTimerRef.current = setTimeout(() => {
            setMenuOpen(false);
          }, 150);
        }}
      >
        <button
          type="button"
          className="profile-button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Profile menu"
        >
          <svg className="profile-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4.1 3.6-7 8-7s8 2.9 8 7" />
          </svg>
        </button>
        {menuOpen && (
          <div
            className="profile-dropdown"
            role="menu"
            onMouseEnter={() => {
              if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
              }
              setMenuOpen(true);
            }}
          >
            {session ? (
              <button
                type="button"
                className="profile-action"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            ) : (
              <button
                type="button"
                className="profile-action"
                onClick={handleSignIn}
              >
                Sign in
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
