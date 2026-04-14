import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAsset } from "../../utils/index.js";
import { DEFAULT_SETTINGS, JukeboxMode, JukeboxSettings } from "../../types/index.js";
import { DroppedAssetMediaType } from "@rtsdk/topia";

const VALID_MODES: JukeboxMode[] = ["jukebox", "karaoke"];

export default async function UpdateSettings(req: Request, res: Response) {
  try {
    const credentials = getCredentials(req.query);
    const { mode, name, imageUrl } = req.body as Partial<JukeboxSettings>;

    if (mode && !VALID_MODES.includes(mode)) {
      return res.status(400).json({ message: `mode must be one of: ${VALID_MODES.join(", ")}` });
    }

    const jukeboxAsset = await getDroppedAsset(credentials);

    const currentSettings: JukeboxSettings = jukeboxAsset.dataObject.settings || DEFAULT_SETTINGS;
    const newSettings: JukeboxSettings = {
      mode: mode ?? currentSettings.mode,
      name: name !== undefined ? name : currentSettings.name,
      imageUrl: imageUrl !== undefined ? imageUrl : currentSettings.imageUrl,
    };

    const { audioSliderVolume, audioRadius, mediaLink } = jukeboxAsset as any;
    if(currentSettings.mode !== newSettings.mode) {
          jukeboxAsset.updateMediaType({
            mediaLink: mediaLink,
            isVideo: newSettings.mode === "karaoke",
            mediaName: newSettings.name || "Jukebox",
            mediaType: DroppedAssetMediaType.LINK,
            audioSliderVolume: audioSliderVolume || 10,
            audioRadius: audioRadius || 2,
            portalName: "",
            syncUserMedia: true,
          })
      
      }

    const lockId = `${jukeboxAsset.id}-settings-${new Date(Math.round(new Date().getTime() / 5000) * 5000)}`;

    await jukeboxAsset.updateDataObject(
      { settings: newSettings },
      {
        lock: { lockId, releaseLock: true },
        analytics: [{ analyticName: "settingsUpdates", urlSlug: credentials.urlSlug }],
      },
    );

    return res.json({ success: true, settings: newSettings });
  } catch (error: any) {
    return errorHandler({
      error,
      functionName: "UpdateSettings",
      message: "Error updating settings",
      req,
      res,
    });
  }
}
