"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import GenerateCaptionsModal from "../../components/GenerateCaptionsModal";

export default function GeneratePage() {
  const [session, setSession] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  return (
    <section className="gen-page">
      <div className="gen-start">
        <h1>Are you ready to generate captions with your own images?</h1>
        <button
          type="button"
          className="gen-start__button"
          onClick={() => setModalOpen(true)}
          disabled={!session}
        >
          Upload Image
        </button>
      </div>

      <GenerateCaptionsModal
        isOpen={modalOpen}
        session={session}
        onClose={() => setModalOpen(false)}
      />

      {!session && (
        <div
          className="auth-guard"
          onClick={() => {
            window.location.href = "/";
          }}
          role="presentation"
        >
          <div
            className="auth-guard__card"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="auth-guard__close"
              onClick={() => {
                window.location.href = "/";
              }}
              aria-label="Close sign-in prompt"
            >
              ×
            </button>
            <h2>Sign in to view this page</h2>
            <button type="button" onClick={handleSignIn}>
              Sign in with Google
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
