import { getVisitor } from "../utils";

const isAdminCheck = async (req, res) => {
  try {
    const { interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query;
    const visitor = await getVisitor({ interactivePublicKey, interactiveNonce, urlSlug, visitorId });
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    } else if (visitor.isAdmin) {
      return res.status(200).json({ isAdmin: true });
    } else {
      return res.status(200).json({ isAdmin: false });
    }

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

export default isAdminCheck;
