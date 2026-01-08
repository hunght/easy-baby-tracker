/* eslint-disable import/no-unused-modules */
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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_state: {
        Row: {
          id: number
          key: string
          user_id: string
          value: string | null
        }
        Insert: {
          id?: number
          key: string
          user_id: string
          value?: string | null
        }
        Update: {
          id?: number
          key?: string
          user_id?: string
          value?: string | null
        }
        Relationships: []
      }
      baby_habits: {
        Row: {
          baby_id: number
          created_at: number
          habit_definition_id: string
          id: number
          is_active: boolean | null
          reminder_days: string | null
          reminder_time: string | null
          target_frequency: string | null
        }
        Insert: {
          baby_id: number
          created_at?: number
          habit_definition_id: string
          id?: number
          is_active?: boolean | null
          reminder_days?: string | null
          reminder_time?: string | null
          target_frequency?: string | null
        }
        Update: {
          baby_id?: number
          created_at?: number
          habit_definition_id?: string
          id?: number
          is_active?: boolean | null
          reminder_days?: string | null
          reminder_time?: string | null
          target_frequency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "baby_habits_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baby_habits_habit_definition_id_fkey"
            columns: ["habit_definition_id"]
            isOneToOne: false
            referencedRelation: "habit_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      baby_profiles: {
        Row: {
          avatar_uri: string | null
          birth_date: string
          created_at: number
          due_date: string
          first_wake_time: string
          gender: string
          id: number
          nickname: string
          selected_easy_formula_id: string | null
          user_id: string | null
        }
        Insert: {
          avatar_uri?: string | null
          birth_date: string
          created_at?: number
          due_date: string
          first_wake_time?: string
          gender: string
          id?: number
          nickname: string
          selected_easy_formula_id?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_uri?: string | null
          birth_date?: string
          created_at?: number
          due_date?: string
          first_wake_time?: string
          gender?: string
          id?: number
          nickname?: string
          selected_easy_formula_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      concern_choices: {
        Row: {
          baby_id: number
          concern_id: string
          id: number
        }
        Insert: {
          baby_id: number
          concern_id: string
          id?: number
        }
        Update: {
          baby_id?: number
          concern_id?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "concern_choices_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      diaper_changes: {
        Row: {
          baby_id: number
          color: string | null
          id: number
          kind: string
          notes: string | null
          recorded_at: number
          time: number
          wetness: number | null
        }
        Insert: {
          baby_id: number
          color?: string | null
          id?: number
          kind: string
          notes?: string | null
          recorded_at?: number
          time?: number
          wetness?: number | null
        }
        Update: {
          baby_id?: number
          color?: string | null
          id?: number
          kind?: string
          notes?: string | null
          recorded_at?: number
          time?: number
          wetness?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "diaper_changes_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      diary_entries: {
        Row: {
          baby_id: number
          content: string | null
          created_at: number
          id: number
          photo_uri: string | null
          title: string | null
        }
        Insert: {
          baby_id: number
          content?: string | null
          created_at?: number
          id?: number
          photo_uri?: string | null
          title?: string | null
        }
        Update: {
          baby_id?: number
          content?: string | null
          created_at?: number
          id?: number
          photo_uri?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diary_entries_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      easy_formula_rules: {
        Row: {
          age_range_key: string | null
          age_range_text: string | null
          baby_id: number | null
          created_at: number
          description: string | null
          id: string
          is_custom: boolean
          label_key: string | null
          label_text: string | null
          max_weeks: number | null
          min_weeks: number
          phases: string
          source_rule_id: string | null
          updated_at: number
          valid_date: string | null
        }
        Insert: {
          age_range_key?: string | null
          age_range_text?: string | null
          baby_id?: number | null
          created_at?: number
          description?: string | null
          id: string
          is_custom?: boolean
          label_key?: string | null
          label_text?: string | null
          max_weeks?: number | null
          min_weeks: number
          phases: string
          source_rule_id?: string | null
          updated_at?: number
          valid_date?: string | null
        }
        Update: {
          age_range_key?: string | null
          age_range_text?: string | null
          baby_id?: number | null
          created_at?: number
          description?: string | null
          id?: string
          is_custom?: boolean
          label_key?: string | null
          label_text?: string | null
          max_weeks?: number | null
          min_weeks?: number
          phases?: string
          source_rule_id?: string | null
          updated_at?: number
          valid_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "easy_formula_rules_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedings: {
        Row: {
          amount_grams: number | null
          amount_ml: number | null
          baby_id: number
          duration: number | null
          id: number
          ingredient: string | null
          ingredient_type: string | null
          left_duration: number | null
          notes: string | null
          recorded_at: number
          right_duration: number | null
          start_time: number
          type: string
        }
        Insert: {
          amount_grams?: number | null
          amount_ml?: number | null
          baby_id: number
          duration?: number | null
          id?: number
          ingredient?: string | null
          ingredient_type?: string | null
          left_duration?: number | null
          notes?: string | null
          recorded_at?: number
          right_duration?: number | null
          start_time?: number
          type: string
        }
        Update: {
          amount_grams?: number | null
          amount_ml?: number | null
          baby_id?: number
          duration?: number | null
          id?: number
          ingredient?: string | null
          ingredient_type?: string | null
          left_duration?: number | null
          notes?: string | null
          recorded_at?: number
          right_duration?: number | null
          start_time?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedings_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_records: {
        Row: {
          baby_id: number
          head_circumference_cm: number | null
          height_cm: number | null
          id: number
          notes: string | null
          recorded_at: number
          time: number
          weight_kg: number | null
        }
        Insert: {
          baby_id: number
          head_circumference_cm?: number | null
          height_cm?: number | null
          id?: number
          notes?: string | null
          recorded_at?: number
          time?: number
          weight_kg?: number | null
        }
        Update: {
          baby_id?: number
          head_circumference_cm?: number | null
          height_cm?: number | null
          id?: number
          notes?: string | null
          recorded_at?: number
          time?: number
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_records_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_definitions: {
        Row: {
          category: string
          default_frequency: string
          description_key: string
          icon_name: string
          id: string
          is_active: boolean | null
          label_key: string
          max_age_months: number | null
          min_age_months: number | null
          sort_order: number | null
        }
        Insert: {
          category: string
          default_frequency: string
          description_key: string
          icon_name: string
          id: string
          is_active?: boolean | null
          label_key: string
          max_age_months?: number | null
          min_age_months?: number | null
          sort_order?: number | null
        }
        Update: {
          category?: string
          default_frequency?: string
          description_key?: string
          icon_name?: string
          id?: string
          is_active?: boolean | null
          label_key?: string
          max_age_months?: number | null
          min_age_months?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          baby_habit_id: number
          baby_id: number
          completed_at: number
          duration: number | null
          id: number
          notes: string | null
          recorded_at: number
        }
        Insert: {
          baby_habit_id: number
          baby_id: number
          completed_at?: number
          duration?: number | null
          id?: number
          notes?: string | null
          recorded_at?: number
        }
        Update: {
          baby_habit_id?: number
          baby_id?: number
          completed_at?: number
          duration?: number | null
          id?: number
          notes?: string | null
          recorded_at?: number
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_baby_habit_id_fkey"
            columns: ["baby_habit_id"]
            isOneToOne: false
            referencedRelation: "baby_habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_logs_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          baby_id: number
          id: number
          medication: string | null
          medicine_type: string | null
          notes: string | null
          recorded_at: number
          symptoms: string | null
          temperature: number | null
          time: number
          type: string
        }
        Insert: {
          baby_id: number
          id?: number
          medication?: string | null
          medicine_type?: string | null
          notes?: string | null
          recorded_at?: number
          symptoms?: string | null
          temperature?: number | null
          time?: number
          type: string
        }
        Update: {
          baby_id?: number
          id?: number
          medication?: string | null
          medicine_type?: string | null
          notes?: string | null
          recorded_at?: number
          symptoms?: string | null
          temperature?: number | null
          time?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_records_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pumpings: {
        Row: {
          amount_ml: number
          baby_id: number
          duration: number | null
          id: number
          left_amount_ml: number | null
          left_duration: number | null
          notes: string | null
          recorded_at: number
          right_amount_ml: number | null
          right_duration: number | null
          start_time: number
        }
        Insert: {
          amount_ml: number
          baby_id: number
          duration?: number | null
          id?: number
          left_amount_ml?: number | null
          left_duration?: number | null
          notes?: string | null
          recorded_at?: number
          right_amount_ml?: number | null
          right_duration?: number | null
          start_time?: number
        }
        Update: {
          amount_ml?: number
          baby_id?: number
          duration?: number | null
          id?: number
          left_amount_ml?: number | null
          left_duration?: number | null
          notes?: string | null
          recorded_at?: number
          right_amount_ml?: number | null
          right_duration?: number | null
          start_time?: number
        }
        Relationships: [
          {
            foreignKeyName: "pumpings_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_notifications: {
        Row: {
          baby_id: number
          created_at: number
          data: string | null
          id: number
          notification_id: string
          notification_type: string
          scheduled_time: number
        }
        Insert: {
          baby_id: number
          created_at?: number
          data?: string | null
          id?: number
          notification_id: string
          notification_type: string
          scheduled_time: number
        }
        Update: {
          baby_id?: number
          created_at?: number
          data?: string | null
          id?: number
          notification_id?: string
          notification_type?: string
          scheduled_time?: number
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_notifications_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_sessions: {
        Row: {
          baby_id: number
          duration: number | null
          end_time: number | null
          id: number
          kind: string
          notes: string | null
          recorded_at: number
          start_time: number
        }
        Insert: {
          baby_id: number
          duration?: number | null
          end_time?: number | null
          id?: number
          kind: string
          notes?: string | null
          recorded_at?: number
          start_time?: number
        }
        Update: {
          baby_id?: number
          duration?: number | null
          end_time?: number | null
          id?: number
          kind?: string
          notes?: string | null
          recorded_at?: number
          start_time?: number
        }
        Relationships: [
          {
            foreignKeyName: "sleep_sessions_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "baby_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
