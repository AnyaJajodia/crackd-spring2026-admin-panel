"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const PAGE_SIZE = 10;

const sortOptions = [
  { value: "recent", label: "Most Recent" },
  { value: "likes_desc", label: "Like Count (Descending)" },
  { value: "likes_asc", label: "Like Count (Ascending)" },
];

function getOrder(sortMode) {
  if (sortMode === "likes_asc") {
    return { column: "like_count", ascending: true };
  }
  if (sortMode === "likes_desc") {
    return { column: "like_count", ascending: false };
  }
  return { column: "created_datetime_utc", ascending: false };
}

function getCardHueByRank(rank, total, direction) {
  if (rank === null || total < 2) {
    return 60;
  }
  const t = rank / (total - 1);
  const hue =
    direction === "likes_desc" ? 120 - t * 120 : Math.max(0, t * 120);
  return Math.max(0, Math.min(120, hue));
}

export default function CaptionsPage() {
  const [sortMode, setSortMode] = useState("recent");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rankMap, setRankMap] = useState(null);
  const [rankTotal, setRankTotal] = useState(0);
  const [expandedItem, setExpandedItem] = useState(null);
  const [session, setSession] = useState(null);

  const isLikesSort = sortMode === "likes_asc" || sortMode === "likes_desc";

  async function fetchPage(pageIndex, append) {
    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { column, ascending } = getOrder(sortMode);

    const captionsQuery = supabase
      .from("captions")
      .select("id, created_datetime_utc, content, image_id, like_count")
      .order(column, { ascending })
      .range(from, to);

    if (column !== "created_datetime_utc") {
      captionsQuery.order("created_datetime_utc", { ascending: false });
    }

    const { data: captions, error: captionsError } = await captionsQuery;

    if (captionsError) {
      throw captionsError;
    }

    const imageIds = Array.from(
      new Set(captions.map((item) => item.image_id).filter(Boolean))
    );

    let imagesById = {};
    if (imageIds.length) {
      const { data: images, error: imagesError } = await supabase
        .from("images")
        .select("id, url")
        .in("id", imageIds);

      if (imagesError) {
        throw imagesError;
      }

      imagesById = images.reduce((acc, image) => {
        acc[image.id] = image.url;
        return acc;
      }, {});
    }

    const merged = captions.map((caption) => ({
      ...caption,
      imageUrl: imagesById[caption.image_id] || null,
    }));

    setHasMore(captions.length === PAGE_SIZE);
    setItems((prev) => (append ? [...prev, ...merged] : merged));
  }

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
    let isActive = true;
    setLoading(true);
    setError(null);

    if (!session) {
      setItems([]);
      setHasMore(false);
      setLoading(false);
      return () => {
        isActive = false;
      };
    }

    fetchPage(0, false)
      .catch((err) => {
        if (isActive) {
          setError(err?.message || "Failed to load captions.");
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [sortMode, session]);

  useEffect(() => {
    let isActive = true;

    if (!session) {
      setRankMap(null);
      setRankTotal(0);
      return () => {
        isActive = false;
      };
    }

    async function buildRankLookup() {
      const { data, error: rankError } = await supabase
        .from("captions")
        .select("id, like_count");

      if (rankError) {
        throw rankError;
      }

      const sorted = [...data].sort((a, b) => {
        const aLikes = a.like_count ?? 0;
        const bLikes = b.like_count ?? 0;
        return bLikes - aLikes;
      });

      const map = sorted.reduce((acc, item, index) => {
        acc[item.id] = index;
        return acc;
      }, {});

      if (isActive) {
        setRankMap(map);
        setRankTotal(sorted.length);
      }
    }

    buildRankLookup().catch((err) => {
      if (isActive) {
        setRankMap(null);
        setRankTotal(0);
        setError(err?.message || "Failed to build rank map.");
      }
    });

    return () => {
      isActive = false;
    };
  }, [sortMode, session]);

  const handleSignIn = async () => {
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  async function handleViewMore() {
    if (loadingMore || loading) return;
    setLoadingMore(true);
    setError(null);
    const nextPage = Math.floor(items.length / PAGE_SIZE);

    try {
      await fetchPage(nextPage, true);
    } catch (err) {
      setError(err?.message || "Failed to load more captions.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section className="captions-page">
      <header className="captions-header">
        <h1 className="captions-title">Captions List</h1>
        <p className="captions-subtitle">Click on box to expand.</p>
        <div className="captions-controls">
          <div className="sort-label">
            Sort:
            <div className="sort-dropdown">
              <button
                type="button"
                className="sort-trigger"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={menuOpen}
              >
                {sortOptions.find((option) => option.value === sortMode)?.label}
              </button>
              {menuOpen && (
                <div className="sort-menu" role="listbox">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`sort-option${
                        option.value === sortMode ? " is-active" : ""
                      }`}
                      onClick={() => {
                        setSortMode(option.value);
                        setMenuOpen(false);
                      }}
                      role="option"
                      aria-selected={option.value === sortMode}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {loading && (
        <div className="captions-state">Loading captions...</div>
      )}

      {error && <div className="captions-state">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="captions-state">
          No captions yet. Add some data to get started.
        </div>
      )}

      <div className="captions-list">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="caption-card"
            style={{
              "--card-hue": getCardHueByRank(
                rankMap?.[item.id] ?? index,
                rankTotal || items.length,
                sortMode === "likes_asc" ? "likes_asc" : "likes_desc"
              ),
            }}
            onClick={() => setExpandedItem(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                setExpandedItem(item);
              }
            }}
          >
            <div className="caption-thumb">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt="Caption thumbnail"
                />
              ) : (
                "No Image"
              )}
            </div>
            <div className="caption-content">{item.content}</div>
            <div className="caption-likes">{item.like_count ?? 0}</div>
          </div>
        ))}
      </div>

      <div className="captions-footer">
        <button
          className="captions-button"
          onClick={handleViewMore}
          disabled={!hasMore || loadingMore || loading}
        >
          {loadingMore ? "Loading..." : hasMore ? "View more" : "No more"}
        </button>
      </div>

      {expandedItem && (
        <div
          className="image-modal"
          onClick={() => setExpandedItem(null)}
          role="presentation"
        >
          <div
            className="image-modal__content polaroid-card"
            onClick={(event) => event.stopPropagation()}
            style={{
              "--modal-hue": getCardHueByRank(
                rankMap?.[expandedItem.id] ?? 0,
                rankTotal || items.length,
                "likes_desc"
              ),
            }}
          >
            <button
              type="button"
              className="image-modal__close"
              onClick={() => setExpandedItem(null)}
              aria-label="Close image"
            >
              ×
            </button>
            {expandedItem.imageUrl ? (
              <img src={expandedItem.imageUrl} alt="Expanded caption" />
            ) : (
              <div className="image-modal__empty">No Image</div>
            )}
            <div className="image-modal__text">
              <div className="image-modal__caption">
                {expandedItem.content}
              </div>
              <div className="image-modal__likes">
                Like count: {expandedItem.like_count ?? 0}
              </div>
            </div>
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
