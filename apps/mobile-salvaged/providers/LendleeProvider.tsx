import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { supabase, getCurrentUser, Tables, InsertTables, UpdateTables } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { Item, Loan, Contact, Give } from '@/types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Enable LayoutAnimation on Android.
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Map a Supabase loans row (snake_case) to the app Loan type (camelCase).
function mapLoanRow(row: any): Loan {
  return {
    id: row.id,
    itemId: row.item_id,
    contactId: row.contact_id,
    lentAt: row.lent_at,
    returnBy: row.return_by ?? undefined,
    returnedAt: row.returned_at ?? undefined,
    status: row.status,
    reminderSent: row.reminder_sent ?? undefined,
    reminderSentAt: row.reminder_sent_at ?? undefined,
    notes: row.notes ?? undefined,
  };
}

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
  isOffline: boolean;
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'ownerId' | 'status'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  lendItem: (params: { itemId: string; contactId: string; returnBy?: string }) => Promise<void>;
  giveItem: (params: { itemId: string; contactId: string; notes?: string }) => Promise<void>;
  markReturned: (loanId: string) => Promise<void>;
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'ownerId'>) => Promise<void>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  getContactById: (id: string) => Contact | undefined;
  getItemById: (id: string) => Item | undefined;
  getActiveLoanForItem: (itemId: string) => Loan | undefined;
  refreshData: () => Promise<void>;
  isAddingItem: boolean;
  isLending: boolean;
  isGiving: boolean;
}

// Create the context
const LendleeContext = createContext<LendleeContextType | null>(null);

// Provider component
export function LendleeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [gives, setGives] = useState<Give[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isLending, setIsLending] = useState(false);
  const [isGiving, setIsGiving] = useState(false);

  // Fetch all data from Supabase
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (itemsError) throw itemsError;
      
      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('owner_id', user.id)
        .order('name', { ascending: true });
      
      if (contactsError) throw contactsError;
      
      // Fetch loans (with joins for full data)
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select(`
          *,
          items:item_id (*),
          contacts:contact_id (*)
        `)
        .order('lent_at', { ascending: false });
      
      if (loansError) throw loansError;
      
      // Fetch gives
      const { data: givesData, error: givesError } = await supabase
        .from('gives')
        .select(`
          *,
          items:item_id (*),
          contacts:contact_id (*)
        `)
        .order('given_at', { ascending: false });
      
      if (givesError) throw givesError;
      
      setItems(itemsData || []);
      setContacts(contactsData || []);
      setLoans(loansData || []);
      setGives(givesData || []);
      setIsOffline(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to items changes
    const itemsSubscription = supabase
      .channel('items_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'items', filter: `owner_id=eq.${user.id}` },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === 'INSERT') {
            setItems(prev => [payload.new as Item, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setItems(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new as Item : item
            ));
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();
    
    // Subscribe to loans changes.
    // Handle events directly so we can animate removals smoothly and avoid
    // a full refetch. LoanCard resolves items/contacts via getItemById /
    // getContactById, so we don't need the joined rows in state.
    const loansSubscription = supabase
      .channel('loans_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'loans', filter: `lender_id=eq.${user.id}` },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === 'INSERT') {
            const newLoan = mapLoanRow(payload.new);
            setLoans(prev => [newLoan, ...prev.filter(l => l.id !== newLoan.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapLoanRow(payload.new);
            // Animate the status transition so the card either re-flows (in
            // "All"/"Returned" filters) or disappears (in "Active" filter)
            // smoothly.
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setLoans(prev =>
              prev.map(l => (l.id === updated.id ? updated : l))
            );
          } else if (payload.eventType === 'DELETE') {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setLoans(prev => prev.filter(l => l.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();
    
    // Subscribe to gives changes
    const givesSubscription = supabase
      .channel('gives_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gives' },
        () => {
          fetchData();
        }
      )
      .subscribe();
    
    // Subscribe to contacts changes
    const contactsSubscription = supabase
      .channel('contacts_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'contacts', filter: `owner_id=eq.${user.id}` },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === 'INSERT') {
            setContacts(prev => [...prev, payload.new as Contact]);
          } else if (payload.eventType === 'UPDATE') {
            setContacts(prev => prev.map(contact => 
              contact.id === payload.new.id ? payload.new as Contact : contact
            ));
          } else if (payload.eventType === 'DELETE') {
            setContacts(prev => prev.filter(contact => contact.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      itemsSubscription.unsubscribe();
      loansSubscription.unsubscribe();
      givesSubscription.unsubscribe();
      contactsSubscription.unsubscribe();
    };
  }, [user, fetchData]);

  // Add new item
  const addItem = useCallback(async (item: Omit<Item, 'id' | 'createdAt' | 'ownerId' | 'status'>) => {
    if (!user) return;
    
    setIsAddingItem(true);
    try {
      const newItem: InsertTables<'items'> = {
        owner_id: user.id,
        title: item.title,
        description: item.description || null,
        notes: item.notes || null,
        category: item.category,
        photo_url: item.photo || null,
        condition: item.condition || null,
        value: item.value || null,
        status: 'available',
      };
      
      const { error } = await supabase
        .from('items')
        .insert(newItem);
      
      if (error) throw error;
      
      // Real-time subscription will update the list
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    } finally {
      setIsAddingItem(false);
    }
  }, [user]);

  // Update item
  const updateItem = useCallback(async (id: string, updates: Partial<Item>) => {
    try {
      const { error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  }, []);

  // Delete item
  const deleteItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }, []);

  // Lend item
  const lendItem = useCallback(async ({ itemId, contactId, returnBy }: 
    { itemId: string; contactId: string; returnBy?: string }) => {
    setIsLending(true);
    try {
      const newLoan: InsertTables<'loans'> = {
        item_id: itemId,
        contact_id: contactId,
        return_by: returnBy || null,
        status: 'active',
      };
      
      const { error } = await supabase
        .from('loans')
        .insert(newLoan);
      
      if (error) throw error;
      
      // Trigger will update item status to 'lent'
    } catch (error) {
      console.error('Error lending item:', error);
      throw error;
    } finally {
      setIsLending(false);
    }
  }, []);

  // Give item
  const giveItem = useCallback(async ({ itemId, contactId, notes }: 
    { itemId: string; contactId: string; notes?: string }) => {
    setIsGiving(true);
    try {
      const newGive: InsertTables<'gives'> = {
        item_id: itemId,
        contact_id: contactId,
        notes: notes || null,
      };
      
      const { error } = await supabase
        .from('gives')
        .insert(newGive);
      
      if (error) throw error;
      
      // Trigger will update item status to 'given'
    } catch (error) {
      console.error('Error giving item:', error);
      throw error;
    } finally {
      setIsGiving(false);
    }
  }, []);

  // Mark loan as returned
  const markReturned = useCallback(async (loanId: string) => {
    try {
      const { error } = await supabase
        .from('loans')
        .update({
          status: 'returned',
          returned_at: new Date().toISOString(),
        })
        .eq('id', loanId);
      
      if (error) throw error;
      
      // Trigger will update item status to 'available'
    } catch (error) {
      console.error('Error marking returned:', error);
      throw error;
    }
  }, []);

  // Add contact
  const addContact = useCallback(async (contact: Omit<Contact, 'id' | 'createdAt' | 'ownerId'>) => {
    if (!user) return;
    
    try {
      const newContact: InsertTables<'contacts'> = {
        owner_id: user.id,
        name: contact.name,
        phone: contact.phone || null,
        email: contact.email || null,
        avatar_url: contact.avatar || null,
        notes: contact.notes || null,
        how_met: contact.howMet || null,
        tags: contact.tags || null,
        reliability: contact.reliability || null,
      };
      
      const { error } = await supabase
        .from('contacts')
        .insert(newContact);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  }, [user]);

  // Update contact
  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }, []);

  // Delete contact
  const deleteContact = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }, []);

  // Getters
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

  // Stats calculation
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
    isLoading,
    isOffline,
    addItem,
    updateItem,
    deleteItem,
    lendItem,
    giveItem,
    markReturned,
    addContact,
    updateContact,
    deleteContact,
    getContactById,
    getItemById,
    getActiveLoanForItem,
    refreshData: fetchData,
    isAddingItem,
    isLending,
    isGiving,
  }), [
    items, loans, gives, contacts, stats, isLoading, isOffline,
    addItem, updateItem, deleteItem, lendItem, giveItem, markReturned,
    addContact, updateContact, deleteContact,
    getContactById, getItemById, getActiveLoanForItem, fetchData,
    isAddingItem, isLending, isGiving,
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
