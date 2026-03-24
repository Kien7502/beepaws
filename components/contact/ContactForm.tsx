"use client";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export function ContactForm() {
  return (
    <form
      className="space-y-4 pt-4 border-t border-[var(--color-border)]"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <Input label="Name" name="name" autoComplete="name" placeholder="Your name" />
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
      />
      <div className="w-full flex flex-col space-y-1.5">
        <label htmlFor="message" className="text-sm font-semibold text-[var(--color-foreground)]">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          placeholder="How can we help?"
          className="w-full rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-foreground)] placeholder-slate-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/20 resize-y min-h-[120px]"
        />
      </div>
      <Button type="submit">Send message</Button>
    </form>
  );
}
