export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          avatar_url: string | null
          preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          avatar_url?: string | null
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          avatar_url?: string | null
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          notes: string | null
          category: 'book' | 'tool' | 'game' | 'gear' | 'other'
          photo_url: string | null
          condition: 'new' | 'good' | 'fair' | 'worn' | null
          value: number | null
          status: 'available' | 'lent' | 'given'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          notes?: string | null
          category?: 'book' | 'tool' | 'game' | 'gear' | 'other'
          photo_url?: string | null
          condition?: 'new' | 'good' | 'fair' | 'worn' | null
          value?: number | null
          status?: 'available' | 'lent' | 'given'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          notes?: string | null
          category?: 'book' | 'tool' | 'game' | 'gear' | 'other'
          photo_url?: string | null
          condition?: 'new' | 'good' | 'fair' | 'worn' | null
          value?: number | null
          status?: 'available' | 'lent' | 'given'
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          owner_id: string
          name: string
          phone: string | null
          email: string | null
          avatar_url: string | null
          notes: string | null
          how_met: string | null
          tags: string[] | null
          reliability: 'high' | 'medium' | 'low' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          phone?: string | null
          email?: string | null
          avatar_url?: string | null
          notes?: string | null
          how_met?: string | null
          tags?: string[] | null
          reliability?: 'high' | 'medium' | 'low' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          avatar_url?: string | null
          notes?: string | null
          how_met?: string | null
          tags?: string[] | null
          reliability?: 'high' | 'medium' | 'low' | null
          created_at?: string
          updated_at?: string
        }
      }
      loans: {
        Row: {
          id: string
          item_id: string
          contact_id: string | null
          lender_id: string | null
          borrower_name: string | null
          borrower_phone: string | null
          tone: string | null
          lent_at: string
          return_by: string | null
          returned_at: string | null
          status: 'active' | 'returned' | 'overdue'
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          contact_id?: string | null
          lender_id?: string | null
          borrower_name?: string | null
          borrower_phone?: string | null
          tone?: string | null
          lent_at?: string
          return_by?: string | null
          returned_at?: string | null
          status?: 'active' | 'returned' | 'overdue'
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          contact_id?: string | null
          lender_id?: string | null
          borrower_name?: string | null
          borrower_phone?: string | null
          tone?: string | null
          lent_at?: string
          return_by?: string | null
          returned_at?: string | null
          status?: 'active' | 'returned' | 'overdue'
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      gives: {
        Row: {
          id: string
          item_id: string
          contact_id: string
          given_at: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          contact_id: string
          given_at?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          contact_id?: string
          given_at?: string
          notes?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_stats: {
        Args: {
          user_id: string
        }
        Returns: {
          total_items: number
          available_items: number
          lent_items: number
          given_items: number
          active_loans: number
          total_contacts: number
        }
      }
      lend_item: {
        Args: {
          p_title: string
          p_category: string
          p_borrower_name: string
          p_borrower_phone: string
          p_return_by: string
          p_tone: string
        }
        Returns: Database['public']['Tables']['loans']['Row']
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

export type Item = Tables<'items'>;
export type Contact = Tables<'contacts'>;
export type Loan = Tables<'loans'>;
export type Give = Tables<'gives'>;
export type Profile = Tables<'profiles'>;
