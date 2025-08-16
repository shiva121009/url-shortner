import { createServer } from 'http';
import { readFile } from 'fs/promises';
import path from 'path';
import { writeFile } from 'fs/promises';   // ✅ fixed (was from "fs", should be "fs/promises")
import crypto from 'crypto';               // ✅ missing import

const DATA_FILE = path.join("data", 'links.json');

const loadLinks = async () => {
  try {
    const data = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeFile(DATA_FILE, JSON.stringify({}));
      return {};
    }
    throw error;
  }
};

const saveLinks = async (links) => {
  await writeFile(DATA_FILE, JSON.stringify(links));
};

const server = createServer(async (req, res) => {
  if (req.method === "GET") {
    if (req.url === "/") {
      try {
        const data = await readFile(path.join("public", "index.html"));
        res.writeHead(200, { 'Content-Type': "text/html" });
        res.end(data);
      } catch (error) {
        res.writeHead(404, { 'Content-Type': "text/html" });
        res.end("<h1>404 Not Found</h1>");
      }
    } else if (req.url === "/style.css") {   // ✅ removed duplicate `if (req.method === "GET")`
      try {
        const data = await readFile(path.join("public", "style.css"));
        res.writeHead(200, { 'Content-Type': "text/css" });
        res.end(data);
      } catch (error) {
        res.writeHead(404, { 'Content-Type': "text/html" });
        res.end("<h1>404 Not Found</h1>");
      }
    }
    else if(req.url==="/links"){
      const links = await loadLinks();
      res.writeHead(200, { 'Content-Type': "application/json" });
      return res.end(JSON.stringify(links));
    }
    else {
      const links = await loadLinks();
      const shortCode =req.url.slice(1);
      if(links[shortCode]){
       res.writeHead(302, {location: links[shortCode]});
        return res.end();
      }
       res.writeHead(404, { 'Content-Type': "text/html" });
       return res.end("<h1>404 Not Found</h1>");
    }
  }

  if (req.method === "POST" && req.url === "/shorten") {
    const links = await loadLinks();
    let body = "";
    req.on("data", (chunk) => body += chunk);
    req.on("end", async () => {
      console.log(body);
      const { url, shortCode } = JSON.parse(body);

      if (!url) {
        res.writeHead(400, { 'Content-Type': "text/plain" });
        return res.end("URL is required");
      }

      const finalShortCode = shortCode || crypto.randomBytes(4).toString('hex');

      if (links[finalShortCode]) {
        res.writeHead(400, { 'Content-Type': "text/plain" });
        return res.end("short code already exists. Please choose another one.");
      }

      links[finalShortCode] = url;
      await saveLinks(links);

      res.writeHead(200, { 'Content-Type': "application/json" });
      res.end(JSON.stringify({ shortCode: finalShortCode, url }));
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
