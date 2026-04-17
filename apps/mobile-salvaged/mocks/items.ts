import { Item, Loan } from '@/types';

export const mockItems: Item[] = [
  {
    id: 'i1',
    title: 'The Great Gatsby',
    category: 'book',
    status: 'lent',
    createdAt: '2025-12-01T10:00:00Z',
    ownerId: 'u1',
  },
  {
    id: 'i2',
    title: 'Cordless Drill',
    category: 'tool',
    status: 'available',
    createdAt: '2025-11-15T14:30:00Z',
    ownerId: 'u1',
  },
  {
    id: 'i3',
    title: 'Catan Board Game',
    category: 'game',
    status: 'lent',
    createdAt: '2025-10-20T09:00:00Z',
    ownerId: 'u1',
  },
  {
    id: 'i4',
    title: 'Camping Tent',
    category: 'gear',
    status: 'available',
    createdAt: '2025-09-05T16:45:00Z',
    ownerId: 'u1',
  },
  {
    id: 'i5',
    title: 'Bluetooth Speaker',
    category: 'gear',
    status: 'returned',
    createdAt: '2025-08-12T11:20:00Z',
    ownerId: 'u1',
  },
];

export const mockLoans: Loan[] = [
  {
    id: 'l1',
    itemId: 'i1',
    contactId: 'c1',
    lentAt: '2026-01-15T10:00:00Z',
    returnBy: '2026-02-15T10:00:00Z',
    status: 'active',
  },
  {
    id: 'l2',
    itemId: 'i3',
    contactId: 'c3',
    lentAt: '2026-02-01T09:00:00Z',
    returnBy: '2026-03-01T09:00:00Z',
    status: 'active',
  },
  {
    id: 'l3',
    itemId: 'i5',
    contactId: 'c2',
    lentAt: '2025-12-01T11:00:00Z',
    returnBy: '2025-12-20T11:00:00Z',
    returnedAt: '2025-12-18T15:30:00Z',
    status: 'returned',
  },
];
