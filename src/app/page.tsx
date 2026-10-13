/* eslint-disable @next/next/no-img-element */
"use client";
import { processReceiptGemini } from "@/core";
import { formatRupiah } from "@/lib/format";
import { computeResult } from "@/lib/split";
import { useApiKeyStore, useBillStore } from "@/lib/stores";
import type Cropper from "cropperjs";
import { useEffect, useRef, useState } from "react";

enum Pages {
  Home,
  ApiKey,
  Member,
  Bill,
  Result,
}

export default function Home() {
  const [currentPage, setCurrentPages] = useState<Pages>(Pages.Home);
  const [loading, setLoading] = useState(false);
  const apikeyStore = useApiKeyStore();
  const billStore = useBillStore();
  const image = useRef<HTMLInputElement>(null);
  const cropRef = useRef<HTMLImageElement>(null);
  const cropper = useRef<Cropper | null>(null);

  useEffect(() => {
    if (!apikeyStore.apiKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- stale wizard state machine; replaced by the routes workstream, where the key gate is hydration-safe
      setCurrentPages(Pages.ApiKey);
    }
  }, [apikeyStore.apiKey]);

  const result = computeResult(billStore.items, billStore.members);

  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center">
      {currentPage === Pages.Home ? (
        <>
          Upload your receipt here
          <input
            type="file"
            id="input"
            ref={image}
            onChange={() => {
              if (image.current?.files?.[0]) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                  if (e.target && cropRef.current) {
                    const { default: CropperCtor } = await import("cropperjs");
                    if (cropper.current) {
                      cropper.current.getCropperCanvas()!.remove();
                      cropper.current = null;
                    }
                    cropRef.current.src = e.target.result as string;
                    cropper.current = new CropperCtor("#crop");
                    cropper.current.getCropperCanvas()!.style.minWidth =
                      "500px";
                    cropper.current.getCropperCanvas()!.style.minHeight =
                      "500px";
                    cropper.current.getCropperSelection()!.initialCoverage = 1;
                  }
                };
                reader.readAsDataURL(image.current.files[0]);
              }
            }}
          />
          <img alt="" ref={cropRef} id="crop" />
          <button
            onClick={() => {
              if (cropper.current) {
                cropper.current
                  .getCropperSelection()!
                  .$toCanvas()
                  .then((e) => {
                    e.toBlob((e) => {
                      if (e) {
                        processReceiptGemini(
                          e,
                          apikeyStore.apiKey,
                          setLoading,
                          billStore.addItem,
                        );
                        setCurrentPages(Pages.Member);
                        if (cropper.current) {
                          cropper.current.getCropperCanvas()!.remove();
                          cropper.current = null;
                        }
                      }
                    });
                  });
              }
              setCurrentPages(Pages.Member);
            }}
          >
            Upload
          </button>
        </>
      ) : currentPage === Pages.ApiKey ? (
        <>
          Please input your gemini apikey
          <input
            type="password"
            onChange={(e) => {
              apikeyStore.setApiKey(e.target.value);
            }}
          />
          <button onClick={() => setCurrentPages(Pages.Home)}>Done</button>
        </>
      ) : currentPage === Pages.Member ? (
        <>
          <h1 className="text-2xl">
            Member <span onClick={() => billStore.addMember()}>+</span>
          </h1>
          {billStore.members.map((member) => (
            <div key={member.id} className="mb-2 flex gap-2">
              <input
                type="color"
                className="h-8 w-8 rounded-full"
                value={member.color}
                onChange={(e) =>
                  billStore.editMemberColor(member.id, e.target.value)
                }
              />
              <input
                type="text"
                value={member.name}
                onChange={(e) =>
                  billStore.editMemberName(member.id, e.target.value)
                }
              />
              <button onClick={() => billStore.removeMember(member.id)}>
                Delete
              </button>
            </div>
          ))}
          <button onClick={() => setCurrentPages(Pages.Bill)}>Continue</button>
        </>
      ) : currentPage === Pages.Bill ? (
        loading ? (
          <>
            <h1>Processing...</h1>
            <h1>Please Wait</h1>
          </>
        ) : (
          <>
            <h1 className="text-2xl">Bill</h1>
            {billStore.items.map((item) => (
              <div key={item.id} className="mb-2 flex gap-2">
                <input
                  type="number"
                  value={item.count}
                  onChange={(e) =>
                    billStore.editItemCount(item.id, Number(e.target.value))
                  }
                />
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    billStore.editItemName(item.id, e.target.value)
                  }
                />
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) =>
                    billStore.editItemUnitPrice(item.id, Number(e.target.value))
                  }
                />
                <div className="flex">
                  {billStore.members.map((member) => (
                    <div
                      className="h-8 w-8 cursor-pointer rounded-full"
                      style={{ backgroundColor: member.color }}
                      key={member.id}
                      onClick={() =>
                        billStore.toggleItemMember(item.id, member.id)
                      }
                    />
                  ))}
                </div>
                <button onClick={() => billStore.removeItem(item.id)}>
                  Delete
                </button>
              </div>
            ))}
            <button onClick={() => setCurrentPages(Pages.Result)}>
              Finish
            </button>
          </>
        )
      ) : currentPage === Pages.Result ? (
        <>
          {result.members.map(({ member, items: shares, total }) => (
            <div key={member.id} className="mb-4">
              <p className="font-bold">
                <input
                  type="color"
                  className="h-8 w-8 rounded-full"
                  value={member.color}
                  disabled
                />
                {member.name || "(unnamed)"} — {formatRupiah(total)}
              </p>
              {shares.map(({ item, share, memberCount }) => (
                <div key={item.id}>
                  {item.name} ({item.count} × {formatRupiah(item.unitPrice)},
                  split {memberCount} ways) — {formatRupiah(share)}
                </div>
              ))}
            </div>
          ))}
          {result.unassigned.length > 0 && (
            <div className="mb-4">
              <p className="font-bold">Unassigned items</p>
              {result.unassigned.map((item) => (
                <div key={item.id}>
                  {item.name} ({item.count} × {formatRupiah(item.unitPrice)})
                </div>
              ))}
            </div>
          )}
          <p className="font-bold">Total: {formatRupiah(result.total)}</p>
        </>
      ) : (
        <h1 className="text-5xl">Not Found :(</h1>
      )}
    </div>
  );
}
