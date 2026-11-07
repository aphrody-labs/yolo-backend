import { ZumbaWebmailEngine } from "./index.js";

const engine = new ZumbaWebmailEngine();

export function startZumbaServer(port = 8798) {
  const server = Bun.serve({
    port,
    fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === "/" || url.pathname === "/index.html") {
        return new Response(engine.getHtmlUi(), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      if (url.pathname === "/api/messages" && req.method === "GET") {
        const folder = url.searchParams.get("folder") || "inbox";
        return Response.json({
          folder,
          messages: engine.getFolderMessages(folder as any),
        });
      }

      if (
        (url.pathname === "/api/messages" ||
          url.pathname === "/api/messages/send") &&
        req.method === "POST"
      ) {
        return req
          .json()
          .then((body: any) => {
            const message = engine.sendMessage({
              from: body.from,
              to: body.to || "contact@aphrody.com",
              subject: body.subject || "(No subject)",
              html: body.html,
              text: body.text || body.body,
            });
            return Response.json({ success: true, message }, { status: 201 });
          })
          .catch((err: any) =>
            Response.json({ error: err.message }, { status: 400 }),
          );
      }

      if (url.pathname === "/health") {
        return Response.json({
          status: "healthy",
          service: "zumba-webmail",
          port,
        });
      }

      return new Response("Not Found", { status: 404 });
    },
  });

  console.log(`Zumba Webmail listening on http://localhost:${server.port}`);
  return server;
}

if (import.meta.main) {
  startZumbaServer();
}
