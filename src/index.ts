import { serve } from "bun";
import index from "./index.html";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    // Export a level as a downloadable .txt file.
    "/api/export": {
      async POST(req) {
        const { filename, content } = (await req.json()) as {
          filename: string;
          content: string;
        };
        return new Response(content, {
          headers: {
            "Content-Type": "text/plain",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
