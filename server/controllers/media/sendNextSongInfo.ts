import { getDroppedAsset } from "../../utils";

const getStockPrice = (range, base) => (Math.random() * range + base).toFixed(2);
const getTime = () => new Date().toLocaleTimeString();

// export default async function sendNextSongInfo(req, res) {
//   const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.query;
//   console.log("HERHER", assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId);
//   res.writeHead(200, {
//     "Access-Control-Allow-Origin": "*",
//     "Connection": "keep-alive",
//     "Content-Type": "text/event-stream; charset=utf-8",
//     "Cache-Control": "no-cache",
//     "Content-Encoding": "none",
//   });
//   console.log(">>> Connection opened!")
//   const getData = () => `retry: 5000\ndata: Current date is ${Date.now()}\n\n`;
//   let timer: ReturnType<typeof setInterval>;
//   res.write(getData());
//   timer = setInterval(() => res.write(getData()), 3000);
// }

async function getCurrentMedia(credentials) {
  const droppedAsset = await getDroppedAsset(credentials);
  const { currentPlayIndex, media } = droppedAsset.dataObject;
  const newMedia = JSON.stringify(media[currentPlayIndex]);
  return newMedia;
}
export default async function sendNextSongInfo(req, res) {
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = req.body;
  const credentials = { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId };

  res.writeHead(200, {
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });
  const getData = (newMedia) => `retry: 5000\ndata: ${newMedia}\n\n`;
  setInterval(async () => {
    const newMedia = await getCurrentMedia(credentials);
    res.write(getData(newMedia));
  }, 5000);
}
