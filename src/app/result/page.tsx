"use client";
import { formatRupiah } from "@/lib/format";
import { computeResult } from "@/lib/split";
import { useBillStore } from "@/lib/stores";

export default function ResultPage() {
  const items = useBillStore((state) => state.items);
  const members = useBillStore((state) => state.members);
  const result = computeResult(items, members);

  return (
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
              {item.name} ({item.count} × {formatRupiah(item.unitPrice)}, split{" "}
              {memberCount} ways) — {formatRupiah(share)}
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
  );
}
