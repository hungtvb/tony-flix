import type { Metadata } from 'next'
import PublicFavorites from '@/components/public-favorites'

export async function generateMetadata({ params }: { params: Promise<{ user: string }> }): Promise<Metadata> {
  const { user } = await params
  return { title: `Phim yêu thích của @${user}` }
}

export default async function UserFavoritesPage({ params }: { params: Promise<{ user: string }> }) {
  const { user } = await params
  return (
    <div className="mx-auto max-w-6xl pb-16">
      <h1 className="px-4 pt-6 text-[22px] font-bold tracking-tight text-paper sm:px-0 sm:pt-8 sm:text-3xl">
        Phim yêu thích của @{user}
      </h1>
      <PublicFavorites user={user} />
    </div>
  )
}
