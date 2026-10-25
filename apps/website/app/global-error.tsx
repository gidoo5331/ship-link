"use client"

// Only used if the root layout itself fails (it's built not to, but this
// replaces Next's bare "Application error" just in case). Must render its own
// <html> and <body>, and can't rely on the app's CSS.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc", color: "#0f172a" }}>
        <main style={{ maxWidth: 480, margin: "0 auto", padding: "96px 16px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, margin: "0 0 12px" }}>Something went wrong</h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#475569", margin: "0 0 24px" }}>
            The site didn&apos;t load properly. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ font: "inherit", fontSize: 14, padding: "10px 18px", borderRadius: 8, border: "none", background: "#0f172a", color: "#fff", cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
