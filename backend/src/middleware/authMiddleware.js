import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ message: "Not signed in" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            avatar: decoded.avatar,
        };

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired session" });
    }
}
