import axios from 'axios'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { api, ensureCsrfCookie } from '../../lib/api'

type DeviceRow = {
  id: number
  name: string
  provider_device_id: string
  phone_label: string | null
  is_active: boolean
}

const emptyForm = {
  name: '',
  provider_device_id: '',
  phone_label: '',
  is_active: true,
}

export function WhatsappDevicesPage() {
  const [devices, setDevices] = useState<DeviceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<DeviceRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const { data } = await api.get<{ data: DeviceRow[] }>('/api/whatsapp-devices')
      setDevices(data.data)
    } catch {
      setError('Gagal memuat daftar device WhatsApp.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function startCreate() {
    setEditing(null)
    setForm(emptyForm)
  }

  function startEdit(device: DeviceRow) {
    setEditing(device)
    setForm({
      name: device.name,
      provider_device_id: device.provider_device_id,
      phone_label: device.phone_label ?? '',
      is_active: device.is_active,
    })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await ensureCsrfCookie()
      const payload = {
        name: form.name,
        provider_device_id: form.provider_device_id,
        phone_label: form.phone_label || null,
        is_active: form.is_active,
      }
      if (editing) {
        await api.put(`/api/whatsapp-devices/${editing.id}`, payload)
      } else {
        await api.post('/api/whatsapp-devices', payload)
      }
      startCreate()
      await load()
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(String(err.response.data.message))
      } else {
        setError('Gagal menyimpan device.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(device: DeviceRow) {
    setError(null)
    try {
      await ensureCsrfCookie()
      await api.patch(`/api/whatsapp-devices/${device.id}`, {
        is_active: !device.is_active,
      })
      await load()
    } catch {
      setError('Gagal mengubah status device.')
    }
  }

  async function remove(device: DeviceRow) {
    if (!window.confirm(`Hapus device "${device.name}"?`)) return
    setError(null)
    try {
      await ensureCsrfCookie()
      await api.delete(`/api/whatsapp-devices/${device.id}`)
      await load()
      if (editing?.id === device.id) startCreate()
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        setError(
          String(
            err.response.data?.message ??
              'Device masih dipakai. Nonaktifkan saja.',
          ),
        )
      } else {
        setError('Gagal menghapus device.')
      }
    }
  }

  if (loading) {
    return <div className="text-stone-600">Memuat device…</div>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-black">
          WhatsApp Devices
        </h1>
        <p className="text-sm text-stone-600">
          Daftarkan device FlowKirim. Isi <span className="font-medium">Provider
          device ID</span> dengan <span className="font-mono text-xs">session_id</span> dari
          dashboard scan.flowkirim.com. Token API tetap di server (.env).
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-black">
            {editing ? 'Ubah device' : 'Device baru'}
          </h2>
          {editing ? (
            <button
              type="button"
              className="text-xs font-medium text-stone-600 hover:text-stone-900"
              onClick={startCreate}
            >
              Buat baru
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-stone-600">Nama</label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-rose-200 focus:ring-2"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="WA Panitia 1"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600">
              Provider device ID
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-rose-200 focus:ring-2"
              value={form.provider_device_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, provider_device_id: e.target.value }))
              }
              placeholder="session_id dari dashboard FlowKirim"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600">
              Label nomor (opsional)
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 outline-none ring-rose-200 focus:ring-2"
              value={form.phone_label}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone_label: e.target.value }))
              }
              placeholder="0812…"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_active: e.target.checked }))
                }
              />
              Aktif
            </label>
          </div>
        </div>
        <div className="mt-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {saving ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Tambah device'}
          </button>
        </div>
      </form>

      {error ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Provider ID</th>
              <th className="hidden px-4 py-3 sm:table-cell">Nomor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {devices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  Belum ada device.
                </td>
              </tr>
            ) : null}
            {devices.map((d) => (
              <tr key={d.id} className="hover:bg-stone-50/80">
                <td className="px-4 py-3 font-medium text-stone-900">{d.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-stone-600">
                  {d.provider_device_id}
                </td>
                <td className="hidden px-4 py-3 text-stone-600 sm:table-cell">
                  {d.phone_label ?? '—'}
                </td>
                <td className="px-4 py-3">
                  {d.is_active ? (
                    <span className="text-emerald-700">Aktif</span>
                  ) : (
                    <span className="text-stone-500">Nonaktif</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-stone-200 px-3 py-1 text-xs text-stone-700 hover:bg-stone-50"
                      onClick={() => startEdit(d)}
                    >
                      Ubah
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-stone-200 px-3 py-1 text-xs text-stone-700 hover:bg-stone-50"
                      onClick={() => void toggleActive(d)}
                    >
                      {d.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                      onClick={() => void remove(d)}
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
