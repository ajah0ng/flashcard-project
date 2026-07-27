import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function signSessionToken(user) {
    return jwt.sign(
        {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            avatar: user.avatar,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

function setSessionCookie(res, token) {
    res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_MAX_AGE_MS,
    });
}

// POST /api/auth/google -- body: { credential } (Google ID token)
export async function googleSignIn(req, res) {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: "Missing credential" });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        const user = await User.findOneAndUpdate(
            { googleId: payload.sub },
            {
                googleId: payload.sub,
                email: payload.email,
                name: payload.name,
                avatar: payload.picture,
            },
            { new: true, upsert: true }
        );

        setSessionCookie(res, signSessionToken(user));

        res.status(200).json({
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
        });
    } catch (error) {
        console.error("Error in googleSignIn", error);

        res.status(401).json({ message: "Google sign-in failed" });
    }
}

// GET /api/auth/me -- requires requireAuth
export async function getCurrentUser(req, res) {
    try {
        const user = await User.findById(req.user.id).lean();

        if (!user) {
            return res.status(401).json({ message: "Not signed in" });
        }

        res.status(200).json({
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
        });
    } catch (error) {
        console.error("Error in getCurrentUser", error);

        res.status(500).json({ message: "Internal server error" });
    }
}

// POST /api/auth/logout
export function signOut(req, res) {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ message: "Signed out" });
}
