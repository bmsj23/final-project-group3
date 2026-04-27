export type AppRole = 'admin' | 'user';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';

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

export type EventFavoriteRecord = {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
};

export type BookingRecord = {
  id: string;
  user_id: string;
  event_id: string;
  ticket_count: number;
  status: BookingStatus;
  qr_payload: string;
  created_at: string;
  updated_at: string;
};

export type FetchMyBookingsRow = {
  booking_id: string;
  event_id: string;
  user_id: string;
  ticket_count: number;
  status: BookingStatus;
  computed_status: BookingStatus;
  qr_payload: string;
  booking_created_at: string;
  booking_updated_at: string;
  event_title: string;
  event_location: string;
  event_date_time: string;
  event_registration_deadline: string;
  event_capacity: number;
  event_cover_image_url: string | null;
  event_status: EventStatus;
  organizer_id: string;
  organizer_name: string | null;
  organizer_avatar_url: string | null;
  confirmed_tickets: number;
  remaining_slots: number;
};

export type EventRemainingSlotsRow = {
  event_id: string;
  confirmed_tickets: number;
  remaining_slots: number;
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
      event_favorites: {
        Row: EventFavoriteRecord;
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: BookingRecord;
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          ticket_count: number;
          status?: BookingStatus;
          qr_payload: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          ticket_count?: number;
          status?: BookingStatus;
          qr_payload?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      cancel_booking: {
        Args: {
          p_booking_id: string;
        };
        Returns: BookingRecord;
      };
      fetch_event_remaining_slots: {
        Args: {
          p_event_ids: string[];
        };
        Returns: EventRemainingSlotsRow[];
      };
      fetch_my_bookings: {
        Args: Record<string, never>;
        Returns: FetchMyBookingsRow[];
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      register_for_event: {
        Args: {
          p_event_id: string;
          p_ticket_count: number;
        };
        Returns: BookingRecord;
      };
      update_booking_tickets: {
        Args: {
          p_booking_id: string;
          p_ticket_count: number;
        };
        Returns: BookingRecord;
      };
    };
    Enums: {
      app_role: AppRole;
      booking_status: BookingStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
