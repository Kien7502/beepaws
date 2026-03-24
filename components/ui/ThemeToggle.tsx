"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 text-[var(--color-foreground)] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors w-9 h-9">
        <span className="sr-only">Loading theme</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 text-[var(--color-foreground)] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative flex items-center justify-center w-9 h-9"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun className="absolute h-5 w-5 transition-all scale-100 rotate-0 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 transition-all scale-0 rotate-90 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
