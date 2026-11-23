import { IDroppedAsset } from "../../types/DroppedAssetInterface.js";
import { DEFAULT_SETTINGS } from "../../types/index.js";
import { errorHandler } from "../errorHandler.js";

export const initializeJukebox = async (droppedAsset: IDroppedAsset) => {
  try {
    await droppedAsset.fetchDataObject();

    const data: any = droppedAsset?.dataObject;
    const needsCatalogInit = !data?.catalog || !data?.queue;
    const needsSettingsInit = !data?.settings;

    if (needsCatalogInit || needsSettingsInit) {
      // adding a lockId and releaseLock will prevent race conditions and ensure the data object is being updated only once until either the time has passed or the operation is complete
      const lockId = `${droppedAsset.id}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;

      if (needsCatalogInit) {
        await droppedAsset.setDataObject(
          {
            catalog: [],
            queue: [],
            nowPlaying: "-1",
            settings: DEFAULT_SETTINGS,
          },
          { lock: { lockId } },
        );
      } else if (needsSettingsInit) {
        // Catalog already exists, just add settings without overwriting
        await droppedAsset.updateDataObject({ settings: DEFAULT_SETTINGS }, { lock: { lockId } });
      }
    }

    return;
  } catch (error) {
    errorHandler({
      error,
      functionName: "initializeJukebox",
      message: "Error initializing dropped asset data object",
    });
    return await droppedAsset.fetchDataObject();
  }
};
