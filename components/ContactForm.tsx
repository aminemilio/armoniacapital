"use client";

import { useState } from "react";

export function ContactForm({ email }: { email: string }) {
  const [form, setForm] = useState({ name: "", email: "", message: "", company: "" });
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function submit() {
    if (state === "sending") return;
    setError("");
    setState("sending");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) setState("done");
      else {
        setError(json.error ?? "Something went wrong.");
        setState("idle");
      }
    } catch {
      setError("Network error. Please try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p role="status" className="border border-brass/40 bg-ink-2 p-6 text-bone">
        Thank you. Your message has been sent and we will reply by email.
      </p>
    );
  }

  const field = "w-full border border-white/15 bg-ink px-4 py-3 text-bone placeholder:text-slate focus:border-brass focus:outline-none";
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="c-name" className="mb-1 block text-sm text-bone/80">
          Name
        </label>
        <input id="c-name" className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
      </div>
      <div>
        <label htmlFor="c-email" className="mb-1 block text-sm text-bone/80">
          Email
        </label>
        <input id="c-email" type="email" className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
      </div>
      <div>
        <label htmlFor="c-msg" className="mb-1 block text-sm text-bone/80">
          Message
        </label>
        <textarea id="c-msg" rows={6} className={field} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      </div>
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" name="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="absolute left-[-9999px] h-0 w-0 opacity-0" />
      {error && (
        <p role="alert" className="text-sm text-fall">
          {error}
        </p>
      )}
      <button type="button" onClick={submit} disabled={state === "sending"} className="bg-brass px-6 py-3 font-medium text-ink hover:bg-brass-light disabled:opacity-60">
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
      <p className="text-xs text-slate">
        Prefer email? Write to{" "}
        <a href={`mailto:${email}`} className="text-brass-light underline">
          {email}
        </a>
        .
      </p>
    </div>
  );
}
