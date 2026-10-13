import type { Item, Member } from "./types";

export type ItemShare = {
  item: Item;
  /** This member's share of the item's line total, in whole rupiah. */
  share: number;
  /** How many members the item is split among. */
  memberCount: number;
};

export type MemberResult = {
  member: Member;
  items: ItemShare[];
  /** Sum of every share, in whole rupiah. */
  total: number;
};

export type BillResult = {
  members: MemberResult[];
  /** Items with no members assigned; never dropped from the result. */
  unassigned: Item[];
  /** Sum of every item's line total, in whole rupiah. */
  total: number;
};

/**
 * Split every item's line total equally among its assigned members.
 *
 * Line total = unit price × count. Shares are whole rupiah: the base share is
 * the floor, and the remainder (line total − base × members) is handed out one
 * rupiah at a time in member list order, so member totals reconcile exactly
 * with the receipt. Assignments pointing at deleted members are ignored.
 */
export const computeResult = (items: Item[], members: Member[]): BillResult => {
  const memberResults = new Map<number, MemberResult>(
    members.map((member) => [member.id, { member, items: [], total: 0 }]),
  );

  const unassigned: Item[] = [];
  let total = 0;

  for (const item of items) {
    const lineTotal = item.unitPrice * item.count;
    total += lineTotal;

    const assigned = members.filter((member) =>
      item.members.includes(member.id),
    );
    if (assigned.length === 0) {
      unassigned.push(item);
      continue;
    }

    const base = Math.floor(lineTotal / assigned.length);
    const remainder = lineTotal - base * assigned.length;

    assigned.forEach((member, index) => {
      const result = memberResults.get(member.id)!;
      const share = base + (index < remainder ? 1 : 0);
      result.items.push({ item, share, memberCount: assigned.length });
      result.total += share;
    });
  }

  return { members: [...memberResults.values()], unassigned, total };
};
