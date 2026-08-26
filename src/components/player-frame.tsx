'use client'

/**
 * Netflix-style player frame with ad blocking.
 *
 * The embed runs inside a sandboxed wrapper document:
 * - no `allow-popups`      → ad popups are silently dropped
 * - no `allow-top-navigation` → "click anywhere" redirects die
 * - `referrerPolicy=no-referrer` → embed cannot sniff the referring site
 * - inner CSP blocks <object>/<embed> plugin lures
 *
 * Playback (scripts, same-origin storage, fullscreen, presentation) stays intact.
 */

const WRAPPER_HEAD =
  '<!DOCTYPE html><html><head><meta charset="utf-8">' +
  '<meta http-equiv="Content-Security-Policy" content="object-src \'none\'; base-uri \'none\'">' +
  '<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}' +
  'iframe{width:100%;height:100%;border:0}</style></head><body>'

export default function PlayerFrame({ src, title }: { src: string; title: string }) {
  const inner =
    `<iframe src="${src.replace(/"/g, '&quot;')}" allowfullscreen ` +
    'allow="autoplay; fullscreen; encrypted-media; picture-in-picture" ' +
    'referrerpolicy="no-referrer" ' +
    'sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"></iframe>'

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <iframe
        key={src}
        srcDoc={`${WRAPPER_HEAD}${inner}</body></html>`}
        title={title}
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  )
}
