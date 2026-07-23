import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CreateDeckModal from "./modals/CreateDeckModal";
import axios from "axios";
import '../styles/CollectionsPage.css'
import '../styles/Page.css'
import '../styles/Buttons.css'
import { getDeckColour } from "../utils/deckColours";

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

    const [editingDeckId, setEditingDeckId] = useState(null);
    const [editedDeckName, setEditedDeckName] = useState("");

    const [isEditingCollectionName, setIsEditingCollectionName] = useState(false);
    const [editedCollectionName, setEditedCollectionName] = useState("");
    const [collectionTitleSize, setCollectionTitleSize] = useState(null);
    const collectionTitleRef = useRef(null);

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

    const handleEditDeck = (deck) => {
        setEditingDeckId(deck._id);
        setEditedDeckName(deck.deckName);
    };

    const handleSaveDeckName = async (deckId) => {
        const trimmedName = editedDeckName.trim();

        if (!trimmedName) {
            setEditingDeckId(null);
            return;
        }

        try {
            const response = await axios.put(
                `http://localhost:5001/api/decks/${deckId}`,
                { updatedDeckName: trimmedName }
            );

            queryClient.setQueryData(
                ["collection", collectionId],
                (oldCollection) => {
                    if (!oldCollection) return oldCollection;

                    return {
                        ...oldCollection,
                        decks: oldCollection.decks.map((deck) =>
                            deck._id === deckId
                                ? { ...deck, deckName: response.data.deckName }
                                : deck
                        ),
                    };
                }
            );

            queryClient.setQueryData(["deck", deckId], (oldDeck) => {
                if (!oldDeck) return oldDeck;

                return { ...oldDeck, deckName: response.data.deckName };
            });

            setEditingDeckId(null);
        } catch (error) {
            console.error("Failed to edit deck:", error);
        }
    };

    const handleEditCollectionName = () => {
        if (collectionTitleRef.current) {
            const rect = collectionTitleRef.current.getBoundingClientRect();
            setCollectionTitleSize({ width: rect.width, height: rect.height });
        }

        setEditedCollectionName(collection.collectionName);
        setIsEditingCollectionName(true);
    };

    const handleSaveCollectionName = async () => {
        const trimmedName = editedCollectionName.trim();

        if (!trimmedName) {
            setIsEditingCollectionName(false);
            return;
        }

        try {
            const response = await axios.put(
                `http://localhost:5001/api/collections/${collectionId}`,
                { collectionName: trimmedName }
            );

            queryClient.setQueryData(
                ["collection", collectionId],
                (oldCollection) => {
                    if (!oldCollection) return oldCollection;

                    return {
                        ...oldCollection,
                        collectionName: response.data.collectionName,
                    };
                }
            );

            queryClient.setQueryData(["collections"], (old = []) =>
                old.map((c) =>
                    c._id === collectionId
                        ? { ...c, collectionName: response.data.collectionName }
                        : c
                )
            );

            setIsEditingCollectionName(false);
        } catch (error) {
            console.error("Failed to edit collection:", error);
        }
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
                <button
                    className="back-button"
                    onClick={() => navigate("/")}
                >
                    ← Back to My Collections
                </button>

                <div className="title-row">
                    {isEditingCollectionName ? (
                        <input
                            className="collection-name-input"
                            style={
                                collectionTitleSize
                                    ? {
                                          width: collectionTitleSize.width,
                                          height: collectionTitleSize.height,
                                      }
                                    : undefined
                            }
                            autoFocus
                            value={editedCollectionName}
                            onChange={(e) => setEditedCollectionName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSaveCollectionName();
                                }

                                if (e.key === "Escape") {
                                    setIsEditingCollectionName(false);
                                }
                            }}
                            onBlur={handleSaveCollectionName}
                        />
                    ) : (
                        <h1 ref={collectionTitleRef} onDoubleClick={handleEditCollectionName}>
                            {collection.collectionName}
                        </h1>
                    )}

                    <div className="exam-buttons">
                        <button type="button">Practice Mode</button>
                        <button type="button">Exam Mode</button>
                    </div>
                </div>
            </div>

            <div id="summary-table">
                <div className="summary-card">
                    <h3>📚 Lecture Decks to Revise</h3>

                    <p className="summary-subtitle">
                        Highest weighted lecture decks. Based on course outcomes that you have flagged as most likely to appear in the exam and to revise.
                    </p>

                    <ul>
                        <li>Lecture 2 – Cell Biology</li>
                        <li>Lecture 5 – DNA Replication</li>
                        <li>Lecture 8 – Genetics</li>
                    </ul>
                </div>
            </div>

            <div className="decks-container">
                    {!collection.decks || collection.decks.length === 0 ? (
                    <p>No decks in this collection.</p>
                    ) : (
                    collection.decks.map((deck) => (
                        <div
                        key={deck._id}
                        className="deck-card"
                        style={{
                            "--deck-colour": getDeckColour(deck._id),
                        }}
                        role="button"
                        tabIndex={0}
                        onMouseEnter={() => handlePrefetchDeck(deck._id)}
                        onClick={() => {
                        if (editingDeckId !== deck._id) {
                            navigate(
                            `/collections/${collectionId}/decks/${deck._id}`
                            );
                        }
                        }}
                        onKeyDown={(event) => {
                        if (
                            editingDeckId !== deck._id &&
                            (event.key === "Enter" || event.key === " ")
                        ) {
                            navigate(
                            `/collections/${collectionId}/decks/${deck._id}`
                            );
                        }
                        }}
                        >
                        {editingDeckId === deck._id ? (
                            <input
                                className="deck-name-input"
                                autoFocus
                                value={editedDeckName}
                                onChange={(e) => setEditedDeckName(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                    e.stopPropagation();

                                    if (e.key === "Enter") {
                                        handleSaveDeckName(deck._id);
                                    }

                                    if (e.key === "Escape") {
                                        setEditingDeckId(null);
                                    }
                                }}
                                onBlur={() => handleSaveDeckName(deck._id)}
                            />
                        ) : (
                            <h3
                                onClick={(e) => e.stopPropagation()}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    handleEditDeck(deck);
                                }}
                            >
                                {deck.deckName}
                            </h3>
                        )}
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