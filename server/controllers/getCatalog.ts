import { DroppedAsset, getDroppedAsset } from "../utils";

const getCatalog = async (req, res) => {
  try {
    const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query;
    const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId };
    const droppedAsset = await getDroppedAsset(credentials);

    // const droppedAssetWithMediaDuration = droppedAsset.dataObject.media.map((video) => {
    //   return {
    //     ...video,
    //     duration: 1000,
    //   };
    // });
    if (droppedAsset) {
      res.json(droppedAsset.dataObject);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

export default getCatalog;
