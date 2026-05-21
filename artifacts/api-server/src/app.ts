import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import router from "./routes";
import { logger } from "./lib/logger";
import path from "path";
import fs from "node:fs";

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

app.use(cors({
  origin: true,
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

const publicPath = resolvePublicPath();

app.use(express.static(publicPath));

// For all other non-API routes, send the React index.html for client-side routing
app.get(/.*/, (req: Request, res: Response) => {
  res.sendFile(path.resolve(publicPath, "index.html"));
});

export default app;
