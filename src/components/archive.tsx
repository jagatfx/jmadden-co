import Image from "next/image";
import { legacy } from "@/content/legacy";

const WASH = ["bg-tomato", "bg-cobalt", "bg-sun", "bg-teal", "bg-pink", "bg-plum"];

export function Archive() {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {legacy.map((item, i) => {
        const body = (
          <>
            <div className={`duotone relative aspect-[4/3] overflow-hidden rounded-2xl ${WASH[i % WASH.length]}`}>
              <Image
                src={item.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
              {item.href && (
                <span className="absolute right-2 bottom-2 rounded-full bg-paper px-2 py-0.5 font-mono text-[10px] tracking-wider text-ink uppercase">
                  Watch
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="font-display text-lg leading-tight">{item.title}</span>
              <span className="font-mono text-xs text-ink-soft">{item.date.slice(0, 4)}</span>
            </div>
            <p className="mt-1 text-sm leading-snug text-ink-soft">{item.blurb}</p>
          </>
        );
        return (
          <li key={item.title}>
            {item.href ? (
              <a href={item.href} className="group block">
                {body}
              </a>
            ) : (
              <div className="duotone-static">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
