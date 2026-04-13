import { DroppedAsset } from "@rtsdk/topia";

export type JukeboxMode = "jukebox" | "karaoke";

export interface JukeboxSettings {
  mode: JukeboxMode;
  name: string;
  imageUrl: string;
}

export interface IDroppedAsset extends DroppedAsset {
  dataObject?: {
    count?: number;
    settings?: JukeboxSettings;
  };
}
