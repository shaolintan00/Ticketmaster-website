const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const app = express();

// middleware
app.use(express.json());

// Debug: print whether MONGO_URI env var is present (do NOT print the value)
console.log('MONGO_URI set in env:', !!process.env.MONGO_URI);

// Mongoose connection lifecycle logging to help diagnose deployment issues
const logMongooseState = () => {
    const state = mongoose.connection.readyState; // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
    console.log('Mongoose readyState=', state);
};
mongoose.connection.on('connected', () => {
    console.log('Mongoose event: connected');
    logMongooseState();
});
mongoose.connection.on('error', (err) => {
    console.error('Mongoose event: error', err && err.message, err && err.stack);
    logMongooseState();
});
mongoose.connection.on('disconnected', () => {
    console.warn('Mongoose event: disconnected');
    logMongooseState();
});

// serve frontend static files (assumes built frontend files are in backend/frontend)
// use an absolute path so static files are resolved correctly regardless of cwd
// The production build's files are located in frontend/browser
app.use(express.static(path.join(__dirname, 'frontend', 'browser')));

// mount API routes
const searchRouter = require('./routes/search');
app.use('/search', searchRouter);

const autocompleteRouter = require('./routes/autocomplete');
app.use('/autocomplete', autocompleteRouter);

const eventRouter = require('./routes/event');
app.use('/event', eventRouter);

// favorites (save/remove/list user-favorited events)
const favoritesRouter = require('./routes/favorites');
app.use('/favorites', favoritesRouter);

// Health endpoint for deployment debugging
app.get('/health', async (req, res) => {
    const state = mongoose.connection.readyState; // 0 = disconnected, 1 = connected
    res.json({ ok: true, dbState: state, env: process.env.NODE_ENV || 'development' });
});

// Fallback to index.html for SPA navigation:
// When the browser requests a page (GET with Accept: text/html), return the
// frontend's index.html so client-side routing (e.g. /search) works.
// API routes that return JSON will continue to work because they will not
// send Accept: text/html in typical AJAX requests.
// Use '/*' instead of '*' to avoid path-to-regexp parsing issues in some
// dependency versions.
// Use a middleware (no path string) so we don't trigger path-to-regexp parsing
// issues in certain versions of express/path-to-regexp. This middleware will
// send index.html when the browser requests HTML (so client-side routes like
// /search render the SPA). API JSON requests continue to the API routers.
app.use((req, res, next) => {
    // Only handle GET navigation requests that accept HTML and do NOT look
    // like a static file (i.e. request path has no extension). This prevents
    // returning index.html for missing JS/CSS requests which would cause the
    // browser to receive HTML with a text/html MIME type (and integrity/MIME
    // errors).
    if (req.method !== 'GET') return next();
    const accept = req.headers.accept || '';
    const ext = path.extname(req.path || '');
    if (ext) return next(); // looks like a file request -> let static/404 handle it
    if (accept.indexOf('text/html') !== -1) {
        return res.sendFile(path.join(__dirname, 'frontend', 'browser', 'index.html'));
    }
    next();
});

// dbtest: attempt a lightweight DB ping to verify the deployed app can reach MongoDB
app.get('/dbtest', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({ ok: false, message: 'mongoose not connected', state: mongoose.connection.readyState });
        }
        const admin = mongoose.connection.db.admin();
        const pong = await admin.ping();
        return res.json({ ok: true, ping: pong });
    } catch (err) {
        console.error('DB test failed', err, err && err.stack);
        return res.status(500).json({ ok: false, error: err && err.message });
    }
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
// Connect to MongoDB once at startup (if available). If connection fails
// we still start the server so the frontend and API routes can respond.
const MONGO_URI = process.env.MONGO_URI || '';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}...`);
        });
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB', err);
        // Still start the server so API routes can return errors instead of hanging
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT} (no DB connection)`);
        });
    });