'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Nút "Cài đặt ứng dụng" — hiện khi trình duyệt fire `beforeinstallprompt`
 * (PWA installable). Ẩn sau khi user cài hoặc bỏ qua. Manifest đã có sẵn.
 */
export default function PwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (!deferred || dismissed) return null

  async function install() {
    if (!deferred) return
    deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-xl border border-white/10 bg-carbon/95 px-4 py-2.5 shadow-xl backdrop-blur sm:left-auto sm:right-4 sm:translate-x-0">
      <Download size={18} className="shrink-0 text-acid-lime" />
      <span className="text-[13px] text-bone">Cài TonyFlix vào màn hình chính?</span>
      <button
        type="button"
        onClick={install}
        className="rounded-md bg-acid-lime px-3 py-1 text-[12px] font-semibold text-void transition-opacity hover:opacity-90"
      >
        Cài đặt
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Bỏ qua"
        className="text-ash hover:text-paper"
      >
        <X size={16} />
      </button>
    </div>
  )
}
