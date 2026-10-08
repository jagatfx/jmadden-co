declare module "@met4citizen/talkinghead" {
  import type { Object3D, Camera } from "three";
  export type SpeakAudio = {
    audio: AudioBuffer;
    words: string[];
    wtimes: number[];
    wdurations: number[];
  };
  export class TalkingHead {
    constructor(node: HTMLElement, opt: Record<string, unknown>);
    armature: Object3D;
    audioCtx: AudioContext;
    isSpeaking: boolean;
    lipsync: Record<string, unknown>;
    speakTo: TalkingHead | Object3D | null;
    showAvatar(
      avatar: Record<string, unknown>,
      onprogress?: (e: ProgressEvent) => void,
    ): Promise<void>;
    animate(dt: number): void;
    speakAudio(
      r: SpeakAudio,
      opt?: Record<string, unknown>,
      onsubtitles?: (s: string) => void,
    ): void;
    setMood(mood: string): void;
    playGesture(
      name: string,
      dur?: number,
      mirror?: boolean,
      ms?: number,
    ): void;
    stopSpeaking(): void;
    makeEyeContact(t: number): void;
    lookAtCamera(t: number): void;
  }
  export type { Camera };
}
declare module "@met4citizen/talkinghead/modules/lipsync-en.mjs" {
  export class LipsyncEn {}
}
