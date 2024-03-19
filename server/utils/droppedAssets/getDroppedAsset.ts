import { Credentials } from "../../types/index.ts";
import { DroppedAsset, errorHandler } from "../index.ts"

export const getDroppedAsset = async (credentials: Credentials) => {
  try {
    const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = credentials;

    const droppedAsset = await DroppedAsset.get(assetId, urlSlug, {
      credentials: {
        interactiveNonce,
        interactivePublicKey,
        visitorId,
      },
    });

    if (!droppedAsset) throw "Dropped asset not found";

    return droppedAsset;
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getDroppedAsset",
      message: "Error getting dropped asset",
    });
  }
};
