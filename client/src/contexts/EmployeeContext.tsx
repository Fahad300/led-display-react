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