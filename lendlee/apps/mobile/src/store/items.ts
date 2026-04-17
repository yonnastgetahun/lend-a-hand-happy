import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ItemCategory = "book" | "tool" | "game" | "gear" | "other";
export type ItemStatus = "available" | "lent" | "returned";

export interface Item {
  id: string;
  title: string;
  photo?: string;
  category: ItemCategory;
  ownerId: string;
  borrowerId?: string;
  borrowerName?: string;
  lentDate?: Date;
  dueDate?: Date;
  returnedDate?: Date;
  status: ItemStatus;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
}

interface ItemState {
  items: Item[];
  addItem: (item: Omit<Item, "id" | "status" | "ownerId">) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  lendItem: (itemId: string, contact: Contact, dueDate?: Date) => void;
  returnItem: (itemId: string) => void;
}

export const useItemStore = create<ItemState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (itemData) => {
        const newItem: Item = {
          ...itemData,
          id: Math.random().toString(36).substring(7),
          status: "available",
          ownerId: "current-user",
        };
        set((state) => ({
          items: [...state.items, newItem],
        }));
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      deleteItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      lendItem: (itemId, contact, dueDate) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  status: "lent" as const,
                  borrowerId: contact.id,
                  borrowerName: contact.name,
                  lentDate: new Date(),
                  dueDate,
                }
              : item
          ),
        }));
      },

      returnItem: (itemId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  status: "returned" as const,
                  returnedDate: new Date(),
                }
              : item
          ),
        }));
      },
    }),
    {
      name: "lendlee-items",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
