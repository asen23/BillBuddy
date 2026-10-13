/* eslint-disable @next/next/no-img-element */
"use client";
import { processReceiptGemini } from "@/core";
import { useApiKeyStore, useBillStore, useExtractionStore } from "@/lib/stores";
import type Cropper from "cropperjs";
import { useRouter } from "next/navigation";
import { useRef } from "react";

export default function UploadPage() {
  const apiKey = useApiKeyStore((state) => state.apiKey);
  const addItem = useBillStore((state) => state.addItem);
  const setStatus = useExtractionStore((state) => state.setStatus);
  const router = useRouter();
  const image = useRef<HTMLInputElement>(null);
  const cropRef = useRef<HTMLImageElement>(null);
  const cropper = useRef<Cropper | null>(null);

  const handleUpload = () => {
    if (!cropper.current) return;
    cropper.current
      .getCropperSelection()!
      .$toCanvas()
      .then((canvas) => {
        canvas.toBlob((blob) => {
          if (!blob) return;
          processReceiptGemini(
            blob,
            apiKey,
            (working) => setStatus(working ? "working" : "idle"),
            addItem,
          );
          if (cropper.current) {
            cropper.current.getCropperCanvas()!.remove();
            cropper.current = null;
          }
          router.push("/members");
        });
      });
  };

  return (
    <>
      <p>Upload your receipt here</p>
      <input
        type="file"
        id="input"
        accept="image/*"
        ref={image}
        onChange={() => {
          if (image.current?.files?.[0]) {
            const reader = new FileReader();
            reader.onload = async (event) => {
              if (event.target && cropRef.current) {
                const { default: CropperCtor } = await import("cropperjs");
                if (cropper.current) {
                  cropper.current.getCropperCanvas()!.remove();
                  cropper.current = null;
                }
                cropRef.current.src = event.target.result as string;
                cropper.current = new CropperCtor("#crop");
                cropper.current.getCropperCanvas()!.style.minWidth = "500px";
                cropper.current.getCropperCanvas()!.style.minHeight = "500px";
                cropper.current.getCropperSelection()!.initialCoverage = 1;
              }
            };
            reader.readAsDataURL(image.current.files[0]);
          }
        }}
      />
      <img alt="" ref={cropRef} id="crop" />
      <button
        className="mt-2 rounded border px-3 py-1.5"
        onClick={handleUpload}
      >
        Upload
      </button>
    </>
  );
}
