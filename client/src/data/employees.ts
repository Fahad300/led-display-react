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
    dateOfJoining: string;
    isBirthday: boolean;
    isAnniversary: boolean;
}

/**
 * Sample employee data
 */
export const employees: Employee[] = [

    {
        id: "EMP001",
        name: "Sarah Johnson",
        dob: "1990-04-27",
        designation: "Product Manager",
        teamName: "Product Management",
        picture: "",
        email: "sarah.johnson@company.com",
        gender: "female",
        dateOfJoining: "2009-07-28",
        isBirthday: false,
        isAnniversary: true
    },
    {
        id: "EMP002",
        name: "Jhon Snow",
        dob: "2002-07-28",
        designation: "Software Engineer",
        teamName: "Development",
        picture: "",
        email: "jhon.snow@company.com",
        gender: "male",
        dateOfJoining: "2009-01-01",
        isBirthday: true,
        isAnniversary: false
    }
]; 