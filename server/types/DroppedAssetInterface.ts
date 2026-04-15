import { DroppedAsset } from "@rtsdk/topia";
import { Video } from "./index.js";

export type JukeboxMode = "jukebox" | "karaoke";

export interface JukeboxSettings {
  mode: JukeboxMode;
  name: string;
  imageUrl: string;
}

export interface JukeboxDataObject {
  catalog: Video[];
  queue: string[];
  nowPlaying: string;
  settings?: JukeboxSettings;
  count?: number;
}

export interface IDroppedAsset extends Omit<DroppedAsset, "dataObject"> {
  dataObject: JukeboxDataObject;
  // Runtime-populated SDK fields not in the public type
  error?: any;
  audioSliderVolume?: number;
  audioRadius?: number;
  mediaPlayTime?: number;
  mediaLink?: string;
}
