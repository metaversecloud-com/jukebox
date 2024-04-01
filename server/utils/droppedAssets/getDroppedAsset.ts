import { Credentials } from "../../types/index.js";
import { DroppedAsset, errorHandler } from "../index.js";

export const getDroppedAsset = async (credentials: Credentials) => {
  try {
    const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = credentials;
    if (!assetId || !interactivePublicKey || !interactiveNonce || !urlSlug || !visitorId) throw "Invalid credentials";

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
