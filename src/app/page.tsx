/* eslint-disable @next/next/no-img-element */
'use client';
import { processReceiptGemini } from '@/core';
import { useApiKeyStore } from '@/util';
import Cropper from 'cropperjs';
import { useEffect, useRef, useState } from 'react';

enum Pages {
  Home,
  ApiKey,
  Member,
  Bill,
  Result,
}

export default function Home() {
  const [currentPage, setCurrentPages] = useState<Pages>(Pages.Home);
  const apikey = useApiKeyStore();
  const image = useRef<HTMLInputElement>(null);
  const cropRef = useRef<HTMLImageElement>(null);
  const cropper = useRef<Cropper>(null);

  useEffect(() => {
    if (!apikey.apiKey) {
      setCurrentPages(Pages.ApiKey);
    }
  }, [apikey.apiKey]);
  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-screen">
      {currentPage === Pages.Home
        ? (
            <>
              Upload your receipt here
              <input
                type="file"
                id="input"
                ref={image}
                onChange={() => {
                  console.log('got', image.current?.files?.[0]);
                  if (image.current?.files?.[0]) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      if (e.target && cropRef.current) {
                        if (cropper.current) {
                          cropper.current.getCropperCanvas()!.remove();
                          cropper.current = null;
                        }
                        cropRef.current.src = e.target.result as string;
                        cropper.current = new Cropper('#crop');
                        cropper.current.getCropperCanvas()!.style.minWidth = '500px';
                        cropper.current.getCropperCanvas()!.style.minHeight = '500px';
                        cropper.current.getCropperSelection()!.initialCoverage = 1;
                      }
                    };
                    reader.readAsDataURL(image.current.files[0]);
                  }
                }}
              />
              <img alt="" ref={cropRef} id="crop" />
              <button onClick={() => {
                if (cropper.current) {
                  cropper.current.getCropperSelection()!.$toCanvas().then((e) => {
                    e.toBlob((e) => {
                      if (e) {
                        processReceiptGemini(e, apikey.apiKey);
                      }
                    });
                  });
                }
              }}
              >
                Upload
              </button>
            </>
          )
        : currentPage === Pages.ApiKey
          ? (
              <>
                Please input your gemini apikey
                <input
                  type="password"
                  onChange={(e) => {
                    apikey.setApiKey(e.target.value);
                  }}
                />
                <button>Done</button>
              </>
            )
          : (
              <h1>Not Found :(</h1>
            )}
    </div>
  );
}
