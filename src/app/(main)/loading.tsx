export default function MainLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
      {/* Hero skeleton */}
      <div className="mb-8 h-56 w-full animate-pulse rounded-2xl bg-white/5 sm:h-72" />

      {/* Row label */}
      <div className="mb-4 h-5 w-40 animate-pulse rounded bg-white/5" />

      {/* Card grid — khớp FilmCard (aspect 2/3) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg">
            <div className="aspect-[2/3] w-full animate-pulse rounded-lg bg-white/5" />
            <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-white/5" />
            <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  )
}
