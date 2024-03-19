import { Visitor } from "../topiaInit.ts"
import { errorHandler } from "../errorHandler.ts"
import { Credentials } from "../../types/index.ts";

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
