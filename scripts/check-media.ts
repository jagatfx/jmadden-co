/**
 * Fails the build if any file under public/ is still a Git LFS pointer, so a
 * deploy that skipped `git lfs pull` breaks loudly instead of shipping broken
 * images and audio. Run with: bun run check-media
 */
import { openSync, readSync, readdirSync, closeSync } from "node:fs";
import { join } from "node:path";

const POINTER = "version https://git-lfs";

function* files(dir: string): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* files(p);
    else yield p;
  }
}

const head = Buffer.alloc(POINTER.length);
const pointers: string[] = [];
for (const f of files(join(process.cwd(), "public"))) {
  const fd = openSync(f, "r");
  const n = readSync(fd, head, 0, head.length, 0);
  closeSync(fd);
  if (n === head.length && head.toString() === POINTER) pointers.push(f);
}

if (pointers.length) {
  console.error(
    `${pointers.length} file(s) in public/ are Git LFS pointers, not media. Run \`git lfs pull\`.\n` +
      pointers.map((p) => `  ${p}`).join("\n"),
  );
  process.exit(1);
}
console.log("Media check passed: no LFS pointers in public/.");
