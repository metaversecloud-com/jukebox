import { errorHandler, getCredentials, getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";
import { getAvailableVideos } from "../../utils/youtube/index.js";
import { checkIsAdmin } from "../../middleware/isAdmin.js";

export default async function GetJukeboxDataObject(req: Request, res: Response) {
  try {
    const credentials = getCredentials(req.query);
    const {  profileId, urlSlug } = credentials;

    const jukeboxAsset = await getDroppedAsset(credentials);
    if (jukeboxAsset.error) {
      return res.status(404).json({ message: "Asset not found" });
    }
    if (jukeboxAsset) {
      jukeboxAsset
        .updateDataObject(
          {},
          {
            analytics: [
              {
                analyticName: "views",
                profileId,
                uniqueKey: profileId,
                urlSlug,
              },
            ],
          },
        )
        .then()
        .catch(() => console.error("Error sending analytics for views"));

      const isAdmin = checkIsAdmin(credentials);
      if (isAdmin) {
        const videoIds = await getAvailableVideos(jukeboxAsset.dataObject.catalog);
        jukeboxAsset.dataObject.catalog = jukeboxAsset.dataObject.catalog.map((video) => {
          return {
            ...video,
            exists: videoIds.includes(video.id.videoId),
          };
        });
      }

      return res.status(200).json(jukeboxAsset.dataObject);
    }
  } catch (error: any) {
    return errorHandler({
      error,
      functionName: "GetJukeboxDataObject",
      message: "Error getting Jukebox",
      req,
      res,
    });
  }
}
