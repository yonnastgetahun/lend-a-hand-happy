export interface Item {
  id: string;
  title: string;
  photo?: string;
  category: "book" | "tool" | "game" | "gear" | "other";
  ownerId: string;
  borrowerId?: string;
  lentDate?: Date;
  dueDate?: Date;
  returnedDate?: Date;
  status: "available" | "lent" | "returned";
}

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
}

export interface Loan {
  id: string;
  item: Item;
  lenderId: string;
  borrowerId: string;
  lentDate: Date;
  dueDate?: Date;
  returnedDate?: Date;
  status: "active" | "returned" | "overdue";
  reminderSent: boolean;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}
