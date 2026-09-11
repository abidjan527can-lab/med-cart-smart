export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          batch_no: string | null
          expiry_date: string | null
          id: string
          invoice_id: string
          medicine_id: string | null
          name: string
          quantity: number
          sale_price: number
          unit_price: number
        }
        Insert: {
          batch_no?: string | null
          expiry_date?: string | null
          id?: string
          invoice_id: string
          medicine_id?: string | null
          name: string
          quantity?: number
          sale_price?: number
          unit_price?: number
        }
        Update: {
          batch_no?: string | null
          expiry_date?: string | null
          id?: string
          invoice_id?: string
          medicine_id?: string | null
          name?: string
          quantity?: number
          sale_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          ai_raw: Json | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          invoice_date: string | null
          invoice_no: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          supplier_id: string | null
          supplier_name: string | null
          total: number
        }
        Insert: {
          ai_raw?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          invoice_date?: string | null
          invoice_no?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          supplier_id?: string | null
          supplier_name?: string | null
          total?: number
        }
        Update: {
          ai_raw?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          invoice_date?: string | null
          invoice_no?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          supplier_id?: string | null
          supplier_name?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          barcode: string | null
          batch_no: string | null
          created_at: string
          created_by: string | null
          expiry_date: string | null
          form: string | null
          generic_name: string | null
          id: string
          image_url: string | null
          manufacturer: string | null
          min_stock: number
          name: string
          notes: string | null
          pack_size: string | null
          purchase_price: number
          quantity: number
          rack: string | null
          sale_price: number
          strength: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          batch_no?: string | null
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          form?: string | null
          generic_name?: string | null
          id?: string
          image_url?: string | null
          manufacturer?: string | null
          min_stock?: number
          name: string
          notes?: string | null
          pack_size?: string | null
          purchase_price?: number
          quantity?: number
          rack?: string | null
          sale_price?: number
          strength?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          batch_no?: string | null
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          form?: string | null
          generic_name?: string | null
          id?: string
          image_url?: string | null
          manufacturer?: string | null
          min_stock?: number
          name?: string
          notes?: string | null
          pack_size?: string | null
          purchase_price?: number
          quantity?: number
          rack?: string | null
          sale_price?: number
          strength?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          medicine_id: string | null
          name: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          medicine_id?: string | null
          name: string
          order_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          id?: string
          medicine_id?: string | null
          name?: string
          order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          ai_raw: Json | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          note: string | null
          order_no: number
          prescription_url: string | null
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
        }
        Insert: {
          ai_raw?: Json | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          note?: string | null
          order_no?: number
          prescription_url?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Update: {
          ai_raw?: Json | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          note?: string | null
          order_no?: number
          prescription_url?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          medicine_id: string
          quantity: number
          reason: string | null
          reference_id: string | null
          source: string
          type: Database["public"]["Enums"]["movement_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          medicine_id: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          source?: string
          type: Database["public"]["Enums"]["movement_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          medicine_id?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          source?: string
          type?: Database["public"]["Enums"]["movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff"
      invoice_status: "draft" | "posted"
      movement_type: "in" | "out" | "adjust"
      order_status:
        | "pending"
        | "confirmed"
        | "ready"
        | "delivered"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff"],
      invoice_status: ["draft", "posted"],
      movement_type: ["in", "out", "adjust"],
      order_status: ["pending", "confirmed", "ready", "delivered", "cancelled"],
    },
  },
} as const
