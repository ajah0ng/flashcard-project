import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import CollectionPage from "./components/CollectionPage";
import DeckPage from "./components/DeckPage";
import CardPage from "./components/CardPage";
import AuthBar from "./components/AuthBar";
import LandingPage from "./components/LandingPage";
import LoadingSpinner from "./components/LoadingSpinner";
import { useAuth } from "./context/AuthContext";
import "./index.css";

function App() {
  const { user, isLoading } = useAuth();

  return (
    <div id="layout">
      <div id="top-bar">
        <AuthBar />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !user ? (
        <LandingPage />
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/collections/:collectionId"
            element={<CollectionPage />}
          />

          <Route
            path="/collections/:collectionId/decks/:deckId"
            element={<DeckPage />}
          />

          <Route
            path="/collections/:collectionId/decks/:deckId/cards/:cardId"
            element={<CardPage />}
          />
        </Routes>
      )}

      <div id="display-bar"></div>
    </div>
  );
}

export default App;
