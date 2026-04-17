import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Item, Loan, Contact, Give } from '@/types';
import { mockItems, mockLoans, mockGives } from '@/mocks/items';
import { mockContacts } from '@/mocks/contacts';

const ITEMS_KEY = 'lendlee_items';
const LOANS_KEY = 'lendlee_loans';
const GIVES_KEY = 'lendlee_gives';

// Define the context type
interface LendleeContextType {
  items: Item[];
  loans: Loan[];
  gives: Give[];
  contacts: Contact[];
  stats: {
    total: number;
    available: number;
    lent: number;
    given: number;
    activeLoans: number;
  };
  isLoading: boolean;
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'ownerId' | 'status'>) => Promise<void>;
  lendItem: (params: { itemId: string; contactId: string; returnBy?: string }) => Promise<void>;
  giveItem: (params: { itemId: string; contactId: string }) => Promise<void>;
  markReturned: (loanId: string) => Promise<void>;
  getContactById: (id: string) => Contact | undefined;
  getItemById: (id: string) => Item | undefined;
  getActiveLoanForItem: (itemId: string) => Loan | undefined;
  isAddingItem: boolean;
  isLending: boolean;
  isGiving: boolean;
}

// Create the context
const LendleeContext = createContext<LendleeContextType | null>(null);

// Provider component
export function LendleeProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [gives, setGives] = useState<Give[]>([]);
  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(ITEMS_KEY);
      if (stored) return JSON.parse(stored) as Item[];
      await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(mockItems));
      return mockItems;
    },
  });

  const loansQuery = useQuery({
    queryKey: ['loans'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(LOANS_KEY);
      if (stored) return JSON.parse(stored) as Loan[];
      await AsyncStorage.setItem(LOANS_KEY, JSON.stringify(mockLoans));
      return mockLoans;
    },
  });

  const givesQuery = useQuery({
    queryKey: ['gives'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(GIVES_KEY);
      if (stored) return JSON.parse(stored) as Give[];
      await AsyncStorage.setItem(GIVES_KEY, JSON.stringify(mockGives));
      return mockGives;
    },
  });

  useEffect(() => {
    if (itemsQuery.data) setItems(itemsQuery.data);
  }, [itemsQuery.data]);

  useEffect(() => {
    if (loansQuery.data) setLoans(loansQuery.data);
  }, [loansQuery.data]);

  useEffect(() => {
    if (givesQuery.data) setGives(givesQuery.data);
  }, [givesQuery.data]);

  const persistItems = useCallback(async (updated: Item[]) => {
    await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(updated));
    return updated;
  }, []);

  const persistLoans = useCallback(async (updated: Loan[]) => {
    await AsyncStorage.setItem(LOANS_KEY, JSON.stringify(updated));
    return updated;
  }, []);

  const persistGives = useCallback(async (updated: Give[]) => {
    await AsyncStorage.setItem(GIVES_KEY, JSON.stringify(updated));
    return updated;
  }, []);

  const addItemMutation = useMutation({
    mutationFn: async (item: Omit<Item, 'id' | 'createdAt' | 'ownerId' | 'status'>) => {
      const newItem: Item = {
        ...item,
        id: `i_${Date.now()}`,
        status: 'available',
        createdAt: new Date().toISOString(),
        ownerId: 'u1',
      };
      const updated = [...items, newItem];
      await persistItems(updated);
      return { updated, newItem };
    },
    onSuccess: ({ updated }) => {
      setItems(updated);
      queryClient.setQueryData(['items'], updated);
    },
  });

  const lendItemMutation = useMutation({
    mutationFn: async ({
      itemId,
      contactId,
      returnBy,
    }: {
      itemId: string;
      contactId: string;
      returnBy?: string;
    }) => {
      const updatedItems = items.map((i) =>
        i.id === itemId ? { ...i, status: 'lent' as const } : i
      );
      const newLoan: Loan = {
        id: `l_${Date.now()}`,
        itemId,
        contactId,
        lentAt: new Date().toISOString(),
        returnBy,
        status: 'active',
      };
      const updatedLoans = [...loans, newLoan];
      await persistItems(updatedItems);
      await persistLoans(updatedLoans);
      return { updatedItems, updatedLoans };
    },
    onSuccess: ({ updatedItems, updatedLoans }) => {
      setItems(updatedItems);
      setLoans(updatedLoans);
      queryClient.setQueryData(['items'], updatedItems);
      queryClient.setQueryData(['loans'], updatedLoans);
    },
  });

  const markReturnedMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const loan = loans.find((l) => l.id === loanId);
      if (!loan) throw new Error('Loan not found');

      const updatedLoans = loans.map((l) =>
        l.id === loanId
          ? { ...l, status: 'returned' as const, returnedAt: new Date().toISOString() }
          : l
      );
      const updatedItems = items.map((i) =>
        i.id === loan.itemId ? { ...i, status: 'available' as const } : i
      );
      await persistItems(updatedItems);
      await persistLoans(updatedLoans);
      return { updatedItems, updatedLoans };
    },
    onSuccess: ({ updatedItems, updatedLoans }) => {
      setItems(updatedItems);
      setLoans(updatedLoans);
      queryClient.setQueryData(['items'], updatedItems);
      queryClient.setQueryData(['loans'], updatedLoans);
    },
  });

  const giveItemMutation = useMutation({
    mutationFn: async ({
      itemId,
      contactId,
    }: {
      itemId: string;
      contactId: string;
    }) => {
      const updatedItems = items.map((i) =>
        i.id === itemId ? { ...i, status: 'given' as const } : i
      );
      const newGive: Give = {
        id: `g_${Date.now()}`,
        itemId,
        contactId,
        givenAt: new Date().toISOString(),
      };
      const updatedGives = [...gives, newGive];
      await persistItems(updatedItems);
      await persistGives(updatedGives);
      return { updatedItems, updatedGives };
    },
    onSuccess: ({ updatedItems, updatedGives }) => {
      setItems(updatedItems);
      setGives(updatedGives);
      queryClient.setQueryData(['items'], updatedItems);
      queryClient.setQueryData(['gives'], updatedGives);
    },
  });

  const contacts: Contact[] = mockContacts;

  const getContactById = useCallback(
    (id: string) => contacts.find((c) => c.id === id),
    [contacts]
  );

  const getItemById = useCallback(
    (id: string) => items.find((i) => i.id === id),
    [items]
  );

  const getActiveLoanForItem = useCallback(
    (itemId: string) => loans.find((l) => l.itemId === itemId && l.status === 'active'),
    [loans]
  );

  const stats = useMemo(() => ({
    total: items.length,
    available: items.filter((i) => i.status === 'available').length,
    lent: items.filter((i) => i.status === 'lent').length,
    given: items.filter((i) => i.status === 'given').length,
    activeLoans: loans.filter((l) => l.status === 'active').length,
  }), [items, loans]);

  const value = useMemo(() => ({
    items,
    loans,
    gives,
    contacts,
    stats,
    isLoading: itemsQuery.isLoading || loansQuery.isLoading || givesQuery.isLoading,
    addItem: addItemMutation.mutateAsync,
    lendItem: lendItemMutation.mutateAsync,
    giveItem: giveItemMutation.mutateAsync,
    markReturned: markReturnedMutation.mutateAsync,
    getContactById,
    getItemById,
    getActiveLoanForItem,
    isAddingItem: addItemMutation.isPending,
    isLending: lendItemMutation.isPending,
    isGiving: giveItemMutation.isPending,
  }), [
    items, loans, gives, contacts, stats,
    itemsQuery.isLoading, loansQuery.isLoading, givesQuery.isLoading,
    addItemMutation.mutateAsync, lendItemMutation.mutateAsync, giveItemMutation.mutateAsync, markReturnedMutation.mutateAsync,
    getContactById, getItemById, getActiveLoanForItem,
    addItemMutation.isPending, lendItemMutation.isPending, giveItemMutation.isPending,
  ]);

  return (
    <LendleeContext.Provider value={value}>
      {children}
    </LendleeContext.Provider>
  );
}

// Custom hook to use the context
export function useLendlee() {
  const context = useContext(LendleeContext);
  if (!context) {
    throw new Error('useLendlee must be used within a LendleeProvider');
  }
  return context;
}

// Hook for filtered loans
export function useFilteredLoans(filter: 'all' | 'active' | 'returned') {
  const { loans } = useLendlee();
  return useMemo(() => {
    if (filter === 'all') return loans;
    return loans.filter((l) => l.status === filter);
  }, [loans, filter]);
}
