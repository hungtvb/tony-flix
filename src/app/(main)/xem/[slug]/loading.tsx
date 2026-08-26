export default function XemLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
      {/* Player frame */}
      <div className="aspect-video w-full animate-pulse rounded-xl bg-white/5" />
      {/* Title + controls */}
      <div className="mt-4 h-6 w-1/2 animate-pulse rounded bg-white/5" />
      <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-white/5" />
      <div className="mt-5 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-14 animate-pulse rounded-md bg-white/5" />
        ))}
      </div>
    </div>
  )
}
