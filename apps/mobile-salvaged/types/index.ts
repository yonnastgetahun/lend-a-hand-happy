export type ItemCategory = 'book' | 'tool' | 'game' | 'gear' | 'other';

export type ItemStatus = 'available' | 'lent' | 'returned' | 'given';

export type LoanStatus = 'active' | 'returned' | 'overdue';

export type GiveStatus = 'available' | 'given';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences?: {
    reminderTone: 'gentle' | 'casual' | 'direct';
    defaultReminderDays?: number;
    enablePushNotifications?: boolean;
    enableEmailReminders?: boolean;
  };
}

export interface Item {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  category: ItemCategory;
  photo?: string;
  condition?: 'new' | 'good' | 'fair' | 'worn';
  value?: number;
  status: ItemStatus;
  createdAt: string;
  updatedAt?: string;
  ownerId: string;
}

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  notes?: string;
  howMet?: string;
  tags?: string[];
  reliability?: 'high' | 'medium' | 'low';
}

export interface Loan {
  id: string;
  itemId: string;
  contactId: string;
  lentAt: string;
  returnBy?: string;
  returnedAt?: string;
  status: LoanStatus;
  reminderSent?: boolean;
  reminderSentAt?: string;
  notes?: string;
}

export interface Give {
  id: string;
  itemId: string;
  contactId: string;
  givenAt: string;
  notes?: string;
}

export interface ReminderSettings {
  itemId: string;
  contactId: string;
  returnBy?: string;
  reminderDays?: number;
  tone?: 'gentle' | 'casual' | 'direct';
}
