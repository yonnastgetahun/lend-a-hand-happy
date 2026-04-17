export type ItemCategory = 'book' | 'tool' | 'game' | 'gear' | 'other';

export type ItemStatus = 'available' | 'lent' | 'returned';

export type LoanStatus = 'active' | 'returned' | 'overdue';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Item {
  id: string;
  title: string;
  category: ItemCategory;
  photo?: string;
  status: ItemStatus;
  createdAt: string;
  ownerId: string;
}

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  avatar?: string;
}

export interface Loan {
  id: string;
  itemId: string;
  contactId: string;
  lentAt: string;
  returnBy?: string;
  returnedAt?: string;
  status: LoanStatus;
}
