export default function PhimLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-8 pt-6 sm:pb-10">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6 sm:text-left">
        {/* Poster */}
        <div className="aspect-[2/3] w-32 shrink-0 animate-pulse rounded-lg bg-white/5 sm:w-48" />
        {/* Meta */}
        <div className="min-w-0 flex-1">
          <div className="mx-auto h-7 w-2/3 animate-pulse rounded bg-white/5 sm:mx-0 sm:w-1/2" />
          <div className="mx-auto mt-3 h-4 w-1/2 animate-pulse rounded bg-white/5 sm:mx-0" />
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 w-16 animate-pulse rounded bg-white/5" />
            ))}
          </div>
          <div className="mt-5 flex justify-center gap-2.5 sm:justify-start">
            <div className="h-10 w-36 animate-pulse rounded-md bg-white/5" />
            <div className="h-10 w-24 animate-pulse rounded-md bg-white/5" />
          </div>
        </div>
      </div>

      {/* Episodes */}
      <div className="mt-8">
        <div className="mb-3 h-5 w-40 animate-pulse rounded bg-white/5" />
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-md bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  )
}
