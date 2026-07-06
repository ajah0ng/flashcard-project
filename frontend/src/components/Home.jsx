import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import CreateCollectionModal from "./modals/CreateCollectionModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/Home.css'
import threeDotsIcon from '../../assets/three-dots-vertical-svgrepo-com.svg'

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
    const [editingCollectionId, setEditingCollectionId] = useState(null);
    const [editedName, setEditedName] = useState("");

    const [openEditDeleteMenu, setOpenEditDeleteMenu] = useState(null);

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


    // Should show a modal
    const handleDelete = async (collectionId) => {
        try {
            await axios.delete(
                `http://localhost:5001/api/collections/${collectionId}`
            );

            // Remove it from the React Query cache
            queryClient.setQueryData(["collections"], (old = []) =>
                old.filter((collection) => collection._id !== collectionId)
            );

            setOpenEditDeleteMenu(null);
        } catch (error) {
            console.error("Failed to delete collection:", error);
        }
    };


    const handleEdit = (collectionId) => {
        const currentCollection = collections.find(
            (collection) => collection._id === collectionId
        );

        setEditingCollectionId(collectionId);
        setEditedName(currentCollection.collectionName);
        setOpenEditDeleteMenu(null);
    };

    const handleSaveEdit = async (collectionId) => {
        if (!editedName.trim()) return;

        try {
            const response = await axios.put(
                `http://localhost:5001/api/collections/${collectionId}`,
                {
                    collectionName: editedName.trim(),
                }
            );

            queryClient.setQueryData(["collections"], (old = []) =>
                old.map((collection) =>
                    collection._id === collectionId
                        ? response.data
                        : collection
                )
            );

            setEditingCollectionId(null);
            setEditedName("");
        } catch (error) {
            console.error("Failed to edit collection:", error);
        }
    };

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
                        onClick={() => {
                            if (editingCollectionId !== collection._id) {
                                navigate(`/collections/${collection._id}`);
                            }
                        }}
                    >
                        <div className="card-header">
                            {/* Users directly edit collection name */}
                            {editingCollectionId === collection._id ? (
                                <input
                                    autoFocus
                                    value={editedName}
                                    onChange={(e) => setEditedName(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleSaveEdit(collection._id);
                                        }

                                        if (e.key === "Escape") {
                                            setEditingCollectionId(null);
                                        }
                                    }}
                                    onBlur={() => handleSaveEdit(collection._id)}
                                />
                            ) : (
                                <h3>{collection.collectionName}</h3>
                            )}
                            <div className="menu-container">
                                <button
                                    className="icon-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenEditDeleteMenu(
                                            openEditDeleteMenu === collection._id ? null : collection._id
                                        );
                                    }}
                                >
                                    <img src={threeDotsIcon} alt="Menu" />
                                </button>

                                {openEditDeleteMenu === collection._id && (
                                    <div
                                        className="menu"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button onClick={() => handleEdit(collection._id)}>
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(collection._id)}>
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
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