import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Plus, Save, Trash2, Upload, Users } from 'lucide-react';
import type { PortalCompetitionTeam } from '@shared/portalCompetencias';
import { Button } from '../components/ui/Button';
import { PortalCompetenciasGrid } from '../components/portal/PortalCompetenciasGrid';

const getAuthToken = () => {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
  if (match?.[1]) return decodeURIComponent(match[1]);
  if (typeof window !== 'undefined') return window.localStorage.getItem('auth_token') || '';
  return '';
};

type EditableMember = { id?: number; name: string; photo_url?: string | null; photo_key?: string | null; sort_order: number };
type EditableGallery = { id?: number; image_url: string; image_key?: string | null; sort_order: number };
type EditableTeam = {
  id?: number;
  name: string;
  main_image_url?: string | null;
  main_image_key?: string | null;
  achievements?: string | null;
  is_active: boolean;
  is_visible: boolean;
  sort_order: number;
  members: EditableMember[];
  gallery: EditableGallery[];
};

const emptyTeam = (): EditableTeam => ({
  name: '',
  main_image_url: null,
  main_image_key: null,
  achievements: '',
  is_active: true,
  is_visible: true,
  sort_order: 0,
  members: [],
  gallery: [],
});

async function uploadImage(file: File, kind: 'team-main' | 'member' | 'gallery') {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('kind', kind);
  const response = await fetch('/api/admin/portal-competencias/upload-image', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  const json = await response.json();
  if (!response.ok || !json.success) throw new Error(json.error || 'No se pudo subir la imagen');
  return json.image as { url: string; key: string };
}

export default function AdminPortalCompetencias() {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [teams, setTeams] = useState<PortalCompetitionTeam[]>([]);
  const [editingTeam, setEditingTeam] = useState<EditableTeam>(emptyTeam());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTeam = useMemo(
    () => (teamId ? teams.find((team) => String(team.id) === teamId) : undefined),
    [teams, teamId],
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        const response = await fetch('/api/admin/portal-competencias/teams', {
          cache: 'no-store',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json.error || 'No se pudieron cargar los equipos');
        if (active) setTeams(json.teams || []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Error cargando equipos');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      setEditingTeam({
        id: selectedTeam.id,
        name: selectedTeam.name,
        main_image_url: selectedTeam.main_image_url || null,
        main_image_key: selectedTeam.main_image_key || null,
        achievements: selectedTeam.achievements || '',
        is_active: selectedTeam.is_active,
        is_visible: selectedTeam.is_visible,
        sort_order: selectedTeam.sort_order,
        members: selectedTeam.members.map((m) => ({ ...m })),
        gallery: selectedTeam.gallery.map((g) => ({ ...g })),
      });
    } else {
      setEditingTeam(emptyTeam());
    }
  }, [selectedTeam]);

  const saveTeam = async () => {
    try {
      setSaving(true);
      setError(null);
      if (!editingTeam.name.trim()) throw new Error('No se puede crear un equipo sin nombre');
      if (editingTeam.gallery.length > 5) throw new Error('Máximo 5 imágenes en la galería');
      const token = getAuthToken();
      const method = editingTeam.id ? 'PUT' : 'POST';
      const url = editingTeam.id ? `/api/admin/portal-competencias/teams/${editingTeam.id}` : '/api/admin/portal-competencias/teams';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(editingTeam),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'No se pudo guardar el equipo');
      const saved = json.team as PortalCompetitionTeam;
      setTeams((current) => {
        const exists = current.some((team) => team.id === saved.id);
        return exists ? current.map((team) => (team.id === saved.id ? saved : team)) : [...current, saved];
      });
      navigate(`/panel-admin/portal-del-socio/competencias/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando equipo');
    } finally {
      setSaving(false);
    }
  };

  const deleteTeam = async () => {
    if (!editingTeam.id) return;
    if (!window.confirm('¿Eliminar este equipo?')) return;
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/admin/portal-competencias/teams/${editingTeam.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || 'No se pudo eliminar el equipo');
      setTeams((current) => current.filter((team) => team.id !== editingTeam.id));
      navigate('/panel-admin/portal-del-socio/competencias');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando equipo');
    }
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link to="/panel-admin/portal-del-socio" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft className="h-4 w-4" /> Volver al Portal del Socio</Link>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Competencias</h1>
            <p className="mt-2 text-sm leading-7 text-gray-600">Gestiona equipos, integrantes, logros y galería pública del módulo de competencias.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/panel-admin/portal-del-socio/competencias')}>Nuevo equipo</Button>
            <Button className="bg-red-600 text-white" onClick={saveTeam} disabled={saving}>{saving ? 'Guardando…' : 'Guardar equipo'}</Button>
          </div>
        </div>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="grid gap-6 xl:grid-cols-[1.05fr_1.2fr]">
          <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Galería de equipos</h2>
              <Button variant="outline" onClick={() => navigate('/panel-admin/portal-del-socio/competencias')}><Plus className="mr-2 h-4 w-4" /> Crear equipo</Button>
            </div>
            {loading ? <div className="text-sm text-gray-600">Cargando equipos…</div> : <PortalCompetenciasGrid teams={teams} basePath="/panel-admin/portal-del-socio/competencias" pathField="id" emptyMessage="Aún no hay equipos creados." />}
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
                <div>
                  <div className="aspect-square overflow-hidden rounded-3xl border border-gray-200 bg-gray-50">
                    {editingTeam.main_image_url ? (
                      <img src={editingTeam.main_image_url} alt={editingTeam.name || 'Equipo'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300"><Users className="h-12 w-12" /></div>
                    )}
                  </div>
                  <label className="mt-3 inline-flex cursor-pointer items-center rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
                    <Upload className="mr-2 h-4 w-4" /> Imagen principal
                    <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const image = await uploadImage(file, 'team-main');
                      setEditingTeam((current) => ({ ...current, main_image_url: image.url, main_image_key: image.key }));
                    }} />
                  </label>
                  <p className="mt-2 text-xs text-gray-500">Formato recomendado 800x800, visual cuadrado 500x500.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">Nombre del equipo</label>
                    <input value={editingTeam.name} onChange={(e) => setEditingTeam((c) => ({ ...c, name: e.target.value }))} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex items-start gap-3 rounded-2xl border border-gray-200 p-4"><input type="checkbox" checked={editingTeam.is_active} onChange={(e) => setEditingTeam((c) => ({ ...c, is_active: e.target.checked }))} className="mt-1" /><span><span className="block text-sm font-medium text-gray-900">Equipo activo</span><span className="block text-xs text-gray-500 mt-1">Controla el estado interno.</span></span></label>
                    <label className="flex items-start gap-3 rounded-2xl border border-gray-200 p-4"><input type="checkbox" checked={editingTeam.is_visible} onChange={(e) => setEditingTeam((c) => ({ ...c, is_visible: e.target.checked }))} className="mt-1" /><span><span className="block text-sm font-medium text-gray-900">Visible en portal</span><span className="block text-xs text-gray-500 mt-1">Solo visibles y activos se publican.</span></span></label>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">Logros</label>
                <textarea value={editingTeam.achievements || ''} onChange={(e) => setEditingTeam((c) => ({ ...c, achievements: e.target.value }))} rows={5} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm leading-7 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Integrantes</h3>
                  <Button variant="outline" onClick={() => setEditingTeam((c) => ({ ...c, members: [...c.members, { name: '', sort_order: c.members.length }] }))}><Plus className="mr-2 h-4 w-4" /> Agregar integrante</Button>
                </div>
                <div className="space-y-3">
                  {editingTeam.members.map((member, index) => (
                    <div key={`${member.id || 'new'}-${index}`} className="grid gap-3 rounded-2xl border border-gray-200 p-4 lg:grid-cols-[90px_minmax(0,1fr)_auto] lg:items-center">
                      <div className="aspect-square overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                        {member.photo_url ? <img src={member.photo_url} alt={member.name || 'Integrante'} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-gray-300"><Users className="h-6 w-6" /></div>}
                      </div>
                      <div className="space-y-2">
                        <input value={member.name} onChange={(e) => setEditingTeam((c) => ({ ...c, members: c.members.map((m, i) => i === index ? { ...m, name: e.target.value } : m) }))} placeholder="Nombre del integrante" className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100" />
                        <label className="inline-flex cursor-pointer items-center rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
                          <Upload className="mr-2 h-4 w-4" /> Foto
                          <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const image = await uploadImage(file, 'member');
                            setEditingTeam((c) => ({ ...c, members: c.members.map((m, i) => i === index ? { ...m, photo_url: image.url, photo_key: image.key } : m) }));
                          }} />
                        </label>
                      </div>
                      <button type="button" onClick={() => setEditingTeam((c) => ({ ...c, members: c.members.filter((_, i) => i !== index) }))} className="inline-flex items-center rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</button>
                    </div>
                  ))}
                  {editingTeam.members.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center text-sm text-gray-500">Aún no hay integrantes cargados.</div> : null}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Galería del equipo</h3>
                  <label className={`inline-flex cursor-pointer items-center rounded-xl px-3 py-2 text-sm font-medium ${editingTeam.gallery.length >= 5 ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    <Upload className="mr-2 h-4 w-4" /> Agregar imagen
                    <input disabled={editingTeam.gallery.length >= 5} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (editingTeam.gallery.length >= 5) return;
                      const image = await uploadImage(file, 'gallery');
                      setEditingTeam((c) => ({ ...c, gallery: [...c.gallery, { image_url: image.url, image_key: image.key, sort_order: c.gallery.length }] }));
                    }} />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {editingTeam.gallery.map((image, index) => (
                    <div key={`${image.id || 'new'}-${index}`} className="rounded-2xl border border-gray-200 p-3">
                      <div className="aspect-square overflow-hidden rounded-2xl bg-gray-50"><img src={image.image_url} alt={`Galería ${index + 1}`} className="h-full w-full object-cover" /></div>
                      <button type="button" onClick={() => setEditingTeam((c) => ({ ...c, gallery: c.gallery.filter((_, i) => i !== index) }))} className="mt-3 inline-flex items-center rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"><Trash2 className="mr-2 h-4 w-4" /> Quitar</button>
                    </div>
                  ))}
                  {editingTeam.gallery.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center text-sm text-gray-500 sm:col-span-2 xl:col-span-3">Puedes subir hasta 5 imágenes adicionales.</div> : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-4">
                {editingTeam.is_visible ? <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"><Eye className="mr-1 h-3.5 w-3.5" /> Visible</span> : <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"><EyeOff className="mr-1 h-3.5 w-3.5" /> Oculto</span>}
                {editingTeam.id ? <Button variant="outline" onClick={deleteTeam}><Trash2 className="mr-2 h-4 w-4" /> Eliminar equipo</Button> : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
