import { Visitor } from "../topiaInit.js"
import { errorHandler } from "../errorHandler.js"
import { Credentials } from "../../types/index.js";

export const getVisitor = async (credentials: Credentials) => {
  try {
    const { interactivePublicKey, interactiveNonce, urlSlug, visitorId } = credentials;

    const visitor = await Visitor.get(parseInt(visitorId), urlSlug, {
      credentials: {
        interactiveNonce,
        interactivePublicKey,
        visitorId: parseInt(visitorId),
      },
    });
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
