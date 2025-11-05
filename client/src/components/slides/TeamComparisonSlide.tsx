import React from "react";
import type { TeamComparisonSlide } from "../../types";
import { useUnified } from "../../contexts/UnifiedContext";

/**
 * TeamComparisonSlideComponent
 * Displays a comparison of team metrics in a table format using data from UnifiedContext
 * 
 * NOTE: This component now uses teamComparisonData instead of graphData.
 * The Team Wise Data slide uses graphData, while Team Performance Comparison uses teamComparisonData.
 * 
 * Shows all teams in a single comprehensive table with all priority levels
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

    // Format team name - remove "TEAM" suffix and capitalize properly
    const formatTeamName = (teamName: string): string => {
        if (!teamName) return "UNKNOWN";

        // Remove "TEAM" suffix (case insensitive)
        let formatted = teamName.replace(/\s+TEAM\s*$/i, "");

        // Convert to ALL CAPS
        formatted = formatted.toUpperCase();

        return formatted;
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

            // Include all teams, even those with zero data
            // This ensures we see the complete picture of all teams

            return {
                teamName: formatTeamName(team.teamName || "Unknown Team"),
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

        // Sort by total tickets (descending) and return all teams
        return allTeams
            .sort((a: any, b: any) => b.totalTickets - a.totalTickets);
    };

    const allTeams = transformGraphDataToTeams();
    const hasData = allTeams.length > 0;
    const slideTitle = "Team Performance Comparison";

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-persivia-white px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 py-2 sm:py-3 md:py-4 pb-4 sm:pb-6 md:pb-8 rounded-lg shadow animated-gradient-bg overflow-hidden relative">

            <div className="flex flex-col items-center justify-space-between mb-0.5 sm:mb-1 md:mb-1.5 flex-shrink-0">
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-persivia-white mb-0.5 sm:mb-1">
                    {slideTitle}
                    <span className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-normal ml-0.5 sm:ml-1">({getDateRange()})</span>
                </h2>
            </div>
            <div className={`w-[88%] sm:w-[89%] md:w-[90%] lg:w-[91%] xl:w-[92%] 2xl:w-[93%] max-w-none rounded-2xl backdrop-blur-md bg-white/20 bg-opacity-70 shadow-lg overflow-hidden ${hasData ? "block h-auto p-0.5 sm:p-1 md:p-1.5 lg:p-2" : "flex-1 flex flex-col min-h-0"}`}>
                {loading ? (
                    <div className="flex items-center justify-center flex-1 min-h-[200px] sm:min-h-[300px] md:min-h-[400px] p-1 sm:p-1.5 md:p-2 lg:p-3">
                        <div className="text-center">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-white/70 text-xs sm:text-sm md:text-base lg:text-lg font-medium mt-2 sm:mt-4">Loading team data...</p>
                            <p className="text-white/50 text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2">Fetching live data from API</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center flex-1 min-h-[200px] sm:min-h-[300px] md:min-h-[400px] p-1 sm:p-1.5 md:p-2 lg:p-3">
                        <div className="text-center">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-white/70 text-xs sm:text-sm md:text-base lg:text-lg font-medium">Error loading team data</p>
                            <p className="text-red-300 text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2">{error}</p>
                        </div>
                    </div>
                ) : !hasData ? (
                    <div className="flex items-center justify-center flex-1 min-h-[200px] sm:min-h-[300px] md:min-h-[400px] p-1 sm:p-1.5 md:p-2 lg:p-3">
                        <div className="text-center">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-white/70 text-xs sm:text-sm md:text-base lg:text-lg font-medium">No team data available</p>
                        </div>
                    </div>
                ) : (
                    <div className="w-full">
                        <table className="w-full border-collapse table-auto">
                            <thead>
                                <tr className="bg-persivia-blue/90">
                                    <th className="px-0.5 sm:px-1 md:px-1 lg:px-1.5 xl:px-2 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-bold text-white text-left">Team</th>
                                    <th className="px-0 sm:px-0.5 md:px-0.5 lg:px-1 xl:px-1 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-bold text-white text-center">Disaster</th>
                                    <th className="px-0 sm:px-0.5 md:px-0.5 lg:px-1 xl:px-1 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-bold text-white text-center">Code Blue</th>
                                    <th className="px-0 sm:px-0.5 md:px-0.5 lg:px-1 xl:px-1 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-bold text-white text-center">C-Level</th>
                                    <th className="px-0 sm:px-0.5 md:px-0.5 lg:px-1 xl:px-1 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-bold text-white text-center">Omega</th>
                                    <th className="px-0 sm:px-0.5 md:px-0.5 lg:px-0.5 xl:px-1 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-bold text-white text-center">P1</th>
                                    <th className="px-0 sm:px-0.5 md:px-0.5 lg:px-0.5 xl:px-1 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-bold text-white text-center">P2</th>
                                    <th className="px-0 sm:px-0.5 md:px-0.5 lg:px-0.5 xl:px-1 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-bold text-white text-center">P3</th>
                                    <th className="px-0 sm:px-0.5 md:px-0.5 lg:px-0.5 xl:px-1 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-bold text-white text-center">P4</th>
                                    <th className="px-0 sm:px-0.5 md:px-0.5 lg:px-0.5 xl:px-1 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-bold text-white text-center">P5</th>
                                    <th className="px-0.5 sm:px-1 md:px-1 lg:px-1.5 xl:px-2 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base font-bold text-white text-center">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allTeams.map((team: any, index: number) => (
                                    <tr
                                        key={team.teamName}
                                        className={`${index % 2 === 0 ? "bg-white/10" : "bg-white/5"} hover:bg-white/20 transition-colors`}
                                    >
                                        <td className="px-0.5 sm:px-1 md:px-1 lg:px-1.5 xl:px-2 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base text-white font-medium border-r border-white/10">{team.teamName}</td>
                                        <td className="px-0 sm:px-0.5 md:px-0.5 lg:px-1 xl:px-1 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base text-white text-center font-medium border-r border-white/10 bg-red-900/60">{team.disasterEscalations}</td>
                                        <td className="px-0 sm:px-0.5 md:px-0.5 lg:px-1 xl:px-1 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base text-white text-center font-medium border-r border-white/10 bg-purple-900/60">{team.codeBlueEscalations}</td>
                                        <td className="px-0 sm:px-0.5 md:px-0.5 lg:px-1 xl:px-1 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base text-white text-center font-medium border-r border-white/10 bg-red-500/40">{team.cLevelEscalations}</td>
                                        <td className="px-0 sm:px-0.5 md:px-0.5 lg:px-1 xl:px-1 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base text-white text-center font-medium border-r border-white/10 bg-pink-600/40">{team.omegaEscalations}</td>
                                        <td className="px-0 sm:px-0.5 md:px-0.5 lg:px-0.5 xl:px-1 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base text-white text-center font-medium border-r border-white/10 bg-orange-500/40">{team.p1Escalations}</td>
                                        <td className="px-0 sm:px-0.5 md:px-0.5 lg:px-0.5 xl:px-1 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base text-white text-center font-medium border-r border-white/10 bg-yellow-500/40">{team.p2Escalations}</td>
                                        <td className="px-0 sm:px-0.5 md:px-0.5 lg:px-0.5 xl:px-1 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base text-white text-center font-medium border-r border-white/10 bg-blue-500/40">{team.p3Escalations}</td>
                                        <td className="px-0 sm:px-0.5 md:px-0.5 lg:px-0.5 xl:px-1 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base text-white text-center font-medium border-r border-white/10 bg-green-500/40">{team.p4Escalations}</td>
                                        <td className="px-0 sm:px-0.5 md:px-0.5 lg:px-0.5 xl:px-1 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base text-white text-center font-medium border-r border-white/10 bg-teal-500/40">{team.p5Escalations}</td>
                                        <td className="px-0.5 sm:px-1 md:px-1 lg:px-1.5 xl:px-2 py-0.5 sm:py-0.5 md:py-0.5 lg:py-1 xl:py-1 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm 2xl:text-base text-white text-center font-bold">{team.totalTickets}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
