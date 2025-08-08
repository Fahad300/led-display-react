import React, { useRef } from "react";
import { GraphSlide as GraphSlideType } from "../../types";
import { useGraphs } from "../../contexts/GraphContext";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartData,
    ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// Priority-based color mapping with better variety
const PRIORITY_COLORS: { [key: string]: string } = {
    'C-Level (Top Priority: fix immediately)': '#FF0000', // Bright Red
    'P1 - Blocker (fix immediately)': '#FF6B35', // Bright Orange
    'P2 - Critical (must fix)': '#D4AF37', // Light Yellow/Camel
    'P3 - Major (really should fix)': '#4ECDC4', // Bright Teal
    'P4 - Minor (should fix)': '#00FF88', // Vibrant Green
    // Fallback colors for other categories
    'Critical': '#FF0000',
    'High': '#FF6B35',
    'Medium': '#4ECDC4',
    'Low': '#00FF88',
    'C-Level': '#FF0000',
    'P1': '#FF6B35',
    'P2': '#D4AF37',
    'P3': '#4ECDC4',
    'P4': '#00FF88',
};

/**
 * Get color based on priority category
 */
const getPriorityColor = (category: string): string => {
    return PRIORITY_COLORS[category] || '#808080'; // Default gray if not found
};

export const GraphSlide: React.FC<{ slide: GraphSlideType }> = ({ slide }) => {
    const chartRef = useRef<ChartJS<"bar">>(null);
    const { teamWiseData, loading, error } = useGraphs();

    // Use live data from context if available, otherwise show loading or empty state
    const graphData = teamWiseData || {
        title: slide.data.title,
        description: slide.data.description,
        graphType: slide.data.graphType,
        timeRange: slide.data.timeRange,
        lastUpdated: slide.data.lastUpdated,
        categories: slide.data.categories,
        data: [] // Empty data instead of sample data
    };

    // Transform data to match PHP format for horizontal stacked bars
    const labels = graphData.data.map(team => team.teamName);

    // Create datasets for each priority/category (horizontal stacked bars)
    const datasets = graphData.categories.map((category) => ({
        label: category,
        data: graphData.data.map(team => {
            const point = team.dataPoints.find(dp => dp.category === category);
            return point ? point.value : 0;
        }),
        backgroundColor: getPriorityColor(category),
        borderColor: getPriorityColor(category),
        borderWidth: 0,
        fill: true,
        barPercentage: 0.8,
    }));

    const chartData: ChartData<"bar"> = {
        labels,
        datasets
    };

    // Chart options matching PHP implementation
    const options: ChartOptions<"bar"> = {
        indexAxis: 'y' as const, // Horizontal bars
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
                labels: {
                    color: '#fff',
                    font: {
                        size: 13,
                        weight: 'bold',
                        family: 'Inter, system-ui, sans-serif',
                    },
                    padding: 15,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            title: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
                padding: 12,
                boxPadding: 6,
                usePointStyle: true,
                cornerRadius: 8,
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: ${context.parsed.x} escalations`;
                    }
                }
            }
        },
        scales: {
            x: {
                stacked: true, // Stacked bars
                grid: { color: 'rgba(255,255,255,0.08)' },
                ticks: {
                    color: '#fff',
                    font: {
                        size: 12,
                        weight: 'normal',
                        family: 'Inter, system-ui, sans-serif'
                    }
                }
            },
            y: {
                stacked: true, // Stacked bars
                grid: { color: 'rgba(255,255,255,0.08)' },
                ticks: {
                    color: '#fff',
                    font: {
                        size: 12,
                        weight: 'normal',
                        family: 'Inter, system-ui, sans-serif'
                    }
                }
            }
        },
        onClick: (event, elements) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                const datasetIndex = elements[0].datasetIndex;
                const selectedTeam = labels[index];
                const selectedPriority = graphData.categories[datasetIndex];

                // Handle click - you can add navigation logic here
                console.log(`Clicked: Team ${selectedTeam}, Priority ${selectedPriority}`);

            }
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-persivia-white p-4 md:p-6 pb-16 rounded-lg shadow animated-gradient-bg overflow-hidden">
            <div className="text-center mb-4 md:mb-6">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                    {graphData.title}
                </h2>
            </div>
            <div className="w-full h-full max-w-7xl rounded-2xl backdrop-blur-md bg-white/10 bg-opacity-70 shadow-xl border border-white/20 p-4 md:p-6 overflow-hidden">
                <div className="">
                </div>
                <div className="relative flex-1 min-h-0" style={{ height: 'calc(100% - 40px)' }}>
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <p className="text-white/70 text-lg font-medium">Loading team data...</p>
                                <p className="text-white/50 text-sm mt-2">Fetching live data from API</p>
                            </div>
                        </div>
                    ) : (chartData.labels && chartData.labels.length > 0 && chartData.datasets && chartData.datasets.length > 0) ? (
                        <Bar
                            ref={chartRef as React.RefObject<ChartJS<"bar">>}
                            data={chartData as ChartData<"bar">}
                            options={options as ChartOptions<"bar">}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <p className="text-white/70 text-lg font-medium">No data available for graph</p>
                                {error && (
                                    <p className="text-red-300 text-sm mt-2">Error: {error}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs md:text-sm">
                    <div className="flex items-center gap-2 text-white/70">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="font-medium">Last updated: {new Date(graphData.lastUpdated).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="font-medium">Time range: {graphData.timeRange.charAt(0).toUpperCase() + graphData.timeRange.slice(1)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}; 