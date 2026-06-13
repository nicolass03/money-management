import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler from "serve-handler";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");
const port = Number(process.env.PORT ?? 3000);

const securityHeaders: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

if (process.env.NODE_ENV === "production") {
  securityHeaders["Strict-Transport-Security"] =
    "max-age=31536000; includeSubDomains";
}

const server = createServer(async (req, res) => {
  for (const [key, value] of Object.entries(securityHeaders)) {
    res.setHeader(key, value);
  }

  const url = req.url ?? "/";
  if (url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  await handler(req, res, {
    public: distDir,
    rewrites: [{ source: "**", destination: "/index.html" }],
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Serving on http://0.0.0.0:${port}`);
});
