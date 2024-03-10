export default async function sendNextSongInfo(req, res) {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache",
    "Content-Encoding": "none",
  });
  console.log("HELLO BABY");
  const getData = () => `retry: 5000\ndata: Current date is ${Date.now()}\n\n`;
  let timer: ReturnType<typeof setInterval>;
  res.write(getData());
  timer = setInterval(() => res.write(getData()), 3000);
}
