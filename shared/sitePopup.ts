export interface SitePopupConfig {
  id: number;
  image_url: string;
  link_url?: string | null;
  open_in_new_tab: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
