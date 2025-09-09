import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Employee } from "../types";
import { fetchEmployeesData } from "../services/eventsService";

interface EmployeeContextType {
    employees: Employee[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

interface EmployeeProviderProps {
    children: ReactNode;
}

export const EmployeeProvider: React.FC<EmployeeProviderProps> = ({ children }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEmployees = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchEmployeesData();
            if (Array.isArray(data) && data.length > 0) {
                setEmployees(data);
                // Debug logging only in development
                if (process.env.NODE_ENV === 'development') {
                    const birthdays = data.filter(emp => emp.isBirthday).length;
                    const anniversaries = data.filter(emp => emp.isAnniversary).length;
                    console.log(`Employee data refreshed: ${data.length} employees, ${birthdays} birthdays, ${anniversaries} anniversaries`);
                }
            } else {
                setEmployees([]);
                setError("No employees found");
            }
        } catch (err) {
            console.error("Error fetching employees:", err);
            setEmployees([]);
            setError("Failed to fetch employees data");
        } finally {
            setLoading(false);
        }
    };

    const refetch = async () => {
        await fetchEmployees();
    };

    useEffect(() => {
        fetchEmployees();

        // Set up automatic refresh with appropriate intervals for event data
        const interval = setInterval(() => {
            const now = new Date();
            const hour = now.getHours();

            // Event data only changes at midnight, so refresh:
            // - Every 30 minutes during business hours (8 AM - 6 PM) for any manual updates
            // - Every 2 hours outside business hours
            // - Once at midnight (00:00) for daily event changes
            const isBusinessHours = hour >= 8 && hour < 18;
            const isMidnight = hour === 0;
            const refreshInterval = isMidnight ? 0 : (isBusinessHours ? 30 * 60 * 1000 : 2 * 60 * 60 * 1000);

            // Only refresh if enough time has passed
            const timeSinceLastFetch = Date.now() - (window as any).lastEmployeeFetch || 0;
            if (timeSinceLastFetch >= refreshInterval) {
                fetchEmployees();
                (window as any).lastEmployeeFetch = Date.now();
            }
        }, 30 * 60 * 1000); // Check every 30 minutes

        return () => clearInterval(interval);
    }, []);

    const value: EmployeeContextType = {
        employees,
        loading,
        error,
        refetch,
    };

    return (
        <EmployeeContext.Provider value={value}>
            {children}
        </EmployeeContext.Provider>
    );
};

export const useEmployees = (): EmployeeContextType => {
    const context = useContext(EmployeeContext);
    if (context === undefined) {
        throw new Error("useEmployees must be used within an EmployeeProvider");
    }
    return context;
}; 