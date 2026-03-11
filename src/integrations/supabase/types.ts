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
      appointments: {
        Row: {
          address: string
          city: string
          client_id: string | null
          close_amount: number | null
          closed_at: string | null
          closed_by: string | null
          closed_value: number | null
          created_at: string
          cultural_origin: string | null
          date: string
          decision_timeline: string | null
          full_name: string
          had_inspection_report: string | null
          id: string
          industry: string | null
          inspection_by: string | null
          hot_call_attempt_count: number
          hot_call_last_feedback: string | null
          hot_call_owner_id: string | null
          hot_call_recall_at: string | null
          hot_call_state: string | null
          hot_call_tags: string[]
          hot_call_taken_at: string | null
          is_backlog: boolean
          is_hot_call: boolean
          last_hot_call_attempt_at: string | null
          lead_source: string | null
          notes: string
          origin: string | null
          phone: string
          pre_qual_1: string
          pre_qual_2: string
          property_duration_years: number | null
          recent_or_future_work: string | null
          rep_id: string
          scheduled_at: string | null
          sms_scheduled: boolean
          source: string | null
          status: string
          status_log: Json
          tenant_id: string
          time: string
          updated_at: string
          was_recovered: boolean | null
          work_already_done: string | null
        }
        Insert: {
          address?: string
          city?: string
          client_id?: string | null
          close_amount?: number | null
          closed_at?: string | null
          closed_by?: string | null
          closed_value?: number | null
          created_at?: string
          cultural_origin?: string | null
          date: string
          decision_timeline?: string | null
          full_name: string
          had_inspection_report?: string | null
          id?: string
          industry?: string | null
          inspection_by?: string | null
          hot_call_attempt_count?: number
          hot_call_last_feedback?: string | null
          hot_call_owner_id?: string | null
          hot_call_recall_at?: string | null
          hot_call_state?: string | null
          hot_call_tags?: string[]
          hot_call_taken_at?: string | null
          is_backlog?: boolean
          is_hot_call?: boolean
          last_hot_call_attempt_at?: string | null
          lead_source?: string | null
          notes?: string
          origin?: string | null
          phone: string
          pre_qual_1?: string
          pre_qual_2?: string
          property_duration_years?: number | null
          recent_or_future_work?: string | null
          rep_id?: string
          scheduled_at?: string | null
          sms_scheduled?: boolean
          source?: string | null
          status?: string
          status_log?: Json
          tenant_id?: string
          time?: string
          updated_at?: string
          was_recovered?: boolean | null
          work_already_done?: string | null
        }
        Update: {
          address?: string
          city?: string
          client_id?: string | null
          close_amount?: number | null
          closed_at?: string | null
          closed_by?: string | null
          closed_value?: number | null
          created_at?: string
          cultural_origin?: string | null
          date?: string
          decision_timeline?: string | null
          full_name?: string
          had_inspection_report?: string | null
          id?: string
          industry?: string | null
          inspection_by?: string | null
          hot_call_attempt_count?: number
          hot_call_last_feedback?: string | null
          hot_call_owner_id?: string | null
          hot_call_recall_at?: string | null
          hot_call_state?: string | null
          hot_call_tags?: string[]
          hot_call_taken_at?: string | null
          is_backlog?: boolean
          is_hot_call?: boolean
          last_hot_call_attempt_at?: string | null
          lead_source?: string | null
          notes?: string
          origin?: string | null
          phone?: string
          pre_qual_1?: string
          pre_qual_2?: string
          property_duration_years?: number | null
          recent_or_future_work?: string | null
          rep_id?: string
          scheduled_at?: string | null
          sms_scheduled?: boolean
          source?: string | null
          status?: string
          status_log?: Json
          tenant_id?: string
          time?: string
          updated_at?: string
          was_recovered?: boolean | null
          work_already_done?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_photos: {
        Row: {
          client_name: string
          client_phone: string
          created_at: string
          file_path: string
          file_type: string
          id: string
          uploaded_by: string
        }
        Insert: {
          client_name?: string
          client_phone: string
          created_at?: string
          file_path: string
          file_type?: string
          id?: string
          uploaded_by?: string
        }
        Update: {
          client_name?: string
          client_phone?: string
          created_at?: string
          file_path?: string
          file_type?: string
          id?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string
          city: string
          created_at: string
          cultural_origin: string | null
          full_name: string
          id: string
          lead_source: string | null
          origin: string | null
          phone: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string
          city?: string
          created_at?: string
          cultural_origin?: string | null
          full_name: string
          id?: string
          lead_source?: string | null
          origin?: string | null
          phone: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          cultural_origin?: string | null
          full_name?: string
          id?: string
          lead_source?: string | null
          origin?: string | null
          phone?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      hot_call_notes: {
        Row: {
          call_feedback: string | null
          created_at: string
          hot_call_id: string
          id: string
          note: string
          user_id: string
        }
        Insert: {
          call_feedback?: string | null
          created_at?: string
          hot_call_id: string
          id?: string
          note?: string
          user_id?: string
        }
        Update: {
          call_feedback?: string | null
          created_at?: string
          hot_call_id?: string
          id?: string
          note?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hot_call_notes_hot_call_id_fkey"
            columns: ["hot_call_id"]
            isOneToOne: false
            referencedRelation: "hot_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      hot_calls: {
        Row: {
          address: string
          assigned_to_user_id: string | null
          attempts: number
          city: string
          created_at: string
          follow_up_date: string | null
          full_name: string
          id: string
          last_action_at: string | null
          last_contact_date: string | null
          last_feedback: string
          lock_expires_at: string | null
          locked_at: string | null
          notes: string | null
          origin: string | null
          original_appointment_id: string | null
          phase: string
          phone: string
          source: string
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          address?: string
          assigned_to_user_id?: string | null
          attempts?: number
          city?: string
          created_at?: string
          follow_up_date?: string | null
          full_name: string
          id?: string
          last_action_at?: string | null
          last_contact_date?: string | null
          last_feedback?: string
          lock_expires_at?: string | null
          locked_at?: string | null
          notes?: string | null
          origin?: string | null
          original_appointment_id?: string | null
          phase?: string
          phone: string
          source?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: string
          assigned_to_user_id?: string | null
          attempts?: number
          city?: string
          created_at?: string
          follow_up_date?: string | null
          full_name?: string
          id?: string
          last_action_at?: string | null
          last_contact_date?: string | null
          last_feedback?: string
          lock_expires_at?: string | null
          locked_at?: string | null
          notes?: string | null
          origin?: string | null
          original_appointment_id?: string | null
          phase?: string
          phone?: string
          source?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      map_zone_status_logs: {
        Row: {
          changed_at: string
          changed_by: string
          id: string
          new_status: string
          previous_status: string
          zone_id: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: string
          new_status: string
          previous_status: string
          zone_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: string
          new_status?: string
          previous_status?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_zone_status_logs_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "map_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      map_zones: {
        Row: {
          city: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          planned_date: string | null
          polygon: Json
          rep_id: string
          status: string
          updated_at: string
        }
        Insert: {
          city?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          planned_date?: string | null
          polygon: Json
          rep_id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          planned_date?: string | null
          polygon?: Json
          rep_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_leads: {
        Row: {
          address: string | null
          assigned_rep_id: string | null
          attempts_count: number
          city: string | null
          converted_appointment_id: string | null
          created_at: string
          created_by_user_id: string
          full_name: string
          has_attic: string | null
          id: string
          last_contact_date: string | null
          next_followup_date: string | null
          notes: string | null
          phone: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_rep_id?: string | null
          attempts_count?: number
          city?: string | null
          converted_appointment_id?: string | null
          created_at?: string
          created_by_user_id?: string
          full_name: string
          has_attic?: string | null
          id?: string
          last_contact_date?: string | null
          next_followup_date?: string | null
          notes?: string | null
          phone: string
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_rep_id?: string | null
          attempts_count?: number
          city?: string | null
          converted_appointment_id?: string | null
          created_at?: string
          created_by_user_id?: string
          full_name?: string
          has_attic?: string | null
          id?: string
          last_contact_date?: string | null
          next_followup_date?: string | null
          notes?: string | null
          phone?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          disabled_at: string | null
          display_name: string
          email: string
          id: string
          invited_at: string | null
          phone: string | null
          role: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          disabled_at?: string | null
          display_name?: string
          email?: string
          id?: string
          invited_at?: string | null
          phone?: string | null
          role?: string
          tenant_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          disabled_at?: string | null
          display_name?: string
          email?: string
          id?: string
          invited_at?: string | null
          phone?: string | null
          role?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          role?: string
          user_id: string
          workspace_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { p_tenant_id?: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
