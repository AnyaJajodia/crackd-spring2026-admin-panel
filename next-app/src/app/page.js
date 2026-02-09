"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [session, setSession] = useState(null);

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
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "96px 24px 48px",
        overflow: "hidden",
        background: "#000000",
      }}
    >
      <div
        style={{
          textAlign: "center",
          display: "grid",
          gap: "18px",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontFamily:
              "\"SFMono-Regular\", Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace",
            fontWeight: 700,
            margin: 0,
            color: "#ffffff",
            textShadow: "0 0 14px rgba(255, 255, 255, 0.55)",
          }}
        >
          Hello World
        </h1>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {!session && (
            <button
              type="button"
              onClick={handleSignIn}
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                color: "#ffffff",
                padding: "10px 18px",
                borderRadius: "999px",
                cursor: "pointer",
                fontFamily:
                  "\"SFMono-Regular\", Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace",
                letterSpacing: "0.04em",
              }}
            >
              Sign in with Google
            </button>
          )}
          {session && (
            <>
              <Link
                href="/captions"
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                  color: "#ffffff",
                  padding: "10px 18px",
                  borderRadius: "999px",
                  letterSpacing: "0.04em",
                }}
              >
                Continue to Captions
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  padding: "10px 18px",
                  borderRadius: "999px",
                  cursor: "pointer",
                  fontFamily:
                    "\"SFMono-Regular\", Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace",
                  letterSpacing: "0.04em",
                }}
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
