/* eslint-disable @next/next/no-img-element */
"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { startExtraction } from "@/lib/receipt";
import { useApiKeyStore } from "@/lib/stores";
import type Cropper from "cropperjs";
import { Camera, ScanText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function UploadPage() {
  const apiKey = useApiKeyStore((state) => state.apiKey);
  const [ready, setReady] = useState(false);
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
          startExtraction(blob, apiKey);
          if (cropper.current) {
            cropper.current.getCropperCanvas()!.remove();
            cropper.current = null;
          }
          router.push("/members");
        });
      });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Split a receipt</CardTitle>
        <CardDescription>
          Photograph the receipt, pick who shared it, get exact totals.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <label
          htmlFor="receipt-input"
          className="border-border text-muted-foreground hover:bg-muted/60 flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm transition-colors"
        >
          <Camera className="size-6" />
          {ready ? "Choose a different photo" : "Take or choose a photo"}
        </label>
        <input
          id="receipt-input"
          type="file"
          accept="image/*"
          className="sr-only"
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
                  cropper.current.getCropperCanvas()!.style.minWidth = "100%";
                  cropper.current.getCropperCanvas()!.style.minHeight = "320px";
                  cropper.current.getCropperSelection()!.initialCoverage = 1;
                  setReady(true);
                }
              };
              reader.readAsDataURL(image.current.files[0]);
            }
          }}
        />
        <div className="overflow-hidden rounded-lg">
          <img alt="" ref={cropRef} id="crop" className="max-w-full" />
        </div>
        {ready ? (
          <Button
            size="lg"
            className="h-12 w-full text-base"
            onClick={handleUpload}
          >
            <ScanText />
            Read receipt
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
