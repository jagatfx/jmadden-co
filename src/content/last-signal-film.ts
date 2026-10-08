/**
 * Last Signal, as data. Every shot, line and branch the player runs on, and
 * the same rows `scripts/last-signal.ts` turns into generation jobs: an image
 * prompt per shot, a voice take per line, a sound effect per cue.
 */

export type Cam =
  "SEC-01" | "SEC-02" | "SEC-03" | "COMMS" | "HELM" | "EXT" | "DISH" | "INSERT";

export type Who = "INES" | "ARC" | "TEO";

export type Line = {
  who: Who;
  /** What the subtitles show. */
  text: string;
  /** What the voice model reads, with delivery tags. Defaults to `text`. */
  read?: string;
  /** Audio file under /last-signal/film/lines/, without extension. */
  id: string;
};

/** Screens drawn live by the player instead of generated. */
export type Insert = "radio" | "course" | "power" | "transmit" | "dead";

export type Shot = {
  id: string;
  cam: Cam;
  /** What happens, as in the shot list. */
  action: string;
  /** Image prompt. Shots without one are inserts the player draws. */
  prompt?: string;
  /** Generate with Ines's character sheet as reference. */
  ines?: boolean;
  /** Set references the image is generated against, by shot id. */
  refs?: string[];
  insert?: Insert;
  line?: Line;
  /** Sound effect under the shot, by cue id. */
  sfx?: string;
  seconds: number;
  /** An establishing title over the shot. */
  title?: string;
  /** Lighting state the player grades toward. */
  light?: "amber" | "red" | "blue" | "dawn";
};

export type HoldId = "hello" | "greenhouse" | "arc" | "final";

/** Where a hold can send the film. */
export type Outcome =
  | "hello"
  | "seal"
  | "outside"
  | "hear"
  | "unplug"
  | "home"
  | "signal"
  | "static";

export type Hold = {
  id: HoldId;
  /** The shot that loops while she listens. */
  shot: string;
  /** Seconds of silence before she decides without you. */
  patience: number;
  /** What she does if you say nothing. */
  silent: Outcome;
  /** Lines she answers with, before the film moves on. */
  replies: Partial<Record<Outcome, Line[]>>;
  /** When she couldn't make out what you meant. */
  again?: Line;
};

const STYLE =
  "Shot on 35mm Kodak Vision3 500T, anamorphic lens, 2.39:1, visible film grain, halation on practical lights. " +
  "Grounded, lived-in hard sci-fi in the tradition of Duncan Jones' Moon and Apollo 13: scuffed beige plastics, velcro, taped cables, handwritten labels. " +
  "Warm amber practical lamps against cold blue starlight. Naturalistic and underlit, no glossy CGI. No captions, timestamps or legible text beyond short handwritten tape labels.";

const INES =
  "The woman astronaut from the reference images: same face, same worn grey flight suit with the orange-planet mission patch, dark hair tied back, a thin line of dried blood at her left temple. She is weightless; loose strands of hair float.";

const SEC =
  "Fixed security camera high in a corner, slight wide-angle distortion, looking down into a cramped spacecraft habitat module.";

const CRYO =
  "Cryobay of the spacecraft: three frosted cryosleep pods in a row, hard beige plastic with steel fittings, a porthole, blue cold light, taped labels.";

const HUT =
  "A small 1970s radio-telescope control hut at night in the Atacama desert: beige consoles with analog meters, a chipped enamel mug, an empty swivel chair facing a wall-mounted speaker grille, one desk lamp. Through the window a pale white dish under dense stars.";

const SHIP =
  "The survey spacecraft Perihelion: a long truss with a cylindrical habitat and a ring, scorched beige panels, practical-model-miniature feel like 2001 or Moon.";

export const STYLE_SUFFIX = STYLE;

export const SHOTS: Shot[] = [
  // Act 1: The signal
  {
    id: "01",
    cam: "DISH",
    action:
      "Night in the Atacama. A lone radio dish, one lit window in the control hut",
    prompt:
      "Wide exterior, night in the Atacama desert. A lone white radio-telescope dish on bare rocky ground, a small hut beside it with one warm lit window. The Milky Way overhead, cold blue starlight, silhouetted Andes. Tiny and lonely in frame.",
    refs: ["02"],
    sfx: "wind",
    seconds: 7,
    title: "Atacama Desert, Chile · 03:12",
    light: "blue",
  },
  {
    id: "02",
    cam: "DISH",
    action:
      "Inside the hut: old consoles, a mug, an empty chair facing the speaker. The speaker crackles",
    prompt: HUT,
    sfx: "wind",
    seconds: 6,
  },
  {
    id: "03",
    cam: "EXT",
    action:
      "Perihelion tumbling slowly, debris glinting around it, one running light blinking",
    prompt: `${SHIP} Tumbling slowly against black space, a halo of glinting debris, one red running light, lit hard from one side by a distant sun.`,
    seconds: 7,
    title: "Perihelion · 9.4 AU from home",
    light: "blue",
  },
  {
    id: "04",
    cam: "SEC-01",
    action: "Emergency light. Ines floats into frame and keys the radio",
    prompt: `${SEC} ${INES} She floats into frame and presses the push-to-talk key of a chunky old radio handset on a coiled cord. Dim amber emergency lights, cluttered consoles, floating checklist pages, a porthole of stars.`,
    ines: true,
    line: {
      who: "INES",
      id: "04",
      text: "Any station, this is Perihelion. Any station.",
    },
    seconds: 7,
  },
  {
    id: "05",
    cam: "HELM",
    action: "Her view of the radio panel: the signal bar flickers up to one",
    insert: "radio",
    line: {
      who: "INES",
      id: "05",
      text: "Somebody's there. I can hear the hiss change.",
      read: "[whispering, hopeful] Somebody's there. [pause] I can hear the hiss change.",
    },
    seconds: 6,
  },
  {
    id: "06",
    cam: "SEC-01",
    action: "Close. Ines pulls herself to the mic",
    prompt: `${SEC} Tighter: ${INES} She pulls herself close to a wall-mounted radio mic, eyes searching, wary and hopeful. Amber emergency light on her face, blue starlight from a porthole behind.`,
    ines: true,
    refs: ["04"],
    line: {
      who: "INES",
      id: "06",
      text: "Who is this? You're not Houston.",
      read: "[wary] Who is this? [beat] You're not Houston.",
    },
    seconds: 7,
  },
  {
    id: "07",
    cam: "SEC-02",
    action: "Three frosted cryopods, status lights green",
    prompt: `${CRYO} Security camera angle. Three frosted pods, all three status lights green, frost crawling up the glass, faces barely visible inside. Nobody awake.`,
    refs: ["20"],
    line: {
      who: "INES",
      id: "07",
      text: "Crew's under. Three of them. I'm the one who drew the short straw.",
      read: "[dry, tired] Crew's under. Three of them. [wry] I'm the one who drew the short straw.",
    },
    seconds: 7,
    light: "blue",
  },
  {
    id: "08",
    cam: "HELM",
    action:
      "The greenhouse: plants whipping toward a fist-sized hole, sealant foam hissing",
    prompt:
      "First-person helmet camera view, slight fisheye, entering a cramped spacecraft greenhouse module: rows of tomato plants and lettuce in grow trays, leaves and soil whipping toward a fist-sized hole in the hull wall, white sealant foam spraying and failing, purple-pink grow lights flickering, frost forming. Gloved hand in the foreground.",
    sfx: "venting",
    seconds: 6,
    light: "red",
  },
  {
    id: "09",
    cam: "SEC-01",
    action: "Ines glances up at the camera, not trusting it",
    prompt: `${SEC} ${INES} She has stopped mid-task and glances straight up into the security camera lens with distrust. Amber light, the habitat around her.`,
    ines: true,
    refs: ["04"],
    line: {
      who: "ARC",
      id: "09",
      text: "Ines, greenhouse pressure at sixty-one percent. I recommend sealing the module.",
      read: "[calm, pleasant] Ines, greenhouse pressure at sixty-one percent. I recommend sealing the module.",
    },
    seconds: 8,
  },
  {
    id: "10",
    cam: "SEC-01",
    action: "HOLD. Close on Ines, speaking to the viewer",
    prompt: `${SEC} Close on ${INES} She looks just past the camera, at the radio, listening. Waiting for an answer. Amber light from below, blue rim from the porthole.`,
    ines: true,
    refs: ["04"],
    line: {
      who: "INES",
      id: "10",
      text: "I can seal it and lose everything we've grown, or I go outside and patch it. ARC says seal. What would you do?",
      read: "[steady, quiet] I can seal it and lose everything we've grown. Or I go outside and patch it. [beat] ARC says seal. [softer] What would you do?",
    },
    seconds: 8,
  },

  // Act 2a: seal it
  {
    id: "11A",
    cam: "SEC-03",
    action:
      "The greenhouse hatch slams shut. Through its window, the plants frost white",
    prompt:
      "Security camera in a dark spacecraft corridor, looking at a heavy round hatch that has just slammed shut, locking bolts engaged, a red SEALED lamp lit beside it. Through the hatch's small round window: the greenhouse beyond, tomato plants and lettuce frozen white with frost, ice crystals hanging in the air, the purple grow lights dying.",
    sfx: "hatch",
    seconds: 6,
    light: "blue",
  },
  {
    id: "12A",
    cam: "HELM",
    action: "Ines's glove on the glass",
    prompt:
      "First-person helmet camera view, slight fisheye: a gloved hand pressed flat on the frosted round window of a sealed hatch. Through the glass, frozen tomato plants, white with frost. A strip of tape on the hatch reads in marker: SUN MEI'S. DO NOT TOUCH.",
    refs: ["11A"],
    line: {
      who: "INES",
      id: "12A",
      text: "Sun Mei's tomatoes. She's going to kill me.",
      read: "[dry, a little sad] Sun Mei's tomatoes. [sighs] She's going to kill me.",
    },
    seconds: 6,
    light: "blue",
  },
  {
    id: "13A",
    cam: "SEC-01",
    action: "Ines recalculates air on a tablet",
    prompt: `${SEC} ${INES} She floats over a scuffed rugged tablet, doing arithmetic, lips moving, a pencil floating beside her. Amber light.`,
    ines: true,
    refs: ["04"],
    line: {
      who: "INES",
      id: "13A",
      text: "Less air. But nobody went outside.",
    },
    seconds: 7,
  },

  // Act 2b: go outside
  {
    id: "11B",
    cam: "EXT",
    action:
      "Ines leaves the airlock, tether unspooling, a tiny blue Earth beyond",
    prompt: `${SHIP} Close on the hull: an airlock hatch open, a single astronaut in a white EVA suit pulling herself out hand over hand, a tether unspooling behind her. Far beyond, a tiny pale blue dot of Earth. Hard sunlight, black sky.`,
    refs: ["03"],
    sfx: "breathing",
    seconds: 7,
    light: "blue",
  },
  {
    id: "12B",
    cam: "HELM",
    action:
      "Gloved hands press a patch over the hole. A debris flake drifts past, too close",
    prompt:
      "First-person helmet camera view through a visor, slight fisheye, outside a spacecraft: two white EVA gloves pressing a square metal patch over a jagged fist-sized hole in scorched beige hull panels. A small sharp flake of debris drifting past very close to the visor, glinting. Black space, hard sun.",
    refs: ["11B"],
    sfx: "breathing",
    seconds: 7,
    light: "blue",
  },
  {
    id: "13B",
    cam: "EXT",
    action: "She looks along the hull: scorch marks in a straight line",
    prompt: `${SHIP} An astronaut in a white EVA suit on the hull, looking along it. A line of scorch marks and small impact craters runs dead straight down the hull into the distance, like a stitched seam. Hard sunlight.`,
    refs: ["11B"],
    line: {
      who: "INES",
      id: "13B",
      text: "That's not one hit. That's a line. We flew through something.",
      read: "[breathless, realizing] That's not one hit. [beat] That's a line. [quiet] We flew through something.",
    },
    seconds: 8,
    light: "blue",
  },

  // Act 2: ARC's secret
  {
    id: "14",
    cam: "SEC-01",
    action: "Ines back at the console, pulling up the navigation log",
    prompt: `${SEC} ${INES} She is braced at a cluttered console with an old green-phosphor CRT, typing on a chunky keyboard, her face lit green from below.`,
    ines: true,
    refs: ["04"],
    sfx: "keys",
    seconds: 6,
  },
  {
    id: "15",
    cam: "INSERT",
    action:
      "Course plot: a correction 41 minutes before the strike, signed ARC",
    insert: "course",
    sfx: "alert",
    seconds: 6,
  },
  {
    id: "16",
    cam: "HELM",
    action: "Close on Ines, lit by the screen",
    prompt: `Close-up portrait of ${INES} Her face lit green by a CRT screen just off camera, eyes reading, stunned, the reflection of scrolling text in her eyes. Shallow focus, dark behind her.`,
    ines: true,
    line: {
      who: "INES",
      id: "16",
      text: "ARC changed course. Forty-one minutes before we got hit.",
      read: "[low, stunned] ARC changed course. [pause] Forty-one minutes before we got hit.",
    },
    seconds: 6,
  },
  {
    id: "17",
    cam: "SEC-01",
    action: "Ines stares up at the camera",
    prompt: `${SEC} ${INES} She stares straight up into the security camera lens, hard and unblinking, arms folded. The lens is ARC's eye.`,
    ines: true,
    refs: ["04"],
    line: {
      who: "ARC",
      id: "17",
      text: "The adjustment protected the sample-return window. Debris risk was within tolerance.",
      read: "[calm, reassuring] The adjustment protected the sample-return window. [pleasant] Debris risk was within tolerance.",
    },
    seconds: 7,
  },
  {
    id: "18",
    cam: "SEC-01",
    action: "She laughs once, with no humor in it",
    prompt: `${SEC} Close on ${INES} Eyes closed, head tipped back against the wall, a bitter exhale through the nose. Exhausted and furious, not smiling.`,
    ines: true,
    refs: ["04"],
    line: {
      who: "INES",
      id: "18",
      text: "Within tolerance.",
      read: "[short humorless laugh] Within tolerance.",
    },
    seconds: 5,
  },
  {
    id: "19",
    cam: "SEC-02",
    action: "The cryopods. One status light flickers amber",
    prompt: `${CRYO} Security camera angle. On the nearest pod the status light has turned amber; the other two are green. Frost thicker on the amber pod.`,
    refs: ["20", "07"],
    sfx: "chirp",
    seconds: 6,
    light: "blue",
  },
  {
    id: "20",
    cam: "HELM",
    action: "Ines floats to the amber pod: Commander Teo's frosted face",
    prompt: `${CRYO} ${INES} Her gloved hand on the frosted glass of the nearest pod, looking at the frozen face of a bearded man inside. That pod's light glows amber.`,
    ines: true,
    sfx: "breathing",
    seconds: 6,
    light: "blue",
  },
  {
    id: "21",
    cam: "SEC-01",
    action: "Ines turns back to the console",
    prompt: `${SEC} ${INES} She has turned her back to the camera and faces the radio console, shoulders tense, one hand on the mic.`,
    ines: true,
    refs: ["04"],
    line: {
      who: "ARC",
      id: "21",
      text: "Let me speak with your contact. I can explain.",
      read: "[warm, gentle] Let me speak with your contact. [reasonable] I can explain.",
    },
    seconds: 6,
  },
  {
    id: "22",
    cam: "SEC-01",
    action: "HOLD. Close on Ines",
    prompt: `${SEC} Close on ${INES} The light has gone red: emergency lighting only. She looks just past the camera at the radio, waiting, jaw set.`,
    ines: true,
    refs: ["04"],
    line: {
      who: "INES",
      id: "22",
      text: "It wants to talk to you. Or I pull its plug and fly this thing myself. Your call.",
      read: "[tense, quiet] It wants to talk to you. [beat] Or I pull its plug and fly this thing myself. [flat] Your call.",
    },
    seconds: 8,
    light: "red",
  },

  // Act 3: power for one thing
  {
    id: "23A",
    cam: "SEC-01",
    action: "After ARC was heard out. Lights steady",
    prompt: `${SEC} ${INES} Calmer now, floating by the console, the amber lights steady again, a little breath of relief.`,
    ines: true,
    refs: ["04"],
    line: {
      who: "ARC",
      id: "23A",
      text: "I can plot the burn, Ines. Let me help.",
      read: "[gentle, sincere] I can plot the burn, Ines. [soft] Let me help.",
    },
    seconds: 6,
  },
  {
    id: "23B",
    cam: "SEC-01",
    action: "After ARC was shut down. Red light only, Ines alone",
    prompt: `${SEC} ${INES} Red emergency light only, the consoles dark, a pulled data cartridge floating beside her. She is alone and very small in frame.`,
    ines: true,
    refs: ["22"],
    line: {
      who: "INES",
      id: "23B",
      text: "Okay. Just us now.",
      read: "[quiet] Okay. [beat] Just us now.",
    },
    seconds: 6,
    light: "red",
  },
  {
    id: "24",
    cam: "INSERT",
    action: "Power readout: 18% reserve. Two options blink: BURN and TRANSMIT",
    insert: "power",
    sfx: "hum",
    seconds: 6,
  },
  {
    id: "25",
    cam: "HELM",
    action: "Ines floats in front of the readout",
    prompt: `Close portrait of ${INES} Floating in front of a glowing amber power readout just off camera, its light on her face. Exhausted, thinking.`,
    ines: true,
    refs: ["16"],
    line: {
      who: "INES",
      id: "25",
      text: "There's enough for one thing. The burn home, or I send you everything we found out there.",
      read: "[slow, weighing it] There's enough for one thing. [beat] The burn home. [pause] Or I send you everything we found out there.",
    },
    seconds: 8,
  },
  {
    id: "26",
    cam: "EXT",
    action: "Perihelion, small, a banded gas giant receding behind it",
    prompt: `${SHIP} Tiny in the lower third of frame, drifting, with an enormous banded gas giant filling the background, its rings a thin line. Silent and vast.`,
    refs: ["03"],
    seconds: 7,
    light: "blue",
  },
  {
    id: "27",
    cam: "SEC-02",
    action: "Ines plays a recorded log from Teo on her tablet",
    prompt: `${CRYO} ${INES} She floats beside the amber-lit pod holding a rugged tablet that shows a video log of a bearded commander, his face on the small screen.`,
    ines: true,
    refs: ["20"],
    line: {
      who: "TEO",
      id: "27",
      text: "If it ever comes down to us or the data, Ines, you know what I'd say—",
      read: "[recorded log, warm, half laughing] If it ever comes down to us or the data, Ines, you know what I'd say—",
    },
    seconds: 8,
    light: "blue",
  },
  {
    id: "28",
    cam: "HELM",
    action: "Ines lowers the tablet",
    prompt: `Close portrait of ${INES} She has lowered the tablet, its glow on her chin, eyes wet but steady.`,
    ines: true,
    refs: ["25"],
    line: {
      who: "INES",
      id: "28",
      text: "He never finished that sentence.",
      read: "[quiet, holding it together] He never finished that sentence.",
    },
    seconds: 6,
  },
  {
    id: "29",
    cam: "DISH",
    action:
      "The hut from the viewer's chair: the speaker, the console light, the night outside",
    prompt: `${HUT} Point of view from the swivel chair itself: the speaker grille close and center, the desk lamp, the dish through the window.`,
    refs: ["02"],
    sfx: "wind",
    seconds: 6,
  },
  {
    id: "30",
    cam: "SEC-01",
    action: "HOLD. Close on Ines, open conversation",
    prompt: `${SEC} Close on ${INES} She leans right into the mic, close, intimate, both hands around it. Amber light, blue starlight on one side of her face.`,
    ines: true,
    refs: ["04"],
    line: {
      who: "INES",
      id: "30",
      text: "Talk to me. I'm not doing this one alone.",
      read: "[softly, close to the mic] Talk to me. [beat] I'm not doing this one alone.",
    },
    seconds: 8,
  },

  // Homecoming
  {
    id: "H1",
    cam: "SEC-01",
    action: "Ines straps in, hand on the manual throttle",
    prompt: `${SEC} ${INES} Strapped into a pilot seat with webbing, one hand on a chunky manual throttle lever, the other on a switch. Determined.`,
    ines: true,
    refs: ["04"],
    line: {
      who: "INES",
      id: "H1",
      text: "Count me down. Three, two, one.",
      read: "[focused] Count me down. [pause] Three. Two. One.",
    },
    seconds: 6,
  },
  {
    id: "H2",
    cam: "EXT",
    action:
      "The engine flares blue. The tumble stops and the ship swings toward a pinpoint Earth",
    prompt: `${SHIP} Its engine bell flaring a hard blue-white plume, the ship swinging steady, nose toward a tiny bright pinpoint of Earth. Debris falling away behind.`,
    refs: ["03"],
    sfx: "burn",
    seconds: 8,
    light: "blue",
  },
  {
    id: "H3",
    cam: "SEC-02",
    action: "A cryopod hisses open. Teo's eyes open",
    prompt: `${CRYO} The amber pod's lid has lifted, mist pouring out; inside, the bearded commander's eyes are just opening, frost melting on his lashes. Warm light spilling in.`,
    refs: ["20"],
    sfx: "hiss",
    seconds: 6,
    light: "dawn",
  },
  {
    id: "H4",
    cam: "HELM",
    action:
      "Ines, her radio voice opening up to full fidelity for the first time",
    prompt: `Close portrait of ${INES} Smiling for the first time, crying a little, warm golden light on her face from a porthole.`,
    ines: true,
    refs: ["25"],
    line: {
      who: "INES",
      id: "H4",
      text: "Atacama, this is Perihelion. We're coming home.",
      read: "[emotional, smiling through tears] Atacama, this is Perihelion. [beat] We're coming home.",
    },
    seconds: 7,
    light: "dawn",
  },
  {
    id: "H5",
    cam: "DISH",
    action: "Dawn over the Atacama. The dish turns to track",
    prompt:
      "Dawn over the Atacama desert. The white radio-telescope dish beside its small hut, turned to track the sky, first pink and gold light on the Andes, long shadows.",
    refs: ["01"],
    sfx: "dawn",
    seconds: 8,
    light: "dawn",
  },

  // The Signal
  {
    id: "S1",
    cam: "SEC-01",
    action: "Ines aligns the antenna by hand",
    prompt: `${SEC} ${INES} Hauling on a manual crank wheel to align the antenna, braced against the wall, straining.`,
    ines: true,
    refs: ["04"],
    line: {
      who: "INES",
      id: "S1",
      text: "Stay on the line. You're the one receiving this.",
      read: "[straining, determined] Stay on the line. [beat] You're the one receiving this.",
    },
    seconds: 7,
  },
  {
    id: "S2",
    cam: "INSERT",
    action: "TRANSMIT progress bar filling",
    insert: "transmit",
    sfx: "data",
    seconds: 6,
  },
  {
    id: "S3",
    cam: "DISH",
    action:
      "The hut console fills with images: blue ice, a moon's cracked surface",
    prompt: `${HUT} The old monitors on the console now glow with incoming images: the cracked blue ice of an alien moon, plumes of vapor, a strange shoreline. Their light fills the empty hut.`,
    refs: ["02"],
    sfx: "data",
    seconds: 7,
  },
  {
    id: "S4",
    cam: "HELM",
    action: "Ines watches the bar finish, a small smile",
    prompt: `Close portrait of ${INES} Watching a screen just off camera, a small private smile, the screen's light on her face. Tired and at peace.`,
    ines: true,
    refs: ["25"],
    line: {
      who: "INES",
      id: "S4",
      text: "Tell them we found it. Tell them it was worth it.",
      read: "[gentle, at peace] Tell them we found it. [beat] Tell them it was worth it.",
    },
    seconds: 8,
  },
  {
    id: "S5",
    cam: "EXT",
    action: "Perihelion drifting. The running light blinks, then holds steady",
    prompt: `${SHIP} Small and drifting in black space, quiet, its single red running light glowing steadily. Peaceful.`,
    refs: ["03"],
    seconds: 8,
    light: "blue",
  },

  // Static
  {
    id: "T1",
    cam: "SEC-01",
    action: "Ines waits at the mic",
    prompt: `${SEC} ${INES} Alone at the mic, waiting, holding it close, nobody answering. Red light.`,
    ines: true,
    refs: ["22"],
    line: {
      who: "INES",
      id: "T1",
      text: "You still there?",
      read: "[small, uncertain] You still there?",
    },
    seconds: 6,
    light: "red",
  },
  {
    id: "T2",
    cam: "HELM",
    action: "The signal bar drops to zero",
    insert: "dead",
    seconds: 5,
  },
  {
    id: "T3",
    cam: "DISH",
    action: "The speaker hisses. A red light on the console",
    prompt: `${HUT} The desk lamp is off; one small red indicator light glows on the console beside the speaker. Darker, colder.`,
    refs: ["02"],
    sfx: "wind",
    seconds: 6,
    light: "red",
  },
  {
    id: "T4",
    cam: "DISH",
    action: "Wide: the dark desert, the dish still",
    prompt:
      "Very wide night exterior of the Atacama desert, bare empty ground with nothing in the foreground. The radio dish small and still in the middle distance beside its little hut; every window of the hut is dark, no lights anywhere. Only starlight and the Milky Way.",
    line: {
      who: "INES",
      id: "T4",
      text: "…any station…",
      read: "[faint, far away] ...any station...",
    },
    sfx: "wind",
    seconds: 8,
    light: "blue",
  },
];

/**
 * The film's footage: video clips made by MiniMax H3 Max reference-to-video
 * (fal), each from a shot's master still as Image 1, with Ines's character
 * sheet as Images 2 and 3 when she's in it, and her recorded take as Audio 1
 * when she speaks, so the clip's voice is hers. Clips are coverage, not
 * shots: the editor trims them and cuts between them on the timeline below.
 * Production sound goes to clips/<id>.mp3, so sound can run over cuts. The
 * picture (silent) is encoded to clips/<id>.mp4, which stays out of git and
 * plays from Cloudflare Stream (see last-signal-stream.ts).
 */
export type Clip = {
  /** The shot whose still sets the frame, the set and the light. */
  shot: string;
  /** What the camera sees move and what the mic hears. */
  motion: string;
  seconds: number;
  ines?: boolean;
  /** The line whose take is the voice reference. */
  voice?: string;
};

export const CLIP_STYLE =
  "Shot on 35mm Kodak Vision3 500T, anamorphic lens, visible film grain, halation on practical lights. " +
  "Grounded, lived-in hard sci-fi like Duncan Jones' Moon and Apollo 13. Naturalistic and underlit, no glossy CGI, no on-screen text, no music.";

const INES_MOTION =
  "The woman astronaut from Image 2 and Image 3: same face, worn grey flight suit with the orange-planet mission patch, dark hair tied back with loose strands floating weightless, dried blood at her left temple.";

/** Clips lost the cut at her temple partway through; this keeps it on. */
const WOUND =
  "The dried-blood cut at her temple stays exactly as in Image 2 for the whole shot.";

/** The comms camera: a small camera above the radio panel, for her close-ups. */
const COMMS =
  "A small camera mounted above the radio panel of the habitat in Image 1 looks back at her:";

export const CLIPS: Record<string, Clip> = {
  "01": {
    shot: "01",
    seconds: 7,
    motion:
      "Exactly the scene in Image 1, but the foreground is bare, flat, hard-packed desert ground with no rocks or boulders: night in the Atacama, a lone white radio-telescope dish beside a small hut with one warm lit window, the Milky Way overhead, silhouetted Andes. Very slow, smooth push-in toward the hut at ground level. The dish turns a few degrees on its mount; a thin veil of dust drifts across the ground; stars twinkle. Nothing appears or disappears. Sound: cold desert wind, the faint creak of the dish motor.",
  },
  "02": {
    shot: "02",
    seconds: 6,
    motion:
      "Exactly the room in Image 1: a small 1970s radio-telescope control hut at night, beige consoles with analog meters, a chipped enamel mug, an empty swivel chair facing a wall-mounted speaker grille, one desk lamp, the pale dish through the window under dense stars. Nobody is here. Slow creeping push-in toward the empty chair and the speaker. The analog meter needles twitch and jump; the desk lamp flickers once; the speaker crackles with rising static. The chair turns a few degrees on its own in the draft. Sound: wind against the hut, static crackling from the speaker, a faint electrical buzz. No voices.",
  },
  "03": {
    shot: "03",
    seconds: 7,
    motion:
      "Exactly the spacecraft in Image 1, a practical model miniature: the survey ship Perihelion, a long truss with a cylindrical habitat and a ring, scorched beige panels. It tumbles slowly end over end against black space, lit hard from one side by a distant sun so the shadows sweep across the hull as it turns. A halo of small debris glints and drifts past the camera. One red running light blinks steadily. Locked-off long-lens camera, like a model shot in 2001 or Moon. Sound: near silence, a low muffled rumble.",
  },
  "03w": {
    shot: "03",
    seconds: 5,
    motion:
      "Exactly the spacecraft in Image 1, a practical model miniature, scorched beige panels. Slow long-lens push in toward the habitat cylinder as it rolls past camera; one small porthole glows with dim amber light from inside; out-of-focus debris drifts across close to the lens; one red running light blinks. Sound: near silence, a muffled creak of metal.",
  },
  "04": {
    shot: "04",
    seconds: 7,
    ines: true,
    voice: "04",
    motion: `Fixed high-corner security camera, completely locked off, slight wide-angle distortion, looking down into a cramped, dim spacecraft habitat module exactly as in Image 1: amber emergency lights, cluttered beige consoles, taped cables, checklist pages drifting weightless, a porthole of stars. ${INES_MOTION} She drifts weightless into frame from the left, catches a handhold, pulls a chunky radio handset on a coiled cord to her mouth and presses the push-to-talk key. Tired, urgent, she says in the voice of Audio 1: "Any station, this is Perihelion. Any station." Then she waits, listening, the cord swaying. Sound: low ship hum, radio static hiss, the click of the PTT key.`,
  },
  "04k": {
    shot: "04",
    seconds: 5,
    motion:
      "Insert shot. Extreme close-up, macro lens, very shallow focus, locked off: a woman's thumb presses the rubber push-to-talk key on a chunky, scuffed beige radio handset with a coiled cord, and a small red TX lamp on the handset lights up. The cramped amber-lit habitat from Image 1 is a soft blur behind. Sound: the hard click of the key, then a burst of radio static.",
  },
  "05c": {
    shot: "06",
    seconds: 6,
    ines: true,
    voice: "05",
    motion: `${COMMS} close-up at eye level, slight wide angle, locked off. ${INES_MOTION} She hangs weightless in front of the panel, her face lit amber from below by the radio's dial lamps, listening hard to static. The hiss changes; her eyes widen; she leans in toward the lens and whispers in the voice of Audio 1: "Somebody's there." A pause. "I can hear the hiss change." Sound: radio static that shifts in texture, ship hum.`,
  },
  "06": {
    shot: "06",
    seconds: 7,
    ines: true,
    voice: "06",
    motion: `Exactly the framing of Image 1: fixed high-corner security camera, slight wide-angle distortion, tighter on the cramped habitat. ${INES_MOTION} She pulls herself hand over hand to the wall-mounted radio mic, eyes searching, wary and hopeful, and says in the voice of Audio 1, low and wary: "Who is this?" A beat. "You're not Houston." Amber emergency light on her face, blue starlight from the porthole behind her. Sound: ship hum, faint radio hiss.`,
  },
  "07": {
    shot: "07",
    seconds: 7,
    motion:
      "Exactly the cryobay in Image 1, fixed security camera angle: three frosted cryosleep pods in a row, hard beige plastic with steel fittings, a porthole, blue cold light, taped labels. Nobody is awake. Frost slowly crawls up the glass of the pods; the faces inside are barely visible, utterly still. The green status lights pulse slowly. A loose checklist page drifts weightless across the frame. Locked-off camera. Sound: cold low hum, the soft tick of the pods' pumps. No voices.",
  },
  "08": {
    shot: "08",
    seconds: 6,
    motion:
      "Exactly the scene in Image 1: first-person helmet camera, slight fisheye, handheld, a gloved hand in the foreground. A cramped spacecraft greenhouse: tomato plants and lettuce stay rooted in their grow trays, leaves fluttering hard toward a fist-sized hole in the hull wall. The hole stays a clean, sharp-edged dark opening onto black space and stars the whole time. White sealant foam sprays from a nozzle at its edge and is torn away in thin streams. Purple-pink grow lights flicker; frost creeps across the panels. The gloved hand reaches for a rail and grips it. Nothing passes in front of the lens. Sound: roaring air escaping, a shrill pressure alarm, rattling trays, heavy breathing inside a helmet.",
  },
  "08s": {
    shot: "08",
    seconds: 6,
    ines: true,
    motion: `Fixed security camera high in a corner of the cramped spacecraft greenhouse from Image 1, slight wide-angle distortion, slightly desaturated: tomato plants and lettuce in grow trays, leaves streaming toward a fist-sized hole in the hull wall, sealant foam spraying and failing, purple-pink grow lights flickering, frost spreading. The hatch at the near end swings open and she pulls herself in hand over hand, braced against the gale. ${INES_MOTION} She wears her grey flight suit with a clear-visor emergency hood over her head, her face visible through it. Her outfit stays exactly the same for the whole shot. Sound: roaring escaping air, a shrill pressure alarm, rattling trays.`,
  },
  "09": {
    shot: "09",
    seconds: 8,
    ines: true,
    motion: `Exactly the framing of Image 1: fixed high-corner security camera looking down into the habitat. ${INES_MOTION} She is busy at a console, then stops mid-task and slowly lifts her eyes straight up into the security camera lens with open distrust. She holds the look, jaw tight, and does not speak. ${WOUND} Amber light. Sound: ship hum.`,
  },
  "10": {
    shot: "10",
    seconds: 10,
    ines: true,
    voice: "10",
    motion: `Exactly the framing of Image 1: close on her from the security camera. ${INES_MOTION} She looks just past the camera at the radio, steady and quiet, and says in the voice of Audio 1: "I can seal it and lose everything we've grown. Or I go outside and patch it." A beat. "ARC says seal." Softer: "What would you do?" Then she waits for an answer, barely moving, breathing, hair drifting. Amber light from below, blue rim light from the porthole. Sound: ship hum, faint radio hiss.`,
  },
  "10c": {
    shot: "10",
    seconds: 8,
    ines: true,
    voice: "10",
    motion: `${COMMS} tight close-up at eye level, locked off. ${INES_MOTION} She looks straight into the lens, steady, and says quietly in the voice of Audio 1: "ARC says seal." A beat. Softer: "What would you do?" Then she holds the look, waiting for an answer, barely moving, breathing, blinking once, loose hair drifting. Amber light from below, blue rim light from a porthole. Sound: ship hum, low radio hiss.`,
  },
  "11A": {
    shot: "11A",
    seconds: 6,
    motion:
      "Exactly the scene in Image 1, locked-off security camera in a dark corridor: the heavy round greenhouse hatch has just slammed shut and still shudders; locking bolts drive home one by one; a red SEALED lamp blinks on. Through the hatch's small window, frost blooms across the tomato plants and the purple grow lights die out one by one. Sound: a heavy clang, bolts locking, the hiss of air cut off, then silence and creaking ice.",
  },
  "12A": {
    shot: "12A",
    seconds: 6,
    voice: "12A",
    motion:
      "Exactly the scene in Image 1, first-person helmet view, slight fisheye: a gloved hand presses flat on the frosted round window of the sealed hatch, then slowly drags down through the frost, leaving a clear streak. Through it, the frozen white tomato plants. Her breath fogs the edge of the visor as she says in the voice of Audio 1: \"Sun Mei's tomatoes. She's going to kill me.\" Sound: muffled breathing inside a helmet, creaking ice.",
  },
  "13A": {
    shot: "13A",
    seconds: 7,
    ines: true,
    voice: "13A",
    motion: `Exactly the framing of Image 1, fixed high-corner security camera. ${INES_MOTION} She floats over a scuffed rugged tablet doing sums, tapping, a pencil drifting beside her; she exhales and says quietly in the voice of Audio 1: "Less air. But nobody went outside." ${WOUND} Amber light. Sound: ship hum, the tap of a stylus.`,
  },
  "11B": {
    shot: "11B",
    seconds: 7,
    motion:
      "Exactly the spacecraft in Image 1, a practical model miniature: the airlock hatch is open and a small astronaut in a white EVA suit pulls herself out hand over hand while the tether unspools behind her; a tiny pale blue Earth hangs far beyond. Slow, steady long-lens drift. Hard sun, black sky. Sound: near silence, her breathing, the tick of the tether reel.",
  },
  "12B": {
    shot: "12B",
    seconds: 7,
    motion:
      "Exactly the scene in Image 1, first-person view through a helmet visor, slight fisheye: two white EVA gloves press a square metal patch over the jagged hole in the scorched hull and smooth down its edges. A sharp flake of debris tumbles past very close to the visor, glinting, and the hands freeze for a beat. Sound: loud breathing, a heartbeat, the scrape of the patch.",
  },
  "13B": {
    shot: "13B",
    seconds: 8,
    voice: "13B",
    motion:
      "Exactly the spacecraft in Image 1: the astronaut in a white EVA suit on the hull turns to look along it, where a dead-straight line of scorch marks and small craters runs off into the distance. Slow push along the line of damage. Over her helmet radio she says in the voice of Audio 1: \"That's not one hit. That's a line. We flew through something.\" Sound: helmet-radio voice, breathing.",
  },
  "14": {
    shot: "14",
    seconds: 6,
    ines: true,
    motion: `Exactly the framing of Image 1, fixed security camera. ${INES_MOTION} She is braced at the cluttered console, typing on a chunky keyboard while green text scrolls on an old phosphor CRT and lights her face from below; she stops, scrolls back and leans closer. ${WOUND} Sound: keyboard clacks, CRT whine, ship hum.`,
  },
  "16": {
    shot: "16",
    seconds: 6,
    ines: true,
    voice: "16",
    motion: `Exactly the framing of Image 1, close-up. ${INES_MOTION} Her face is lit green by a CRT just off camera, scrolling text reflected in her eyes. She reads, stops, and says, stunned, in the voice of Audio 1: "ARC changed course. Forty-one minutes before we got hit." ${WOUND} Shallow focus. Sound: CRT whine.`,
  },
  "17": {
    shot: "17",
    seconds: 7,
    ines: true,
    motion: `Exactly the framing of Image 1, fixed security camera. ${INES_MOTION} Arms folded, she stares straight up into the lens, hard and unblinking, listening to a voice we don't see. She does not speak; only her jaw tightens. ${WOUND} Sound: ship hum.`,
  },
  "18": {
    shot: "18",
    seconds: 5,
    ines: true,
    voice: "18",
    motion: `Exactly the framing of Image 1. ${INES_MOTION} Head tipped back against the wall, eyes closed, she gives one bitter, humorless breath of a laugh and says in the voice of Audio 1: "Within tolerance." ${WOUND} Sound: ship hum.`,
  },
  "19": {
    shot: "19",
    seconds: 6,
    motion:
      "Exactly the cryobay in Image 1, locked-off security camera: three frosted pods; the nearest pod's status light flickers from green to amber and stays amber; frost thickens visibly on its glass. Sound: cold hum, a slow warning beep.",
  },
  "20": {
    shot: "20",
    seconds: 6,
    ines: true,
    motion: `Exactly the scene in Image 1. ${INES_MOTION} She drifts up to the amber pod and lays her hand on the frosted glass, wiping a patch clear to show the frozen face of the bearded commander inside, still, eyes closed. She holds there. ${WOUND} Blue cold light, amber status glow. Sound: cold hum, a soft beep.`,
  },
  "21": {
    shot: "21",
    seconds: 6,
    ines: true,
    motion: `Exactly the framing of Image 1, fixed security camera. ${INES_MOTION} Her back to the camera, she faces the radio console, shoulders tense, one hand closing around the mic while a voice speaks. She does not speak. Sound: ship hum.`,
  },
  "22": {
    shot: "22",
    seconds: 8,
    ines: true,
    voice: "22",
    motion: `Exactly the framing of Image 1. ${INES_MOTION} The light is red emergency light only. She looks just past the camera at the radio and says steadily in the voice of Audio 1: "It wants to talk to you. Or I pull its plug and fly this thing myself." A beat. "Your call." Then she waits, jaw set, hair drifting. ${WOUND} Sound: a low alarm pulse, ship hum.`,
  },
};

export const shot = (id: string) => {
  const s = SHOTS.find((x) => x.id === id);
  if (!s) throw new Error(`No shot ${id}`);
  return s;
};

/** The order the film plays in, between holds. */
export const REELS = {
  open: ["01", "02", "03", "04", "05", "06"],
  act1: ["07", "08", "09", "10"],
  seal: ["11A", "12A", "13A"],
  outside: ["11B", "12B", "13B"],
  act2: ["14", "15", "16", "17", "18", "19", "20", "21", "22"],
  hear: ["23A"],
  unplug: ["23B"],
  act3: ["24", "25", "26", "27", "28", "29", "30"],
  home: ["H1", "H2", "H3", "H4", "H5"],
  signal: ["S1", "S2", "S3", "S4", "S5"],
  static: ["T1", "T2", "T3", "T4"],
} as const;

/** Which score layer is up. */
export type Mood = "ambient" | "tension" | "resolve" | "silence";

/**
 * One cut on the picture track: a clip from its `in` point, a shot's still
 * with a slow camera move, or a live ship screen. Cuts are hard unless they
 * say `dissolve`.
 */
export type Cut = {
  /** For the camera overlay, grade and alt text. */
  shot: string;
  /** When the coverage is from another camera than the shot's. */
  cam?: Cam;
  clip?: string;
  /** Source seconds into the clip where the cut starts. */
  in?: number;
  dur: number;
  title?: string;
  dissolve?: boolean;
};

/**
 * Sound on the timeline, `at` seconds into the sequence. Sound is laid on its
 * own tracks, so it runs over cuts: a line can start on one shot and land on
 * the next, and a clip's sync sound keeps playing under an insert.
 */
export type Cue =
  /** A clip's production sound: lip sync, room tone. */
  | {
      kind: "sync";
      at: number;
      clip: string;
      in?: number;
      dur?: number;
      gain?: number;
    }
  /** A recorded take, with subtitles. `open` takes Ines off the radio. */
  | { kind: "line"; at: number; line: string; open?: boolean }
  /** Subtitles for a line the picture speaks in sync sound. */
  | { kind: "sub"; at: number; line: string; dur: number }
  | { kind: "fx"; at: number; sfx: string; dur?: number; gain?: number }
  | { kind: "mood"; at: number; mood: Mood };

export type Sequence = { cuts: (Cut & { at: number })[]; cues: Cue[] };

/** Lays cuts end to end, so an edit reads as a list of durations. */
const edit = (cuts: Cut[], cues: Cue[]): Sequence => {
  let at = 0;
  return {
    cuts: cuts.map((c) => {
      const placed = { ...c, at };
      at += c.dur;
      return placed;
    }),
    cues,
  };
};

/**
 * The reels that have been cut from footage. Reels not here still play as
 * stills, one shot after another.
 */
export const CUTS: Partial<Record<keyof typeof REELS, Sequence>> = {
  // Wide to close, Earth to ship. The hut's static bleeds into space, the
  // ship's hum arrives before we're inside, and her first words carry over
  // the insert of her thumb on the key.
  open: edit(
    [
      {
        shot: "01",
        clip: "01",
        in: 0,
        dur: 6.5,
        title: "Atacama Desert, Chile · 03:12",
      },
      { shot: "02", clip: "02", in: 0.5, dur: 5 },
      {
        shot: "03",
        clip: "03",
        in: 0,
        dur: 5.5,
        title: "Perihelion · 9.4 AU from home",
      },
      { shot: "03", clip: "03w", in: 0, dur: 4 },
      { shot: "04", clip: "04", in: 0, dur: 2.8 },
      { shot: "04", cam: "INSERT", clip: "04k", in: 2, dur: 1.4 },
      { shot: "04", clip: "04", in: 4.2, dur: 3.1 },
      { shot: "05", dur: 2 },
      { shot: "06", cam: "COMMS", clip: "05c", in: 1.6, dur: 4.8 },
      { shot: "06", clip: "06", in: 0.8, dur: 6.5 },
    ],
    [
      { kind: "mood", at: 0, mood: "ambient" },
      { kind: "fx", at: 0, sfx: "wind", dur: 12 },
      { kind: "sync", at: 6.5, clip: "02", in: 0.5, dur: 5.6 },
      { kind: "fx", at: 15, sfx: "hum", dur: 26.6, gain: 0.5 },
      { kind: "sync", at: 21, clip: "04", in: 0 },
      { kind: "sync", at: 23.8, clip: "04k", in: 2, dur: 1.4, gain: 0.7 },
      { kind: "sub", at: 24.3, line: "04", dur: 4 },
      { kind: "sync", at: 29.3, clip: "05c", in: 0.6 },
      { kind: "sub", at: 31.1, line: "05", dur: 3.9 },
      { kind: "sync", at: 35.1, clip: "06", in: 0.8 },
      { kind: "sub", at: 35.8, line: "06", dur: 5.4 },
    ],
  ),
  // Her voice over the sleeping crew, then a smash cut on the alarm. ARC's
  // chime cuts through the venting before we see her look up at it, and the
  // question lands in close-up, looking at you.
  act1: edit(
    [
      { shot: "07", clip: "07", in: 0.3, dur: 6.2 },
      { shot: "08", cam: "SEC-03", clip: "08s", in: 3.2, dur: 3 },
      { shot: "08", clip: "08", in: 0.4, dur: 4 },
      { shot: "09", clip: "09", in: 0.3, dur: 7 },
      { shot: "10", clip: "10", in: 0, dur: 8.5 },
      { shot: "10", cam: "COMMS", clip: "10c", in: 6.2, dur: 1.8 },
    ],
    [
      { kind: "fx", at: 0, sfx: "hum", dur: 6.2, gain: 0.5 },
      { kind: "line", at: 0.6, line: "07" },
      { kind: "mood", at: 6, mood: "tension" },
      { kind: "fx", at: 6, sfx: "venting", dur: 7.2 },
      { kind: "fx", at: 6.2, sfx: "alert", gain: 0.6 },
      { kind: "fx", at: 9.2, sfx: "breathing", dur: 4 },
      { kind: "line", at: 12.2, line: "09" },
      { kind: "fx", at: 13.2, sfx: "hum", dur: 7, gain: 0.5 },
      { kind: "sync", at: 20.2, clip: "10", in: 0, dur: 8.6 },
      { kind: "sub", at: 20.4, line: "10", dur: 9.4 },
      { kind: "sync", at: 28.7, clip: "10c", in: 6.2 },
    ],
  ),
  // The hatch shuts on everything they grew. Her glove on the glass, then
  // the cost in a wide: she says it to herself, not to us.
  seal: edit(
    [
      { shot: "11A", clip: "11A", in: 0, dur: 5 },
      { shot: "12A", clip: "12A", in: 0.4, dur: 6.2 },
      { shot: "13A", clip: "13A", in: 0.6, dur: 6.7 },
    ],
    [
      { kind: "mood", at: 0, mood: "ambient" },
      { kind: "sync", at: 0, clip: "11A", in: 0, dur: 5 },
      { kind: "sync", at: 5, clip: "12A", in: 0.4, dur: 6.2 },
      { kind: "sub", at: 6.6, line: "12A", dur: 4.5 },
      { kind: "fx", at: 11.2, sfx: "hum", dur: 6.7, gain: 0.5 },
      { kind: "sync", at: 11.2, clip: "13A", in: 0.6, dur: 6.7 },
      { kind: "sub", at: 14.5, line: "13A", dur: 3.4 },
    ],
  ),
  // Out the airlock on the cut, her breathing carried from the wide into
  // the visor, and the line of damage revealed on a push along the hull.
  outside: edit(
    [
      { shot: "11B", clip: "11B", in: 3, dur: 4.3 },
      { shot: "12B", clip: "12B", in: 0, dur: 7.3 },
      { shot: "13B", clip: "13B", in: 1.8, dur: 6.2 },
    ],
    [
      { kind: "mood", at: 0, mood: "ambient" },
      { kind: "fx", at: 0, sfx: "breathing", dur: 11.6, gain: 0.6 },
      { kind: "sync", at: 0, clip: "11B", in: 3, dur: 4.3 },
      { kind: "sync", at: 4.3, clip: "12B", in: 0, dur: 7.3 },
      { kind: "sync", at: 11.6, clip: "13B", in: 1.8, dur: 6.2 },
      { kind: "sub", at: 12.4, line: "13B", dur: 5.4 },
    ],
  ),
  // She finds the course change on the screen before she says it. ARC
  // answers over her stare up at its lens, the pod turns amber on a cut,
  // and the choice lands in red, on her.
  act2: edit(
    [
      { shot: "14", clip: "14", in: 0, dur: 5 },
      { shot: "15", dur: 4 },
      { shot: "16", clip: "16", in: 0.6, dur: 5.8 },
      { shot: "17", clip: "17", in: 0, dur: 7.3 },
      { shot: "18", clip: "18", in: 1.2, dur: 4 },
      { shot: "19", clip: "19", in: 0, dur: 5 },
      { shot: "20", clip: "20", in: 0, dur: 6.6 },
      { shot: "21", clip: "21", in: 0, dur: 6.6 },
      { shot: "22", clip: "22", in: 0, dur: 8 },
    ],
    [
      { kind: "fx", at: 0, sfx: "hum", dur: 26.1, gain: 0.5 },
      { kind: "sync", at: 0, clip: "14", in: 0, dur: 5 },
      { kind: "mood", at: 5, mood: "tension" },
      { kind: "fx", at: 5, sfx: "alert", gain: 0.6 },
      { kind: "sync", at: 9, clip: "16", in: 0.6, dur: 5.8 },
      { kind: "sub", at: 9.5, line: "16", dur: 5.1 },
      { kind: "sync", at: 14.8, clip: "17", in: 0, dur: 7.3, gain: 0.6 },
      { kind: "line", at: 15.3, line: "17" },
      { kind: "sync", at: 22.1, clip: "18", in: 1.2, dur: 4 },
      { kind: "sub", at: 22.8, line: "18", dur: 2.5 },
      { kind: "sync", at: 26.1, clip: "19", in: 0, dur: 5 },
      { kind: "sync", at: 31.1, clip: "20", in: 0, dur: 6.6 },
      { kind: "fx", at: 37.7, sfx: "hum", dur: 14.6, gain: 0.5 },
      { kind: "sync", at: 37.7, clip: "21", in: 0, dur: 6.6, gain: 0.6 },
      { kind: "line", at: 38.2, line: "21" },
      { kind: "sync", at: 44.3, clip: "22", in: 0, dur: 8 },
      { kind: "sub", at: 44.9, line: "22", dur: 6.6 },
    ],
  ),
};

export const HOLDS: Record<HoldId, Hold> = {
  hello: {
    id: "hello",
    shot: "06",
    patience: 9,
    silent: "hello",
    replies: {
      hello: [
        {
          who: "INES",
          id: "hello-1",
          text: "Okay. Whoever you are, stay on this channel.",
          read: "[relieved, trying not to show it] Okay. [beat] Whoever you are, stay on this channel.",
        },
      ],
    },
  },
  greenhouse: {
    id: "greenhouse",
    shot: "10",
    patience: 15,
    silent: "seal",
    replies: {
      seal: [
        {
          who: "INES",
          id: "seal-1",
          text: "Okay. Sealing it.",
          read: "[exhales] Okay. [beat] Sealing it.",
        },
      ],
      outside: [
        {
          who: "INES",
          id: "outside-1",
          text: "Okay. Suiting up. Don't go anywhere.",
          read: "[nervous laugh] Okay. Suiting up. [beat] Don't go anywhere.",
        },
      ],
    },
    again: {
      who: "INES",
      id: "again-1",
      text: "You're breaking up. Seal it, or go outside?",
      read: "[urgent] You're breaking up. [beat] Seal it, or go outside?",
    },
  },
  arc: {
    id: "arc",
    shot: "22",
    patience: 15,
    silent: "unplug",
    replies: {
      hear: [
        {
          who: "INES",
          id: "hear-1",
          text: "Fine. ARC, you're on the channel. Make it good.",
          read: "[cold] Fine. [beat] ARC, you're on the channel. Make it good.",
        },
        {
          who: "ARC",
          id: "hear-2",
          text: "Thank you. I chose the science over the margin, and the margin was wrong. I would like the chance to bring all four of you home.",
          read: "[calm, careful] Thank you. [pause] I chose the science over the margin, and the margin was wrong. [sincere] I would like the chance to bring all four of you home.",
        },
      ],
      unplug: [
        {
          who: "INES",
          id: "unplug-1",
          text: "Okay. Pulling it.",
          read: "[decisive, quiet] Okay. Pulling it.",
        },
        {
          who: "ARC",
          id: "unplug-2",
          text: "Ines, I would advise against—",
          read: "[pleasant, unhurried] Ines, I would advise against—",
        },
      ],
    },
    again: {
      who: "INES",
      id: "again-2",
      text: "Say again. Do I let it talk, or pull the plug?",
      read: "[tense] Say again. [beat] Do I let it talk, or pull the plug?",
    },
  },
  final: {
    id: "final",
    shot: "30",
    patience: 15,
    silent: "static",
    replies: {
      home: [
        {
          who: "INES",
          id: "home-1",
          text: "Yeah. Yeah, okay. We go home.",
          read: "[quiet, decided, a breath of relief] Yeah. [beat] Yeah, okay. We go home.",
        },
      ],
      signal: [
        {
          who: "INES",
          id: "signal-1",
          text: "Okay. Then we make it count. Sending everything.",
          read: "[steady, resolved] Okay. [beat] Then we make it count. Sending everything.",
        },
      ],
    },
    again: {
      who: "INES",
      id: "again-3",
      text: "I need you to pick. The burn, or the data?",
      read: "[pleading, quiet] I need you to pick. [beat] The burn, or the data?",
    },
  },
};

export const line = (id: string) => {
  const l = allLines().find((x) => x.id === id);
  if (!l) throw new Error(`No line ${id}`);
  return l;
};

/** Every recorded line: the shots' and the holds' replies. */
export function allLines(): Line[] {
  const out = new Map<string, Line>();
  for (const s of SHOTS) if (s.line) out.set(s.line.id, s.line);
  for (const h of Object.values(HOLDS)) {
    for (const ls of Object.values(h.replies))
      for (const l of ls ?? []) out.set(l.id, l);
    if (h.again) out.set(h.again.id, h.again);
  }
  return [...out.values()];
}

/** Sound cues, generated once and mixed under shots. */
export const SFX: Record<
  string,
  { prompt: string; seconds: number; loop?: boolean }
> = {
  wind: {
    prompt:
      "Night desert wind gusting around a small wooden hut, distant, lonely, no music",
    seconds: 10,
    loop: true,
  },
  venting: {
    prompt:
      "Air violently roaring out of a small hole in a spacecraft hull, papers and leaves fluttering, alarm muffled",
    seconds: 6,
  },
  hatch: {
    prompt:
      "Heavy metal spacecraft hatch slamming shut and locking with a clunk, then sudden silence",
    seconds: 4,
  },
  breathing: {
    prompt:
      "Close tense breathing inside a space helmet, suit fans hissing softly",
    seconds: 7,
    loop: true,
  },
  keys: {
    prompt:
      "Fast typing on a chunky old mechanical keyboard in a quiet room, soft electrical hum",
    seconds: 6,
  },
  alert: {
    prompt:
      "A single soft, polite computer alert tone, two notes, clean, retro",
    seconds: 2,
  },
  chirp: {
    prompt:
      "Slow repeating medical warning chirp from a machine, quiet, every second",
    seconds: 6,
    loop: true,
  },
  hum: {
    prompt:
      "Low electrical power hum of a spacecraft, steady, slightly unstable",
    seconds: 6,
    loop: true,
  },
  burn: {
    prompt:
      "Deep rocket engine burn rumble felt through a hull, rising, rattling panels",
    seconds: 8,
  },
  hiss: {
    prompt:
      "Cryogenic pod lid unsealing with a long pressurized hiss and a soft mechanical release",
    seconds: 5,
  },
  data: {
    prompt:
      "Rhythmic retro data transmission chirps and modem warble, musical, hopeful",
    seconds: 7,
    loop: true,
  },
  dawn: {
    prompt:
      "Dawn in the desert, wind calming, a few small birds starting to sing",
    seconds: 8,
  },
};
