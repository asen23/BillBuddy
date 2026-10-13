"use client";
import { useBillStore } from "@/lib/stores";
import { useRouter } from "next/navigation";

export default function MembersPage() {
  const members = useBillStore((state) => state.members);
  const addMember = useBillStore((state) => state.addMember);
  const editMemberName = useBillStore((state) => state.editMemberName);
  const editMemberColor = useBillStore((state) => state.editMemberColor);
  const removeMember = useBillStore((state) => state.removeMember);
  const router = useRouter();

  return (
    <>
      <h1 className="text-2xl">
        Member <span onClick={() => addMember()}>+</span>
      </h1>
      {members.map((member) => (
        <div key={member.id} className="mb-2 flex gap-2">
          <input
            type="color"
            className="h-8 w-8 rounded-full"
            value={member.color}
            onChange={(event) => editMemberColor(member.id, event.target.value)}
          />
          <input
            type="text"
            value={member.name}
            onChange={(event) => editMemberName(member.id, event.target.value)}
          />
          <button onClick={() => removeMember(member.id)}>Delete</button>
        </div>
      ))}
      <button
        className="mt-2 rounded border px-3 py-1.5"
        onClick={() => router.push("/bill")}
      >
        Continue
      </button>
    </>
  );
}
