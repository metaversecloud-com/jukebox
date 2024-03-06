import { DroppedAsset, errorHandler } from "../index.ts"

export const getDroppedAsset = async (credentials) => {
  try {
    const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = credentials;

    const droppedAsset = await DroppedAsset.get(assetId, urlSlug, {
      credentials: {
        // Why pass apiKey here when it's already set in the Topia instance?
        // apiKey: process.env.API_KEY,
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
