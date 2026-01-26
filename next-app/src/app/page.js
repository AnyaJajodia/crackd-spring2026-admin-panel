export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "48px 24px",
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
      </div>
    </main>
  );
}
