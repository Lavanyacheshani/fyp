export type Database = {
  public: {
    Tables: {      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'Transporter' | 'Logistics Company' | 'Certifier' | 'Admin';
          status: 'active' | 'pending' | 'suspended';
          credits: number;
          join_date: string;
          avatar_url: string | null;
          permissions: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };      vehicles: {
        Row: {
          id: number;
          plate_number: string;
          model: string;
          capacity: number;
          transporter_id: number; // Changed from string to number
          status: 'active' | 'maintenance' | 'inactive';
          created_at: string;
          updated_at: string;
        };        Insert: {
          plate_number: string;
          model?: string | null;
          capacity?: number | null;
          transporter_id: number; // Changed from string to number
          status: 'active' | 'maintenance' | 'inactive';
        };
        Update: Partial<Database['public']['Tables']['vehicles']['Row']>;
      };
      containers: {
        Row: {
          id: number;
          name: string;
          location: string;
          status: 'active' | 'inactive' | 'warning';
          last_updated: string;
          assigned_to: string | null;
          vehicle_id: number | null;
          temperature: number;
          humidity: number;
          battery_level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['containers']['Row'], 'id' | 'created_at' | 'updated_at'> & { vehicle_id?: number | null };
        Update: Partial<Database['public']['Tables']['containers']['Row']>;
      };      shipments: {
        Row: {
          id: number;
          container_id: number;
          origin: string;
          destination: string;
          status: 'scheduled' | 'in-transit' | 'delivered' | 'delayed';
          departure_time: string;
          arrival_time: string;
          transporter_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shipments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['shipments']['Row']>;
      };
      environmental_metrics: {
        Row: {
          id: number;
          date: string;
          co2_saved: number;
          energy_saved: number;
          waste_reduced: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['environmental_metrics']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['environmental_metrics']['Row']>;
      };
      notifications: {
        Row: {
          id: string; // UUID
          type: string;
          message: string;
          link: string;
          entity_id: string;
          entity_type: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at' | 'is_read'> & { is_read?: boolean };
        Update: Partial<Database['public']['Tables']['notifications']['Row']>;
      };
      route_analytics: {
        Row: {
          id: number;
          route_name: string;
          origin: string; // PostgreSQL point type stored as string "(x,y)"
          destination: string; // PostgreSQL point type stored as string "(x,y)"
          total_shipments: number;
          delayed_shipments: number;
          avg_transit_time: string | null; // PostgreSQL interval type stored as string
          risk_level: 'low' | 'medium' | 'high' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['route_analytics']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['route_analytics']['Row']>;
      };
    };
  };
};