"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { classifyGeminiError, KEY_TEST_MESSAGES } from "@/lib/gemini-error";
import { useApiKeyStore } from "@/lib/stores";
import { GoogleGenAI } from "@google/genai";
import { useState } from "react";

const TEST_TIMEOUT_MS = 15_000;

type TestStatus =
  | { kind: "idle" }
  | { kind: "testing" }
  | { kind: "ok" }
  | { kind: "error"; message: string };

type ApiKeyDialogProps = {
  open: boolean;
  /** When false the dialog cannot be dismissed without saving a key. */
  dismissable: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ApiKeyDialog({
  open,
  dismissable,
  onOpenChange,
}: ApiKeyDialogProps) {
  const storedKey = useApiKeyStore((state) => state.apiKey);
  const setApiKey = useApiKeyStore((state) => state.setApiKey);
  const [value, setValue] = useState(storedKey);
  const [status, setStatus] = useState<TestStatus>({ kind: "idle" });

  const testing = status.kind === "testing";
  const canSubmit = value.trim().length > 0;

  /** Check the key currently in the field, without saving or dismissing. */
  const testKey = async () => {
    setStatus({ kind: "testing" });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TEST_TIMEOUT_MS);
    try {
      const ai = new GoogleGenAI({ apiKey: value.trim() });
      await ai.models.list({ config: { abortSignal: controller.signal } });
      setStatus({ kind: "ok" });
    } catch (error) {
      const reason = classifyGeminiError(error, {
        aborted: controller.signal.aborted,
      });
      setStatus({ kind: "error", message: KEY_TEST_MESSAGES[reason] });
    } finally {
      clearTimeout(timeout);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !dismissable) return;
        onOpenChange(next);
      }}
    >
      <DialogContent showCloseButton={dismissable}>
        <DialogHeader>
          <DialogTitle>Gemini API key</DialogTitle>
          <DialogDescription>
            BillBuddy reads receipts with Gemini using your own API key. The key
            is stored only in this browser.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="api-key">API key</Label>
          <Input
            id="api-key"
            type="password"
            autoFocus
            placeholder="Paste your key"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setStatus({ kind: "idle" });
            }}
          />
          {status.kind === "testing" ? (
            <p className="text-muted-foreground text-sm">Testing…</p>
          ) : null}
          {status.kind === "ok" ? (
            <p role="status" className="text-sm">
              Key works.
            </p>
          ) : null}
          {status.kind === "error" ? (
            <p role="status" className="text-destructive text-sm">
              {status.message}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          {dismissable ? (
            <Button
              variant="outline"
              className="h-10"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="h-10"
            disabled={testing || !canSubmit}
            onClick={testKey}
          >
            Test
          </Button>
          <Button
            className="h-10"
            disabled={!canSubmit}
            onClick={() => {
              setApiKey(value.trim());
              onOpenChange(false);
            }}
          >
            Save key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
