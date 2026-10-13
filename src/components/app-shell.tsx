"use client";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useApiKeyStore, useBillStore } from "@/lib/stores";
import { cn } from "cn";
import { Plus, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ApiKeyDialog } from "./api-key-dialog";
import { HydrationGate } from "./hydration-gate";

const steps = [
  { label: "Upload", path: "/" },
  { label: "Members", path: "/members" },
  { label: "Bill", path: "/bill" },
  { label: "Result", path: "/result" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <HydrationGate>
      <Shell>{children}</Shell>
    </HydrationGate>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const apiKey = useApiKeyStore((state) => state.apiKey);
  const resetBill = useBillStore((state) => state.resetBill);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const currentStep = steps.findIndex((step) => step.path === pathname);
  const needsKey = apiKey.length === 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-border/70 bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-1 px-3 py-2.5 sm:gap-2 sm:px-4">
          <Logo />
          <nav
            className="mx-auto hidden items-center gap-1 sm:flex"
            aria-label="Steps"
          >
            {steps.map((step, index) => (
              <span
                key={step.path}
                aria-current={index === currentStep ? "step" : undefined}
                className={cn(
                  "rounded-full px-3 py-1 text-sm transition-colors",
                  index === currentStep
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            ))}
          </nav>
          <span className="text-muted-foreground mx-auto text-sm sm:hidden">
            Step {Math.max(currentStep + 1, 1)} of {steps.length} ·{" "}
            {steps[Math.max(currentStep, 0)]?.label}
          </span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Settings"
              title="Settings"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings />
            </Button>
            <Button
              variant="outline"
              className="h-8"
              onClick={() => {
                resetBill();
                router.push("/");
              }}
            >
              <Plus />
              <span className="hidden sm:inline">New bill</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">
        {children}
      </main>
      {needsKey || settingsOpen ? (
        <ApiKeyDialog
          key={apiKey || "empty"}
          open
          dismissable={!needsKey}
          onOpenChange={(open) => {
            if (!open) setSettingsOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
