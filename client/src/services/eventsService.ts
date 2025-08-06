import { externalApi } from './api';
import { Employee } from '../types';

// Sample employee data for fallback
const sampleEmployees: Employee[] = [
    {
        id: "1",
        name: "John Doe",
        dob: "1990-08-06",
        designation: "Software Engineer",
        teamName: "Development",
        picture: "",
        email: "john.doe@company.com",
        gender: "male",
        dateOfJoining: "2020-03-01",
        isBirthday: true,
        isAnniversary: false
    },
    {
        id: "2",
        name: "Jane Smith",
        dob: "1985-08-22",
        designation: "Product Manager",
        teamName: "Product",
        picture: "",
        email: "jane.smith@company.com",
        gender: "female",
        dateOfJoining: "2019-08-06",
        isBirthday: false,
        isAnniversary: true
    }
];

export const fetchEmployeesData = async () => {
    try {
        // Try to get from external API
        const res = await externalApi.get('/celebrations');
        console.log('Fetched employee data from API:', res.data);
        return res.data;
    } catch (error) {
        console.error('Error fetching employee data from API:', error);
        console.log('Using sample employee data as fallback');
        return sampleEmployees;
    }
};
