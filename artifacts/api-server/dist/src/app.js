import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import router from "./routes";
import { logger } from "./lib/logger";
import path from "path";
import fs from "node:fs";
const app = express();
const PgSession = connectPgSimple(session);
app.use(pinoHttp({
    logger,
    serializers: {
        req(req) {
            return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
        },
        res(res) {
            return { statusCode: res.statusCode };
        },
    },
}));
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
function resolvePublicPath() {
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
const indexHtml = path.join(publicPath, "index.html");
if (!fs.existsSync(indexHtml) && process.env.NODE_ENV !== "production") {
    logger.debug({ publicPath, cwd: process.cwd() }, "public/index.html not found");
}
app.use(express.static(publicPath));
// SPA fallback: skip /api and requests for static files (e.g. /assets/*.js)
app.get(/^(?!\/api(?:\/|$)).*/, (req, res, next) => {
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
export default app;
