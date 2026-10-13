"use client";
import { Button } from "@/components/ui/button";
import { Moon, Sun, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";

const order = ["system", "light", "dark"] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const current = (theme ?? "system") as (typeof order)[number];
  const next = order[(order.indexOf(current) + 1) % order.length];
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : SunMoon;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Theme: ${current}. Switch to ${next}`}
      title={`Theme: ${current}`}
      onClick={() => setTheme(next)}
    >
      <Icon />
    </Button>
  );
}
