import type { Metadata } from "next";
import { AreaGrid } from "@/components/area-grid";

export const metadata: Metadata = {
  title: "Areas",
  description: "Fifteen areas of creative AI, each with a point of view and the work behind it.",
};

export default function AreasPage() {
  return (
    <div className="pt-10">
      <h1 className="font-display text-6xl leading-none tracking-tight sm:text-7xl">
        Areas
      </h1>
      <p className="mt-6 mb-14 max-w-2xl text-lg leading-relaxed text-muted">
        Fifteen disciplines of creative AI. Each has a one-line thesis on where
        it is going, and the work that tests it.
      </p>
      <AreaGrid />
    </div>
  );
}
