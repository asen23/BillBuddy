"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";
import { computeResult } from "@/lib/split";
import { useBillStore } from "@/lib/stores";
import { ReceiptText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ResultPage() {
  const items = useBillStore((state) => state.items);
  const members = useBillStore((state) => state.members);
  const resetBill = useBillStore((state) => state.resetBill);
  const router = useRouter();
  const result = computeResult(items, members);

  return (
    <>
      <Card>
        <CardHeader className="border-b border-dashed">
          <CardTitle className="flex items-center gap-2 font-mono text-sm tracking-widest uppercase">
            <ReceiptText className="size-4" />
            Receipt
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 font-mono text-sm">
          {result.members.length === 0 ? (
            <p className="text-muted-foreground font-sans text-sm">
              No members yet — nothing to split.
            </p>
          ) : null}
          {result.members.map(({ member, items: shares, total }, index) => (
            <div key={member.id} className="flex flex-col gap-1.5">
              {index > 0 ? (
                <div className="mb-2 border-t border-dashed" />
              ) : null}
              <div className="flex items-center gap-2">
                <span
                  className="size-3.5 shrink-0 rounded-full"
                  style={{ backgroundColor: member.color }}
                  aria-hidden="true"
                />
                <span className="truncate font-sans font-semibold">
                  {member.name || "(unnamed)"}
                </span>
                <span className="ml-auto shrink-0 font-semibold">
                  {formatRupiah(total)}
                </span>
              </div>
              {shares.map(({ item, share, memberCount }) => (
                <div key={item.id} className="flex items-baseline gap-1.5">
                  <span className="shrink-0">{item.count}×</span>
                  <span className="truncate">{item.name}</span>
                  <span className="text-muted-foreground shrink-0">
                    @{formatRupiah(item.unitPrice)}
                  </span>
                  <span className="text-muted-foreground ml-auto shrink-0">
                    ÷{memberCount}
                  </span>
                  <span className="w-16 shrink-0 text-right">
                    {formatRupiah(share)}
                  </span>
                </div>
              ))}
            </div>
          ))}
          {result.unassigned.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <div className="mb-2 border-t border-dashed" />
              <p className="font-sans font-semibold">Unassigned items</p>
              {result.unassigned.map((item) => (
                <div
                  key={item.id}
                  className="text-muted-foreground flex items-baseline gap-1.5"
                >
                  <span className="shrink-0">{item.count}×</span>
                  <span className="truncate">{item.name}</span>
                  <span className="ml-auto shrink-0">
                    {formatRupiah(item.unitPrice * item.count)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex items-center gap-2 border-t-2 border-dashed pt-3 text-base">
            <span>Total</span>
            <span className="ml-auto font-semibold">
              {formatRupiah(result.total)}
            </span>
          </div>
        </CardContent>
      </Card>
      <Button
        size="lg"
        className="h-12 w-full text-base"
        onClick={() => {
          resetBill();
          router.push("/");
        }}
      >
        Start a new bill
      </Button>
    </>
  );
}
