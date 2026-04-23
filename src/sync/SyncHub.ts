import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 4000 });

console.log(" Sync Hub running on port 4000");

wss.on("connection", (ws) => {
  console.log(" Client connected");

  ws.on("message", (message) => {
    try {
      const data = message.toString();

      
      const parsed = JSON.parse(data);

      if (!parsed.type || !parsed.key) {
        console.log(" Invalid event skipped");
        return;
      }

      for (const client of wss.clients) {
        if (client !== ws && client.readyState === 1) {
          client.send(data);
        }
      }

    } catch (err) {
      console.log(" Invalid JSON ignored");
    }
  });

  ws.on("close", () => {
    console.log(" Client disconnected");
  });

  ws.on("error", () => {
    console.log(" Client error");
  });
});