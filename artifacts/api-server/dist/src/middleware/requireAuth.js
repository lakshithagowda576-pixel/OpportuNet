export function requireAuth(req, res, next) {
    if (!req.session?.userId) {
        res.status(401).json({ error: "Unauthorized. Please log in." });
        return;
    }
    next();
}
export function requireAdmin(req, res, next) {
    if (!req.session?.userId) {
        res.status(401).json({ error: "Unauthorized. Please log in." });
        return;
    }
    if (req.session?.userRole !== "admin") {
        res.status(403).json({ error: "Forbidden. Admin access required." });
        return;
    }
    next();
}
export function requireAdminOrHR(req, res, next) {
    if (!req.session?.userId) {
        res.status(401).json({ error: "Unauthorized. Please log in." });
        return;
    }
    const role = req.session?.userRole;
    if (role !== "admin" && role !== "hr") {
        res.status(403).json({ error: "Forbidden. Admin or HR access required." });
        return;
    }
    next();
}
