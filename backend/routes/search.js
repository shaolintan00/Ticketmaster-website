const express = require('express');
const router = express.Router();
const axios = require('axios');

TICKETMASTER_API_KEY = ''

router.get('/', async (req, res) => {
    const { keyword, category, location, distance } = req.query;
    const apiKey = TICKETMASTER_API_KEY;

    const params = new URLSearchParams({ apikey: apiKey });
    if (keyword) params.append('keyword', keyword);
    // Ticketmaster supports classificationName for broad categories
    if (category) params.append('classificationName', category);
    // frontend may provide a city name; if using lat/long this should be adapted
    if (location) params.append('city', location);
    if (distance) params.append('radius', distance);
    // default to miles
    params.append('unit', 'miles');

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;

    try {
        const tmRes = await axios.get(url);
        return res.json(tmRes.data);
    } catch (err) {
        console.error('Ticketmaster API error', err?.response?.data || err.message);
        const status = err.response?.status || 502;
        return res.status(status).json({ error: 'Failed to fetch from Ticketmaster', details: err.message });
    }
});

module.exports = router;