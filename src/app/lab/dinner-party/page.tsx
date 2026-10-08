import type { Metadata } from "next";
import { DinnerPartyStage } from "@/components/dinner-party/stage";

export const metadata: Metadata = {
  title: "Dinner Party",
  description:
    "Drinks at Theo and Nina's. Walk their loft, say anything, and see where the night goes.",
  robots: { index: false, follow: false },
};

export default function DinnerPartyPage() {
  return (
    <section className="px-4 py-10 sm:px-8">
      <DinnerPartyStage />
      <div className="mx-auto mt-8 max-w-3xl space-y-3 text-sm opacity-80">
        <p>
          You&apos;re their oldest friend, over for drinks. They&apos;re
          fighting about something before you even knock. Talk to them, take
          sides or don&apos;t, pick things up, wander off. The night goes a
          different way each time.
        </p>
      </div>
    </section>
  );
}
