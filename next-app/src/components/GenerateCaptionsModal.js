"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  generatePresignedUrl,
  generateCaptions,
  registerImageUrl,
  uploadToPresignedUrl,
} from "../lib/pipeline";

const SUPPORTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
];

const STEP_LABELS = [
  "Preparing upload",
  "Uploading image",
  "Registering image",
  "Generating captions",
];

export default function GenerateCaptionsModal({
  isOpen,
  session,
  onClose,
  onComplete,
}) {
  const fileInputRef = useRef(null);
  const [phase, setPhase] = useState("select");
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [captions, setCaptions] = useState([]);
  const [captionIndex, setCaptionIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPhase("select");
      setSelectedFile(null);
      setError(null);
      setStepIndex(0);
      setCaptions([]);
      setCaptionIndex(0);
      setImageUrl(null);
      setIsBusy(false);
      setDragActive(false);
    }
  }, [isOpen]);

  const canClose = phase !== "progress";

  const supportedFormatsText = useMemo(
    () => "Supported formats: JPG, JPEG, PNG, WEBP, GIF, HEIC",
    []
  );

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!SUPPORTED_TYPES.includes(file.type)) {
      setError("Unsupported file type. Please upload a supported image.");
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  const handleGenerate = async () => {
    if (!selectedFile || !session?.access_token) return;
    setIsBusy(true);
    setPhase("progress");
    setStepIndex(0);
    setError(null);

    try {
      setStepIndex(0);
      const { presignedUrl, cdnUrl } = await generatePresignedUrl(
        session.access_token,
        selectedFile.type
      );

      setStepIndex(1);
      await uploadToPresignedUrl(presignedUrl, selectedFile);

      setStepIndex(2);
      const { imageId } = await registerImageUrl(
        session.access_token,
        cdnUrl,
        false
      );

      setStepIndex(3);
      const generated = await generateCaptions(session.access_token, imageId);

      const captionsList = Array.isArray(generated) ? generated : [];
      setCaptions(captionsList);
      setCaptionIndex(0);
      setImageUrl(cdnUrl);
      setPhase("results");
      if (onComplete) {
        onComplete({ imageId, imageUrl: cdnUrl, captions: captionsList });
      }
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
      setPhase("select");
    } finally {
      setIsBusy(false);
    }
  };

  const handleReset = () => {
    setPhase("select");
    setSelectedFile(null);
    setCaptions([]);
    setCaptionIndex(0);
    setError(null);
    setStepIndex(0);
    setImageUrl(null);
  };

  const handleCaptionNav = (direction) => {
    if (!captions.length) return;
    setCaptionIndex((prev) => {
      const next = direction === "next" ? prev + 1 : prev - 1;
      if (next < 0) return captions.length - 1;
      if (next >= captions.length) return 0;
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="gen-overlay"
      onClick={() => {
        if (canClose) onClose();
      }}
      role="presentation"
    >
      <div
        className="gen-modal"
        onClick={(event) => event.stopPropagation()}
      >
        {phase === "select" && (
          <div className="gen-section">
            <h2>Upload an image</h2>
            <div
              className={`gen-dropzone${dragActive ? " is-active" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <p>Drag & drop your image here</p>
              <span>or</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                Select Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={SUPPORTED_TYPES.join(",")}
                onChange={(event) => handleFileSelect(event.target.files?.[0])}
                hidden
              />
            </div>
            <p className="gen-supported">{supportedFormatsText}</p>
            {selectedFile && (
              <button
                type="button"
                className="gen-primary"
                onClick={handleGenerate}
                disabled={isBusy}
              >
                Generate Captions
              </button>
            )}
            {error && <div className="gen-error">{error}</div>}
          </div>
        )}

        {phase === "progress" && (
          <div className="gen-section">
            <h2>Generating captions</h2>
            <div className="gen-progress">
              {STEP_LABELS.map((label, index) => (
                <div
                  key={label}
                  className={`gen-progress__step${
                    index <= stepIndex ? " is-active" : ""
                  }`}
                >
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <p className="gen-note">
              Please don’t refresh your page — this might take a minute or two.
            </p>
          </div>
        )}

        {phase === "results" && (
          <div className="gen-section">
            <h2>Generated captions</h2>
            <div className="gen-card">
              {imageUrl && (
                <img src={imageUrl} alt="Uploaded preview" />
              )}
              <div className="gen-carousel">
                <button
                  type="button"
                  className="gen-carousel__nav"
                  onClick={() => handleCaptionNav("prev")}
                  aria-label="Previous caption"
                >
                  ‹
                </button>
                <div key={captionIndex} className="gen-carousel__text">
                  {captions[captionIndex]?.content ||
                    captions[captionIndex]?.caption ||
                    "No captions returned."}
                </div>
                <button
                  type="button"
                  className="gen-carousel__nav"
                  onClick={() => handleCaptionNav("next")}
                  aria-label="Next caption"
                >
                  ›
                </button>
              </div>
              <div className="gen-carousel__count">
                {captions.length ? `${captionIndex + 1} / ${captions.length}` : "0 / 0"}
              </div>
            </div>
            <button type="button" className="gen-secondary" onClick={handleReset}>
              Upload another image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
