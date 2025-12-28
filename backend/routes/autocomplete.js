const express = require('express');
const router = express.Router();
const axios = require('axios');

TICKETMASTER_API_KEY = ''

router.get('/', async (req, res) => {
    const { keyword } = req.query;
    const apiKey = TICKETMASTER_API_KEY;

    const params = new URLSearchParams({ apikey: apiKey });
    if (keyword) params.append('keyword', keyword);

    const url = `https://app.ticketmaster.com/discovery/v2/suggest?${params.toString()}`;

    try {
        const respond = await axios.get(url);
        return res.json(respond.data);
    } catch (err) {
        console.error('Ticketmaster API error', err?.response?.data || err.message);
        const status = err.response?.status || 502;
        return res.status(status).json({ error: 'Failed to fetch from Ticketmaster', details: err.message });
    }
});

module.exports = router;