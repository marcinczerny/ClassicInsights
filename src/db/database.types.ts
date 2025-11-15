export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      ai_error_logs: {
        Row: {
          created_at: string;
          error_code: string | null;
          error_message: string | null;
          id: number;
          model_name: string | null;
          source_text_hash: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          error_code?: string | null;
          error_message?: string | null;
          id?: number;
          model_name?: string | null;
          source_text_hash?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          error_code?: string | null;
          error_message?: string | null;
          id?: number;
          model_name?: string | null;
          source_text_hash?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      ai_suggestions: {
        Row: {
          content: string | null;
          created_at: string;
          generation_duration_ms: number | null;
          id: string;
          name: string | null;
          note_id: string | null;
          status: Database["public"]["Enums"]["suggestion_status"];
          suggested_entity_id: string | null;
          type: Database["public"]["Enums"]["suggestion_type"];
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          generation_duration_ms?: number | null;
          id?: string;
          name?: string | null;
          note_id?: string | null;
          status?: Database["public"]["Enums"]["suggestion_status"];
          suggested_entity_id?: string | null;
          type: Database["public"]["Enums"]["suggestion_type"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          generation_duration_ms?: number | null;
          id?: string;
          name?: string | null;
          note_id?: string | null;
          status?: Database["public"]["Enums"]["suggestion_status"];
          suggested_entity_id?: string | null;
          type?: Database["public"]["Enums"]["suggestion_type"];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: false;
            referencedRelation: "notes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_suggestions_suggested_entity_id_fkey";
            columns: ["suggested_entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
        ];
      };
      entities: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          type: Database["public"]["Enums"]["entity_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          type?: Database["public"]["Enums"]["entity_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          type?: Database["public"]["Enums"]["entity_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      note_entities: {
        Row: {
          created_at: string;
          entity_id: string;
          note_id: string;
          type: Database["public"]["Enums"]["relationship_type"];
        };
        Insert: {
          created_at?: string;
          entity_id: string;
          note_id: string;
          type?: Database["public"]["Enums"]["relationship_type"];
        };
        Update: {
          created_at?: string;
          entity_id?: string;
          note_id?: string;
          type?: Database["public"]["Enums"]["relationship_type"];
        };
        Relationships: [
          {
            foreignKeyName: "note_entities_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "note_entities_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: false;
            referencedRelation: "notes";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          content: string | null;
          created_at: string;
          id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          id?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          has_agreed_to_ai_data_processing: boolean;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          has_agreed_to_ai_data_processing?: boolean;
          id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          has_agreed_to_ai_data_processing?: boolean;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      relationships: {
        Row: {
          created_at: string;
          id: string;
          source_entity_id: string;
          target_entity_id: string;
          type: Database["public"]["Enums"]["relationship_type"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          source_entity_id: string;
          target_entity_id: string;
          type?: Database["public"]["Enums"]["relationship_type"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          source_entity_id?: string;
          target_entity_id?: string;
          type?: Database["public"]["Enums"]["relationship_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "relationships_source_entity_id_fkey";
            columns: ["source_entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "relationships_target_entity_id_fkey";
            columns: ["target_entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      delete_user_account: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      get_notes_with_all_entities: {
        Args: { p_entity_ids: string[]; p_user_id: string };
        Returns: {
          id: string;
        }[];
      };
    };
    Enums: {
      entity_type: "person" | "work" | "epoch" | "idea" | "school" | "system" | "other";
      relationship_type:
        | "criticizes"
        | "is_student_of"
        | "expands_on"
        | "influenced_by"
        | "is_example_of"
        | "is_related_to";
      suggestion_status: "pending" | "accepted" | "rejected";
      suggestion_type: "quote" | "summary" | "new_entity" | "existing_entity_link";
    };
    CompositeTypes: Record<never, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      entity_type: ["person", "work", "epoch", "idea", "school", "system", "other"],
      relationship_type: [
        "criticizes",
        "is_student_of",
        "expands_on",
        "influenced_by",
        "is_example_of",
        "is_related_to",
      ],
      suggestion_status: ["pending", "accepted", "rejected"],
      suggestion_type: ["quote", "summary", "new_entity", "existing_entity_link"],
    },
  },
} as const;
