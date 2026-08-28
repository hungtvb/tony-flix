'use client'

import { useEffect, useState, useCallback } from 'react'
import { Star, Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react'

interface CuratedRow {
  filmSlug: string
  title: string
  poster: string
  note: string
  position: number
}

export default function CuratedManager() {
  const [items, setItems] = useState<CuratedRow[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // form thêm mới
  const [slug, setSlug] = useState('')
  const [note, setNote] = useState('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setError('')
    const res = await fetch('/api/admin/curated')
    if (!res.ok) {
      setError('Không tải được danh sách Editor’s picks.')
      return
    }
    const body = await res.json()
    setItems(body.films ?? [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function onAdd() {
    const s = slug.trim()
    if (!s) {
      setError('Nhập slug phim (VD: nguoi-nhen-khong-con-nha).')
      return
    }
    setAdding(true)
    setError('')
    try {
      const res = await fetch('/api/admin/curated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: s, note: note.trim() }),
      })
      if (res.ok) {
        setSlug('')
        setNote('')
        await load()
      } else {
        const b = await res.json().catch(() => ({}))
        setError(b.error === 'unauthenticated' || b.error === 'forbidden'
          ? 'Bạn không có quyền.'
          : (b.error ?? 'Thêm thất bại.'))
      }
    } finally {
      setAdding(false)
    }
  }

  async function onRemove(s: string) {
    if (!confirm(`Xoá "${s}" khỏi Editor’s picks?`)) return
    setBusy(true)
    const res = await fetch(`/api/admin/curated?slug=${encodeURIComponent(s)}`, { method: 'DELETE' })
    setBusy(false)
    if (res.ok) {
      setItems((prev) => prev.filter((f) => f.filmSlug !== s))
    } else {
      alert('Xoá thất bại.')
    }
  }

  // Đẩy lên / xuống 1 bậc bằng cách swap position với hàng kề.
  async function onMove(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const a = items[index]
    const b = items[target]
    const newItems = items.slice()
    const pa = a.position
    newItems[index] = { ...a, position: b.position }
    newItems[target] = { ...b, position: pa }
    // re-sort theo position rồi reassign tuần tự để không bị trùng
    newItems.sort((x, y) => x.position - y.position)
    newItems.forEach((it, i) => (it.position = i))
    setItems(newItems)
    setBusy(true)
    await Promise.all(
      newItems.map((it) =>
        fetch('/api/admin/curated', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: it.filmSlug, note: it.note, position: it.position }),
        }),
      ),
    )
    setBusy(false)
  }

  return (
    <div>
      {/* Form thêm */}
      <div className="mb-6 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-mist">Slug phim</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="VD: nguoi-nhen-khong-con-nha"
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-bone outline-none focus:border-acid-lime"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-mist">Ghi chú (tuỳ chọn)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: Bom tấn tuần này"
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-bone outline-none focus:border-acid-lime"
          />
        </div>
        <button
          onClick={onAdd}
          disabled={adding || busy}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-acid-lime px-4 text-sm font-semibold text-void transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={16} strokeWidth={2.5} /> Thêm
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-mist/60">
          Chưa có phim nổi bật nào. Thêm slug phim ở trên.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-mist">
              <tr>
                <th className="w-12 px-3 py-3 font-medium text-center">#</th>
                <th className="px-4 py-3 font-medium">Phim</th>
                <th className="px-4 py-3 font-medium">Ghi chú</th>
                <th className="w-28 px-3 py-3 font-medium text-center">Thứ tự</th>
                <th className="w-20 px-3 py-3 font-medium text-right">Xoá</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f, i) => (
                <tr key={f.filmSlug} className="border-t border-white/5">
                  <td className="px-3 py-3 text-center text-mist">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {f.poster ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.poster}
                          alt={f.title}
                          className="h-14 w-10 shrink-0 rounded object-cover ring-1 ring-white/10"
                        />
                      ) : (
                        <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded bg-white/5 text-acid-lime">
                          <Star size={16} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-bone">{f.title}</p>
                        <p className="truncate text-xs text-mist/70">{f.filmSlug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-mist">{f.note || '—'}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        disabled={busy || i === 0}
                        onClick={() => onMove(i, -1)}
                        className="rounded border border-white/10 p-1 text-bone transition-colors hover:border-acid-lime/50 disabled:opacity-30"
                        aria-label="Lên"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        disabled={busy || i === items.length - 1}
                        onClick={() => onMove(i, 1)}
                        className="rounded border border-white/10 p-1 text-bone transition-colors hover:border-acid-lime/50 disabled:opacity-30"
                        aria-label="Xuống"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      disabled={busy}
                      onClick={() => onRemove(f.filmSlug)}
                      className="rounded-md border border-red-500/30 p-1.5 text-red-300 transition-colors hover:border-red-500 disabled:opacity-40"
                      aria-label="Xoá"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
