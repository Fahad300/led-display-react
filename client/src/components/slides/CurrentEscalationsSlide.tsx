import React from "react";
import type { CurrentEscalationsSlide } from "../../types";

/**
 * CurrentEscalationsSlideComponent
 * Displays current escalations as a bordered table
 */
export const CurrentEscalationsSlideComponent: React.FC<{ slide: CurrentEscalationsSlide }> = ({ slide }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-persivia-white p-8 rounded-lg shadow animated-gradient-bg">
            <h2 className="text-5xl md:text-6xl font-bold text-persivia-white mb-12">Team's Current Ongoing Escalations Ticket Summary</h2>
            <div className="overflow-x-auto w-full max-w-8xl rounded-2xl backdrop-blur-md bg-white/20 bg-opacity-70 shadow-lg p-8">
                <table className="min-w-full rounded-lg">
                    <thead>
                        <tr>
                            <th className="px-8 py-6 border text-2xl md:text-3xl font-bold text-white text-center">Category</th>
                            <th className="px-8 py-6 border text-2xl md:text-3xl font-bold text-white text-center">Team</th>
                            <th className="px-8 py-6 border text-2xl md:text-3xl font-bold text-white text-center">Client</th>
                            <th className="px-8 py-6 border text-2xl md:text-3xl font-bold text-white text-center">Summary</th>
                            <th className="px-8 py-6 border text-2xl md:text-3xl font-bold text-white text-center">Avg. Response</th>
                            <th className="px-8 py-6 border text-2xl md:text-3xl font-bold text-white text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {slide.data.escalations.map((row, idx) => (
                            <tr key={idx} className="">
                                <td className={`px-8 py-6 border border-white text-xl md:text-2xl text-center text-white ${row.ticketCategory === "Code Blue" ? "bg-blue-500" : row.ticketCategory === "Code Red" ? "bg-red-500" : row.ticketCategory === "Code Yellow" ? "bg-yellow-500" : row.ticketCategory === "Code Green" ? "bg-green-500" : ""}`}>
                                    {row.ticketCategory}
                                </td>
                                <td className="px-8 py-6 border border-white text-xl md:text-2xl text-center text-white">{row.teamName}</td>
                                <td className="px-8 py-6 border border-white text-xl md:text-2xl text-center text-white">{row.clientName}</td>
                                <td className="px-8 py-6 border border-white text-xl md:text-2xl text-center text-white">{row.ticketSummary}</td>
                                <td className="px-8 py-6 border border-white text-xl md:text-2xl text-center text-white">{row.averageResponseTime}</td>
                                <td className={`px-8 py-6 border border-white text-xl md:text-2xl text-center text-white ${row.currentStatus === "Resolved" ? "bg-green-500" : row.currentStatus === "Open" ? "bg-red-500" : row.currentStatus === "Pending" ? "bg-yellow-500" : ""}`}>{row.ticketStatus}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}; 