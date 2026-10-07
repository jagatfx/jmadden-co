/** The /now page (https://nownownow.com/about). Newest snapshot first. */
export type NowSnapshot = {
  updated: string;
  location: string;
  sections: { heading: string; items: string[] }[];
};

export const motto = "Embracing the now, for it is all we have.";

export const now: NowSnapshot = {
  updated: "2026-10-07",
  location: "Nomadic, mostly East Tennessee and South Florida",
  sections: [
    {
      heading: "Making",
      items: [
        "Last Signal, a short film you talk to. Nine days to premiere on October 16.",
        "Studio OS, the agent studio that turns a shot list into a cut.",
        "Firefolio, and the trading-agent experiments that live inside it.",
      ],
    },
    {
      heading: "Writing",
      items: [
        "Articles on financial independence for Firefolio.",
        "A daily build log on X and in the notebook here, until the premiere.",
      ],
    },
    {
      heading: "Reading",
      items: ["Other Worlds Than These, by Stephen King and Peter Straub."],
    },
    {
      heading: "On repeat",
      items: [
        "The O My Beloved tracks Kings of Leon are releasing ahead of the full record.",
      ],
    },
    {
      heading: "Learning",
      items: [
        "Bouldering.",
        "Ecuadorian Highlands Kichwa.",
        "How to set up a free library in Ecuador.",
      ],
    },
  ],
};

/** Earlier snapshots, kept from the old site. */
export const previously: NowSnapshot[] = [
  {
    updated: "2020-02-24",
    location: "New York, NY",
    sections: [
      {
        heading: "Doing",
        items: [
          "Onboarding at a new gig and learning all the things",
          "Experimenting with features for Practicar, a Spanish practice React app",
          "Exploring character cartridges and personas in virtual reality",
          "Finalizing a trail challenge mobile app in React",
        ],
      },
    ],
  },
  {
    updated: "2019-12-02",
    location: "Schenectady, NY",
    sections: [
      {
        heading: "Doing",
        items: [
          "Working on a Costa Rica jungle VR experience where you live as different animals",
          "Editing footage from our Azure Kinect volumetric capture of AR dancer performances",
          "Exploring virtual hand interactions on Oculus Quest",
          "Investigating health and wellness wearables and metrics",
          "Making a trail challenge app",
        ],
      },
    ],
  },
];
