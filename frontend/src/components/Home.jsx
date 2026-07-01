import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import CreateCollectionModal from "./CreateCollectionModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/Home.css'

const fetchCollections = async () => {
    const response = await axios.get(
        "http://localhost:5001/api/collections"
    );
    return response.data;
};

const fetchCollection = async (collectionId) => {
    const response = await axios.get(
        `http://localhost:5001/api/collections/${collectionId}`
    );
    return response.data;
};

function Home() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [showCreateCollectionModal, setShowCreateCollectionModal] =
        useState(false);

    const {
        data: collections = [],
        isLoading,
    } = useQuery({
        queryKey: ["collections"],
        queryFn: fetchCollections,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const handlePrefetchCollection = (collectionId) => {
        queryClient.prefetchQuery({
            queryKey: ["collection", collectionId],
            queryFn: () => fetchCollection(collectionId),
            staleTime: 1000 * 60 * 5,
        });
    };

    const addCollection = (newCollection) => {
        queryClient.setQueryData(
            ["collections"],
            (old = []) => [...old, newCollection]
        );
    };

    if (isLoading && collections.length === 0) {
        return <h2>Loading...</h2>;
    }

    return (
        <div id="home-page">
            <h1>My Collections</h1>

            <div id="collections-container">
                {collections.map((collection) => (
                    <div
                        key={collection._id}
                        className="collection-card"
                        onMouseEnter={() =>
                            handlePrefetchCollection(
                                collection._id
                            )
                        }
                        onClick={() =>
                            navigate(
                                `/collections/${collection._id}`
                            )
                        }
                    >
                        <h3>{collection.collectionName}</h3>
                        <p>{collection.decks.length} decks</p>
                    </div>
                ))}

                <button
                    className="create-btn"
                    onClick={() =>
                        setShowCreateCollectionModal(true)
                    }
                >
                    Create Collection +
                </button>
            </div>

            <CreateCollectionModal
                isOpen={showCreateCollectionModal}
                onClose={() =>
                    setShowCreateCollectionModal(false)
                }
                onCollectionCreated={addCollection}
            />
        </div>
    );
}

export default Home;