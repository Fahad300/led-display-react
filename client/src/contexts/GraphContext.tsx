import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GraphSlideData } from "../types";
import { fetchTeamWiseData } from "../services/graphService";

interface GraphContextType {
    teamWiseData: GraphSlideData | null;
    loading: boolean;
    error: string | null;
    refetchTeamWiseData: () => Promise<void>;
}

const GraphContext = createContext<GraphContextType | undefined>(undefined);

interface GraphProviderProps {
    children: ReactNode;
}

export const GraphProvider: React.FC<GraphProviderProps> = ({ children }) => {
    const [teamWiseData, setTeamWiseData] = useState<GraphSlideData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTeamWiseDataFromAPI = async () => {
        try {
            setError(null);
            const data = await fetchTeamWiseData();
            setTeamWiseData(data);
        } catch (err) {
            console.error("Error fetching team wise data:", err);
            setError("Failed to fetch team wise data");
        }
    };

    const refetchTeamWiseData = async () => {
        await fetchTeamWiseDataFromAPI();
    };

    // Initial data fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                await fetchTeamWiseDataFromAPI();
            } catch (err) {
                console.error("Error fetching initial graph data:", err);
                setError("Failed to fetch initial graph data");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const value: GraphContextType = {
        teamWiseData,
        loading,
        error,
        refetchTeamWiseData
    };

    return (
        <GraphContext.Provider value={value}>
            {children}
        </GraphContext.Provider>
    );
};

export const useGraphs = (): GraphContextType => {
    const context = useContext(GraphContext);
    if (context === undefined) {
        throw new Error("useGraphs must be used within a GraphProvider");
    }
    return context;
};
