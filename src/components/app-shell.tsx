"use client";
import { useApiKeyStore, useBillStore } from "@/lib/stores";
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
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-4 border-b p-4">
        <span className="text-lg font-bold">BillBuddy</span>
        <nav className="flex gap-3 text-sm" aria-label="Steps">
          {steps.map((step, index) => (
            <span
              key={step.path}
              className={index === currentStep ? "font-bold" : "text-gray-400"}
              aria-current={index === currentStep ? "step" : undefined}
            >
              {step.label}
            </span>
          ))}
        </nav>
        <div className="flex gap-2 text-sm">
          <button
            className="rounded border px-3 py-1.5"
            onClick={() => {
              resetBill();
              router.push("/");
            }}
          >
            New bill
          </button>
          <button
            className="rounded border px-3 py-1.5"
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </button>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center p-4">{children}</main>
      {(needsKey || settingsOpen) && (
        <ApiKeyDialog
          dismissable={!needsKey}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
