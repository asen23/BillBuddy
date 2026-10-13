export type Member = {
  id: number;
  name: string;
  color: string;
};

export type Item = {
  id: number;
  name: string;
  /** Unit price in whole rupiah. */
  unitPrice: number;
  /** Number of units on the receipt. */
  count: number;
  /** Assignment: the ids of the members this item is split among. */
  members: number[];
};

/** An item before the store assigns an id and an (empty) assignment. */
export type ItemDraft = Omit<Item, "id" | "members">;
