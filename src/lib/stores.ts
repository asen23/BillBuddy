import { create } from "zustand";
import { persist } from "zustand/middleware";
import { memberColorAt } from "./member-colors";
import type { Item, ItemDraft, Member } from "./types";

type ApiKeyState = {
  apiKey: string;
  setApiKey: (apiKey: string) => void;
};

export const useApiKeyStore = create<ApiKeyState>()(
  persist(
    (set) => ({
      apiKey: "",
      setApiKey: (apiKey) => set({ apiKey }),
    }),
    { name: "billbuddy.apiKey", skipHydration: true },
  ),
);

type BillState = {
  members: Member[];
  items: Item[];
  nextMemberId: number;
  nextItemId: number;
  addMember: () => void;
  editMemberName: (id: number, name: string) => void;
  editMemberColor: (id: number, color: string) => void;
  removeMember: (id: number) => void;
  addItem: (draft: ItemDraft) => void;
  editItemName: (id: number, name: string) => void;
  editItemUnitPrice: (id: number, unitPrice: number) => void;
  editItemCount: (id: number, count: number) => void;
  toggleItemMember: (id: number, memberId: number) => void;
  removeItem: (id: number) => void;
  resetBill: () => void;
};

const emptyBill = {
  members: [] as Member[],
  items: [] as Item[],
  nextMemberId: 0,
  nextItemId: 0,
};

export const useBillStore = create<BillState>()(
  persist(
    (set) => ({
      ...emptyBill,
      addMember: () =>
        set((state) => ({
          members: [
            ...state.members,
            {
              id: state.nextMemberId,
              name: "",
              color: memberColorAt(state.members.length),
            },
          ],
          nextMemberId: state.nextMemberId + 1,
        })),
      editMemberName: (id, name) =>
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id ? { ...member, name } : member,
          ),
        })),
      editMemberColor: (id, color) =>
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id ? { ...member, color } : member,
          ),
        })),
      removeMember: (id) =>
        set((state) => ({
          members: state.members.filter((member) => member.id !== id),
          items: state.items.map((item) => ({
            ...item,
            members: item.members.filter((memberId) => memberId !== id),
          })),
        })),
      addItem: (draft) =>
        set((state) => ({
          items: [
            ...state.items,
            { ...draft, id: state.nextItemId, members: [] },
          ],
          nextItemId: state.nextItemId + 1,
        })),
      editItemName: (id, name) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, name } : item,
          ),
        })),
      editItemUnitPrice: (id, unitPrice) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, unitPrice } : item,
          ),
        })),
      editItemCount: (id, count) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, count } : item,
          ),
        })),
      toggleItemMember: (id, memberId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  members: item.members.includes(memberId)
                    ? item.members.filter((member) => member !== memberId)
                    : [...item.members, memberId],
                }
              : item,
          ),
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      resetBill: () => set(emptyBill),
    }),
    { name: "billbuddy.bill", version: 1, skipHydration: true },
  ),
);

type ExtractionStatus = "idle" | "working";

type ExtractionState = {
  status: ExtractionStatus;
  setStatus: (status: ExtractionStatus) => void;
};

/** Transient (not persisted) receipt-extraction status, shared across routes. */
export const useExtractionStore = create<ExtractionState>()((set) => ({
  status: "idle",
  setStatus: (status) => set({ status }),
}));
