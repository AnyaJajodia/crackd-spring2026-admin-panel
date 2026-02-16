"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const BATCH_SIZE = 40;
const BATCH_VOTE_LIMIT = 10;

function toVotePayload({ captionId, profileId, voteValue }) {
  const now = new Date().toISOString();
  return {
    caption_id: captionId,
    profile_id: profileId,
    vote_value: voteValue,
    created_datetime_utc: now,
    modified_datetime_utc: now,
  };
}

export default function RatingsPage() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [voteInProgress, setVoteInProgress] = useState(false);
  const [error, setError] = useState(null);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [votedIds, setVotedIds] = useState(() => new Set());
  const [seenImageIds, setSeenImageIds] = useState(() => new Set());
  const [queue, setQueue] = useState([]);
  const [batchVotes, setBatchVotes] = useState(0);

  const profileId = session?.user?.id ?? null;

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


  function shuffleArray(items) {
    return [...items].sort(() => 0.5 - Math.random());
  }

  function validateImageUrl(url) {
    return new Promise((resolve) => {
      if (!url) {
        resolve(false);
        return;
      }
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  async function fetchBatch(attempt = 0) {
    if (!profileId) return;
    setLoadingItem(true);
    setError(null);

    const { data: voteRows, error: votesError } = await supabase
      .from("caption_votes")
      .select("caption_id")
      .eq("profile_id", profileId);

    if (votesError) {
      setError(votesError.message || "Failed to load votes.");
      setLoadingItem(false);
      return;
    }

    const latestVotedIds = new Set(
      (voteRows || []).map((row) => row.caption_id)
    );

    const voteArray = Array.from(latestVotedIds);
    const formattedIds = voteArray.map((id) => `"${id}"`).join(",");

    const countQuery = supabase
      .from("captions")
      .select("id", { count: "exact", head: true });

    if (voteArray.length > 0) {
      countQuery.not("id", "in", `(${formattedIds})`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      setError(countError.message || "Failed to load captions.");
      setLoadingItem(false);
      return;
    }

    if (!count || count === 0) {
      setCurrentItem(null);
      setLoadingItem(false);
      return;
    }

    const batchSize = Math.min(BATCH_SIZE, count);
    const maxOffset = Math.max(count - batchSize, 0);
    const offset = Math.floor(Math.random() * (maxOffset + 1));

    let captionsQuery = supabase
      .from("captions")
      .select("id, content, image_id")
      .order("created_datetime_utc", { ascending: false })
      .range(offset, offset + batchSize - 1);

    if (voteArray.length > 0) {
      captionsQuery = captionsQuery.not("id", "in", `(${formattedIds})`);
    }
    captionsQuery = captionsQuery.not("image_id", "is", null);

    const { data: captions, error: captionsError } = await captionsQuery;

    if (captionsError) {
      setError(captionsError.message || "Failed to load captions.");
      setLoadingItem(false);
      return;
    }

    if (!captions || captions.length === 0) {
      setCurrentItem(null);
      setLoadingItem(false);
      return;
    }

    setVotedIds(latestVotedIds);
    const seenImages = new Set(seenImageIds);
    const uniqueImageIds = Array.from(
      new Set(captions.map((item) => item.image_id).filter(Boolean))
    );
    const availableImageIds = uniqueImageIds.filter(
      (id) => !seenImages.has(id)
    );
    const imagePool = availableImageIds.length
      ? availableImageIds
      : uniqueImageIds;

    const shuffledImageIds = shuffleArray(imagePool);
    const groupedByImage = shuffledImageIds
      .map((imageId) => {
        const candidates = captions.filter(
          (caption) => caption.image_id === imageId
        );
        if (!candidates.length) return null;
        return shuffleArray(candidates)[0];
      })
      .filter(Boolean);

    if (!groupedByImage.length) {
      if (attempt < 2) {
        setLoadingItem(false);
        await fetchBatch(attempt + 1);
        return;
      }
      setCurrentItem(null);
      setLoadingItem(false);
      return;
    }

    const imageIds = Array.from(
      new Set(groupedByImage.map((item) => item.image_id).filter(Boolean))
    );
    let imagesById = {};
    if (imageIds.length) {
      const { data: images, error: imagesError } = await supabase
        .from("images")
        .select("id, url")
        .in("id", imageIds);

      if (!imagesError && images?.length) {
        imagesById = images.reduce((acc, image) => {
          acc[image.id] = image.url;
          return acc;
        }, {});
      }
    }

    const prepared = groupedByImage.map((caption) => ({
      ...caption,
      imageUrl: imagesById[caption.image_id] || null,
    }));

    const validated = [];
    for (const item of prepared) {
      // Skip any captions with missing/unloadable images.
      // eslint-disable-next-line no-await-in-loop
      const ok = await validateImageUrl(item.imageUrl);
      if (ok) {
        validated.push(item);
      }
    }

    if (!validated.length) {
      if (attempt < 2) {
        setLoadingItem(false);
        await fetchBatch(attempt + 1);
        return;
      }
      setCurrentItem(null);
      setLoadingItem(false);
      return;
    }

    const [next, ...rest] = validated;
    setCurrentItem(next || null);
    setQueue(rest);
    if (next?.image_id) {
      setSeenImageIds((prev) => new Set(prev).add(next.image_id));
    }
    setLoadingItem(false);
  }

  async function fetchNextItem() {
    if (!profileId) return;
    if (queue.length === 0) {
      await fetchBatch();
      return;
    }

    const [next, ...rest] = queue;
    setQueue(rest);
    setCurrentItem(next);
    if (next?.image_id) {
      setSeenImageIds((prev) => new Set(prev).add(next.image_id));
    }
  }

  async function startVoting() {
    setReady(true);
    await fetchBatch();
  }

  async function submitVote(voteValue) {
    if (!currentItem || !profileId || voteInProgress) return;
    setVoteInProgress(true);
    setError(null);
    setSwipeDirection(voteValue === 1 ? "right" : "left");

    const payload = toVotePayload({
      captionId: currentItem.id,
      profileId,
      voteValue,
    });

    const { error: insertError } = await supabase
      .from("caption_votes")
      .insert(payload);

    if (insertError) {
      setError(insertError.message || "Failed to submit vote.");
      setSwipeDirection(null);
      setVoteInProgress(false);
      return;
    }

    setVotedIds((prev) => new Set(prev).add(currentItem.id));

    setTimeout(async () => {
      setSwipeDirection(null);
      const nextCount = batchVotes + 1;
      if (nextCount >= BATCH_VOTE_LIMIT) {
        setBatchVotes(0);
        setQueue([]);
        setSeenImageIds(new Set());
        await fetchBatch();
      } else {
        setBatchVotes(nextCount);
        await fetchNextItem();
      }
      setVoteInProgress(false);
    }, 650);
  }

  const handleClose = () => {
    setReady(false);
    setCurrentItem(null);
    setError(null);
    setSwipeDirection(null);
  };

  return (
    <section className="ratings-page">
      <div className="ratings-start">
        <h1>Are you ready to vote?</h1>
        <button type="button" onClick={startVoting} disabled={!session}>
          Start Voting
        </button>
      </div>

      {ready && (
        <div className="ratings-overlay" onClick={handleClose} role="presentation">
          <div
            className="ratings-frame"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ratings-modal ratings-modal--fixed">
              <div className="ratings-card">
                {loadingItem && (
                  <div className="ratings-loading">Loading...</div>
                )}

                {!loadingItem && !currentItem && (
                  <div className="ratings-empty">No more captions to rate</div>
                )}

                {!loadingItem && currentItem && (
                  <div
                    className={`ratings-card__content${
                      swipeDirection ? ` is-swipe-${swipeDirection}` : ""
                    }`}
                    key={currentItem.id}
                  >
                    {currentItem.imageUrl ? (
                      <img src={currentItem.imageUrl} alt="Caption" />
                    ) : (
                      <div className="image-modal__empty">No Image</div>
                    )}
                    <div className="image-modal__text">
                      <div className="image-modal__caption">
                        {currentItem.content}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {error && <div className="ratings-error">{error}</div>}
            </div>

            {ready && currentItem && (
              <>
                <button
                  type="button"
                  className="vote-button vote-button--left"
                  onClick={(event) => {
                    event.stopPropagation();
                    submitVote(-1);
                  }}
                  disabled={voteInProgress || loadingItem}
                  aria-label="Thumbs down"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M10 14H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4m0 9v6a2 2 0 0 0 2 2h1l4-10V5a2 2 0 0 0-2-2h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="vote-button vote-button--right"
                  onClick={(event) => {
                    event.stopPropagation();
                    submitVote(1);
                  }}
                  disabled={voteInProgress || loadingItem}
                  aria-label="Thumbs up"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M14 10h4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-4m0-9V4a2 2 0 0 0-2-2h-1L7 12v7a2 2 0 0 0 2 2h5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}

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
