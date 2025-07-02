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
  items: string[]
  members: string[]
  notes: string
  clearItem: () => void
  addItem: (item: string) => void
  removeItem: (id: string) => void
  addMember: (name: string) => void
  removeMember: (name: string) => void
  setNotes: (note: string) => void
};

export const useBillBuddyStore = create<BillBuddyState>()(set => ({
  items: [],
  members: [],
  notes: '',
  clearItem: () => set(state => ({ ...state, item: [] })),
  addItem: item => set(state => ({ ...state, items: [...state.items, item] })),
  removeItem: id => set(state => ({ ...state, items: state.items.filter(v => v != id) })),
  addMember: name => set(state => ({ ...state, members: [...state.members, name] })),
  removeMember: name => set(state => ({ ...state, members: state.members.filter(v => v != name) })),
  setNotes: note => set(state => ({ ...state, notes: note })),
}));
