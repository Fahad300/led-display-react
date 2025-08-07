import { backendApi } from './api';

export const fetchEmployeesData = async () => {
    try {
        // Use backend proxy to avoid CORS issues
        const res = await backendApi.get('/api/proxy/celebrations');
        return res.data;
    } catch (error) {
        console.error('Error fetching employee data via backend proxy:', error);
        return [];
    }
};
