import { Visitor } from "../topiaInit"
import { errorHandler } from "../errorHandler"
import { Credentials } from "../../types/index";

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
