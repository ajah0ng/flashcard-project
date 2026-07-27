import { useRef } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import "../styles/LandingPage.css";

function LandingPage() {
  const { signInWithGoogle } = useAuth();
  const hiddenGoogleButtonRef = useRef(null);

  const handleSignInClick = () => {
    hiddenGoogleButtonRef.current
      ?.querySelector('div[role="button"]')
      ?.click();
  };

  return (
    <div id="landing-page">
      <section className="landing-hero">
        <span className="landing-eyebrow">Collections are exams blocks, Decks are lectures. Cards are course outlines. </span>
        <h1>Flashcards, without the extra stuff.</h1>
        <p className="landing-lede">
          Built for UNSW BIOC, BABS, and BINF long-extended exams. Organise your coursework throughout the term and prepare for extended-response exams, midterms, and finals with a completely student-driven study tool designed for long-term retention and effective memory recall.
        </p>
        <div className="landing-signin">
          <button
            type="button"
            className="landing-signin-btn"
            onClick={handleSignInClick}
          >
            Sign in
          </button>

          <div className="landing-signin-hidden" ref={hiddenGoogleButtonRef}>
            <GoogleLogin
              onSuccess={(credentialResponse) =>
                signInWithGoogle(credentialResponse.credential)
              }
              onError={() => console.error("Google sign-in failed")}
            />
          </div>
        </div>
      </section>

      <section className="landing-demo">
        <div className="landing-demo-frame">
          <div className="landing-demo-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M8 5v14l11-7L8 5Z" />
            </svg>
          </div>
          <p>Product demo walkthrough coming soon</p>
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-feature-card">
          <div className="landing-feature-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M3 9h18" />
              <path d="M8 4v-1" />
              <path d="M16 4v-1" />
            </svg>
          </div>
          <h3>Inspera Mode</h3>
          <p>
            Practice under simulated Inspera exam conditions: content
            revealed one item at a time, in a fixed sequence, with hints
            and saved notes hidden until you finish.
          </p>
        </div>

        <div className="landing-feature-card">
          <div className="landing-feature-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
            </svg>
          </div>
          <h3>Collections &amp; decks</h3>
          <p>
            Lecture decks are built entirely by yourself. Test yourself against your own knowledge.
          </p>
        </div>

        <div className="landing-feature-card">
          <div className="landing-feature-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="m9 9 6 6M15 9l-6 6" />
            </svg>
          </div>
          <h3>No AI</h3>
          <p>
            Every card is written by you. Nothing is generated, so what
            you study is exactly what you'll be tested on. 
          </p>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
