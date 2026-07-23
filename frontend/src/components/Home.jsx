import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import DeleteConfirmationModal from "./modals/DeleteConfirmationModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/Home.css'
import '../styles/Page.css'
import '../styles/CollectionsPage.css'
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
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

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

    const handleCreateCollection = async () => {
        try {
            const response = await axios.post(
                "http://localhost:5001/api/collections",
                {
                    collectionName: "",
                    decks: [],
                }
            );

            addCollection(response.data);
        } catch (error) {
            console.error("Failed to create collection:", error);
        }
    };

    const handleOpenCollection = (collectionId) => {
        navigate(`/collections/${collectionId}`);

        axios
            .patch(`http://localhost:5001/api/collections/${collectionId}/study`)
            .then((response) => {
                queryClient.setQueryData(["collections"], (old = []) =>
                    old.map((collection) =>
                        collection._id === collectionId
                            ? { ...collection, lastStudiedAt: response.data.lastStudiedAt }
                            : collection
                    )
                );
            })
            .catch((error) => {
                console.error("Failed to record last studied time:", error);
            });
    };

    if (isLoading && collections.length === 0) {
        return <h2>Loading...</h2>;
    }


    const handleDelete = async (collectionId) => {
        try {
            await axios.delete(
                `http://localhost:5001/api/collections/${collectionId}`
            );

            // Remove it from the React Query cache
            queryClient.setQueryData(["collections"], (old = []) =>
                old.filter((collection) => collection._id !== collectionId)
            );

            setDeleteConfirmId(null);
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
                                handleOpenCollection(collection._id);
                            }
                        }}
                    >
                        <div className="card-header">
                            {/* Users directly edit collection name */}
                            {editingCollectionId === collection._id ? (
                                <input
                                    className="deck-name-input"
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
                                <h3
                                    className={
                                        !collection.collectionName
                                            ? "deck-name-placeholder"
                                            : undefined
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(collection._id);
                                    }}
                                >
                                    {collection.collectionName || "Untitled Collection"}
                                </h3>
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
                                        <button
                                            onClick={() => {
                                                setDeleteConfirmId(collection._id);
                                                setOpenEditDeleteMenu(null);
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                        <div>
                            <p className="deck-count">{collection.decks.length} decks</p>
                            <p className="last-accessed">
                                {collection.lastStudiedAt
                                    ? `Last accessed ${formatDistanceToNow(
                                          new Date(collection.lastStudiedAt),
                                          { addSuffix: true }
                                      )}`
                                    : "Not accessed yet"}
                            </p>
                        </div>
                    </div>
                ))}

                <button
                    className="create-btn"
                    onClick={handleCreateCollection}
                >
                    Create Collection +
                </button>
            </div>

            <DeleteConfirmationModal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={() => handleDelete(deleteConfirmId)}
                itemName={
                    collections.find(
                        (collection) => collection._id === deleteConfirmId
                    )?.collectionName
                }
            />
        </div>
    );
}

export default Home;