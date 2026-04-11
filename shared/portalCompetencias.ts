export interface PortalCompetitionTeamMember {
  id: number;
  team_id: number;
  name: string;
  photo_url?: string | null;
  photo_key?: string | null;
  sort_order: number;
}

export interface PortalCompetitionTeamGalleryImage {
  id: number;
  team_id: number;
  image_url: string;
  image_key?: string | null;
  sort_order: number;
}

export interface PortalCompetitionTeam {
  id: number;
  slug: string;
  name: string;
  main_image_url?: string | null;
  main_image_key?: string | null;
  achievements?: string | null;
  is_active: boolean;
  is_visible: boolean;
  sort_order: number;
  members: PortalCompetitionTeamMember[];
  gallery: PortalCompetitionTeamGalleryImage[];
  created_at?: string;
  updated_at?: string;
}
