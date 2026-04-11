export interface PortalDocument {
  id: number;
  section_key: 'documentos';
  file_name: string;
  visible_name: string;
  file_url: string;
  file_key?: string | null;
  file_type: string;
  file_size?: number | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}
