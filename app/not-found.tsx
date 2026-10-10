import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <h1 className="font-serif text-4xl text-bone">Page not found</h1>
      <p className="mt-4 text-bone/70">That page does not exist or has moved.</p>
      <Link href="/" className="mt-8 inline-block bg-brass px-6 py-3 font-medium text-ink hover:bg-brass-light">
        Back to today&apos;s balance
      </Link>
    </div>
  );
}
