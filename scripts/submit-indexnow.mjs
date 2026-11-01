/**
 * Automatic IndexNow Submission Script
 * Submits castov.com URLs to Bing, Yandex, Seznam & Naver via IndexNow protocol.
 */

import https from "node:https";

const HOST = "castov.com";
const KEY = "0c9eb8496b2547488d26ac1ffec3a82c";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const URLS = [
  `https://${HOST}/`,
  `https://${HOST}/tools`,
  `https://${HOST}/mcp`,
  `https://${HOST}/cli`,
  `https://${HOST}/extension`,
  `https://${HOST}/convert`,
  `https://${HOST}/guides`,
  `https://${HOST}/diff`,
  `https://${HOST}/jwt`,
  `https://${HOST}/secret-scanner`,
  `https://${HOST}/regex`,
  `https://${HOST}/cron`,
  `https://${HOST}/timestamp`,
  `https://${HOST}/http-status`,
  `https://${HOST}/cidr`,
  `https://${HOST}/chmod`,
  `https://${HOST}/sql-formatter`,
  `https://${HOST}/json-formatter`,
  `https://${HOST}/base64`,
  `https://${HOST}/hash-generator`,
  `https://${HOST}/uuid`,
  `https://${HOST}/lorem-ipsum`,
  `https://${HOST}/webhook-tester`,
  `https://${HOST}/tech-trends`,
  `https://${HOST}/cloud-status`,
  `https://${HOST}/regex-patterns`,
  `https://${HOST}/error-fixes`,
  `https://${HOST}/privacy`,
  `https://${HOST}/terms`,
  `https://${HOST}/security`
];

const payload = JSON.stringify({
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: URLS
});

const options = {
  hostname: "api.indexnow.org",
  port: 443,
  path: "/indexnow",
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload)
  }
};

console.log(`Submitting ${URLS.length} URLs to IndexNow (key: ${KEY})...`);

const req = https.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    if (res.statusCode === 200 || res.statusCode === 202) {
      console.log(`IndexNow submission succeeded! HTTP status: ${res.statusCode}`);
      console.log("Bing and IndexNow search engines have been notified.");
    } else {
      console.log(`IndexNow response HTTP ${res.statusCode}:`, data);
    }
  });
});

req.on("error", (err) => {
  console.error("IndexNow submission error:", err.message);
});

req.write(payload);
req.end();
