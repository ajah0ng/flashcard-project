import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchDeck = async (deckId) => {
    const response = await axios.get(
        `http://localhost:5001/api/decks/${deckId}`
    );
    return response.data;
};

function DeckPage() {
    const { deckId } = useParams();
    const navigate = useNavigate();
    // Always starts with one template deck
    const [decks, setDecks] = [" "];
    
    const {
        data: deck,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["deck", deckId],
        queryFn: () => fetchDeck(deckId),
        enabled: !!deckId,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    if (isLoading) {
        return <h2>Loading...</h2>;
    }

    if (isError) {
        console.log("deckId:", deckId);
        console.error("Query Error:", error);
        console.log(error.response?.data);
        return <h2>{error.message}</h2>;
    }

    return (
        <div id="deck-page">
            <div className="section-1-page">
                <button onClick={() => navigate(-1)}>
                    Go Back
                </button>

                <h1>{deck.deckName}</h1>
            </div>

            <div className="cards-container">
                {deck.cards?.length === 0 ? (
                    <p>No cards in this deck.</p>
                ) : (
                    deck.cards?.map((card) => (
                        <div
                            key={card._id}
                            className="card-item-card"
                        >
                            <h3>{card.courseOutcome}</h3>

                            {card.keyWords?.length > 0 && (
                                <p>
                                    <strong>Keywords:</strong>{" "}
                                    {card.keyWords.join(", ")}
                                </p>
                            )}

                            <p>{card.content}</p>
                        </div>
                    ))
                )}
                <button>Create Card +</button>
            </div>
        </div>
    );
}

export default DeckPage;