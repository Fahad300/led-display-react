import { backendApi } from './api';
import { Employee } from '../types';

export const fetchEmployeesData = async (): Promise<Employee[]> => {
    try {
        // Use backend proxy to avoid CORS issues
        const res = await backendApi.get('/api/proxy/celebrations');
        const rawData = res.data;

        // The API already provides isBirthday and isAnniversary flags, so use them directly
        const processedEmployees: Employee[] = rawData.map((employee: any) => ({
            id: employee.id,
            name: employee.name,
            dob: employee.dob,
            designation: employee.designation,
            teamName: employee.teamName,
            picture: employee.picture,
            email: employee.email,
            gender: employee.gender,
            dateOfJoining: employee.dateOfJoining,
            isBirthday: employee.isBirthday || false,
            isAnniversary: employee.isAnniversary || false
        }));

        console.log('🎉 Event Slides Data Summary:', {
            totalEmployees: processedEmployees.length,
            birthdayCount: processedEmployees.filter(e => e.isBirthday).length,
            anniversaryCount: processedEmployees.filter(e => e.isAnniversary).length,
            birthdayEmployees: processedEmployees.filter(e => e.isBirthday).map(e => ({ name: e.name, gender: e.gender })),
            anniversaryEmployees: processedEmployees.filter(e => e.isAnniversary).map(e => ({ name: e.name, gender: e.gender }))
        });

        return processedEmployees;
    } catch (error) {
        console.error('Error fetching employee data via backend proxy:', error);
        return [];
    }
};
