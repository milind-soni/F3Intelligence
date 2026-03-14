"use client";

import { useState, useEffect } from "react";

const PASSWORD = "fthree";
const STORAGE_KEY = "f3-auth";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem(STORAGE_KEY) === "true") {
      setAuthenticated(true);
    }
  }, []);

  if (!mounted) return null;

  if (authenticated) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setAuthenticated(true);
    } else {
      setError(true);
      setInput("");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 shadow-lg w-full max-w-sm mx-4"
      >
        <div className="text-2xl font-display">F3 Intelligence</div>
        <p className="text-sm text-muted-foreground">Enter password to continue</p>
        <input
          type="password"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(false);
          }}
          placeholder="Password"
          autoFocus
          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        {error && (
          <p className="text-sm text-red-500">Incorrect password</p>
        )}
        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Enter
        </button>
      </form>
    </div>
  );
}
