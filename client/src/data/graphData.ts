import { GraphSlide, SLIDE_TYPES } from "../types";

const teamNames = [
    "Team Alpha", "Team Beta", "Team Gamma", "Team Delta", "Team Epsilon",
    "Team Zeta", "Team Eta", "Team Theta", "Team Iota", "Team Kappa"
];

const critical = [12, 8, 10, 15, 7, 13, 9, 11, 6, 14];
const high = [18, 15, 14, 20, 12, 17, 13, 16, 10, 19];
const medium = [25, 20, 22, 27, 19, 23, 21, 24, 18, 26];
const low = [30, 28, 26, 32, 24, 29, 27, 31, 22, 33];

/**
 * Sample graph data for escalation trends (10 teams, bar chart)
 */
export const graphData: GraphSlide["data"] = {
    title: "Escalation Trend Graph",
    description: "A visual graph comparing escalation volumes and types across teams.",
    graphType: "bar",
    timeRange: "monthly",
    lastUpdated: new Date().toISOString(),
    categories: ["Critical", "High", "Medium", "Low"],
    data: teamNames.map((teamName, idx) => ({
        teamName,
        dataPoints: [
            { date: "", value: critical[idx], category: "Critical" },
            { date: "", value: high[idx], category: "High" },
            { date: "", value: medium[idx], category: "Medium" },
            { date: "", value: low[idx], category: "Low" },
        ]
    }))
};

/**
 * Get a default graph slide with sample data
 */
export const getDefaultGraphSlide = (): GraphSlide => {
    return {
        id: "graph-1",
        name: "Escalation Trend Graph",
        type: SLIDE_TYPES.GRAPH,
        dataSource: "manual",
        duration: 10,
        active: true,
        data: graphData
    };
}; 