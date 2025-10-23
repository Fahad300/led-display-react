import React from "react";
import type { TeamComparisonSlide } from "../../types";
import { useUnified } from "../../contexts/UnifiedContext";

/**
 * TeamComparisonSlideComponent
 * Displays a comparison of team metrics in a table format using data from UnifiedContext
 * 
 * NOTE: This component now uses teamComparisonData instead of graphData.
 * The Team Wise Data slide uses graphData, while Team Performance Comparison uses teamComparisonData.
 */
export const TeamComparisonSlideComponent: React.FC<{ slide: TeamComparisonSlide }> = ({ slide }) => {
    const { teamComparisonData } = useUnified();
    const teamWiseData = teamComparisonData; // Use dedicated teamComparisonData
    const loading = false; // Loading is handled in UnifiedContext
    const error = null; // Error handling is in UnifiedContext


    // Extract date range from data (formatted by backend)
    const getDateRange = (): string => {
        if (!teamWiseData) {
            return "N/A";
        }

        // Check if backend provided a formatted dateRange field
        if ((teamWiseData as any).dateRange) {
            return (teamWiseData as any).dateRange;
        }

        // Fallback: format from lastUpdated
        if (teamWiseData.lastUpdated) {
            const date = new Date(teamWiseData.lastUpdated);
            return date.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric"
            });
        }

        return "N/A";
    };

    // Transform graph data to team comparison format
    const transformGraphDataToTeams = () => {
        if (!teamWiseData || !teamWiseData.data || !Array.isArray(teamWiseData.data) || teamWiseData.data.length === 0) {
            return [];
        }

        const allTeams = teamWiseData.data.map((team: any, index: number) => {
            // Ensure dataPoints exists and is an array
            if (!team.dataPoints || !Array.isArray(team.dataPoints) || team.dataPoints.length === 0) {
                // Skip teams with no data instead of showing "Unknown Team"
                return null;
            }

            // Calculate totals for each priority level (supporting new categories)
            const disasterCount = team.dataPoints.find((dp: any) => dp.category && dp.category.includes("Disaster"))?.value || 0;
            const codeBlueCount = team.dataPoints.find((dp: any) => dp.category && dp.category.includes("Code Blue"))?.value || 0;
            const cLevelCount = team.dataPoints.find((dp: any) => dp.category && dp.category.includes("C-Level"))?.value || 0;
            const omegaCount = team.dataPoints.find((dp: any) => dp.category && dp.category.includes("Omega"))?.value || 0;
            const p1Count = team.dataPoints.find((dp: any) => dp.category && dp.category.includes("P1"))?.value || 0;
            const p2Count = team.dataPoints.find((dp: any) => dp.category && dp.category.includes("P2"))?.value || 0;
            const p3Count = team.dataPoints.find((dp: any) => dp.category && dp.category.includes("P3"))?.value || 0;
            const p4Count = team.dataPoints.find((dp: any) => dp.category && dp.category.includes("P4"))?.value || 0;
            const p5Count = team.dataPoints.find((dp: any) => dp.category && dp.category.includes("P5"))?.value || 0;

            const totalTickets = disasterCount + codeBlueCount + cLevelCount + omegaCount + p1Count + p2Count + p3Count + p4Count + p5Count;

            // Only include teams with actual data
            if (totalTickets === 0) {
                return null;
            }

            return {
                teamName: team.teamName || "Unknown Team",
                totalTickets: totalTickets,
                disasterEscalations: disasterCount,
                codeBlueEscalations: codeBlueCount,
                cLevelEscalations: cLevelCount,
                omegaEscalations: omegaCount,
                p1Escalations: p1Count,
                p2Escalations: p2Count,
                p3Escalations: p3Count,
                p4Escalations: p4Count,
                p5Escalations: p5Count
            };
        }).filter(team => team !== null); // Remove null entries

        // Sort by total tickets (descending) and return top 10
        return allTeams
            .sort((a: any, b: any) => b.totalTickets - a.totalTickets)
            .slice(0, 10);
    };

    const teams = transformGraphDataToTeams();
    const hasData = teams.length > 0;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-persivia-white p-6 pb-16 rounded-lg shadow animated-gradient-bg overflow-hidden">
            <div className="flex flex-col items-center justify-space-between">
                <h2 className="text-3xl md:text-4xl font-bold text-persivia-white mb-6">
                    Team Performance Comparison
                    <span className="text-lg md:text-xl font-normal ml-2">({getDateRange()})</span>
                </h2>
            </div>
            <div className="w-[90%] max-w-6xl rounded-2xl backdrop-blur-md bg-white/20 bg-opacity-70 shadow-lg p-6 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="text-center">
                            <div className="w-16 h-16 
                            border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
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
                                <th className="px-4 py-3 text-base md:text-lg font-bold text-white text-left">Team</th>
                                <th className="px-4 py-3 text-base md:text-lg font-bold text-white text-center">Total</th>
                                <th className="px-3 py-3 text-sm md:text-base font-bold text-white text-center">Disaster</th>
                                <th className="px-3 py-3 text-sm md:text-base font-bold text-white text-center">Code Blue</th>
                                <th className="px-3 py-3 text-sm md:text-base font-bold text-white text-center">C-Level</th>
                                <th className="px-3 py-3 text-sm md:text-base font-bold text-white text-center">Omega</th>
                                <th className="px-3 py-3 text-sm md:text-base font-bold text-white text-center">P1</th>
                                <th className="px-3 py-3 text-sm md:text-base font-bold text-white text-center">P2</th>
                                <th className="px-3 py-3 text-sm md:text-base font-bold text-white text-center">P3</th>
                                <th className="px-3 py-3 text-sm md:text-base font-bold text-white text-center">P4</th>
                                <th className="px-3 py-3 text-sm md:text-base font-bold text-white text-center">P5</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams.map((team: any, index: number) => (
                                <tr
                                    key={team.teamName}
                                    className={`${index % 2 === 0 ? "bg-white/10" : "bg-white/5"} hover:bg-white/20 transition-colors`}
                                >
                                    <td className="px-4 py-3 text-lg text-white font-medium border-r border-white/10">{team.teamName}</td>
                                    <td className="px-4 py-3 text-lg text-white text-center font-bold border-r border-white/10">{team.totalTickets}</td>
                                    <td className="px-3 py-3 text-base text-white text-center font-medium border-r border-white/10 bg-red-900/60">{team.disasterEscalations}</td>
                                    <td className="px-3 py-3 text-base text-white text-center font-medium border-r border-white/10 bg-purple-900/60">{team.codeBlueEscalations}</td>
                                    <td className="px-3 py-3 text-base text-white text-center font-medium border-r border-white/10 bg-red-500/40">{team.cLevelEscalations}</td>
                                    <td className="px-3 py-3 text-base text-white text-center font-medium border-r border-white/10 bg-pink-600/40">{team.omegaEscalations}</td>
                                    <td className="px-3 py-3 text-base text-white text-center font-medium border-r border-white/10 bg-orange-500/40">{team.p1Escalations}</td>
                                    <td className="px-3 py-3 text-base text-white text-center font-medium border-r border-white/10 bg-yellow-500/40">{team.p2Escalations}</td>
                                    <td className="px-3 py-3 text-base text-white text-center font-medium border-r border-white/10 bg-blue-500/40">{team.p3Escalations}</td>
                                    <td className="px-3 py-3 text-base text-white text-center font-medium border-r border-white/10 bg-green-500/40">{team.p4Escalations}</td>
                                    <td className="px-3 py-3 text-base text-white text-center font-medium bg-teal-500/40">{team.p5Escalations}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
