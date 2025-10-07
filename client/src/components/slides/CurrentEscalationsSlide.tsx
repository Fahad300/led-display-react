import React from "react";
import type { CurrentEscalationsSlide } from "../../types";
import { useUnified } from "../../contexts/UnifiedContext";

/**
 * CurrentEscalationsSlideComponent
 * Displays current escalations as a bordered table using data from UnifiedContext
 */
export const CurrentEscalationsSlideComponent: React.FC<{ slide: CurrentEscalationsSlide }> = ({ slide }) => {
    const { escalations } = useUnified();

    // Debug logging
    React.useEffect(() => {
        console.log("CurrentEscalationsSlide - escalations data:", escalations);
        console.log("CurrentEscalationsSlide - escalations length:", escalations?.length || 0);
    }, [escalations]);

    // Color mapping for categories
    const categoryColorMap: Record<string, string> = {
        'code blue': 'bg-blue-500/90',
        'c-level': 'bg-purple-500/90',
        'omega': 'bg-orange-500/90',
        'disaster': 'bg-red-500/90'
    };

    // Color mapping for statuses
    const statusColorMap: Record<string, string> = {
        'triage': 'bg-red-500/90',
        'support review': 'bg-orange-500/90',
        'in techsupport': 'bg-purple-500/90',
        'in product qa': 'bg-indigo-500/90',
        'in clientsupport': 'bg-orange-500/90',
        'closed': 'bg-green-500/90',
        'addressed': 'bg-green-500/90'
    };

    // Get category background color based on category type
    const getCategoryBackgroundColor = (category: string): string => {
        const normalizedCategory = category.toLowerCase().trim();

        // Check for exact match first
        if (categoryColorMap[normalizedCategory]) {
            return categoryColorMap[normalizedCategory];
        }

        // Check for partial matches
        for (const [key, color] of Object.entries(categoryColorMap)) {
            if (normalizedCategory.includes(key)) {
                return color;
            }
        }

        return 'bg-gray-500/90'; // Default gray for unknown categories
    };

    // Get status background color based on status type
    const getStatusBackgroundColor = (status: string): string => {
        const normalizedStatus = status.toLowerCase().trim();

        // Check for exact match first
        if (statusColorMap[normalizedStatus]) {
            return statusColorMap[normalizedStatus];
        }

        // Check for partial matches
        for (const [key, color] of Object.entries(statusColorMap)) {
            if (normalizedStatus.includes(key)) {
                return color;
            }
        }

        return 'bg-gray-500/90'; // Default gray for unknown statuses
    };

    // Transform API data to match the expected table format
    const transformEscalationsData = (data: any[]) => {
        console.log("🔍 TransformEscalationsData - Raw data:", data);
        return data.map(item => {
            console.log("🔍 TransformEscalationsData - Item:", item);
            return {
                key: item.key || "N/A",
                ticketCategory: item.category || "N/A",
                teamName: item.team || "N/A",
                clientName: item.client || "N/A",
                ticketSummary: item.summary || "N/A",
                currentStatus: item.status || "N/A"
            };
        });
    };

    const escalationsData = escalations.length > 0 ? transformEscalationsData(escalations) : [];
    const loading = false; // Loading is handled in UnifiedContext
    const error = null; // Error handling is in UnifiedContext
    const hasData = escalationsData.length > 0;


    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-persivia-white p-8 pb-16 rounded-lg shadow animated-gradient-bg">
            <h2 className="text-3xl md:text-4xl font-bold text-persivia-white mb-8">Current Ongoing Escalations</h2>
            <div className="w-full max-w-8xl overflow-x-auto rounded-2xl backdrop-blur-md bg-white/20 bg-opacity-70 shadow-lg p-8">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="text-center">
                            <div className="w-16 h-16 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-white/70 text-lg font-medium">Loading escalations data...</p>
                            <p className="text-white/50 text-sm mt-2">Fetching live data from API</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-white/70 text-lg font-medium">Error loading escalations</p>
                            <p className="text-red-300 text-sm mt-2">{error}</p>
                        </div>
                    </div>
                ) : !hasData ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-white/70 text-lg font-medium">No data available</p>
                        </div>
                    </div>
                ) : (
                    <table className="min-w-full rounded-lg border-separate border-spacing-2 bg-white/5">
                        <thead>
                            <tr className="bg-persivia-blue/90 shadow-lg">
                                <th className="px-6 py-5 text-xl md:text-2xl font-bold text-white text-center border-b-2 border-white/30 rounded-tl-lg">Category</th>
                                <th className="px-6 py-5 text-xl md:text-2xl font-bold text-white text-center border-b-2 border-white/30">Key</th>
                                <th className="px-6 py-5 text-xl md:text-2xl font-bold text-white text-center border-b-2 border-white/30">Team</th>
                                <th className="px-6 py-5 text-xl md:text-2xl font-bold text-white text-center border-b-2 border-white/30">Client</th>
                                <th className="px-6 py-5 text-xl md:text-2xl font-bold text-white text-center border-b-2 border-white/30">Summary</th>
                                <th className="px-6 py-5 text-xl md:text-2xl font-bold text-white text-center border-b-2 border-white/30 rounded-tr-lg">Status</th>
                            </tr>
                        </thead>
                        <tbody className="space-y-2">
                            {escalationsData.map((row, idx) => (
                                <tr
                                    key={idx}
                                    className={`${idx % 2 === 0 ? 'bg-white/15' : 'bg-white/10'} hover:bg-white/25 transition-all duration-200 rounded-lg shadow-md`}
                                >
                                    <td className={`px-6 py-5 text-xl text-white text-center font-bold rounded-l-lg ${getCategoryBackgroundColor(row.ticketCategory)}`}>
                                        {row.ticketCategory}
                                    </td>
                                    <td className="px-6 py-5 text-xl text-white text-center font-mono bg-white/5">{row.key}</td>
                                    <td className="px-6 py-5 text-xl text-white text-center bg-white/5">{row.teamName}</td>
                                    <td className="px-6 py-5 text-xl text-white text-center bg-white/5">{row.clientName}</td>
                                    <td className="px-6 py-5 text-xl text-white text-center bg-white/5">{row.ticketSummary}</td>
                                    <td className={`px-6 py-5 text-xl text-white text-center font-bold rounded-r-lg ${getStatusBackgroundColor(row.currentStatus)}`}>
                                        {row.currentStatus}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}; 