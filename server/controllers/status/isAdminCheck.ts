import { Credentials } from "../../types/index.js";
import { errorHandler, getVisitor } from "../../utils/index.js";
import { Request, Response } from "express";

export default async function isAdminCheck(req: Request, res: Response) {
  try {
    const { interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query as Credentials;
    const visitor = await getVisitor({ interactivePublicKey, interactiveNonce, urlSlug, visitorId });
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    } else if (visitor.isAdmin) {
      return res.status(200).json({ isAdmin: true });
    } else {
      return res.status(200).json({ isAdmin: false });
    }
  } catch (err) {
    return errorHandler({
      err,
      functionName: "isAdminCheck",
      message: "Error in Admin Check",
      req, res
    });
  }
}
