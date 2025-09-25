"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ dir = "rtl" }: { dir?: "rtl" | "ltr" }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full border border-transparent hover:border-emerald-500"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light" : "Switch to dark"}
    >
      {isDark ? (
        <Sun className="h-5 w-5" aria-hidden />
      ) : (
        <Moon className="h-5 w-5" aria-hidden style={dir === "rtl" ? { transform: "scaleX(-1)" } : undefined} />
      )}
    </Button>
  );
}
