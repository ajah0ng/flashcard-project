import { useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import "../styles/AuthBar.css";

function AuthBar() {
    const { user, isLoading, signInWithGoogle, signOut } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!isMenuOpen) return;

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMenuOpen]);

    if (isLoading) {
        return null;
    }

    if (!user) {
        return (
            <div className="auth-bar">
                <GoogleLogin
                    onSuccess={(credentialResponse) =>
                        signInWithGoogle(credentialResponse.credential)
                    }
                    onError={() => console.error("Google sign-in failed")}
                    size="medium"
                    shape="pill"
                />
            </div>
        );
    }

    return (
        <div className="auth-bar">
            <div className="auth-profile-menu" ref={menuRef}>
                <button
                    type="button"
                    className="auth-profile-btn"
                    onClick={() => setIsMenuOpen((open) => !open)}
                >
                    {user.avatar ? (
                        <img src={user.avatar} alt="" className="auth-profile-avatar" />
                    ) : (
                        <span className="auth-profile-avatar auth-profile-avatar-fallback">
                            {(user.name || user.email || "?").charAt(0).toUpperCase()}
                        </span>
                    )}
                    <span className="auth-profile-name">{user.name}</span>
                </button>

                {isMenuOpen && (
                    <div className="auth-profile-dropdown">
                        <p className="auth-profile-email">{user.email}</p>

                        <button
                            type="button"
                            className="auth-sign-out-btn"
                            onClick={() => {
                                setIsMenuOpen(false);
                                signOut();
                            }}
                        >
                            Sign out
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AuthBar;
