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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          assigned_to: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          id: string
          ip_address: string | null
          resource_id: string
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          resource_id: string
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          resource_id?: string
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      commission_rules: {
        Row: {
          commission_type: Database["public"]["Enums"]["commission_type"]
          created_at: string | null
          deal_type: Database["public"]["Enums"]["deal_type"] | null
          id: string
          is_active: boolean | null
          is_tiered: boolean | null
          name: string
          percentage: number | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
        }
        Insert: {
          commission_type: Database["public"]["Enums"]["commission_type"]
          created_at?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          id?: string
          is_active?: boolean | null
          is_tiered?: boolean | null
          name: string
          percentage?: number | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
        }
        Update: {
          commission_type?: Database["public"]["Enums"]["commission_type"]
          created_at?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"] | null
          id?: string
          is_active?: boolean | null
          is_tiered?: boolean | null
          name?: string
          percentage?: number | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      commission_tiers: {
        Row: {
          created_at: string | null
          id: string
          max_value: number | null
          min_value: number
          percentage: number
          rule_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_value?: number | null
          min_value: number
          percentage: number
          rule_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          max_value?: number | null
          min_value?: number
          percentage?: number
          rule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_tiers_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "commission_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          base_value: number
          commission_type: Database["public"]["Enums"]["commission_type"]
          created_at: string | null
          deal_id: string | null
          id: string
          notes: string | null
          payment_date: string | null
          percentage: number
          status: Database["public"]["Enums"]["commission_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          base_value: number
          commission_type: Database["public"]["Enums"]["commission_type"]
          created_at?: string | null
          deal_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          percentage: number
          status?: Database["public"]["Enums"]["commission_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          base_value?: number
          commission_type?: Database["public"]["Enums"]["commission_type"]
          created_at?: string | null
          deal_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          percentage?: number
          status?: Database["public"]["Enums"]["commission_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address_city: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          cnpj: string | null
          company_size: Database["public"]["Enums"]["company_size"] | null
          created_at: string | null
          created_by: string | null
          id: string
          industry: string | null
          legal_name: string | null
          name: string
          notes: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cnpj?: string | null
          company_size?: Database["public"]["Enums"]["company_size"] | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          industry?: string | null
          legal_name?: string | null
          name: string
          notes?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cnpj?: string | null
          company_size?: Database["public"]["Enums"]["company_size"] | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          industry?: string | null
          legal_name?: string | null
          name?: string
          notes?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          is_primary: boolean | null
          linkedin_url: string | null
          notes: string | null
          phone: string | null
          position: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean | null
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean | null
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          actual_close_date: string | null
          closer_id: string | null
          company_id: string | null
          contract_duration_months: number | null
          created_at: string | null
          deal_type: Database["public"]["Enums"]["deal_type"]
          expected_close_date: string | null
          hours_consumed: number | null
          hours_rollover: boolean | null
          id: string
          loss_competitor: string | null
          loss_notes: string | null
          loss_reason: Database["public"]["Enums"]["loss_reason"] | null
          monthly_hours: number | null
          monthly_value: number | null
          owner_id: string
          probability: number | null
          referred_by: string | null
          sdr_id: string | null
          source: Database["public"]["Enums"]["deal_source"]
          stage: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at: string | null
          value: number
        }
        Insert: {
          actual_close_date?: string | null
          closer_id?: string | null
          company_id?: string | null
          contract_duration_months?: number | null
          created_at?: string | null
          deal_type: Database["public"]["Enums"]["deal_type"]
          expected_close_date?: string | null
          hours_consumed?: number | null
          hours_rollover?: boolean | null
          id?: string
          loss_competitor?: string | null
          loss_notes?: string | null
          loss_reason?: Database["public"]["Enums"]["loss_reason"] | null
          monthly_hours?: number | null
          monthly_value?: number | null
          owner_id: string
          probability?: number | null
          referred_by?: string | null
          sdr_id?: string | null
          source: Database["public"]["Enums"]["deal_source"]
          stage?: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at?: string | null
          value: number
        }
        Update: {
          actual_close_date?: string | null
          closer_id?: string | null
          company_id?: string | null
          contract_duration_months?: number | null
          created_at?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"]
          expected_close_date?: string | null
          hours_consumed?: number | null
          hours_rollover?: boolean | null
          id?: string
          loss_competitor?: string | null
          loss_notes?: string | null
          loss_reason?: Database["public"]["Enums"]["loss_reason"] | null
          monthly_hours?: number | null
          monthly_value?: number | null
          owner_id?: string
          probability?: number | null
          referred_by?: string | null
          sdr_id?: string | null
          source?: Database["public"]["Enums"]["deal_source"]
          stage?: Database["public"]["Enums"]["deal_stage"]
          title?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          company_id: string | null
          created_at: string | null
          deal_id: string | null
          due_date: string
          id: string
          invoice_number: string
          is_recurring: boolean | null
          issue_date: string
          notes: string | null
          payment_date: string | null
          recurrence_month: number | null
          recurrence_year: number | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          company_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          due_date: string
          id?: string
          invoice_number: string
          is_recurring?: boolean | null
          issue_date: string
          notes?: string | null
          payment_date?: string | null
          recurrence_month?: number | null
          recurrence_year?: number | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          company_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          is_recurring?: boolean | null
          issue_date?: string
          notes?: string | null
          payment_date?: string | null
          recurrence_month?: number | null
          recurrence_year?: number | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      lgpd_consents: {
        Row: {
          company_id: string | null
          consent_date: string
          consent_given: boolean
          consent_type: Database["public"]["Enums"]["consent_type"]
          contact_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          revoked: boolean | null
          revoked_at: string | null
          user_agent: string | null
        }
        Insert: {
          company_id?: string | null
          consent_date: string
          consent_given: boolean
          consent_type: Database["public"]["Enums"]["consent_type"]
          contact_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          revoked?: boolean | null
          revoked_at?: string | null
          user_agent?: string | null
        }
        Update: {
          company_id?: string | null
          consent_date?: string
          consent_given?: boolean
          consent_type?: Database["public"]["Enums"]["consent_type"]
          contact_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          revoked?: boolean | null
          revoked_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lgpd_consents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lgpd_consents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          last_login: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          last_login?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      activity_type: "call" | "meeting" | "email" | "task" | "note"
      app_role: "admin" | "closer" | "sdr"
      commission_status: "pending" | "approved" | "paid" | "cancelled"
      commission_type: "qualification" | "closing" | "delivery" | "referral"
      company_size: "1-10" | "11-50" | "51-200" | "201-500" | "500+"
      consent_type: "marketing" | "data_processing" | "both"
      deal_source:
        | "inbound"
        | "outbound"
        | "referral"
        | "event"
        | "partner"
        | "other"
      deal_stage:
        | "lead"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
      deal_type: "retainer" | "project"
      invoice_status: "pending" | "paid" | "overdue" | "cancelled"
      loss_reason:
        | "price"
        | "timing"
        | "competitor"
        | "no_budget"
        | "no_fit"
        | "other"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      activity_type: ["call", "meeting", "email", "task", "note"],
      app_role: ["admin", "closer", "sdr"],
      commission_status: ["pending", "approved", "paid", "cancelled"],
      commission_type: ["qualification", "closing", "delivery", "referral"],
      company_size: ["1-10", "11-50", "51-200", "201-500", "500+"],
      consent_type: ["marketing", "data_processing", "both"],
      deal_source: [
        "inbound",
        "outbound",
        "referral",
        "event",
        "partner",
        "other",
      ],
      deal_stage: [
        "lead",
        "qualified",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      deal_type: ["retainer", "project"],
      invoice_status: ["pending", "paid", "overdue", "cancelled"],
      loss_reason: [
        "price",
        "timing",
        "competitor",
        "no_budget",
        "no_fit",
        "other",
      ],
    },
  },
} as const
