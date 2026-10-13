"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MEMBER_COLORS } from "@/lib/member-colors";
import { useBillStore } from "@/lib/stores";
import { cn } from "cn";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MembersPage() {
  const members = useBillStore((state) => state.members);
  const addMember = useBillStore((state) => state.addMember);
  const editMemberName = useBillStore((state) => state.editMemberName);
  const editMemberColor = useBillStore((state) => state.editMemberColor);
  const removeMember = useBillStore((state) => state.removeMember);
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Who shared the bill?</CardTitle>
        <CardDescription>
          Add everyone, give each person a name and a color.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {members.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No members yet — add the first one below.
          </p>
        ) : null}
        {members.map((member) => (
          <div
            key={member.id}
            className="flex flex-col gap-2 rounded-lg border p-3"
          >
            <div className="flex items-center gap-2">
              <span
                className="size-3.5 shrink-0 rounded-full"
                style={{ backgroundColor: member.color }}
                aria-hidden="true"
              />
              <Input
                value={member.name}
                placeholder={`Member ${member.id + 1}`}
                onChange={(event) =>
                  editMemberName(member.id, event.target.value)
                }
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${member.name || "member"}`}
                onClick={() => removeMember(member.id)}
              >
                <Trash2 />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MEMBER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Use color ${color}`}
                  onClick={() => editMemberColor(member.id, color)}
                  className={cn(
                    "size-7 rounded-full transition-transform",
                    member.color === color
                      ? "ring-foreground ring-offset-background ring-2 ring-offset-2"
                      : "hover:scale-110",
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          className="h-10 border-dashed"
          onClick={() => addMember()}
        >
          <Plus />
          Add member
        </Button>
        <Button
          size="lg"
          className="h-12 w-full text-base"
          onClick={() => router.push("/bill")}
        >
          Continue
          <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  );
}
