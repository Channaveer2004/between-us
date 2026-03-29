"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid Hydration Mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
      aria-label="Toggle Dark Mode"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
