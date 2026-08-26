/**
 * Player frame — plain direct embed (verified working configuration).
 * No sandbox wrapper: the upstream embed breaks under sandboxing,
 * so playback takes priority over ad hardening here.
 */
export default function PlayerFrame({ src, title }: { src: string; title: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <iframe
        key={src}
        src={src}
        title={title}
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        referrerPolicy="origin"
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  )
}
