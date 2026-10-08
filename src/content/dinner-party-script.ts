/**
 * Every line Trip and Grace can say. `text` is the subtitle, `read` is the
 * take as sent to the voice (with ElevenLabs direction tags), and `name` means
 * the guest's name is spoken just before the line, from the names catalog.
 * `scripts/dinner-party-lines.ts` records whatever is missing.
 */

export type Speaker = "TRIP" | "GRACE";
export type NameTone = "exclaim" | "address";
export type ScriptLine = {
  who: Speaker;
  text: string;
  read?: string;
  name?: NameTone;
  /** Heard through the front door: muffled, nobody on screen. */
  door?: boolean;
};

const T = (text: string, read?: string, name?: NameTone): ScriptLine => ({
  who: "TRIP",
  text,
  read,
  name,
});
const G = (text: string, read?: string, name?: NameTone): ScriptLine => ({
  who: "GRACE",
  text,
  read,
  name,
});
const door = (l: ScriptLine): ScriptLine => ({ ...l, door: true });

export const SCRIPT = {
  // 0. Through the door
  "d-g1": door(
    G(
      "Did you call Dan back? He called the house again.",
      "[tense, low] Did you call Dan back? He called the house again.",
    ),
  ),
  "d-t1": door(
    T(
      "I'll deal with Dan. Tonight is not the night, Grace.",
      "[irritated, hushed] I'll deal with Dan. Tonight is not the night, Grace.",
    ),
  ),
  "d-g2": door(G("It's never the night.", "[bitter] It's never the night.")),
  "d-t2": door(
    T(
      "They're going to be here any—",
      "[snapping] They're going to be here any—",
    ),
  ),
  "d-t3": door(T("Smile.", "[whispering] Smile.")),
  "d-g3": door(G("I am smiling.", "[whispering, flat] I am smiling.")),

  // 1. Arrival
  "a-t1": T(
    "There you are! Get in here!",
    "[delighted, a little too loud] There you are! Get in here!",
    "exclaim",
  ),
  "a-g1": G(
    "Hi. Oh, it's been way too long.",
    "[warm, a touch tired] Hi. Oh, it's been way too long.",
    "address",
  ),
  "a-t2": T(
    "Ten years. Do you realize that? Ten years since you introduced us at that terrible party.",
    "[nostalgic, hosting hard] Ten years. Do you realize that? Ten years since you introduced us at that terrible party.",
  ),
  "a-g2": G(
    "It was a good party. You were the terrible part.",
    "[dry, half a smile] It was a good party. You were the terrible part.",
  ),
  "a-t3": T(
    "Ha! She's kidding. She's kidding.",
    "[forced laugh] Ha! She's kidding. She's kidding.",
  ),

  // 2. Drinks
  "k-g1": G(
    "Trip's been mixing drinks since six.",
    "[dry] Trip's been mixing drinks since six.",
  ),
  "k-t1": T(
    "Five-thirty. Practice makes perfect. So. What can I get you?",
    "[laughs it off] Five-thirty. Practice makes perfect. [brightly] So. What can I get you?",
  ),
  "k-strong-t": T(
    "Now we're talking. Two of those, coming right up.",
    "[delighted] Now we're talking. Two of those, coming right up.",
  ),
  "k-strong-g": G("Of course.", "[flat, under her breath] Of course."),
  "k-water-g": G("Smart.", "[approving, a small smile] Smart."),
  "k-water-t": T(
    "Water. Wow. Okay. Living on the edge.",
    "[deflated, joking] Water. Wow. Okay. Living on the edge.",
  ),
  "k-other-t": T(
    "I'll surprise you. I make a mean martini.",
    "[confident] I'll surprise you. I make a mean martini.",
  ),
  "k-t2": T("Grace? The usual?", "[bright] Grace? The usual?"),
  "k-g2": G("Just wine.", "[short] Just wine."),
  "k-t3": T(
    "Just wine. She says it like it's a moral position.",
    "[needling, to the guest] Just wine. She says it like it's a moral position.",
  ),
  "k-g3": G("It's a drink, Trip.", "[cool] It's a drink, Trip."),

  // 3. The painting
  "p-t1": T(
    "Oh! You haven't seen it. Look. Over the sofa.",
    "[excited] Oh! You haven't seen it. Look. Over the sofa.",
    "address",
  ),
  "p-t2": T(
    "Grace's little comeback.",
    "[proud, slightly patronising] Grace's little comeback.",
  ),
  "p-g1": G(
    "It's not a comeback. It's a painting.",
    "[quiet, still] It's not a comeback. It's a painting.",
  ),
  "p-t3": T(
    "It's great! It's great. It's very... blue.",
    "[backpedalling] It's great! It's great. It's very... blue.",
  ),
  "p-g2": G(
    "Honestly. What do you see when you look at it?",
    "[sincere, a little exposed] Honestly. What do you see when you look at it?",
    "address",
  ),
  "p-love-g": G(
    "Thank you. Really. Nobody in this apartment has said that.",
    "[moved, then pointed] Thank you. Really. Nobody in this apartment has said that.",
  ),
  "p-love-t": T("I said it was great!", "[defensive] I said it was great!"),
  "p-love-g2": G("You said it was blue.", "[dry] You said it was blue."),
  "p-hate-t": T(
    "See? It's a lot of blue.",
    "[relieved, laughing] See? It's a lot of blue.",
  ),
  "p-hate-g": G("Right. Of course.", "[hurt, cold] Right. Of course."),
  "p-meh-g": G(
    "That's a very diplomatic non-answer.",
    "[wry] That's a very diplomatic non-answer.",
  ),
  "p-meh-t": T(
    "That's our friend. Switzerland.",
    "[jovial] That's our friend. Switzerland.",
  ),
  "p-g3": G(
    "It's a door. I painted a door. Open.",
    "[to herself, quietly] It's a door. I painted a door. [beat] Open.",
  ),
  "p-t4": T(
    "Doors. Great. Very symbolic.",
    "[sarcastic, under his breath] Doors. Great. Very symbolic.",
  ),

  // 4. Venice
  "v-t1": T(
    "You know what this reminds me of? Venice.",
    "[picking up the photo, warm] You know what this reminds me of? Venice.",
  ),
  "v-t2": T(
    "Our honeymoon. Best week of my life.",
    "[nostalgic] Our honeymoon. Best week of my life.",
  ),
  "v-g1": G(
    "Ask him what he promised in Venice.",
    "[pointed, calm] Ask him what he promised in Venice.",
    "address",
  ),
  "v-t3": T("Grace.", "[warning] Grace."),
  "v-g2": G("Go on. Tell them.", "[insisting] Go on. Tell them."),
  "v-t4": T(
    "I said we'd go back every five years.",
    "[reluctant] I said we'd go back every five years.",
  ),
  "v-g3": G("And?", "[expectant] And?"),
  "v-t5": T(
    "And life happened! Work happened! You know how it is.",
    "[exasperated, appealing to the guest] And life happened! Work happened! You know how it is.",
  ),
  "v-g4": G(
    "I know exactly how it is. I was there for all of it.",
    "[quiet, cutting] I know exactly how it is. I was there for all of it.",
  ),
  "v-t6": T(
    "Back me up here. You can't just drop everything for a gondola.",
    "[pleading, half laughing] Back me up here. You can't just drop everything for a gondola.",
    "address",
  ),
  "v-g5": G(
    "It's not about the gondola, Trip.",
    "[tired] It's not about the gondola, Trip.",
  ),
  "v-g6": G(
    "You knew us before all this. Who's being unfair here?",
    "[direct, to the guest] You knew us before all this. Who's being unfair here?",
  ),
  "v-grace-t": T(
    "Wow. Okay. Two against one. Great.",
    "[stung] Wow. Okay. Two against one. Great.",
  ),
  "v-grace-g": G("Thank you.", "[quiet, grateful] Thank you."),
  "v-trip-g": G(
    "Of course. Everyone loves Trip.",
    "[bitter] Of course. Everyone loves Trip.",
  ),
  "v-trip-t": T("That's not fair.", "[uncomfortable] That's not fair."),
  "v-both-g": G("Diplomatic again.", "[sigh] Diplomatic again."),
  "v-both-t": T(
    "No, that's... that's actually fair.",
    "[surprised, softer] No, that's... that's actually fair.",
  ),

  // 5a. Trip's secret (his phone)
  "s-t-g1": G(
    "Who's texting you at nine at night?",
    "[suspicious] Who's texting you at nine at night?",
  ),
  "s-t-t1": T("Nobody. Work.", "[too quick] Nobody. Work."),
  "s-t-g2": G(
    "Is it Dan again? Why does our financial advisor keep calling the house?",
    "[sharp] Is it Dan again? Why does our financial advisor keep calling the house?",
  ),
  "s-t-t2": T(
    "It's nothing. Can we not do this right now?",
    "[cornered] It's nothing. Can we not do this right now?",
  ),
  "s-t-press-t": T(
    "Fine. Fine! I lost money, okay? Options trades. Eighty thousand dollars.",
    "[breaking, loud] Fine. Fine! [beat] I lost money, okay? Options trades. [quiet] Eighty thousand dollars.",
  ),
  "s-t-press-g": G(
    "Eighty... thousand?",
    "[stunned, barely audible] Eighty... thousand?",
  ),
  "s-t-press-t2": T(
    "I was going to fix it before you ever had to know.",
    "[ashamed] I was going to fix it before you ever had to know.",
  ),
  "s-t-cover-g": G(
    "Fine. Keep your secrets, Trip. You're good at it.",
    "[cold] Fine. Keep your secrets, Trip. You're good at it.",
  ),
  "s-t-cover-t": T("Thank you.", "[relieved, to the guest, quiet] Thank you."),
  // Grace answers it with her own
  "s-g-confess": G(
    "Well. Since we're confessing.",
    "[shaky laugh] Well. Since we're confessing.",
  ),
  "s-g-confess2": G(
    "I took the residency. Lisbon. A year. I fly in three weeks. My bag's already packed.",
    "[steady, then trembling] I took the residency. Lisbon. A year. [beat] I fly in three weeks. My bag's already packed.",
  ),
  "s-g-confess-t": T("You... what?", "[gutted] You... what?"),

  // 5b. Grace's secret (the letter)
  "s-g-t1": T(
    "What's this? 'We are delighted to offer you...' Lisbon?",
    "[reading, confused] What's this? [reading] 'We are delighted to offer you...' [beat] Lisbon?",
  ),
  "s-g-g1": G("Trip, give me that.", "[alarmed] Trip, give me that."),
  "s-g-t2": T(
    "A residency? A year? When were you going to tell me?",
    "[rising anger] A residency? A year? When were you going to tell me?",
  ),
  "s-g-g2": G(
    "When I knew you'd actually listen.",
    "[defiant, quiet] When I knew you'd actually listen.",
  ),
  "s-g-defend-t": T(
    "So everyone knew but me.",
    "[hurt] So everyone knew but me.",
  ),
  "s-g-defend-g": G(
    "Nobody knew. I'm telling you now.",
    "[firm, softer] Nobody knew. I'm telling you now.",
  ),
  "s-g-condemn-g": G(
    "Right. I should stay here and design yogurt labels forever.",
    "[furious, icy] Right. I should stay here and design yogurt labels forever.",
  ),
  "s-g-condemn-t": T(
    "That's not what anyone said.",
    "[uneasy] That's not what anyone said.",
  ),
  // Trip answers it with his own
  "s-t-confess": T(
    "Okay. Okay. Since we're doing this.",
    "[exhales, resigned] Okay. Okay. Since we're doing this.",
  ),
  "s-t-confess2": T(
    "I lost eighty thousand dollars on options. Dan's been calling about the credit line.",
    "[ashamed, flat] I lost eighty thousand dollars on options. Dan's been calling about the credit line.",
  ),
  "s-t-confess-g": G("Oh my God.", "[stunned] Oh my God."),

  // 6. The question
  "q-g1": G(
    "Can I ask you something?",
    "[exhausted, sincere] Can I ask you something?",
    "address",
  ),
  "q-t1": T("Honestly.", "[quiet] Honestly."),
  "q-g2": G(
    "Should we still be doing this?",
    "[barely holding it together] Should we still be doing this?",
  ),

  // Endings
  "e-honest-g": G(
    "Look at us. Eighty thousand dollars and a plane ticket.",
    "[laughing through tears] Look at us. Eighty thousand dollars and a plane ticket.",
  ),
  "e-honest-t": T(
    "Go to Lisbon, Grace. Paint. I'll sell the account and come visit.",
    "[gentle, decided] Go to Lisbon, Grace. Paint. I'll sell the account and come visit.",
  ),
  "e-honest-g2": G("You hate flying.", "[teasing, soft] You hate flying."),
  "e-honest-t2": T("I'll take a boat.", "[laughing] I'll take a boat."),
  "e-honest-g3": G(
    "Stay for dinner. Please.",
    "[warm] Stay for dinner. Please.",
    "address",
  ),
  "e-recommit-g": G(
    "Maybe we just... try again.",
    "[quiet, uncertain] Maybe we just... try again.",
  ),
  "e-recommit-t": T(
    "We can try. We can definitely try.",
    "[hopeful] We can try. We can definitely try.",
  ),
  "e-recommit-t2": T(
    "Thank you. Really.",
    "[sincere] Thank you. Really.",
    "address",
  ),
  "e-fracture-g": G(
    "I can't do this anymore.",
    "[calm, final] I can't do this anymore.",
  ),
  "e-fracture-g2": G(
    "My bag's been packed for a week, Trip.",
    "[quiet] My bag's been packed for a week, Trip.",
  ),
  "e-fracture-t": T("Grace. Grace, wait.", "[panicking] Grace. Grace, wait."),
  "e-fracture-t2": T(
    "Stay for one more drink?",
    "[hollow, to the guest] Stay for one more drink?",
  ),
  "e-caught-t": T(
    "Wait. Were you two...?",
    "[slowly realising] Wait. Were you two...?",
  ),
  "e-caught-g": G(
    "Oh my God. No. What is wrong with you?",
    "[appalled] Oh my God. No. What is wrong with you?",
    "address",
  ),
  "e-caught-t2": T("Out. Get out.", "[cold fury] Out. Get out."),
  "e-out-t": T(
    "Okay. I think you should go.",
    "[cold, very calm] Okay. I think you should go.",
  ),
  "e-out-g": G("Now, please.", "[icy] Now, please."),
  "e-out-door-g": door(
    G("Can you believe that?", "[laughing, muffled] Can you believe that?"),
  ),
  "e-out-door-t": door(
    T(
      "Ten years! Ten years of that!",
      "[laughing hard] Ten years! Ten years of that!",
    ),
  ),

  // Open mic: what they say when you cut in
  "x-flirt-g-g": G(
    "Oh. Well. Thank you.",
    "[flustered, pleased] Oh. Well. Thank you.",
  ),
  "x-flirt-g-t": T("Hey. Easy.", "[stiff smile] Hey. Easy."),
  "x-flirt-t-t": T(
    "Ha! Okay, I'm flattered.",
    "[laughing, pleased] Ha! Okay, I'm flattered.",
  ),
  "x-flirt-t-g": G(
    "He'll be insufferable now.",
    "[dry] He'll be insufferable now.",
  ),
  "x-insult-t": T(
    "Wow. Okay. Nice to see you too.",
    "[stung, cold] Wow. Okay. Nice to see you too.",
  ),
  "x-insult-g": G("Excuse me?", "[cold, sharp] Excuse me?"),
  "x-strike2-g": G("Okay. That's twice.", "[icy] Okay. That's twice."),
  "x-praise-g": G(
    "Thank you. See? Someone gets it.",
    "[pleased, pointed] Thank you. See? Someone gets it.",
  ),
  "x-praise-g-t": T("Oh, here we go.", "[eye roll] Oh, here we go."),
  "x-praise-t": T(
    "Thank you! Finally, someone on my side.",
    "[delighted] Thank you! Finally, someone on my side.",
  ),
  "x-praise-t-g": G("Of course.", "[flat] Of course."),
  "x-crit-t": T(
    "Hey. Whose side are you on?",
    "[hurt, half joking] Hey. Whose side are you on?",
  ),
  "x-crit-t-g": G("Mm.", "[satisfied] Mm."),
  "x-crit-g": G("Wow. Okay.", "[hurt] Wow. Okay."),
  "x-crit-g-t": T("Let's not.", "[uneasy] Let's not."),
  "x-calm-t": T(
    "We're not fighting! Are we fighting?",
    "[laughing, too bright] We're not fighting! Are we fighting?",
  ),
  "x-calm-g": G("We're discussing.", "[dry] We're discussing."),
  "x-divorce-t": T(
    "Whoa. Nobody said anything about that.",
    "[alarmed] Whoa. Nobody said anything about that.",
  ),
  "x-divorce-g": G("Maybe somebody should.", "[quiet] Maybe somebody should."),
  "x-therapy-g": G(
    "We tried that. Trip checked his email the whole time.",
    "[dry] We tried that. Trip checked his email the whole time.",
  ),
  "x-therapy-t": T("Once!", "[defensive] Once!"),
  "x-sorry-g": G("It's fine. It's fine.", "[softening] It's fine. It's fine."),
  "x-thanks-t": T(
    "Of course! Anything for you.",
    "[warm] Of course! Anything for you.",
  ),
  "x-hi-t": T("Hi again!", "[amused] Hi again!"),
  "x-ack-t": T("Ha. Right. Right.", "[distracted laugh] Ha. Right. Right."),
  "x-ack-t2": T("Sure. Yeah.", "[half listening] Sure. Yeah."),
  "x-ack-g": G("Mm-hm.", "[polite] Mm-hm."),
  "x-ack-g2": G("Maybe.", "[thoughtful] Maybe."),
  "x-question-t": T("Ha. Good question.", "[deflecting] Ha. Good question."),
  "x-question-g": G(
    "That's a good question.",
    "[looking at Trip] That's a good question.",
  ),
  "x-quiet-g": G(
    "You're very quiet tonight.",
    "[gently probing] You're very quiet tonight.",
  ),
  "x-leave-t": T(
    "What? No, no, you just got here!",
    "[panicked host] What? No, no, you just got here!",
  ),
  // Arrival variants
  "a-t1b": T(
    "Look who it is! Come in, come in!",
    "[booming, delighted] Look who it is! Come in, come in!",
    "exclaim",
  ),
  "a-g1b": G(
    "Hi! Look at you. Come here.",
    "[bright, a little brittle] Hi! Look at you. Come here.",
    "address",
  ),

  // Drinks, extra
  "k-t1b": T(
    "Okay. Bartender's on duty. What are you drinking tonight?",
    "[showman] Okay. Bartender's on duty. What are you drinking tonight?",
  ),
  "k-hand-t": T(
    "Here you go. Careful, I don't measure.",
    "[proud] Here you go. Careful, I don't measure.",
  ),
  "x-sip-t": T(
    "Good, right? Tell me that's good.",
    "[eager] Good, right? Tell me that's good.",
  ),
  "x-give-g": G(
    "Oh. For me? Thank you.",
    "[surprised, touched] Oh. For me? Thank you.",
  ),
  "x-give-t": T("That was for you!", "[mock offended] That was for you!"),
  "x-putdown-t": T(
    "Not a fan? I'm wounded.",
    "[joking, a little hurt] Not a fan? I'm wounded.",
  ),

  // Painting, extra
  "p-g0": G(
    "Come here. I want to show you something.",
    "[shy, inviting] Come here. I want to show you something.",
    "address",
  ),
  "p-near-g": G(
    "Closer. Look at the light at the bottom.",
    "[quiet, pleased] Closer. Look at the light at the bottom.",
  ),
  "p-far-g": G(
    "You can come closer. It doesn't bite.",
    "[slightly deflated] You can come closer. It doesn't bite.",
  ),

  // Venice, extra
  "v-found-t": T(
    "Oh, you found it! Venice!",
    "[thrilled] Oh, you found it! Venice!",
  ),

  // Redecorating
  "r-g1": G(
    "I want to redo this whole room. Everything. Start over.",
    "[restless] I want to redo this whole room. Everything. Start over.",
  ),
  "r-t1": T(
    "We just redid this room. Two years ago.",
    "[patient, strained] We just redid this room. Two years ago.",
  ),
  "r-g2": G(
    "And I've hated it for two years.",
    "[light, lethal] And I've hated it for two years.",
  ),
  "r-t2": T("You picked the sofa!", "[incredulous] You picked the sofa!"),
  "r-g3": G(
    "Be honest. What do you think of the sofa?",
    "[to the guest, testing] Be honest. What do you think of the sofa?",
  ),
  "r-like-t": T(
    "Thank you! It's a great sofa. It's Italian.",
    "[vindicated] Thank you! It's a great sofa. It's Italian.",
  ),
  "r-like-g": G("Of course it is.", "[dry] Of course it is."),
  "r-hate-g": G(
    "Thank you. It's like sitting on a parking garage.",
    "[laughing] Thank you. It's like sitting on a parking garage.",
  ),
  "r-hate-t": T(
    "It cost eleven thousand dollars!",
    "[blurting] It cost eleven thousand dollars!",
  ),
  "r-hate-g2": G(
    "Did it? I thought we said six.",
    "[slowly, suspicious] Did it? I thought we said six.",
  ),
  "r-meh-t": T(
    "See? It's fine. It's a fine sofa.",
    "[relieved] See? It's fine. It's a fine sofa.",
  ),
  "r-meh-g": G("Fine. Everything's fine.", "[flat] Fine. Everything's fine."),

  // The proposal
  "w-t1": T(
    "Did I ever tell you how I proposed? It's a great story.",
    "[warming up, to the guest] Did I ever tell you how I proposed? It's a great story.",
  ),
  "w-g1": G("Trip, please don't.", "[mortified] Trip, please don't."),
  "w-t2": T(
    "Christmas at her parents'. I stood on a chair in front of everybody. Eighteen people.",
    "[storyteller] Christmas at her parents'. I stood on a chair in front of everybody. Eighteen people.",
  ),
  "w-g2": G(
    "Twenty-two. I counted. While I was trying not to die.",
    "[dry, pained] Twenty-two. I counted. While I was trying not to die.",
  ),
  "w-t3": T(
    "And I said, Grace, you're the only painting I'll ever need.",
    "[grandly, proud] And I said, [beat] Grace, you're the only painting I'll ever need.",
  ),
  "w-g3": G(
    "He'd been working on that line for a month.",
    "[to the guest, flat] He'd been working on that line for a month.",
  ),
  "w-t4": T(
    "Come on. Romantic, or what?",
    "[grinning, fishing] Come on. Romantic, or what?",
    "address",
  ),
  "w-yes-t": T(
    "Thank you! See? Romantic.",
    "[triumphant] Thank you! See? Romantic.",
  ),
  "w-yes-g": G("Of course you'd think so.", "[cool] Of course you'd think so."),
  "w-no-g": G(
    "Thank you. Somebody finally said it.",
    "[relieved laugh] Thank you. Somebody finally said it.",
  ),
  "w-no-t": T("Unbelievable.", "[stung] Unbelievable."),

  // The phone
  "ph-g1": G(
    "Your phone's been buzzing all night.",
    "[pointed] Your phone's been buzzing all night.",
  ),
  "ph-t1": T("Hey. That's mine.", "[sharp, reaching] Hey. That's mine."),
  "ph-t2": T(
    "Give me that. Please.",
    "[controlled, scared] Give me that. Please.",
  ),

  // The suitcase
  "su-g1": G(
    "Oh. That's... that's nothing. A work thing.",
    "[caught, too fast] Oh. That's... that's nothing. A work thing.",
  ),
  "su-t1": T(
    "What work thing? You didn't say anything about a trip.",
    "[confused, wary] What work thing? You didn't say anything about a trip.",
  ),
  "su-g2": G(
    "Can we talk about it later?",
    "[pleading, low] Can we talk about it later?",
  ),

  // Topic hooks
  "x-lisbon-g": G(
    "Why would you say Lisbon?",
    "[frozen, quiet] Why would you say Lisbon?",
  ),
  "x-lisbon-t": T("What about Lisbon?", "[confused, sharp] What about Lisbon?"),
  "x-money-t": T(
    "Who told you about that?",
    "[pale, low] Who told you about that?",
  ),
  "x-money-g": G("Told them about what?", "[alert] Told them about what?"),

  // Where you are, what you touch
  "x-space-t": T(
    "Whoa. Personal space, buddy.",
    "[laughing, leaning back] Whoa. Personal space, buddy.",
  ),
  "x-space-g": G(
    "You're... very close.",
    "[uneasy laugh] You're... very close.",
  ),
  "x-away-t": T(
    "Hey, where are you going? Come back here.",
    "[calling across the room] Hey, where are you going? Come back here.",
  ),
  "x-away-g": G(
    "Don't wander off on us.",
    "[calling, half joking] Don't wander off on us.",
  ),
  "x-sit-g": G(
    "Sit, sit. Make yourself at home.",
    "[hostess] Sit, sit. Make yourself at home.",
  ),
  "x-hug-t": T(
    "Oh! Okay. Bring it in.",
    "[surprised, pleased] Oh! Okay. Bring it in.",
  ),
  "x-hug-g": G(
    "Oh. Hi. Thank you. I needed that.",
    "[softening] Oh. Hi. Thank you. I needed that.",
  ),
  "x-hug-jealous-t": T(
    "Hey, what about me?",
    "[joking, a little jealous] Hey, what about me?",
  ),
  "x-kiss-g": G(
    "Whoa. What are you doing?",
    "[shocked] Whoa. What are you doing?",
  ),
  "x-kiss-t": T("Ha! Whoa. Okay!", "[startled laugh] Ha! Whoa. Okay!"),
  "x-bottle-t": T(
    "Help yourself! Mi casa.",
    "[expansive] Help yourself! Mi casa.",
  ),
  "x-photo-g": G(
    "Could you put that down, please?",
    "[tight] Could you put that down, please?",
  ),
  "x-painting-g": G("You like it?", "[hopeful] You like it?"),
  "x-quiet-t": T(
    "You okay? You've barely said a word.",
    "[concerned] You okay? You've barely said a word.",
  ),

  // When they fill the silence themselves
  "f-g1": G(
    "Can you stop refilling your glass for five minutes?",
    "[low, sharp] Can you stop refilling your glass for five minutes?",
  ),
  "f-t1": T("Can you stop counting?", "[snapping back] Can you stop counting?"),
  "f-t2": T(
    "Every party. Every single party, you do this.",
    "[frustrated] Every party. Every single party, you do this.",
  ),
  "f-g2": G("Do what, Trip? Exist?", "[cutting] Do what, Trip? Exist?"),
  "f-g3": G(
    "You're doing the voice. The host voice.",
    "[mocking] You're doing the voice. The host voice.",
  ),
  "f-t3": T(
    "I don't have a voice.",
    "[in exactly the host voice] I don't have a voice.",
  ),
  "f-t4": T(
    "Can we just have one nice night? One?",
    "[pleading, tired] Can we just have one nice night? One?",
  ),
  "f-g4": G(
    "This is the nice night, Trip.",
    "[hollow laugh] This is the nice night, Trip.",
  ),

  // You walked out
  "e-left-t": T(
    "Wait, you're leaving? Now?",
    "[stunned] Wait, you're leaving? Now?",
  ),
  "e-left-door-g": door(
    G(
      "Great. Now look what you did.",
      "[furious, muffled] Great. Now look what you did.",
    ),
  ),
  "e-left-door-t": door(T("What I did?!", "[shouting, muffled] What I did?!")),
} satisfies Record<string, ScriptLine>;

export type LineId = keyof typeof SCRIPT;

export const VOICE: Record<Speaker, string> = {
  TRIP: "iP95p4xoKVk53GoZ742B",
  GRACE: "XrExE9yKIg1WjnnlVkGX",
};

export function lineVoice(id: LineId) {
  const l: ScriptLine = SCRIPT[id];
  return { voice: VOICE[l.who], text: l.read ?? l.text };
}

/** Rude or not-a-name entries they won't say out loud. */
const UNSAYABLE =
  /(fuck|shit|cunt|dick|cock|puss|bitch|slut|whore|fag|nig|retard|penis|vagina|anal|anus|sex|porn|nazi|hitler|rape|kill|poop|butt|boob|tit)/i;

/** The guest's name as they'd say it, or null if they won't say it. */
export function cleanName(raw: string) {
  const n = raw.trim().split(/\s+/)[0] ?? "";
  if (!/^[A-Za-z][A-Za-z'-]{1,15}$/.test(n) || UNSAYABLE.test(n)) return null;
  return n[0].toUpperCase() + n.slice(1).toLowerCase();
}

export function nameVoice(raw: string, who: Speaker, tone: NameTone) {
  const n = cleanName(raw);
  if (!n) return null;
  const read =
    who === "TRIP"
      ? tone === "exclaim"
        ? `[delighted, loud] ${n}!`
        : `[friendly] ${n},`
      : tone === "exclaim"
        ? `[warm, surprised] ${n}!`
        : `[gently] ${n},`;
  return { voice: VOICE[who], text: read };
}

/** Small stable hash, so a changed line gets a fresh URL. */
function fnv(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

export const lineUrl = (id: LineId) =>
  `/api/dinner-party/voice?line=${id}&v=${fnv(lineVoice(id).text)}`;

export const nameUrl = (name: string, who: Speaker, tone: NameTone) =>
  `/api/dinner-party/voice?name=${encodeURIComponent(name)}&who=${who}&tone=${tone}&v=1`;
