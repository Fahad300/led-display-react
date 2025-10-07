const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Test the ongoing-escalations endpoint
app.get('/api/proxy/ongoing-escalations', async (req, res) => {
    try {
        const externalApiUrl = process.env.EXTERNAL_API_URL || 'https://sep.solitontechnologies.com/api';
        const externalApiToken = process.env.EXTERNAL_API_TOKEN || 'hsaffch2';

        console.log('Testing escalations API...');
        console.log('External API URL:', externalApiUrl);
        console.log('Token configured:', !!externalApiToken);

        const response = await axios.get(`${externalApiUrl}/ongoing-escalations`, {
            headers: {
                "Authorization": `Bearer ${externalApiToken}`,
                "Content-Type": "application/json"
            },
            timeout: 30000
        });

        console.log('API Response Status:', response.status);
        console.log('API Response Data:', response.data);

        res.json(response.data);

    } catch (error) {
        console.error('Error testing escalations API:', error.message);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }

        res.status(500).json({
            error: "External API request failed",
            message: error.message,
            details: error.response?.data || null
        });
    }
});

// Test the celebrations endpoint
app.get('/api/proxy/celebrations', async (req, res) => {
    try {
        const externalApiUrl = process.env.EXTERNAL_API_URL || 'https://sep.solitontechnologies.com/api';
        const externalApiToken = process.env.EXTERNAL_API_TOKEN || 'hsaffch2';

        console.log('Testing celebrations API...');

        const response = await axios.get(`${externalApiUrl}/celebrations`, {
            headers: {
                "Authorization": `Bearer ${externalApiToken}`,
                "Content-Type": "application/json"
            },
            timeout: 30000
        });

        console.log('Celebrations API Response Status:', response.status);
        console.log('Celebrations API Response Data:', response.data);

        res.json(response.data);

    } catch (error) {
        console.error('Error testing celebrations API:', error.message);
        res.status(500).json({
            error: "External API request failed",
            message: error.message
        });
    }
});

// Test the jira-chart endpoint
app.get('/api/proxy/jira-chart', async (req, res) => {
    try {
        const externalApiUrl = process.env.EXTERNAL_API_URL || 'https://sep.solitontechnologies.com/api';
        const externalApiToken = process.env.EXTERNAL_API_TOKEN || 'hsaffch2';

        console.log('Testing jira-chart API...');

        const response = await axios.get(`${externalApiUrl}/jira-chart`, {
            headers: {
                "Authorization": `Bearer ${externalApiToken}`,
                "Content-Type": "application/json"
            },
            timeout: 30000
        });

        console.log('Jira-chart API Response Status:', response.status);
        console.log('Jira-chart API Response Data:', response.data);

        res.json(response.data);

    } catch (error) {
        console.error('Error testing jira-chart API:', error.message);
        res.status(500).json({
            error: "External API request failed",
            message: error.message
        });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
    console.log('Test endpoints:');
    console.log('- http://localhost:5000/api/proxy/ongoing-escalations');
    console.log('- http://localhost:5000/api/proxy/celebrations');
    console.log('- http://localhost:5000/api/proxy/jira-chart');
});
