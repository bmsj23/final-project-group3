export type AppRole = 'admin' | 'user';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type ProfileRecord = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: AppRole;
  is_suspended: boolean;
  expo_push_token: string | null;
  created_at: string;
  updated_at: string;
};

export type CategoryRecord = {
  id: string;
  name: string;
  icon_name: string;
  display_order: number;
  created_at: string;
};

export type EventRecord = {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  date_time: string;
  location: string;
  capacity: number;
  category_id: string;
  cover_image_url: string | null;
  tags: string[];
  registration_deadline: string;
  status: EventStatus;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRecord;
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: AppRole;
          is_suspended?: boolean;
          expo_push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: AppRole;
          is_suspended?: boolean;
          expo_push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: CategoryRecord;
        Insert: {
          id?: string;
          name: string;
          icon_name: string;
          display_order: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon_name?: string;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: EventRecord;
        Insert: {
          id?: string;
          organizer_id: string;
          title: string;
          description: string;
          date_time: string;
          location: string;
          capacity: number;
          category_id: string;
          cover_image_url?: string | null;
          tags?: string[];
          registration_deadline: string;
          status?: EventStatus;
          is_flagged?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organizer_id?: string;
          title?: string;
          description?: string;
          date_time?: string;
          location?: string;
          capacity?: number;
          category_id?: string;
          cover_image_url?: string | null;
          tags?: string[];
          registration_deadline?: string;
          status?: EventStatus;
          is_flagged?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      app_role: AppRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
