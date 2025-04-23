import { getCredentials, getVisitor } from "../utils/index.js";
import { Request, Response, NextFunction } from "express";

const checkIsAdmin = async (credentials) => {
  const visitor = await getVisitor(credentials);
  if (!visitor.isAdmin) {
    return false;
  }
  return true;
};

async function isAdmin(req: Request, res: Response, next: NextFunction) {
  const credentials = getCredentials(req.query);
  const isAdmin = await checkIsAdmin(credentials);
  if (!isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export { isAdmin, checkIsAdmin };
