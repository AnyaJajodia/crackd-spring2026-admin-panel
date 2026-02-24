"use client";

import { useEffect, useState } from "react";

export default function YourCaptionsModal({ isOpen, image, captions, onClose }) {
  const [captionIndex, setCaptionIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCaptionIndex(0);
    }
  }, [isOpen, image?.id]);

  const handleCaptionNav = (direction) => {
    if (!captions?.length) return;
    setCaptionIndex((prev) => {
      const next = direction === "next" ? prev + 1 : prev - 1;
      if (next < 0) return captions.length - 1;
      if (next >= captions.length) return 0;
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="yourcaps-overlay" onClick={onClose} role="presentation">
      <div
        className="yourcaps-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="yourcaps-card">
          {image?.url && <img src={image.url} alt="Generated caption" />}
          <div className="yourcaps-carousel">
            <button
              type="button"
              className="yourcaps-carousel__nav"
              onClick={() => handleCaptionNav("prev")}
              aria-label="Previous caption"
            >
              ‹
            </button>
            <div key={captionIndex} className="yourcaps-carousel__text">
              {captions?.[captionIndex]?.content ||
                captions?.[captionIndex]?.caption ||
                "No captions available."}
            </div>
            <button
              type="button"
              className="yourcaps-carousel__nav"
              onClick={() => handleCaptionNav("next")}
              aria-label="Next caption"
            >
              ›
            </button>
          </div>
          <div className="yourcaps-carousel__count">
            {captions?.length ? `${captionIndex + 1} / ${captions.length}` : "0 / 0"}
          </div>
        </div>
      </div>
    </div>
  );
}
