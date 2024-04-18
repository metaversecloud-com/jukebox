import { Credentials } from "../types/index.js";
import { getVisitor } from "../utils/index.js";
import { Request, Response, NextFunction } from "express";

const checkIsAdmin = async (credentials) => {
  const { interactivePublicKey, interactiveNonce, urlSlug, visitorId } = credentials;
  const visitor = await getVisitor({ interactivePublicKey, interactiveNonce, urlSlug, visitorId });
  if (!visitor.isAdmin) {
    return false;
  }
  return true
}

async function isAdmin(req: Request, res: Response, next: NextFunction) {
  const { interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query as Credentials;
  const isAdmin = await checkIsAdmin({ interactivePublicKey, interactiveNonce, urlSlug, visitorId });
  if (!isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export { isAdmin, checkIsAdmin };
