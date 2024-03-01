
// const { google } = require('googleapis');
// const path = require('path');
// const { authenticate } = require('@google-cloud/local-auth');

// // initialize the Youtube API library
// const youtube = google.youtube('v3');

import { youtube } from "@googleapis/youtube";

const yt = youtube({
  version: "v3",
  auth: process.env.GOOGLE_API_KEY,
});
// a very simple example of getting data from a playlist
async function runSample() {
  // the first query will return data with an etag
  const res = await getPlaylistData(null);
  const etag = res.data.etag;
  console.log(`etag: ${etag}`);

  // the second query will (likely) return no data, and an HTTP 304
  // since the If-None-Match header was set with a matching eTag
  const res2 = await getPlaylistData(etag);
  console.log(res2.status);
}

async function getPlaylistData(etag) {
  // Create custom HTTP headers for the request to enable use of eTags
  const headers = {};
  if (etag) {
    headers['If-None-Match'] = etag;
  }
  const res = yt.playlists.list({
    part: 'id,snippet',
    id: 'PLIivdWyY5sqIij_cgINUHZDMnGjVx3rxi',
    headers: headers,
  });
  console.log('Status code: ' + res.status);
  console.log(res.data);
  return res;
}

export { runSample }