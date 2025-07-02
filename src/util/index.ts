import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ApiKeyState = {
  apiKey: string
  setApiKey: (apiKey: string) => void
};

export const useApiKeyStore = create<ApiKeyState>()(persist(set => ({
  apiKey: '',
  setApiKey: apiKey => set(() => ({ apiKey })),
}), { name: 'secret' }));

type BillBuddyState = {
  id: number
  items: Item[]
  notes: string
  clearItem: () => void
  addItem: (item: Item) => void
  editItemName: (id: number, name: string) => void
  editItemPrice: (id: number, price: number) => void
  editItemCount: (id: number, count: number) => void
  toggleItemMember: (id: number, memberId: number) => void
  removeItem: (id: number) => void
  setNotes: (note: string) => void
};

export type Item = {
  id: number
  name: string
  price: number
  count: number
  members: number[]
};

export const useBillBuddyStore = create<BillBuddyState>()(set => ({
  id: 0,
  items: [],
  notes: '',
  clearItem: () => set(state => ({ ...state, item: [] })),
  addItem: item => set((state) => {
    const newItem = item;
    newItem.id = state.id;
    newItem.members = [];
    return { ...state, items: [...state.items, item], id: state.id + 1 };
  }),
  editItemName: (id, name) => set((state) => {
    const items = state.items;
    const idx = items.findIndex(v => v.id == id);
    items[idx].name = name;
    return { ...state, items };
  }),
  editItemPrice: (id, price) => set((state) => {
    const items = state.items;
    const idx = items.findIndex(v => v.id == id);
    items[idx].price = price;
    return { ...state, items };
  }),
  editItemCount: (id, count) => set((state) => {
    const items = state.items;
    const idx = items.findIndex(v => v.id == id);
    items[idx].count = count;
    return { ...state, items };
  }),
  toggleItemMember: (id, memberId) => set((state) => {
    const items = state.items;
    const idx = items.findIndex(v => v.id == id);
    const memberIdx = items[idx].members.findIndex(v => v == memberId);
    console.log('toggling');
    if (memberIdx === -1) {
      console.log('adding', idx, memberId);
      items[idx].members.push(memberId);
    }
    else {
      console.log('removing', idx, memberId);
      items[idx].members = items[idx].members.filter(v => v != memberId);
    }
    console.log('done', items);
    return { ...state, items };
  }),
  removeItem: id => set(state => ({ ...state, items: state.items.filter(v => v.id != id) })),
  setNotes: note => set(state => ({ ...state, notes: note })),
}));

type MemberState = {
  id: number
  members: Member[]
  addMember: () => void
  editMemberName: (id: number, name: string) => void
  editMemberColor: (id: number, color: string) => void
  removeMember: (id: number) => void
};

export type Member = {
  id: number
  name: string
  color: string
};

export const useMemberStore = create<MemberState>()(persist(set => ({
  id: 0,
  members: [],
  addMember: () => set((state) => {
    const member: Member = {
      id: state.id,
      name: '',
      color: '',
    };
    return { ...state, members: [...state.members, member], id: state.id + 1 };
  }),
  editMemberName: (id, name) => set((state) => {
    const members = state.members;
    const idx = members.findIndex(v => v.id == id);
    members[idx].name = name;
    return { ...state, members };
  }),
  editMemberColor: (id, color) => set((state) => {
    const members = state.members;
    const idx = members.findIndex(v => v.id == id);
    members[idx].color = color;
    return { ...state, members };
  }),
  removeMember: id => set(state => ({ ...state, members: state.members.filter(v => v.id != id) })),
}), { name: 'member' }));
