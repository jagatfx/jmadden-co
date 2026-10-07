import Image from "next/image";
import type { Media } from "@/content/types";

const BARS = [0.2, 0.55, 0.35, 0.8, 0.5, 1, 0.65, 0.4, 0.9, 0.3, 0.6, 0.45];

function SignalPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-[radial-gradient(ellipse_at_center,var(--accent-dim),transparent_70%)]">
      <div className="flex h-12 items-end gap-1.5" aria-hidden>
        {BARS.map((h, i) => (
          <span
            key={i}
            className="signal-bar block w-1 rounded-full bg-accent"
            style={{ height: `${h * 100}%`, animationDelay: `${i * 0.11}s` }}
          />
        ))}
      </div>
      <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
        {label}
      </p>
    </div>
  );
}

export function MediaFrame({
  media,
  ratio = "cinema",
  priority = false,
}: {
  media: Media;
  ratio?: "cinema" | "video";
  priority?: boolean;
}) {
  const aspect = ratio === "cinema" ? "aspect-[2.39/1]" : "aspect-video";

  return (
    <figure>
      <div
        className={`${aspect} relative w-full overflow-hidden rounded-lg border border-line bg-bg-raised`}
      >
        {media.kind === "video" && (
          <video
            className="h-full w-full object-cover"
            src={media.src}
            poster={media.poster}
            autoPlay
            muted
            loop
            playsInline
          />
        )}
        {media.kind === "image" && (
          <Image
            src={media.src}
            alt={media.alt}
            fill
            priority={priority}
            className="object-cover"
            sizes="(min-width: 1024px) 1024px, 100vw"
          />
        )}
        {media.kind === "embed" && (
          <iframe
            className="h-full w-full"
            src={media.src}
            title={media.title}
            allow="autoplay; fullscreen; microphone"
          />
        )}
        {media.kind === "placeholder" && <SignalPlaceholder label={media.label} />}
      </div>
      {"caption" in media && media.caption && (
        <figcaption className="mt-2 text-sm text-muted">{media.caption}</figcaption>
      )}
    </figure>
  );
}
