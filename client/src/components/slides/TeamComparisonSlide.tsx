import React from "react";
import type { TeamComparisonSlide } from "../../types";

/**
 * TeamComparisonSlideComponent
 * Displays a comparison of team metrics in a table format
 */
export const TeamComparisonSlideComponent: React.FC<{ slide: TeamComparisonSlide }> = ({ slide }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-persivia-white p-8 rounded-lg shadow animated-gradient-bg">
            <h2 className="text-5xl md:text-6xl font-bold text-persivia-white mb-8">Team Performance Comparison</h2>
            <div className="w-full max-w-8xl overflow-x-auto rounded-2xl backdrop-blur-md bg-white/20 bg-opacity-70 shadow-lg p-8">
                <table className="min-w-full rounded-lg">   
                    <thead>
                        <tr className="bg-persivia-blue/80">
                            <th className="px-6 py-4 text-xl md:text-2xl font-bold text-white text-left">Team</th>
                            <th className="px-6 py-4 text-xl md:text-2xl font-bold text-white text-center">Total Tickets</th>
                            <th className="px-6 py-4 text-xl md:text-2xl font-bold text-white text-center">C-Level Escalations</th>
                            <th className="px-6 py-4 text-xl md:text-2xl font-bold text-white text-center">Omega</th>
                            <th className="px-6 py-4 text-xl md:text-2xl font-bold text-white text-center">Code Blue</th>
                            <th className="px-6 py-4 text-xl md:text-2xl font-bold text-white text-center">Avg. Response Time</th>
                            <th className="px-6 py-4 text-xl md:text-2xl font-bold text-white text-center">Avg. Lead Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {slide.data.teams.map((team, index) => (
                            <tr 
                                key={team.teamName} 
                                className={`${index % 2 === 0 ? 'bg-white/10' : 'bg-white/5'} hover:bg-white/20 transition-colors`}
                            >
                                <td className="px-6 py-4 text-xl text-white font-medium">{team.teamName}</td>
                                <td className="px-6 py-4 text-xl text-white text-center">{team.totalTickets}</td>
                                <td className="px-6 py-4 text-xl text-white text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full ${team.cLevelEscalations > 0 ? 'bg-red-500/90' : 'bg-green-500/90'} text-white`}>
                                        {team.cLevelEscalations}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xl text-white text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full ${team.omegaEscalations > 0 ? 'bg-yellow-500/90' : 'bg-green-500/90'} text-white`}>
                                        {team.omegaEscalations}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xl text-white text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full ${team.codeBlueEscalations > 0 ? 'bg-blue-500/90' : 'bg-green-500/90'} text-white`}>
                                        {team.codeBlueEscalations}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xl text-white text-center">{team.averageResponseTime}</td>
                                <td className="px-6 py-4 text-xl text-white text-center">{team.averageLeadTime}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
