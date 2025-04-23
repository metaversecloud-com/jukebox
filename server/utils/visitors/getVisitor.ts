import { Visitor } from "../topiaInit.js";
import { errorHandler } from "../errorHandler.js";
import { Credentials } from "../../types/index.js";

export const getVisitor = async (credentials: Credentials) => {
  try {
    const { urlSlug, visitorId } = credentials;

    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });
    // @ts-ignore
    if (!visitor || !visitor.username) throw "Not in world";

    return visitor;
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getVisitor",
      message: "Error getting visitor",
    });
  }
};
