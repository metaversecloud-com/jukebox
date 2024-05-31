import { errorHandler, getCredentials, getDroppedAsset } from "../../utils/index.js";
import { Request, Response } from "express";

export default async function GetJukeboxDataObject(req: Request, res: Response) {
  try {
    const credentials = getCredentials(req.query);
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
                profileId: credentials.profileId,
                uniqueKey: credentials.profileId,
                urlSlug: credentials.urlSlug,
              },
            ],
          },
        )
        .then()
        .catch(() => console.error("Error sending analytics for views"));
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
