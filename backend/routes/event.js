const express = require('express');
const router = express.Router();
const axios = require('axios');

const TICKETMASTER_API_KEY = process.env.TM_API_KEY || '';

// GET /event/:id -> fetch event detail from Ticketmaster
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Missing event id' });

    const url = `https://app.ticketmaster.com/discovery/v2/events/${encodeURIComponent(id)}.json?apikey=${TICKETMASTER_API_KEY}`;
    try {
        const tmRes = await axios.get(url);
        return res.json(tmRes.data);
    } catch (err) {
        console.error('Ticketmaster event detail error', err?.response?.data || err.message);
        const status = err.response?.status || 502;
        return res.status(status).json({ error: 'Failed to fetch event details', details: err.message });
    }
});

module.exports = router;
