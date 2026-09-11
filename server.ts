import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { setupSignalingServer, getRoomsList, createOrGetRoom } from "./server/signaling";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Active Real-time Video/Audio Meeting Rooms
  app.get("/api/meetings/rooms", (req, res) => {
    res.json({ success: true, rooms: getRoomsList() });
  });

  app.post("/api/meetings/rooms", (req, res) => {
    const { id, title, hostName, schoolName } = req.body;
    const roomId = id || `ucore-meet-${Math.random().toString(36).substring(2, 8)}`;
    const room = createOrGetRoom(roomId, title, hostName, schoolName);
    res.json({
      success: true,
      room: {
        id: room.id,
        title: room.title,
        hostName: room.hostName,
        schoolName: room.schoolName,
        createdAt: room.createdAt,
        participantCount: room.participants.size,
      },
    });
  });

  // SEO files: robots.txt and sitemap.xml
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.sendFile(path.join(process.cwd(), "public", "robots.txt"));
  });

  app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml");
    res.sendFile(path.join(process.cwd(), "public", "sitemap.xml"));
  });

  // Create HTTP server for both Express and WebSocket upgrades
  const httpServer = http.createServer(app);

  // Setup WebSocket signaling server for WebRTC Video & Audio calls
  setupSignalingServer(httpServer);

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server with WebRTC signaling running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
