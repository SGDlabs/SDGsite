
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "clients": {
                  Row: {
                    "cnpj_cpf": string | null,"contact_email": string | null,"created_at": string,"id": string,"name": string,"phone": string | null
                  }
                  Insert: {
                    "cnpj_cpf"?: string | null,"contact_email"?: string | null,"created_at"?: string,"id"?: string,"name": string,"phone"?: string | null
                  }
                  Update: {
                    "cnpj_cpf"?: string | null,"contact_email"?: string | null,"created_at"?: string,"id"?: string,"name"?: string,"phone"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"leads": {
                  Row: {
                    "company": string | null,"created_at": string,"email": string,"id": string,"message": string | null,"name": string,"phone": string | null,"service_interest": (string)[],"status": Database["public"]['Enums']["lead_status"]
                  }
                  Insert: {
                    "company"?: string | null,"created_at"?: string,"email": string,"id"?: string,"message"?: string | null,"name": string,"phone"?: string | null,"service_interest"?: (string)[],"status"?: Database["public"]['Enums']["lead_status"]
                  }
                  Update: {
                    "company"?: string | null,"created_at"?: string,"email"?: string,"id"?: string,"message"?: string | null,"name"?: string,"phone"?: string | null,"service_interest"?: (string)[],"status"?: Database["public"]['Enums']["lead_status"]
                  }
                  Relationships: [
                    
                  ]
                },"portfolio_items": {
                  Row: {
                    "body": string,"category": Database["public"]['Enums']["portfolio_category"],"cover_alt": string,"cover_path": string | null,"created_at": string,"featured": boolean,"gallery": NonNullable<Json>,"generative_cover": string | null,"id": string,"live_url": string | null,"pixel_art": boolean,"published": boolean,"slug": string,"sort_order": number,"stack": (string)[],"summary": string,"title": string,"updated_at": string
                  }
                  Insert: {
                    "body"?: string,"category": Database["public"]['Enums']["portfolio_category"],"cover_alt"?: string,"cover_path"?: string | null,"created_at"?: string,"featured"?: boolean,"gallery"?: NonNullable<Json>,"generative_cover"?: string | null,"id"?: string,"live_url"?: string | null,"pixel_art"?: boolean,"published"?: boolean,"slug": string,"sort_order"?: number,"stack"?: (string)[],"summary": string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string,"category"?: Database["public"]['Enums']["portfolio_category"],"cover_alt"?: string,"cover_path"?: string | null,"created_at"?: string,"featured"?: boolean,"gallery"?: NonNullable<Json>,"generative_cover"?: string | null,"id"?: string,"live_url"?: string | null,"pixel_art"?: boolean,"published"?: boolean,"slug"?: string,"sort_order"?: number,"stack"?: (string)[],"summary"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"client_id": string | null,"created_at": string,"full_name": string | null,"id": string,"role": Database["public"]['Enums']["user_role"]
                  }
                  Insert: {
                    "avatar_url"?: string | null,"client_id"?: string | null,"created_at"?: string,"full_name"?: string | null,"id": string,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Update: {
                    "avatar_url"?: string | null,"client_id"?: string | null,"created_at"?: string,"full_name"?: string | null,"id"?: string,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    }
                  ]
                },"project_stages": {
                  Row: {
                    "completed_at": string | null,"description": string | null,"id": string,"position": number,"project_id": string,"started_at": string | null,"status": Database["public"]['Enums']["stage_status"],"title": string
                  }
                  Insert: {
                    "completed_at"?: string | null,"description"?: string | null,"id"?: string,"position": number,"project_id": string,"started_at"?: string | null,"status"?: Database["public"]['Enums']["stage_status"],"title": string
                  }
                  Update: {
                    "completed_at"?: string | null,"description"?: string | null,"id"?: string,"position"?: number,"project_id"?: string,"started_at"?: string | null,"status"?: Database["public"]['Enums']["stage_status"],"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_stages_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_tokens": {
                  Row: {
                    "created_at": string,"id": string,"label": string,"last_used_at": string | null,"project_id": string,"revoked_at": string | null,"token_hash": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"label": string,"last_used_at"?: string | null,"project_id": string,"revoked_at"?: string | null,"token_hash": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"label"?: string,"last_used_at"?: string | null,"project_id"?: string,"revoked_at"?: string | null,"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_tokens_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_updates": {
                  Row: {
                    "author_id": string | null,"body": string | null,"created_at": string,"id": string,"kind": Database["public"]['Enums']["update_kind"],"project_id": string,"source": Database["public"]['Enums']["update_source"],"stage_id": string | null,"title": string
                  }
                  Insert: {
                    "author_id"?: string | null,"body"?: string | null,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["update_kind"],"project_id": string,"source"?: Database["public"]['Enums']["update_source"],"stage_id"?: string | null,"title": string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string | null,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["update_kind"],"project_id"?: string,"source"?: Database["public"]['Enums']["update_source"],"stage_id"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_updates_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_updates_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_updates_stage_id_fkey"
      columns: ["stage_id"]
isOneToOne: false
      referencedRelation: "project_stages"
      referencedColumns: ["id"]
    }
                  ]
                },"projects": {
                  Row: {
                    "client_id": string,"cover_path": string | null,"created_at": string,"current_stage_position": number,"due_at": string | null,"id": string,"name": string,"started_at": string | null,"status": Database["public"]['Enums']["project_status"],"type": Database["public"]['Enums']["project_type"],"updated_at": string
                  }
                  Insert: {
                    "client_id": string,"cover_path"?: string | null,"created_at"?: string,"current_stage_position"?: number,"due_at"?: string | null,"id"?: string,"name": string,"started_at"?: string | null,"status"?: Database["public"]['Enums']["project_status"],"type": Database["public"]['Enums']["project_type"],"updated_at"?: string
                  }
                  Update: {
                    "client_id"?: string,"cover_path"?: string | null,"created_at"?: string,"current_stage_position"?: number,"due_at"?: string | null,"id"?: string,"name"?: string,"started_at"?: string | null,"status"?: Database["public"]['Enums']["project_status"],"type"?: Database["public"]['Enums']["project_type"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "projects_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    }
                  ]
                },"update_media": {
                  Row: {
                    "created_at": string,"duration_s": number | null,"height": number | null,"id": string,"mime_type": string,"storage_path": string,"update_id": string,"width": number | null
                  }
                  Insert: {
                    "created_at"?: string,"duration_s"?: number | null,"height"?: number | null,"id"?: string,"mime_type": string,"storage_path": string,"update_id": string,"width"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"duration_s"?: number | null,"height"?: number | null,"id"?: string,"mime_type"?: string,"storage_path"?: string,"update_id"?: string,"width"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "update_media_update_id_fkey"
      columns: ["update_id"]
isOneToOne: false
      referencedRelation: "project_updates"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "advance_project_stage":
{ Args: { "p_project_id": string }; Returns: {
              "completed_at": string | null,
"description": string | null,
"id": string,
"position": number,
"project_id": string,
"started_at": string | null,
"status": Database["public"]['Enums']["stage_status"],
"title": string
            }
                          SetofOptions: {
        from: "*"
        to: "project_stages"
        isOneToOne: true
        isSetofReturn: false
      } },
"can_read_project":
{ Args: { "p_project_id": string }; Returns: boolean
                           },
"can_read_project_path":
{ Args: { "p_name": string }; Returns: boolean
                           },
"create_project_with_stages":
{ Args: { "p_client_id": string,"p_due_at"?: string,"p_name": string,"p_type": Database["public"]['Enums']["project_type"] }; Returns: {
              "client_id": string,
"cover_path": string | null,
"created_at": string,
"current_stage_position": number,
"due_at": string | null,
"id": string,
"name": string,
"started_at": string | null,
"status": Database["public"]['Enums']["project_status"],
"type": Database["public"]['Enums']["project_type"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "projects"
        isOneToOne: true
        isSetofReturn: false
      } },
"current_client_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"publish_integration_update":
{ Args: { "p_body"?: string,"p_id": string,"p_kind": Database["public"]['Enums']["update_kind"],"p_media"?: Json,"p_stage_position": number,"p_title": string,"p_token_id": string }; Returns: {
              "author_id": string | null,
"body": string | null,
"created_at": string,
"id": string,
"kind": Database["public"]['Enums']["update_kind"],
"project_id": string,
"source": Database["public"]['Enums']["update_source"],
"stage_id": string | null,
"title": string
            }
                          SetofOptions: {
        from: "*"
        to: "project_updates"
        isOneToOne: true
        isSetofReturn: false
      } },
"publish_project_update":
{ Args: { "p_body"?: string,"p_id": string,"p_kind": Database["public"]['Enums']["update_kind"],"p_media"?: Json,"p_project_id": string,"p_stage_id": string,"p_title": string }; Returns: {
              "author_id": string | null,
"body": string | null,
"created_at": string,
"id": string,
"kind": Database["public"]['Enums']["update_kind"],
"project_id": string,
"source": Database["public"]['Enums']["update_source"],
"stage_id": string | null,
"title": string
            }
                          SetofOptions: {
        from: "*"
        to: "project_updates"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            "lead_status": "novo"|"em_contato"|"fechado"|"perdido","portfolio_category": "site"|"app"|"sistema"|"integracao","project_status": "ativo"|"pausado"|"concluido","project_type": "site"|"app"|"sistema","stage_status": "pendente"|"em_andamento"|"concluida","update_kind": "nota"|"print"|"video"|"deploy"|"marco","update_source": "manual"|"api"|"github","user_role": "admin"|"client"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "lead_status": ["novo", "em_contato", "fechado", "perdido"],"portfolio_category": ["site", "app", "sistema", "integracao"],"project_status": ["ativo", "pausado", "concluido"],"project_type": ["site", "app", "sistema"],"stage_status": ["pendente", "em_andamento", "concluida"],"update_kind": ["nota", "print", "video", "deploy", "marco"],"update_source": ["manual", "api", "github"],"user_role": ["admin", "client"]
          }
        }
} as const
