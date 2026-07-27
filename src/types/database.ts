/**
 * Tipos del esquema de Supabase (supabase/migrations/0001_init.sql).
 *
 * Escritos a mano para que el repo no dependa de un paso de generación. Si el
 * esquema cambia, se pueden regenerar con:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          bio?: string | null;
        };
        Update: {
          username?: string;
          avatar_url?: string | null;
          bio?: string | null;
        };
        Relationships: [];
      };
      coins: {
        Row: {
          id: string;
          slug: string;
          symbol: string;
          name: string;
          accent: string;
          accent_ink: string | null;
          tagline: string | null;
          blurb: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          symbol: string;
          name: string;
          accent: string;
          accent_ink?: string | null;
          tagline?: string | null;
          blurb?: string | null;
          sort_order?: number;
        };
        Update: {
          slug?: string;
          symbol?: string;
          name?: string;
          accent?: string;
          accent_ink?: string | null;
          tagline?: string | null;
          blurb?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          coin_id: string;
          user_id: string;
          parent_id: string | null;
          body: string;
          like_count: number;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coin_id: string;
          user_id: string;
          parent_id?: string | null;
          body: string;
        };
        Update: {
          body?: string;
          is_deleted?: boolean;
        };
        Relationships: [];
      };
      comment_likes: {
        Row: {
          comment_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          comment_id: string;
          user_id: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type CoinRow = Database["public"]["Tables"]["coins"]["Row"];
export type CommentRow = Database["public"]["Tables"]["comments"]["Row"];

/** Comentario tal y como lo consume la UI: con autor resuelto y estado de like. */
export type ThreadComment = {
  id: string;
  body: string;
  createdAt: string;
  likeCount: number;
  isDeleted: boolean;
  parentId: string | null;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  } | null;
  /** El usuario de la request ya le dio like */
  likedByMe: boolean;
  /** El usuario de la request es el autor */
  isMine: boolean;
  replies: ThreadComment[];
};
