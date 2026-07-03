import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AddDeckModal from "../collection/AddDeckModal"
import axios from "axios";
import '../../styles/CollectionsPage.css'

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
                <button onClick={() => navigate(-1)}>
                    Go back to My Collections
                </button>

                <h1>{collection.collectionName}</h1>
            </div>

            <div className="decks-container">
                {collection.decks.length === 0 ? (
                    <p>No decks in this collection.</p>
                ) : (
                    collection.decks.map((deck) => (
                        <div
                            key={deck._id}
                            className="deck-card"
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() =>
                                handlePrefetchDeck(deck._id)
                            }
                            onClick={() =>
                                navigate(`/decks/${deck._id}`)
                            }
                        >
                            <h3>{deck.deckName}</h3>
                            <p>
                                {deck.cards?.length || 0} cards
                            </p>
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

            <AddDeckModal
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