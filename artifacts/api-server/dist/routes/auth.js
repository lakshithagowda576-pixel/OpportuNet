import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, hrEmailsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
const router = Router();
const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
function getOAuthRedirectUri(req, provider) {
    const configuredBase = (process.env.OAUTH_CALLBACK_BASE_URL || "").replace(/\/$/, "");
    const inferredBase = `${req.protocol}://${req.get("host")}`;
    const base = configuredBase || inferredBase;
    return `${base}/api/auth/${provider}/callback`;
}
function getFrontendLoginErrorUrl(errorCode) {
    const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
    if (!frontendUrl)
        return `/login?error=${encodeURIComponent(errorCode)}`;
    return `${frontendUrl}/login?error=${encodeURIComponent(errorCode)}`;
}
async function determineUserRole(email) {
    const [hrEmail] = await db.select().from(hrEmailsTable).where(eq(hrEmailsTable.email, email));
    if (hrEmail)
        return "hr";
    return "user";
}
// Register
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = registerSchema.parse(req.body);
        const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
        if (existing) {
            res.status(409).json({ error: "Email already registered." });
            return;
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const role = await determineUserRole(email);
        const [user] = await db.insert(usersTable).values({
            name, email, passwordHash, provider: "email", role,
        }).returning();
        req.session.userId = user.id;
        req.session.userRole = user.role;
        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
            address: user.address,
            resumeUrl: user.resumeUrl,
            education: user.education,
            qualification: user.qualification
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Registration failed." });
    }
});
// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
        if (!user) {
            res.status(401).json({ error: "Invalid email or password." });
            return;
        }
        if (!user.passwordHash) {
            res.status(401).json({ error: "This account uses social login. Please use the appropriate provider." });
            return;
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            res.status(401).json({ error: "Invalid email or password." });
            return;
        }
        // Refresh role in case it was updated in HR emails
        const actualRole = user.role === "admin" ? "admin" : await determineUserRole(email);
        if (actualRole !== user.role && user.role !== "admin") {
            await db.update(usersTable).set({ role: actualRole }).where(eq(usersTable.id, user.id));
            user.role = actualRole;
        }
        req.session.userId = user.id;
        req.session.userRole = user.role;
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
            address: user.address,
            resumeUrl: user.resumeUrl,
            education: user.education,
            qualification: user.qualification
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Login failed." });
    }
});
// Logout
router.post("/logout", (req, res) => {
    req.session?.destroy(() => { });
    res.json({ success: true });
});
// Get current user
router.get("/me", async (req, res) => {
    if (!req.session?.userId) {
        res.status(401).json({ error: "Not logged in." });
        return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
    if (!user) {
        res.status(401).json({ error: "User not found." });
        return;
    }
    // Dynamic role logic for HR
    if (user.role !== "admin") {
        const hrCheck = await determineUserRole(user.email);
        if (user.role !== hrCheck) {
            await db.update(usersTable).set({ role: hrCheck }).where(eq(usersTable.id, user.id));
            user.role = hrCheck;
            req.session.userRole = hrCheck;
        }
    }
    res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        address: user.address,
        resumeUrl: user.resumeUrl,
        education: user.education,
        qualification: user.qualification
    });
});
// Update Profile
router.patch("/profile", async (req, res) => {
    if (!req.session?.userId) {
        res.status(401).json({ error: "Not logged in." });
        return;
    }
    const updateSchema = z.object({
        name: z.string().min(2).optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        bio: z.string().optional(),
        skills: z.string().optional(),
        resumeUrl: z.string().optional(),
        education: z.string().optional(),
        qualification: z.string().optional(),
        avatar: z.string().optional(),
    });
    try {
        const updates = updateSchema.parse(req.body);
        const [updated] = await db.update(usersTable)
            .set(updates)
            .where(eq(usersTable.id, req.session.userId))
            .returning();
        res.json(updated);
    }
    catch (err) {
        res.status(400).json({ error: err.message || "Update failed." });
    }
});
async function handleSocialLogin(req, res, ghUser, primaryEmail, provider) {
    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, primaryEmail));
    if (!user) {
        const role = await determineUserRole(primaryEmail);
        const [created] = await db.insert(usersTable).values({
            name: ghUser.name || ghUser.login || ghUser.first_name || primaryEmail.split("@")[0],
            email: primaryEmail,
            provider,
            providerId: String(ghUser.id || ghUser.sub),
            avatar: ghUser.avatar_url || ghUser.picture || ghUser.profile_pic,
            role,
        }).returning();
        user = created;
    }
    else if (user.role !== "admin") {
        const role = await determineUserRole(primaryEmail);
        if (user.role !== role) {
            await db.update(usersTable).set({ role }).where(eq(usersTable.id, user.id));
            user.role = role;
        }
    }
    req.session.userId = user.id;
    req.session.userRole = user.role;
    // Use FRONTEND_URL if configured, otherwise try to stay on the same host
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl) {
        res.redirect(frontendUrl);
    }
    else {
        // If not configured, we try to go to the root of the current host
        // which should be the user-facing host (likely the frontend during dev)
        res.redirect("/");
    }
}
router.get("/github", (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId)
        return res.redirect(getFrontendLoginErrorUrl("GitHub OAuth not configured"));
    const redirectUri = getOAuthRedirectUri(req, "github");
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`);
});
router.get("/github/callback", async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = getOAuthRedirectUri(req, "github");
    if (!clientId || !clientSecret || !code)
        return res.redirect(getFrontendLoginErrorUrl("OAuth failed"));
    try {
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
        });
        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;
        const userRes = await fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } });
        const ghUser = await userRes.json();
        const emailRes = await fetch("https://api.github.com/user/emails", { headers: { Authorization: `Bearer ${accessToken}` } });
        const emails = (await emailRes.json());
        const primaryEmail = emails.find((e) => e.primary)?.email || ghUser.email || `${ghUser.login}@github.com`;
        await handleSocialLogin(req, res, ghUser, primaryEmail, "github");
    }
    catch {
        res.redirect(getFrontendLoginErrorUrl("OAuth failed"));
    }
});
// Google OAuth
router.get("/google", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId)
        return res.redirect(getFrontendLoginErrorUrl("Google OAuth not configured"));
    const redirectUri = getOAuthRedirectUri(req, "google");
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email profile`);
});
router.get("/google/callback", async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = getOAuthRedirectUri(req, "google");
    if (!clientId || !clientSecret || !code)
        return res.redirect(getFrontendLoginErrorUrl("OAuth failed"));
    try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri, grant_type: "authorization_code" }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            console.error("Google token response error:", tokenData);
            return res.redirect(getFrontendLoginErrorUrl("Failed to obtain access token from Google"));
        }
        const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
        const ghUser = await userRes.json();
        if (!ghUser.email) {
            console.error("Google user info error:", ghUser);
            return res.redirect(getFrontendLoginErrorUrl("Unable to retrieve user email from Google"));
        }
        await handleSocialLogin(req, res, ghUser, ghUser.email, "google");
    }
    catch (error) {
        console.error("Google OAuth error:", error);
        res.redirect(getFrontendLoginErrorUrl("OAuth failed"));
    }
});
// Facebook OAuth
router.get("/facebook", (req, res) => {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    if (!clientId)
        return res.redirect(getFrontendLoginErrorUrl("Facebook OAuth not configured"));
    const redirectUri = getOAuthRedirectUri(req, "facebook");
    res.redirect(`https://www.facebook.com/v11.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email`);
});
router.get("/facebook/callback", async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    const redirectUri = getOAuthRedirectUri(req, "facebook");
    if (!clientId || !clientSecret || !code)
        return res.redirect(getFrontendLoginErrorUrl("OAuth failed"));
    try {
        const tokenRes = await fetch(`https://graph.facebook.com/v11.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`);
        const tokenData = await tokenRes.json();
        const userRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`);
        const ghUser = await userRes.json();
        const email = ghUser.email || `${ghUser.id}@facebook.com`;
        ghUser.avatar_url = ghUser.picture?.data?.url;
        await handleSocialLogin(req, res, ghUser, email, "facebook");
    }
    catch {
        res.redirect(getFrontendLoginErrorUrl("OAuth failed"));
    }
});
export default router;
