import { getVisitor } from "../utils";

async function isAdmin(req, res, next) {
  const { interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query;
  const visitor = await getVisitor({ interactivePublicKey, interactiveNonce, urlSlug, visitorId });
  if (!visitor.isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// async function isAdminWebhook(req, res, next) {
//   const { interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.body;
//   const visitor = await getVisitor({ interactivePublicKey, interactiveNonce, urlSlug, visitorId });
//   if (!visitor.isAdmin) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }
//   next();
// }

export { isAdmin };
