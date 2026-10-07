import Image from "next/image";
import Link from "next/link";
import { legacy } from "@/content/legacy";

const FRAME = ["bg-tomato", "bg-cobalt", "bg-sun", "bg-teal", "bg-pink", "bg-plum"];

export function Archive() {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {legacy.map((item, i) => (
        <li key={item.slug}>
          <Link href={`/archive/${item.slug}`} className="group block">
            <div
              className={`relative aspect-[4/3] overflow-hidden rounded-2xl p-2.5 transition-transform group-hover:-rotate-1 ${FRAME[i % FRAME.length]}`}
            >
              <div className="relative h-full w-full overflow-hidden rounded-xl bg-paper">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
                  className="object-contain"
                />
              </div>
              {item.href && (
                <span className="absolute right-4 bottom-4 rounded-full bg-ink px-2 py-0.5 font-mono text-[10px] tracking-wider text-paper uppercase">
                  ▶ Video
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="font-display text-lg leading-tight group-hover:italic">
                {item.title}
              </span>
              <span className="font-mono text-xs text-ink-soft">{item.date.slice(0, 4)}</span>
            </div>
            <p className="mt-1 text-sm leading-snug text-ink-soft">{item.blurb}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
