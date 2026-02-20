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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          permissions: Json | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: Json | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: Json | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_category: string
          event_name: string
          id: string
          metadata: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_category: string
          event_name: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_category?: string
          event_name?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_sessions: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          session_id: string
          source_channel: string | null
          started_at: string
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          session_id?: string
          source_channel?: string | null
          started_at?: string
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          session_id?: string
          source_channel?: string | null
          started_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          ended_at: string | null
          feedback: Json | null
          id: string
          messages: Json
          scenario_id: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          feedback?: Json | null
          id?: string
          messages?: Json
          scenario_id: string
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          feedback?: Json | null
          id?: string
          messages?: Json
          scenario_id?: string
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      evolution_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          invite_code: string
          max_members: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          invite_code?: string
          max_members?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          invite_code?: string
          max_members?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "evolution_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          subscription: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          subscription?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          subscription?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string | null
          conversation_history: Json
          created_at: string
          description: string
          id: string
          resolved_at: string | null
          status: string
          updated_at: string
          user_email: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          category?: string | null
          conversation_history?: Json
          created_at?: string
          description: string
          id?: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          category?: string | null
          conversation_history?: Json
          created_at?: string
          description?: string
          id?: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          id: string
          progress: number | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          id?: string
          progress?: number | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          id?: string
          progress?: number | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          id: string
          total_audio_credits: number
          total_credits: number
          trial_ends_at: string
          trial_started_at: string
          updated_at: string
          used_audio_credits: number
          used_credits: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          total_audio_credits?: number
          total_credits?: number
          trial_ends_at?: string
          trial_started_at?: string
          updated_at?: string
          used_audio_credits?: number
          used_credits?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          total_audio_credits?: number
          total_credits?: number
          trial_ends_at?: string
          trial_started_at?: string
          updated_at?: string
          used_audio_credits?: number
          used_credits?: number
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          average_score: number | null
          created_at: string
          current_adaptive_level: string | null
          current_streak: number | null
          email: string | null
          has_completed_onboarding: boolean
          id: string
          language: string
          last_practice_date: string | null
          level: string
          longest_streak: number | null
          name: string
          plan: string
          total_conversations: number
          updated_at: string
          user_id: string
          weekly_goal: number
        }
        Insert: {
          avatar_url?: string | null
          average_score?: number | null
          created_at?: string
          current_adaptive_level?: string | null
          current_streak?: number | null
          email?: string | null
          has_completed_onboarding?: boolean
          id?: string
          language?: string
          last_practice_date?: string | null
          level?: string
          longest_streak?: number | null
          name?: string
          plan?: string
          total_conversations?: number
          updated_at?: string
          user_id: string
          weekly_goal?: number
        }
        Update: {
          avatar_url?: string | null
          average_score?: number | null
          created_at?: string
          current_adaptive_level?: string | null
          current_streak?: number | null
          email?: string | null
          has_completed_onboarding?: boolean
          id?: string
          language?: string
          last_practice_date?: string | null
          level?: string
          longest_streak?: number | null
          name?: string
          plan?: string
          total_conversations?: number
          updated_at?: string
          user_id?: string
          weekly_goal?: number
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          notifications_enabled: boolean
          theme: string
          updated_at: string
          user_id: string
          voice_enabled: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          notifications_enabled?: boolean
          theme?: string
          updated_at?: string
          user_id: string
          voice_enabled?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          notifications_enabled?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
          voice_enabled?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      user_rankings: {
        Row: {
          avatar_url: string | null
          average_score: number | null
          current_adaptive_level: string | null
          current_streak: number | null
          longest_streak: number | null
          name: string | null
          total_conversations: number | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          average_score?: number | null
          current_adaptive_level?: string | null
          current_streak?: number | null
          longest_streak?: number | null
          name?: string | null
          total_conversations?: number | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          average_score?: number | null
          current_adaptive_level?: string | null
          current_streak?: number | null
          longest_streak?: number | null
          name?: string | null
          total_conversations?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_active_users_metrics: {
        Args: { _end_date?: string; _start_date?: string }
        Returns: {
          daily_active_users: number
          monthly_active_users: number
          weekly_active_users: number
        }[]
      }
      get_all_user_rankings: {
        Args: never
        Returns: {
          average_score: number
          current_adaptive_level: string
          current_streak: number
          longest_streak: number
          name: string
          total_conversations: number
          user_id: string
        }[]
      }
      get_events_count: {
        Args: { _end_date?: string; _event_name: string; _start_date?: string }
        Returns: number
      }
      get_group_by_invite_code: {
        Args: { _invite_code: string }
        Returns: {
          id: string
          max_members: number
          name: string
        }[]
      }
      get_growth_metrics: {
        Args: never
        Returns: {
          current_month_users: number
          growth_rate: number
          previous_month_users: number
        }[]
      }
      get_retention_metrics: {
        Args: never
        Returns: {
          retention_d1: number
          retention_d30: number
          retention_d7: number
        }[]
      }
      get_user_group_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_id_by_email: { Args: { _email: string }; Returns: string }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_group_creator: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      send_daily_push: { Args: never; Returns: undefined }
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
