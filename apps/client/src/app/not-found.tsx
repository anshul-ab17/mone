import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1>Not found</h1>
      <p className="muted">That page doesn&apos;t exist.</p>
      <p>
        <Link href="/" className="back-btn" aria-label="Back to home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
        </Link>
      </p>
    </div>
  );
}
