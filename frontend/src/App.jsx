import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../src/components/Home";
import CollectionPage from "../src/components/CollectionPage"
import DeckPage from "../src/components/DeckPage";
import "./index.css";

function App() {

  return (
    <div id="layout">
      <div id="top-bar"></div>
      <Routes>
        <Route 
          path="/" 
          element={<Home />} />
        <Route
          path="/collections/:collectionId"
          element={<CollectionPage />}
        />
        <Route 
          path="/decks/:deckId" 
          element={<DeckPage />} 
        />
      </Routes>


      <div id="display-bar">

      </div>

      </div>

  );
}

export default App;