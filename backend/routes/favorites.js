const express = require('express');
const router = express.Router();
const EventModel = require('../models/Event');

// GET /favorites/:id -> get a saved event by TM id
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    try {
        const doc = await EventModel.findOne({ id }).exec();
        if (!doc) return res.status(404).json({ error: 'Not found' });
        return res.json(doc);
    } catch (err) {
        console.error('Failed to get favorite', err, err && err.stack);
        return res.status(500).json({ error: 'Failed to get favorite', details: err && err.message });
    }
});

// GET /favorites -> list saved events
router.get('/', async (req, res) => {
    try {
        const docs = await EventModel.find().sort({ createdAt: -1 }).limit(100).exec();
        return res.json(docs);
    } catch (err) {
        console.error('Failed to list favorites', err, err && err.stack);
        return res.status(500).json({ error: 'Failed to list favorites', details: err && err.message });
    }
});

// POST /favorites -> save (upsert) an event
router.post('/', async (req, res) => {
    const event = req.body;
    if (!event || !event.id) return res.status(400).json({ error: 'Missing event body or event.id' });
    try {
        console.log('Favorites POST received for id=', event.id);
        // Use findOneAndUpdate with validators to ensure saved document conforms to schema
        const doc = await EventModel.findOneAndUpdate(
            { id: event.id },
            { $set: event },
            { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
        ).exec();
        console.log('Saved favorite id=', event.id);
        return res.json(doc);
    } catch (err) {
        console.error('Failed to save favorite', err, err && err.stack);
        return res.status(500).json({ error: 'Failed to save favorite', details: err && err.message });
    }
});

// DELETE /favorites/:id -> remove saved event
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    try {
        const result = await EventModel.findOneAndDelete({ id }).exec();
        if (!result) return res.status(404).json({ error: 'Not found' });
        return res.json({ success: true });
    } catch (err) {
        console.error('Failed to delete favorite', err, err && err.stack);
        return res.status(500).json({ error: 'Failed to delete favorite', details: err && err.message });
    }
});

module.exports = router;
