import { Credentials } from "../types";
import { getVisitor } from "../utils";
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
