import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CreateDeckModal from "./modals/CreateDeckModal";
import axios from "axios";
import '../styles/CollectionsPage.css'
import '../styles/Page.css'

const deckColours = [
  "#6366F1", // Indigo
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#06B6D4", // Cyan
  "#EC4899", // Pink
  "#84CC16", // Lime
];

const fetchCollection = async (collectionId) => {
    const response = await axios.get(
        `http://localhost:5001/api/collections/${collectionId}`
    );
    return response.data;
};

const fetchDeck = async (deckId) => {
    const response = await axios.get(
        `http://localhost:5001/api/decks/${deckId}`
    );
    return response.data;
};

function CollectionPage() {
    const { collectionId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [showAddDeckModal, setShowAddDeckModal] =
        useState(false);

    const {
        data: collection,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["collection", collectionId],
        queryFn: () => fetchCollection(collectionId),
        enabled: !!collectionId,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const handlePrefetchDeck = (deckId) => {
        queryClient.prefetchQuery({
            queryKey: ["deck", deckId],
            queryFn: () => fetchDeck(deckId),
            staleTime: 1000 * 60 * 5,
        });
    };


    const addDeck = (newDeck) => {
        queryClient.setQueryData(
            ["collections"],
            (old = []) => [...old, newDeck]
        );
    };

    const handleDeckCreated = (newDeck) => {
        queryClient.setQueryData(
            ["collection", collectionId],
            (oldCollection) => {
                if (!oldCollection) return oldCollection;

                return {
                    ...oldCollection,
                    decks: [
                        ...oldCollection.decks,
                        newDeck,
                    ],
                };
            }
        );

        setShowAddDeckModal(false);
    };


    if (isLoading) {
        return <h2>Loading...</h2>;
    }

    if (isError || !collection) {
        console.error(error);
        return <h2>Collection not found</h2>;
    }

    return (
        <div id="collection-page">
            <div className="section-1-page">
                <button onClick={() => navigate("/")}>
                    Go back to My Collections
                </button>

                <h1>{collection.collectionName}</h1>
            </div>

            <div className="exam-buttons">
                <button type="button">Practice Mode</button>
                <button type="button">Exam Inspera mode</button>
            </div>

            <div id="summary-table">
                <h5>Lecture Decks to Revise</h5>

                <h5>Lecture Decks most likely to be in exam</h5>

            </div>

            <div className="decks-container">
                    {!collection.decks || collection.decks.length === 0 ? (
                    <p>No decks in this collection.</p>
                    ) : (
                    collection.decks.map((deck, index) => (
                        <div
                        key={deck._id}
                        className="deck-card"
                        style={{
                            "--deck-colour":
                                deckColours[index % deckColours.length],
                        }}
                        role="button"
                        tabIndex={0}
                        onMouseEnter={() => handlePrefetchDeck(deck._id)}
                        onClick={() =>
                            navigate(
                            `/collections/${collectionId}/decks/${deck._id}`
                            )
                        }
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                            navigate(
                                `/collections/${collectionId}/decks/${deck._id}`
                            );
                            }
                        }}
                        >
                        <h3>{deck.deckName}</h3>
                        <p>{deck.cards?.length || 0} cards</p>
                        </div>
                    ))
                    )}


                <button
                    className="create-btn"
                    onClick={() =>
                        setShowAddDeckModal(true)
                    }
                >
                    Add Deck +
                </button>
            </div>

            <CreateDeckModal
                isOpen={showAddDeckModal}
                onClose={() =>
                    setShowAddDeckModal(false)
                }
                collectionId={collectionId}
            />
        </div>
    );
}

export default CollectionPage;