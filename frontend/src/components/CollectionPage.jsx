import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import DeleteConfirmationModal from "./modals/DeleteConfirmationModal";
import PracticeSession from "./PracticeSession";
import '../styles/CollectionsPage.css'
import '../styles/Page.css'
import '../styles/Buttons.css'
import '../styles/Home.css'
import '../styles/PracticeMode.css'
import { getDeckColour } from "../utils/deckColours";
import { shuffleArray } from "../utils/shuffle";
import { patchCardFields } from "../utils/cardCacheSync";
import threeDotsIcon from '../../assets/three-dots-vertical-svgrepo-com.svg'
import filledStarIcon from '../../assets/filled-star.svg'
import filledQuestionIcon from '../../assets/filled-question.svg'

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

    const [editingDeckId, setEditingDeckId] = useState(null);
    const [editedDeckName, setEditedDeckName] = useState("");

    const [openDeckMenuId, setOpenDeckMenuId] = useState(null);
    const [deleteDeckId, setDeleteDeckId] = useState(null);

    const [isEditingCollectionName, setIsEditingCollectionName] = useState(false);
    const [editedCollectionName, setEditedCollectionName] = useState("");
    const [collectionTitleSize, setCollectionTitleSize] = useState(null);
    const collectionTitleRef = useRef(null);

    const [isSelectingDecks, setIsSelectingDecks] = useState(false);
    const [selectedDeckIds, setSelectedDeckIds] = useState(new Set());
    const [practiceCards, setPracticeCards] = useState(null);
    const dragSelectRef = useRef({ isDragging: false, mode: "select" });

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

    const handleToggleDeckSelection = (deckId, forceMode) => {
        setSelectedDeckIds((prev) => {
            const next = new Set(prev);
            const shouldSelect = forceMode ?? !next.has(deckId);

            if (shouldSelect) {
                next.add(deckId);
            } else {
                next.delete(deckId);
            }

            return next;
        });
    };

    const handleDeckMouseDown = (deckId) => {
        if (!isSelectingDecks) return;

        const mode = selectedDeckIds.has(deckId) ? "deselect" : "select";
        dragSelectRef.current = { isDragging: true, mode };
        handleToggleDeckSelection(deckId, mode === "select");
    };

    const handleDeckMouseEnter = (deckId) => {
        if (!isSelectingDecks) {
            handlePrefetchDeck(deckId);
            return;
        }

        if (dragSelectRef.current.isDragging) {
            handleToggleDeckSelection(deckId, dragSelectRef.current.mode === "select");
        }
    };

    const handleStartSelectingDecks = () => {
        setIsSelectingDecks((wasSelecting) => {
            if (wasSelecting) {
                setSelectedDeckIds(new Set());
                return false;
            }

            setSelectedDeckIds(new Set());
            return true;
        });
    };

    const handleCancelSelectingDecks = () => {
        setIsSelectingDecks(false);
        setSelectedDeckIds(new Set());
    };

    const handleStartPractice = async () => {
        if (selectedDeckIds.size === 0) return;

        try {
            const decks = await Promise.all(
                Array.from(selectedDeckIds).map((deckId) =>
                    queryClient.fetchQuery({
                        queryKey: ["deck", deckId],
                        queryFn: () => fetchDeck(deckId),
                        staleTime: 1000 * 60 * 5,
                    })
                )
            );

            const allCards = decks.flatMap((deck) => {
                const deckPosition = collection.decks.findIndex((d) => d._id === deck._id);

                return (deck.cards || []).map((card) => ({
                    ...card,
                    deckId: deck._id,
                    deckName: deck.deckName,
                    deckColour: getDeckColour(
                        deck._id,
                        deckPosition === -1 ? undefined : deckPosition
                    ),
                }));
            });

            setPracticeCards(shuffleArray(allCards));
            setIsSelectingDecks(false);
            setSelectedDeckIds(new Set());
        } catch (error) {
            console.error("Failed to start practice mode:", error);
        }
    };

    const handleUpdatePracticeCard = async (cardId, deckId, updates) => {
        patchCardFields(queryClient, { cardId, deckId, collectionId, updates });

        try {
            await axios.put(`http://localhost:5001/api/cards/${cardId}`, updates);
        } catch (error) {
            console.error("Failed to update card:", error);
        }
    };

    useEffect(() => {
        if (!isSelectingDecks) return;

        const handleKeyDown = (event) => {
            if (event.key === "Enter") {
                handleStartPractice();
            }

            if (event.key === "Escape") {
                handleCancelSelectingDecks();
            }
        };

        const handleMouseUp = () => {
            dragSelectRef.current.isDragging = false;
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mouseup", handleMouseUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSelectingDecks, selectedDeckIds]);

    const handleCreateDeck = async () => {
        try {
            const response = await axios.post(
                "http://localhost:5001/api/decks",
                {
                    collectionId,
                    deckName: "",
                    cards: [],
                }
            );

            const newDeck = response.data;

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
        } catch (error) {
            console.error("Failed to create deck:", error);
        }
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

    const handleDeleteDeck = async (deckId) => {
        try {
            await axios.delete(`http://localhost:5001/api/decks/${deckId}`);

            queryClient.setQueryData(
                ["collection", collectionId],
                (oldCollection) => {
                    if (!oldCollection) return oldCollection;

                    return {
                        ...oldCollection,
                        decks: oldCollection.decks.filter(
                            (deck) => deck._id !== deckId
                        ),
                    };
                }
            );

            setDeleteDeckId(null);
        } catch (error) {
            console.error("Failed to delete deck:", error);
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
                        <h1
                            ref={collectionTitleRef}
                            className={!collection.collectionName ? "deck-name-placeholder" : undefined}
                            onDoubleClick={handleEditCollectionName}
                        >
                            {collection.collectionName || "Untitled Collection"}
                        </h1>
                    )}

                    <div className="exam-buttons">
                        <button
                            type="button"
                            className={isSelectingDecks ? "practice-mode-btn-active" : undefined}
                            onClick={handleStartSelectingDecks}
                        >
                            {isSelectingDecks ? "Cancel Selection" : "Practice Mode"}
                        </button>
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

                    {collection.decksToRevise && collection.decksToRevise.length > 0 ? (
                        <ol className="revise-rank-list">
                            {collection.decksToRevise.slice(0, 3).map((deck, rankIndex) => {
                                const deckPosition = collection.decks.findIndex(
                                    (d) => d._id === deck._id
                                );

                                return (
                                    <li
                                        key={deck._id}
                                        className="revise-rank-item"
                                        onClick={() =>
                                            navigate(`/collections/${collectionId}/decks/${deck._id}`)
                                        }
                                    >
                                        <span className="revise-rank-number">{rankIndex + 1}</span>

                                        <span
                                            className="revise-deck-dot"
                                            style={{
                                                "--deck-colour": getDeckColour(
                                                    deck._id,
                                                    deckPosition === -1 ? undefined : deckPosition
                                                ),
                                            }}
                                        />

                                        <span className="revise-deck-name">
                                            {deck.deckName || "Untitled Lecture"}
                                        </span>

                                        <span className="revise-badges">
                                            <span className="revise-badge">
                                                <img src={filledStarIcon} alt="" />
                                                {deck.favouriteCount}
                                            </span>

                                            <span className="revise-badge">
                                                <img src={filledQuestionIcon} alt="" />
                                                {deck.flaggedCount}
                                            </span>
                                        </span>
                                    </li>
                                );
                            })}
                        </ol>
                    ) : (
                        <p className="summary-subtitle">
                            No decks flagged for revision yet.
                        </p>
                    )}
                </div>
            </div>

            <div className="decks-container">
                    {!collection.decks || collection.decks.length === 0 ? (
                    <p>No decks in this collection.</p>
                    ) : (
                    collection.decks.map((deck, deckIndex) => (
                        <div
                        key={deck._id}
                        className={
                            "deck-card" +
                            (isSelectingDecks ? " deck-card-wiggle" : "") +
                            (selectedDeckIds.has(deck._id) ? " deck-card-selected" : "")
                        }
                        style={{
                            "--deck-colour": getDeckColour(deck._id, deckIndex),
                            "--wiggle-delay": `${(deckIndex % 4) * 0.06}s`,
                        }}
                        role="button"
                        tabIndex={0}
                        onMouseDown={() => handleDeckMouseDown(deck._id)}
                        onMouseEnter={() => handleDeckMouseEnter(deck._id)}
                        onClick={() => {
                        if (isSelectingDecks) return;

                        if (editingDeckId !== deck._id) {
                            navigate(
                            `/collections/${collectionId}/decks/${deck._id}`
                            );
                        }
                        }}
                        onKeyDown={(event) => {
                        if (isSelectingDecks) return;

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
                        {isSelectingDecks && (
                            <span
                                className={
                                    selectedDeckIds.has(deck._id)
                                        ? "deck-select-badge deck-select-badge-active"
                                        : "deck-select-badge"
                                }
                            >
                                {selectedDeckIds.has(deck._id) ? "✓" : ""}
                            </span>
                        )}

                        <div className="card-header">
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
                                    className={!deck.deckName ? "deck-name-placeholder" : undefined}
                                    onClick={(e) => {
                                        if (!isSelectingDecks) e.stopPropagation();
                                    }}
                                    onDoubleClick={(e) => {
                                        if (isSelectingDecks) return;
                                        e.stopPropagation();
                                        handleEditDeck(deck);
                                    }}
                                >
                                    {deck.deckName || "Untitled Lecture"}
                                </h3>
                            )}

                            {!isSelectingDecks && (
                                <div className="menu-container">
                                    <button
                                        className="icon-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDeckMenuId(
                                                openDeckMenuId === deck._id ? null : deck._id
                                            );
                                        }}
                                    >
                                        <img src={threeDotsIcon} alt="Menu" />
                                    </button>

                                    {openDeckMenuId === deck._id && (
                                        <div
                                            className="menu"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => {
                                                    setDeleteDeckId(deck._id);
                                                    setOpenDeckMenuId(null);
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <p>{deck.cards?.length || 0} cards</p>
                        </div>
                    ))
                    )}


                <button
                    className="create-btn"
                    onClick={handleCreateDeck}
                >
                    Add Deck +
                </button>
            </div>

            <DeleteConfirmationModal
                isOpen={!!deleteDeckId}
                onClose={() => setDeleteDeckId(null)}
                onConfirm={() => handleDeleteDeck(deleteDeckId)}
                title="Delete Deck"
                itemLabel="deck"
                itemName={
                    collection.decks.find((deck) => deck._id === deleteDeckId)
                        ?.deckName || "Untitled Lecture"
                }
            />

            {isSelectingDecks && (
                <div className="selection-hint-bar">
                    <span className="selection-hint-count">
                        {selectedDeckIds.size} deck{selectedDeckIds.size === 1 ? "" : "s"} selected
                    </span>
                    <span className="selection-hint-instruction">
                        Click or drag across decks to select · Press Enter to start · Esc to cancel
                    </span>
                </div>
            )}

            {practiceCards && (
                <PracticeSession
                    cards={practiceCards}
                    onClose={() => setPracticeCards(null)}
                    onUpdateCard={handleUpdatePracticeCard}
                />
            )}
        </div>
    );
}

export default CollectionPage;