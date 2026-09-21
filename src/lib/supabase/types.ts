export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'customer' | 'admin';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid';

export type PaymentMode = 'cash' | 'upi' | 'card' | 'online';

export interface OrderItemSnapshot {
  itemId: string;
  name: string;
  variant?: 'veg' | 'non-veg' | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      menu_categories: {
        Row: {
          id: string;
          label: string;
          icon: string | null;
          subtitle: string | null;
          description: string | null;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          label: string;
          icon?: string | null;
          subtitle?: string | null;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          label?: string;
          icon?: string | null;
          subtitle?: string | null;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          description: string;
          price: number;
          chicken_price: number | null;
          is_veg: boolean;
          is_spicy: boolean;
          is_bestseller: boolean;
          is_special: boolean;
          image_url: string | null;
          tags: string[] | null;
          is_available: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          description?: string;
          price: number;
          chicken_price?: number | null;
          is_veg?: boolean;
          is_spicy?: boolean;
          is_bestseller?: boolean;
          is_special?: boolean;
          image_url?: string | null;
          tags?: string[] | null;
          is_available?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          description?: string;
          price?: number;
          chicken_price?: number | null;
          is_veg?: boolean;
          is_spicy?: boolean;
          is_bestseller?: boolean;
          is_special?: boolean;
          image_url?: string | null;
          tags?: string[] | null;
          is_available?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: number;
          customer_id: string | null;
          customer_name: string;
          customer_phone: string;
          items: Json;
          subtotal: number;
          total: number;
          status: OrderStatus;
          payment_status: PaymentStatus;
          payment_mode: PaymentMode;
          upi_transaction_id: string | null;
          paid_at: string | null;
          source: string;
          notes: string | null;
          delivery_address?: string | null;
          delivery_coordinates?: Json | null;
          idempotency_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: number;
          customer_id?: string | null;
          customer_name: string;
          customer_phone: string;
          items: Json;
          subtotal?: number;
          total?: number;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          payment_mode?: PaymentMode;
          upi_transaction_id?: string | null;
          paid_at?: string | null;
          source?: string;
          notes?: string | null;
          delivery_address?: string | null;
          delivery_coordinates?: Json | null;
          idempotency_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: number;
          customer_id?: string | null;
          customer_name?: string;
          customer_phone?: string;
          items?: Json;
          subtotal?: number;
          total?: number;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          payment_mode?: PaymentMode;
          upi_transaction_id?: string | null;
          paid_at?: string | null;
          source?: string;
          notes?: string | null;
          delivery_address?: string | null;
          delivery_coordinates?: Json | null;
          idempotency_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string | null;
          item_name: string;
          variant: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id?: string | null;
          item_name: string;
          variant?: string | null;
          quantity?: number;
          unit_price: number;
          total_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string | null;
          item_name?: string;
          variant?: string | null;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      whatsapp_consents: {
        Row: {
          id: string;
          phone: string;
          customer_name: string | null;
          consent_given: boolean;
          source: string;
          metadata: Json;
          consented_at: string;
          opted_out_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          customer_name?: string | null;
          consent_given?: boolean;
          source?: string;
          metadata?: Json;
          consented_at?: string;
          opted_out_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          customer_name?: string | null;
          consent_given?: boolean;
          source?: string;
          metadata?: Json;
          consented_at?: string;
          opted_out_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customer_events: {
        Row: {
          id: string;
          session_id: string;
          event_name: string;
          event_data: Json;
          page_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          event_name: string;
          event_data?: Json;
          page_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          event_name?: string;
          event_data?: Json;
          page_path?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type DbCategory = Database['public']['Tables']['menu_categories']['Row'];
export type DbMenuItem = Database['public']['Tables']['menu_items']['Row'];
export type DbOrder = Database['public']['Tables']['orders']['Row'];
export type DbOrderItem = Database['public']['Tables']['order_items']['Row'];
export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbWhatsAppConsent = Database['public']['Tables']['whatsapp_consents']['Row'];
export type DbCustomerEvent = Database['public']['Tables']['customer_events']['Row'];
