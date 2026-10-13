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
import { useApiKeyStore } from "@/lib/stores";
import { useState } from "react";

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
            onChange={(event) => setValue(event.target.value)}
          />
        </div>
        <DialogFooter>
          {dismissable ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          ) : null}
          <Button
            className="h-10"
            disabled={value.trim().length === 0}
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
