"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import YourCaptionsModal from "../../components/YourCaptionsModal";

export default function YourCaptionsPage() {
  const [session, setSession] = useState(null);
  const [images, setImages] = useState([]);
  const [captionsByImage, setCaptionsByImage] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

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

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    let isActive = true;
    async function fetchCaptions() {
      setLoading(true);
      setError(null);

      const { data: imageRows, error: imagesError } = await supabase
        .from("images")
        .select("id, url, profile_id")
        .eq("profile_id", session.user.id);

      if (imagesError) {
        if (isActive) {
          setError(imagesError.message || "Failed to load images.");
          setLoading(false);
        }
        return;
      }

      const imageIds = imageRows.map((image) => image.id);
      if (!imageIds.length) {
        if (isActive) {
          setImages([]);
          setCaptionsByImage({});
          setLoading(false);
        }
        return;
      }

      const { data: captionsRows, error: captionsError } = await supabase
        .from("captions")
        .select("id, content, image_id")
        .in("image_id", imageIds);

      if (captionsError) {
        if (isActive) {
          setError(captionsError.message || "Failed to load captions.");
          setLoading(false);
        }
        return;
      }

      const grouped = captionsRows.reduce((acc, caption) => {
        if (!acc[caption.image_id]) {
          acc[caption.image_id] = [];
        }
        acc[caption.image_id].push(caption);
        return acc;
      }, {});

      if (isActive) {
        setImages(imageRows);
        setCaptionsByImage(grouped);
        setLoading(false);
      }
    }

    fetchCaptions();

    return () => {
      isActive = false;
    };
  }, [session]);

  const handleSignIn = async () => {
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  return (
    <section className="yourcaps-page">
      <header className="yourcaps-header">
        <h1>Your Captions</h1>
      </header>

      {loading && <div className="yourcaps-state">Loading...</div>}
      {error && <div className="yourcaps-state">{error}</div>}

      {!loading && !error && images.length === 0 && (
        <div className="yourcaps-empty">
          <p>You haven’t generated captions yet.</p>
          <a href="/generate">Generate captions</a>
        </div>
      )}

      {!loading && !error && images.length > 0 && (
        <div className="yourcaps-grid">
          {images.map((image) => (
            <button
              key={image.id}
              type="button"
              className="yourcaps-thumb"
              onClick={() => setSelectedImage(image)}
            >
              <img src={image.url} alt="Generated" />
            </button>
          ))}
        </div>
      )}

      <YourCaptionsModal
        isOpen={!!selectedImage}
        image={selectedImage}
        captions={selectedImage ? captionsByImage[selectedImage.id] : []}
        onClose={() => setSelectedImage(null)}
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
