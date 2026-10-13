"use client";
import { useApiKeyStore } from "@/lib/stores";
import { useState } from "react";

type ApiKeyDialogProps = {
  /** When false the dialog cannot be dismissed without saving a key. */
  dismissable: boolean;
  onClose?: () => void;
};

export function ApiKeyDialog({ dismissable, onClose }: ApiKeyDialogProps) {
  const storedKey = useApiKeyStore((state) => state.apiKey);
  const setApiKey = useApiKeyStore((state) => state.setApiKey);
  const [value, setValue] = useState(storedKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-md flex-col gap-3 rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold">Gemini API key</h2>
        <p className="text-sm text-gray-600">
          BillBuddy reads receipts with Gemini using your own API key. The key
          is stored only in this browser.
        </p>
        <input
          type="password"
          autoFocus
          placeholder="API key"
          className="rounded border p-2"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <div className="flex justify-end gap-2">
          {dismissable && onClose ? (
            <button className="rounded px-3 py-2" onClick={onClose}>
              Cancel
            </button>
          ) : null}
          <button
            className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
            disabled={value.trim().length === 0}
            onClick={() => {
              setApiKey(value.trim());
              onClose?.();
            }}
          >
            Save key
          </button>
        </div>
      </div>
    </div>
  );
}
