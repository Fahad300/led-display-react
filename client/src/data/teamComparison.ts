import { TeamComparisonData, DataSource, TeamComparisonSlide } from "../types";
import { SLIDE_DATA_SOURCES } from "../config/slideDefaults";

export const teamComparisonData: TeamComparisonData[] = [
    {
        teamName: "Data Extraction",
        totalTickets: 42,
        cLevelEscalations: 2,
        omegaEscalations: 5,
        codeBlueEscalations: 8,
        averageResponseTime: "2h 15m",
        averageLeadTime: "1d 4h"
    },
    {
        teamName: "Data Processing",
        totalTickets: 35,
        cLevelEscalations: 1,
        omegaEscalations: 3,
        codeBlueEscalations: 6,
        averageResponseTime: "1h 45m",
        averageLeadTime: "18h 30m"
    },
    {
        teamName: "Data Quality",
        totalTickets: 28,
        cLevelEscalations: 0,
        omegaEscalations: 2,
        codeBlueEscalations: 4,
        averageResponseTime: "1h 15m",
        averageLeadTime: "12h 45m"
    },
    {
        teamName: "Infrastructure",
        totalTickets: 19,
        cLevelEscalations: 3,
        omegaEscalations: 1,
        codeBlueEscalations: 2,
        averageResponseTime: "3h 10m",
        averageLeadTime: "1d 8h"
    },
    {
        teamName: "Frontend",
        totalTickets: 15,
        cLevelEscalations: 0,
        omegaEscalations: 0,
        codeBlueEscalations: 1,
        averageResponseTime: "45m",
        averageLeadTime: "8h 20m"
    }
];

export function getTeamComparisonSlide(): TeamComparisonSlide {
    return {
        id: 'team-comparison-1',
        name: 'Team Performance Comparison',
        type: 'team-comparison-slide',
        dataSource: SLIDE_DATA_SOURCES["team-comparison-slide"],
        duration: 15,
        active: true,
        data: {
            teams: teamComparisonData,
            lastUpdated: new Date().toISOString()
        }
    };
}
