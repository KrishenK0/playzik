const { parse } = require("url");
const got = require("got");
const { get_visitor_id, sanitizeBrowse } = require('../lib/utils');

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Content-Type': 'application/json',
    'X-Goog-AuthUser': '0',
    'x-Origin': 'https://music.youtube.com',
    'Cookie': "YSC=X6GGDuHZufk; CONSENT=YES+cb.20220628-08-p2.fr+FX+651;",
  }
};

export default async function handler(req, res) {
  // Parse the "?url" query parameter.
  const targetUrl = parse(req.url, true).query?.url;

  // Make sure the provided URL is valid.
  if (!targetUrl) {
    res
      .status(401)
      .send('Please provide a valid URL in the "url" query parameter.');
    return;
  }

  try {
    const googleId = await get_visitor_id();
    // Use the got library to fetch the website content.
    // const { body: html, url } = await got(targetUrl, );

    const { body: html, url } = await got.post("https://music.youtube.com/youtubei/v1/browse?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30", {
      headers: options.headers,
      json: { 'context': { 'client': { 'clientName': 'WEB_REMIX', 'clientVersion': '0.1', 'hl': 'en', 'visitorData': googleId }, 'user': {} } },
      responseType: 'json'
    });

    // Extract the metadata from the website content.
    // The Vercel Edge Network can cache the response at the edge in order to
    // serve data to your users as fast as possible.
    // Here we're caching the response at the edge for 1 hour.
    // See https://vercel.com/docs/edge-network/caching for details.
    res.setHeader("Cache-Control", "s-maxage=3600");
    // Make this API publicly accessible.
    res.setHeader("Access-Control-Allow-Origin", "*");
    // Return the metadata as JSON
    res.status(200).json(await sanitizeBrowse(html));
  } catch (err) {
    console.log(err);
    res.status(401).json({ error: `Unable to scrape "${targetUrl}".` });
  }
}
