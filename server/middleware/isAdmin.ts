import { Credentials } from "../types/index.js";
import { getVisitor } from "../utils/index.js";
import { Request, Response, NextFunction } from "express";

async function isAdmin(req: Request, res: Response, next: NextFunction) {
  const { interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query as Credentials;
  const visitor = await getVisitor({ interactivePublicKey, interactiveNonce, urlSlug, visitorId });
  if (!visitor.isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export { isAdmin };
