import type { Metadata } from "next";
import { DinnerPartyStage } from "@/components/dinner-party/stage";

export const metadata: Metadata = {
  title: "Dinner Party: look test",
  description:
    "Trip and Grace, rigged and lit in the browser. A first look before the full film.",
  robots: { index: false, follow: false },
};

export default function DinnerPartyLookTest() {
  return (
    <section className="px-4 py-10 sm:px-8">
      <DinnerPartyStage />
      <div className="mx-auto mt-8 max-w-3xl space-y-3 text-sm opacity-80">
        <p>
          Look test for <em>Dinner Party</em>. You arrive for drinks at Trip and
          Grace&apos;s. Trip asks what you&apos;re having: answer out loud or
          type it, and they react.
        </p>
        <p>
          Everything here runs live in the browser: two rigged characters with
          66 face shapes each, lip-synced to their lines, lit and cut like
          coverage.
        </p>
      </div>
    </section>
  );
}
