'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { log } from '@/lib/logger'

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    log.error('page_error', { message: error.message, digest: error.digest })
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 pt-20 text-center">
      <p className="text-[64px] font-extrabold tracking-tight text-acid-lime">Lỗi</p>
      <h1 className="-mt-2 text-[22px] font-semibold tracking-tight text-paper">
        Có gì đó không ổn
      </h1>
      <p className="max-w-sm text-[14px] text-mist">
        Trang này gặp lỗi khi tải. Thử lại hoặc về trang chủ.
      </p>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center rounded-md bg-acid-lime px-5 text-[14px] font-medium text-void transition-opacity hover:opacity-90"
        >
          Thử lại
        </button>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md border border-graphite px-5 text-[14px] font-medium text-mist transition-colors hover:text-paper"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
