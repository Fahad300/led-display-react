import React from "react";
import type { TeamComparisonSlide } from "../../types";
import { useGraphs } from "../../contexts/GraphContext";

/**
 * TeamComparisonSlideComponent
 * Displays a comparison of team metrics in a table format using data from GraphContext
 */
export const TeamComparisonSlideComponent: React.FC<{ slide: TeamComparisonSlide }> = ({ slide }) => {
    const { teamWiseData, loading, error } = useGraphs();

    // Transform graph data to team comparison format
    const transformGraphDataToTeams = () => {
        if (!teamWiseData || !teamWiseData.data || teamWiseData.data.length === 0) {
            return [];
        }

        const allTeams = teamWiseData.data.map(team => {
            // Calculate totals for each priority level
            const cLevelCount = team.dataPoints.find(dp => dp.category.includes('C-Level'))?.value || 0;
            const p1Count = team.dataPoints.find(dp => dp.category.includes('P1'))?.value || 0;
            const p2Count = team.dataPoints.find(dp => dp.category.includes('P2'))?.value || 0;
            const p3Count = team.dataPoints.find(dp => dp.category.includes('P3'))?.value || 0;
            const p4Count = team.dataPoints.find(dp => dp.category.includes('P4'))?.value || 0;

            const totalTickets = cLevelCount + p1Count + p2Count + p3Count + p4Count;

            return {
                teamName: team.teamName,
                totalTickets: totalTickets,
                cLevelEscalations: cLevelCount,
                p1Escalations: p1Count,
                p2Escalations: p2Count,
                p3Escalations: p3Count,
                p4Escalations: p4Count
            };
        });

        // Sort by total tickets (descending) and return top 5
        return allTeams
            .sort((a, b) => b.totalTickets - a.totalTickets)
            .slice(0, 10);
    };

    const teams = transformGraphDataToTeams();
    const hasData = teams.length > 0;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-persivia-white p-6 pb-16 rounded-lg shadow animated-gradient-bg overflow-hidden">
            <h2 className="text-3xl md:text-4xl font-bold text-persivia-white mb-6">Performance Comparison ( Top 10 ) </h2>
            <div className="w-full max-w-7xl rounded-2xl backdrop-blur-md bg-white/20 bg-opacity-70 shadow-lg p-6 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <p className="text-white/70 text-lg font-medium">Loading team data...</p>
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
                            <p className="text-white/70 text-lg font-medium">Error loading team data</p>
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
                            <p className="text-white/70 text-lg font-medium">No team data available</p>
                        </div>
                    </div>
                ) : (
                    <table className="min-w-full rounded-lg">
                        <thead>
                            <tr className="bg-persivia-blue/90">
                                <th className="px-6 py-4 text-lg md:text-xl font-bold text-white text-left">Team</th>
                                <th className="px-6 py-4 text-lg md:text-xl font-bold text-white text-center">Total</th>
                                <th className="px-6 py-4 text-lg md:text-xl font-bold text-white text-center">C-Level</th>
                                <th className="px-6 py-4 text-lg md:text-xl font-bold text-white text-center">P1</th>
                                <th className="px-6 py-4 text-lg md:text-xl font-bold text-white text-center">P2</th>
                                <th className="px-6 py-4 text-lg md:text-xl font-bold text-white text-center">P3</th>
                                <th className="px-6 py-4 text-lg md:text-xl font-bold text-white text-center">P4</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams.map((team, index) => (
                                <tr
                                    key={team.teamName}
                                    className={`${index % 2 === 0 ? 'bg-white/10' : 'bg-white/5'} hover:bg-white/20 transition-colors`}
                                >
                                    <td className="px-6 py-4 text-xl text-white font-medium border-r border-white/10">{team.teamName}</td>
                                    <td className="px-6 py-4 text-xl text-white text-center font-bold border-r border-white/10">{team.totalTickets}</td>
                                    <td className="px-6 py-4 text-xl text-white text-center font-medium border-r border-white/10 bg-red-500/40">{team.cLevelEscalations}</td>
                                    <td className="px-6 py-4 text-xl text-white text-center font-medium border-r border-white/10 bg-orange-500/40">{team.p1Escalations}</td>
                                    <td className="px-6 py-4 text-xl text-white text-center font-medium border-r border-white/10 bg-yellow-500/40">{team.p2Escalations}</td>
                                    <td className="px-6 py-4 text-xl text-white text-center font-medium border-r border-white/10 bg-blue-500/40">{team.p3Escalations}</td>
                                    <td className="px-6 py-4 text-xl text-white text-center font-medium bg-green-500/40">{team.p4Escalations}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
