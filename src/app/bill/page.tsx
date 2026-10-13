"use client";
import { useBillStore, useExtractionStore } from "@/lib/stores";
import { useRouter } from "next/navigation";

export default function BillPage() {
  const items = useBillStore((state) => state.items);
  const members = useBillStore((state) => state.members);
  const editItemName = useBillStore((state) => state.editItemName);
  const editItemUnitPrice = useBillStore((state) => state.editItemUnitPrice);
  const editItemCount = useBillStore((state) => state.editItemCount);
  const toggleItemMember = useBillStore((state) => state.toggleItemMember);
  const removeItem = useBillStore((state) => state.removeItem);
  const extractionStatus = useExtractionStore((state) => state.status);
  const router = useRouter();

  if (extractionStatus === "working") {
    return (
      <>
        <h1>Processing...</h1>
        <h1>Please Wait</h1>
      </>
    );
  }

  const unassignedCount = items.filter(
    (item) => item.members.length === 0,
  ).length;

  return (
    <>
      <h1 className="text-2xl">Bill</h1>
      {items.map((item) => (
        <div key={item.id} className="mb-2 flex gap-2">
          <input
            type="number"
            value={item.count}
            onChange={(event) =>
              editItemCount(item.id, Number(event.target.value))
            }
          />
          <input
            type="text"
            value={item.name}
            onChange={(event) => editItemName(item.id, event.target.value)}
          />
          <input
            type="number"
            value={item.unitPrice}
            onChange={(event) =>
              editItemUnitPrice(item.id, Number(event.target.value))
            }
          />
          <div className="flex">
            {members.map((member) => (
              <div
                className="h-8 w-8 cursor-pointer rounded-full"
                style={{ backgroundColor: member.color }}
                key={member.id}
                onClick={() => toggleItemMember(item.id, member.id)}
              />
            ))}
          </div>
          <button onClick={() => removeItem(item.id)}>Delete</button>
        </div>
      ))}
      {unassignedCount > 0 && (
        <p className="text-amber-600">
          {unassignedCount} unassigned item{unassignedCount > 1 ? "s" : ""} —
          tap a member color on each item to split it
        </p>
      )}
      <button
        className="mt-2 rounded border px-3 py-1.5"
        onClick={() => router.push("/result")}
      >
        Finish
      </button>
    </>
  );
}
