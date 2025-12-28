const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const distBase = path.join(__dirname, 'dist');
function findSpaDir(base) {
    if (!fs.existsSync(base)) return '';
    // index directly under dist/
    if (fs.existsSync(path.join(base, 'index.html'))) return base;
    const ents = fs.readdirSync(base, { withFileTypes: true }).filter(d => d.isDirectory());
    for (const d of ents) {
        const one = path.join(base, d.name);
        // dist/<app>/index.html
        if (fs.existsSync(path.join(one, 'index.html'))) return one;
        // dist/<app>/browser/index.html (Angular Universal/cli output when using 'browser' subfolder)
        if (fs.existsSync(path.join(one, 'browser', 'index.html'))) return path.join(one, 'browser');
    }
    return '';
}
const distDir = findSpaDir(distBase);
if (!distDir) {
    console.error('Could not find built Angular files under', distBase);
    console.error('Run: npx ng build --configuration production then restart this server.');
    process.exit(1);
}
app.use(express.static(distDir));
app.get(/.*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
const port = process.env.PORT || 4200;
app.listen(port, () => console.log(`Frontend listening on ${port}`));