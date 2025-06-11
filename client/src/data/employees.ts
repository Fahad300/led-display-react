/**
 * Interface for Employee data structure
 */
export interface Employee {
    id: string;
    name: string;
    dob: string;
    designation: string;
    teamName: string;
    picture: string;
    email: string;
    gender: string;
}

/**
 * Sample employee data
 */
export const employees: Employee[] = [
    {
        id: "EMP001",
        name: "John Smith",
        dob: "1985-05-24",
        designation: "Senior Software Engineer",
        teamName: "Frontend Development",
        picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fHByb2ZpbGUlMjBwaG90b3xlbnwwfHwwfHx8MA%3D%3D",
        email: "john.smith@company.com",
        gender: "male"
    },
    {
        id: "EMP002",
        name: "Sarah Johnson",
        dob: "1990-06-03",
        designation: "Product Manager",
        teamName: "Product Management",
        picture: "",
        email: "sarah.johnson@company.com",
        gender: "female"
    },
    {
        id: "EMP003",
        name: "Michael Chen",
        dob: "1988-05-20",
        designation: "UX Designer",
        teamName: "Design Team",
        picture: "",
        email: "michael.chen@company.com",
        gender: "male"
    },
    {
        id: "EMP004",
        name: "Emily Davis",
        dob: "1992-09-30",
        designation: "Backend Developer",
        teamName: "Backend Development",
        picture: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHByb2ZpbGUlMjBwaG90b3xlbnwwfHwwfHx8MA%3D%3D",
        email: "emily.davis@company.com",
        gender: "female"
    },
    {
        id: "EMP005",
        name: "David Wilson",
        dob: "1987-04-17",
        designation: "DevOps Engineer",
        teamName: "Infrastructure",
        picture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHByb2ZpbGUlMjBwaG90b3xlbnwwfHwwfHx8MA%3D%3D",
        email: "david.wilson@company.com",
        gender: "male"
    }
]; 