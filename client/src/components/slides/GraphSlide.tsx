import React, { useRef } from "react";
import { GraphSlide as GraphSlideType } from "../../types";
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

const TYPE_COLORS = [
    "#E53935", // Critical - Red
    "#FB8C00", // High - Orange
    "#43A047", // Medium - Green
    "#1E88E5", // Low - Blue
];

/**
 * GraphSlide Component
 * Styled to match TeamComparisonSlideComponent and CurrentEscalationsSlideComponent
 */
export const GraphSlide: React.FC<{ slide: GraphSlideType }> = ({ slide }) => {
    const chartRef = useRef<ChartJS<"bar">>(null);

    // X-axis: team names
    const labels = slide.data.data.map(team => team.teamName);
    // Datasets: escalation types
    const datasets = slide.data.categories.map((cat, idx) => ({
        label: cat,
        data: slide.data.data.map(team => {
            const point = team.dataPoints.find(dp => dp.category === cat);
            return point ? point.value : 0;
        }),
        backgroundColor: TYPE_COLORS[idx % TYPE_COLORS.length],
        borderColor: TYPE_COLORS[idx % TYPE_COLORS.length],
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: 0.7,
        categoryPercentage: 0.7,
    }));

    const chartData: ChartData<"bar"> = {
        labels,
        datasets
    };

    // Chart options
    const options: ChartOptions<"bar"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#fff',
                    font: {
                        size: 16,
                        weight: 'bold',
                        family: 'inherit',
                    }
                }
            },
            title: { display: false },
            tooltip: {
                backgroundColor: '#fff',
                titleColor: '#134D67',
                bodyColor: '#134D67',
                borderColor: '#134D67',
                borderWidth: 1,
                padding: 12,
                boxPadding: 6,
                usePointStyle: true,
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: ${context.parsed.y} escalations`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255,255,255,0.12)' },
                ticks: { color: '#fff', font: { size: 14 } }
            },
            x: {
                grid: { color: 'rgba(255,255,255,0.12)' },
                ticks: { color: '#fff', font: { size: 14 } }
            }
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-persivia-white p-8 rounded-lg shadow animated-gradient-bg">
            <h2 className="text-5xl md:text-6xl font-bold text-persivia-white mb-8">{slide.data.title}</h2>
            <div className="w-full max-w-8xl overflow-x-auto rounded-2xl backdrop-blur-md bg-white/20 bg-opacity-70 shadow-lg p-8">
                <div className="mb-4">
                    <p className="text-xl text-white font-light mb-2">{slide.data.description}</p>
                </div>
                <div className="relative min-h-[320px]">
                    {(chartData.labels && chartData.labels.length > 0 && chartData.datasets && chartData.datasets.length > 0) ? (
                        <Bar
                            ref={chartRef as React.RefObject<ChartJS<"bar">>}
                            data={chartData as ChartData<"bar">}
                            options={options as ChartOptions<"bar">}
                        />
                    ) : (
                        <div className="text-white text-center text-xl">No data available for graph.</div>
                    )}
                </div>
                <div className="mt-6 text-sm text-white flex flex-row items-center justify-between">
                    <span>Last updated: {new Date(slide.data.lastUpdated).toLocaleString()}</span>
                    <span>Time range: {slide.data.timeRange.charAt(0).toUpperCase() + slide.data.timeRange.slice(1)}</span>
                </div>
            </div>
        </div>
    );
}; 