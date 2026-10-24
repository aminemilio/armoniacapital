import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Subscription", robots: { index: false } };

const MESSAGES: Record<string, { title: string; body: string }> = {
  ok: { title: "You're subscribed", body: "Welcome to The Morning Balance. Your first briefing arrives with the next edition." },
  invalid: { title: "This link is invalid or has expired", body: "Request a new confirmation email from the subscribe form on the homepage." },
  error: { title: "Something went wrong", body: "We could not complete your subscription. Please try again in a few minutes." },
  test: { title: "Test link", body: "This is the unsubscribe link placeholder from a test email." },
};

export default async function SubscribedPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const m = MESSAGES[status ?? "invalid"] ?? MESSAGES.invalid;
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <h1 className="font-serif text-4xl text-bone">{m.title}</h1>
      <p className="mt-4 text-lg text-bone/70">{m.body}</p>
      <Link href="/" className="mt-8 inline-block bg-brass px-6 py-3 font-medium text-ink hover:bg-brass-light">
        Back to today&apos;s balance
      </Link>
    </div>
  );
}
