import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getProductionPersistenceStatus } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Sprint 17.7: production hardening for public Railway exposure.
  app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(
    "/api/trpc",
    rateLimit({
      windowMs: Number(process.env.SBTS_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
      max: Number(process.env.SBTS_RATE_LIMIT_MAX ?? 300),
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please wait and try again.",
      },
    })
  );
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const allowedOrigin = process.env.APP_PUBLIC_URL || process.env.ALLOWED_ORIGIN || "";
  app.use((req, res, next) => {
    if (allowedOrigin) {
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      if (req.method === "OPTIONS") return res.sendStatus(204);
    }
    next();
  });

  app.get("/api/health", async (_req, res) => {
    try {
      const persistence = await getProductionPersistenceStatus();
      res.json({
        status: "ok",
        app: "SBTS",
        version: process.env.SBTS_APP_VERSION || "16.0.0",
        nodeEnv: process.env.NODE_ENV || "development",
        database: persistence.databaseAvailable ? "connected" : "demo-fallback",
        databaseUrlConfigured: persistence.databaseUrlConfigured,
        schemaVersion: persistence.schemaVersion,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        status: "error",
        app: "SBTS",
        version: process.env.SBTS_APP_VERSION || "16.0.0",
        database: "unavailable",
        message: error instanceof Error ? error.message : "Health check failed",
        generatedAt: new Date().toISOString(),
      });
    }
  });

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
