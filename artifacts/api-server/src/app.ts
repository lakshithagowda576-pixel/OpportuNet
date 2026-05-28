import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import router from "./routes";
import { logger } from "./lib/logger";
import path from "path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app: Express = express();

const PgSession = connectPgSimple(session);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: Request) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res: Response) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// Tighten CORS: prefer FRONTEND_URL (comma-separated) if provided, else fall back to permissive for dev.
const frontendUrlEnv = process.env.FRONTEND_URL || "";
const allowedOrigins = frontendUrlEnv.split(",").map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser requests (curl, server-to-server) when no origin present
    if (!origin) return callback(null, true);

    if (allowedOrigins.length === 0) {
      // No explicit FRONTEND_URL set — allow any origin (legacy behavior)
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Deny unknown origins
    return callback(new Error('CORS policy does not allow access from this origin.'), false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env.SESSION_SECRET || "govportal-secret-key-change-in-production";
const databaseUrl = process.env.DATABASE_URL;

app.use(session({
  store: databaseUrl ? new PgSession({
    conString: databaseUrl,
    tableName: "session",
    createTableIfMissing: true,
  }) : undefined,
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  },
}));

app.use("/uploads", express.static("uploads"));
app.use("/api", router);

/** Resolve `public/` at runtime (Vercel Lambda cwd, bundled api/, or local dist). */
function resolvePublicPath(): string {
  const candidates = [
    path.join(process.cwd(), "public"),
    path.resolve(__dirname, "../public"),
    path.resolve(__dirname, "../../../public"),
    path.resolve(__dirname, "../../public"),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "index.html"))) {
      return dir;
    }
  }

  return path.resolve(__dirname, "../../public");
}

// Serve frontend static files only when explicitly enabled (production or SERVE_FRONTEND=true).
const publicPath = resolvePublicPath();
const indexHtml = path.join(publicPath, "index.html");

const serveFrontend = process.env.SERVE_FRONTEND === 'true' || process.env.NODE_ENV === 'production';

if (serveFrontend) {
  if (!fs.existsSync(indexHtml) && process.env.NODE_ENV !== "production") {
    logger.debug({ publicPath, cwd: process.cwd() }, "public/index.html not found");
  }

  app.use(express.static(publicPath));

  // SPA fallback: skip /api and requests for static files (e.g. /assets/*.js)
  app.get(/^(?!\/api(?:\/|$)).*/, (req: Request, res: Response, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }
    if (path.extname(req.path)) {
      return next();
    }
    if (!fs.existsSync(indexHtml)) {
      return res.status(503).send("Service temporarily unavailable");
    }
    res.sendFile(indexHtml, (err) => {
      if (err && !res.headersSent) {
        logger.debug({ err, publicPath }, "sendFile failed");
        res.status(500).send("Internal Server Error");
      }
    });
  });
} else {
  logger.debug({ serveFrontend }, 'Frontend static serving disabled (dev)');
}

export default app;
