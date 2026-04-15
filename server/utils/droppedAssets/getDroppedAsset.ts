import { Credentials } from "../../types/index.js";
import { DroppedAsset, errorHandler } from "../index.js";
import { initializeJukebox } from "./initializeJukebox.js";
import { IDroppedAsset } from "../../types/DroppedAssetInterface.js";

export const getDroppedAsset = async (credentials: Credentials): Promise<IDroppedAsset> => {
  try {
    const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = credentials;
    if (!assetId || !interactivePublicKey || !interactiveNonce || !urlSlug || !visitorId) throw "Invalid credentials";

    const droppedAsset = (await DroppedAsset.get(assetId, urlSlug, { credentials })) as IDroppedAsset;

    if (!droppedAsset) throw "Dropped asset not found";

    const dataObject = droppedAsset.dataObject as { catalog?: unknown; queue?: unknown } | undefined;
    if (!dataObject?.catalog || !dataObject?.queue) {
      await initializeJukebox(droppedAsset);
    }

    return droppedAsset;
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getDroppedAsset",
      message: "Error getting dropped asset",
    });
  }
};
