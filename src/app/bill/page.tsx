"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/format";
import { cancelExtraction, retryExtraction } from "@/lib/receipt";
import { useBillStore, useExtractionStore } from "@/lib/stores";
import { cn } from "cn";
import { ArrowRight, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BillPage() {
  const items = useBillStore((state) => state.items);
  const members = useBillStore((state) => state.members);
  const editItemName = useBillStore((state) => state.editItemName);
  const editItemUnitPrice = useBillStore((state) => state.editItemUnitPrice);
  const editItemCount = useBillStore((state) => state.editItemCount);
  const toggleItemMember = useBillStore((state) => state.toggleItemMember);
  const removeItem = useBillStore((state) => state.removeItem);
  const stage = useExtractionStore((state) => state.stage);
  const errorMessage = useExtractionStore((state) => state.errorMessage);
  const router = useRouter();

  if (stage === "uploading" || stage === "extracting") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <LoaderCircle className="text-muted-foreground size-8 animate-spin" />
          <p className="font-medium">
            {stage === "uploading"
              ? "Uploading photo…"
              : "Reading your receipt…"}
          </p>
          <p className="text-muted-foreground text-sm">
            This usually takes a few seconds.
          </p>
          <Button variant="outline" onClick={cancelExtraction}>
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (stage === "error") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <TriangleAlert className="text-destructive size-8" />
          <p className="text-center font-medium">
            {errorMessage ?? "Couldn't read the receipt."}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/")}>
              Back to upload
            </Button>
            <Button onClick={retryExtraction}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unassignedCount = items.filter(
    (item) => item.members.length === 0,
  ).length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bill</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No items yet. Go back and read a receipt first.
            </p>
          ) : null}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-lg border p-3"
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  className="w-14 text-center"
                  aria-label="Count"
                  value={item.count}
                  onChange={(event) =>
                    editItemCount(item.id, Number(event.target.value))
                  }
                />
                <Input
                  className="flex-1"
                  aria-label="Item name"
                  value={item.name}
                  onChange={(event) =>
                    editItemName(item.id, event.target.value)
                  }
                />
                <Input
                  type="number"
                  min={0}
                  className="w-24 text-right font-mono"
                  aria-label="Unit price"
                  value={item.unitPrice}
                  onChange={(event) =>
                    editItemUnitPrice(item.id, Number(event.target.value))
                  }
                />
              </div>
              <div className="flex items-center gap-1.5">
                {members.map((member) => {
                  const assigned = item.members.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      title={member.name || "member"}
                      aria-label={`${assigned ? "Remove" : "Assign"} ${member.name || "member"}`}
                      aria-pressed={assigned}
                      onClick={() => toggleItemMember(item.id, member.id)}
                      className={cn(
                        "size-8 rounded-full transition-all",
                        assigned
                          ? "ring-foreground ring-offset-background ring-2 ring-offset-2"
                          : "opacity-45 hover:opacity-80",
                      )}
                      style={{ backgroundColor: member.color }}
                    />
                  );
                })}
                <span className="text-muted-foreground ml-auto font-mono text-sm">
                  {formatRupiah(item.unitPrice * item.count)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove item"
                  onClick={() => removeItem(item.id)}
                >
                  <X />
                </Button>
              </div>
            </div>
          ))}
          {unassignedCount > 0 ? (
            <div className="bg-accent text-accent-foreground flex items-start gap-2 rounded-lg px-3 py-2 text-sm">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <span>
                {unassignedCount} unassigned item
                {unassignedCount > 1 ? "s" : ""} — tap a member color on each
                item to split it.
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Button
        size="lg"
        className="h-12 w-full text-base"
        onClick={() => router.push("/result")}
      >
        Finish
        <ArrowRight />
      </Button>
    </>
  );
}
