const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serviramo statičke fajlove

// Globalne varijable za lock mehanizam (u memoriji)
let lineLocks = {}; // { userId: { scenarioId, lineId } }
let characterLocks = {}; // { userId: { scenarioId, characterName } }
let nextScenarioId = 1;

// Pomoćne funkcije

/**
 * Učitava scenarij iz datoteke
 */
function loadScenario(scenarioId) {
    const filePath = path.join(__dirname, 'data', 'scenarios', `scenario-${scenarioId}.json`);
    if (!fs.existsSync(filePath)) {
        return null;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
}

/**
 * Čuva scenarij u datoteku
 */
function saveScenario(scenario) {
    const filePath = path.join(__dirname, 'data', 'scenarios', `scenario-${scenario.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(scenario, null, 2), 'utf8');
}

/**
 * Učitava deltas iz datoteke
 */
function loadDeltas() {
    const filePath = path.join(__dirname, 'data', 'deltas.json');
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
}

/**
 * Čuva deltas u datoteku
 */
function saveDeltas(deltas) {
    const filePath = path.join(__dirname, 'data', 'deltas.json');
    fs.writeFileSync(filePath, JSON.stringify(deltas, null, 2), 'utf8');
}

/**
 * Dodaje novi delta u datoteku
 */
function addDelta(delta) {
    const deltas = loadDeltas();
    deltas.push(delta);
    saveDeltas(deltas);
}

/**
 * Prebrojava riječi u tekstu (ista logika kao u spirali 2)
 */
function countWords(text) {
    if (!text || text.trim() === '') return 0;

    // Zamijeni znakove interpunkcije (zarez i tačka) sa razmakom
    text = text.replace(/[,.]/g, ' ');

    // Razdvoji na riječi
    let words = text.trim().split(/\s+/);

    // Filtriraj brojeve, prazne stringove i samostalne znakove
    words = words.filter(word => {
        if (word.length === 0) return false;
        // Filtriraj brojeve
        if (/^[\d.]+$/.test(word)) return false;
        // Filtriraj samostalne znakove interpunkcije
        if (/^[^\w\s'-]+$/.test(word)) return false;
        return true;
    });

    return words.length;
}

/**
 * Prelama tekst na linije od maksimalno 20 riječi
 */
function wrapText(text) {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = [];

    for (let word of words) {
        currentLine.push(word);
        if (countWords(currentLine.join(' ')) >= 20) {
            lines.push(currentLine.join(' '));
            currentLine = [];
        }
    }

    // Dodaj ostatak
    if (currentLine.length > 0) {
        lines.push(currentLine.join(' '));
    }

    return lines.length > 0 ? lines : [''];
}

/**
 * Pronalazi najveći lineId u scenariju
 */
function getMaxLineId(scenario) {
    if (!scenario.content || scenario.content.length === 0) return 0;
    return Math.max(...scenario.content.map(line => line.lineId));
}

/**
 * Inicijalizuje nextScenarioId na osnovu postojećih fajlova
 */
function initializeScenarioCounter() {
    const scenariosDir = path.join(__dirname, 'data', 'scenarios');
    if (!fs.existsSync(scenariosDir)) {
        fs.mkdirSync(scenariosDir, { recursive: true });
        return;
    }

    const files = fs.readdirSync(scenariosDir);
    let maxId = 0;

    files.forEach(file => {
        const match = file.match(/^scenario-(\d+)\.json$/);
        if (match) {
            const id = parseInt(match[1]);
            if (id > maxId) maxId = id;
        }
    });

    nextScenarioId = maxId + 1;
}

// Inicijalizacija
initializeScenarioCounter();

// ===========================
// API RUTE
// ===========================

/**
 * POST /api/scenarios
 * Kreira novi prazan scenarij
 */
app.post('/api/scenarios', (req, res) => {
    const { title } = req.body;

    const scenarioTitle = (title && title.trim() !== '') ? title : 'Neimenovani scenarij';

    const newScenario = {
        id: nextScenarioId,
        title: scenarioTitle,
        content: [
            {
                lineId: 1,
                nextLineId: null,
                text: ''
            }
        ]
    };

    saveScenario(newScenario);
    nextScenarioId++;

    res.status(200).json(newScenario);
});

/**
 * POST /api/scenarios/:scenarioId/lines/:lineId/lock
 * Zaključava liniju za uređivanje
 */
app.post('/api/scenarios/:scenarioId/lines/:lineId/lock', (req, res) => {
    const scenarioId = parseInt(req.params.scenarioId);
    const lineId = parseInt(req.params.lineId);
    const { userId } = req.body;

    // Provjeri da li scenario postoji
    const scenario = loadScenario(scenarioId);
    if (!scenario) {
        return res.status(404).json({ message: 'Scenario ne postoji!' });
    }

    // Provjeri da li linija postoji
    const line = scenario.content.find(l => l.lineId === lineId);
    if (!line) {
        return res.status(404).json({ message: 'Linija ne postoji!' });
    }

    // Provjeri da li je linija već zaključana od strane drugog korisnika
    for (let [uid, lock] of Object.entries(lineLocks)) {
        if (lock.scenarioId === scenarioId && lock.lineId === lineId && parseInt(uid) !== userId) {
            return res.status(409).json({ message: 'Linija je vec zakljucana!' });
        }
    }

    // Otključaj prethodnu liniju ovog korisnika (ako postoji)
    if (lineLocks[userId]) {
        delete lineLocks[userId];
    }

    // Zaključaj novu liniju
    lineLocks[userId] = { scenarioId, lineId };

    res.status(200).json({ message: 'Linija je uspjesno zakljucana!' });
});

/**
 * PUT /api/scenarios/:scenarioId/lines/:lineId
 * Ažurira liniju teksta
 */
app.put('/api/scenarios/:scenarioId/lines/:lineId', (req, res) => {
    const scenarioId = parseInt(req.params.scenarioId);
    const lineId = parseInt(req.params.lineId);
    const { userId, newText } = req.body;

    // Provjeri da li je newText niz
    if (!Array.isArray(newText) || newText.length === 0) {
        return res.status(400).json({ message: 'Niz new_text ne smije biti prazan!' });
    }

    // Provjeri da li scenario postoji
    const scenario = loadScenario(scenarioId);
    if (!scenario) {
        return res.status(404).json({ message: 'Scenario ne postoji!' });
    }

    // Provjeri da li linija postoji
    const lineIndex = scenario.content.findIndex(l => l.lineId === lineId);
    if (lineIndex === -1) {
        return res.status(404).json({ message: 'Linija ne postoji!' });
    }

    // Provjeri da li je linija zaključana
    if (!lineLocks[userId] || lineLocks[userId].lineId !== lineId || lineLocks[userId].scenarioId !== scenarioId) {
        return res.status(409).json({ message: 'Linija nije zakljucana!' });
    }

    // Provjeri da li je linija zaključana od strane ovog korisnika
    let isLockedByOther = false;
    for (let [uid, lock] of Object.entries(lineLocks)) {
        if (lock.scenarioId === scenarioId && lock.lineId === lineId && parseInt(uid) !== userId) {
            isLockedByOther = true;
            break;
        }
    }

    if (isLockedByOther) {
        return res.status(409).json({ message: 'Linija je vec zakljucana!' });
    }

    const currentLine = scenario.content[lineIndex];
    const oldNextLineId = currentLine.nextLineId;

    // Procesiranje newText - primjena prelamanja na svaki element
    let allLines = [];
    newText.forEach(text => {
        const wrappedLines = wrapText(text);
        allLines = allLines.concat(wrappedLines);
    });

    // Ažuriraj trenutnu liniju sa prvom linijom teksta
    currentLine.text = allLines[0] || '';

    // Dobij maksimalni lineId
    let maxLineId = getMaxLineId(scenario);

    // Dodaj nove linije ako ih ima
    const newLinesToAdd = [];
    for (let i = 1; i < allLines.length; i++) {
        maxLineId++;
        const newLine = {
            lineId: maxLineId,
            nextLineId: (i === allLines.length - 1) ? oldNextLineId : maxLineId + 1,
            text: allLines[i]
        };
        newLinesToAdd.push(newLine);

        // Dodaj delta za novu liniju
        addDelta({
            scenarioId: scenarioId,
            type: 'line_update',
            lineId: newLine.lineId,
            nextLineId: newLine.nextLineId,
            content: newLine.text,
            timestamp: Math.floor(Date.now() / 1000)
        });
    }

    // Postavi nextLineId trenutne linije
    if (allLines.length > 1) {
        currentLine.nextLineId = newLinesToAdd[0].lineId;
    } else {
        currentLine.nextLineId = oldNextLineId;
    }

    // Dodaj nove linije u content nakon trenutne linije
    scenario.content.splice(lineIndex + 1, 0, ...newLinesToAdd);

    // Sačuvaj scenario
    saveScenario(scenario);

    // Dodaj delta za trenutnu liniju
    addDelta({
        scenarioId: scenarioId,
        type: 'line_update',
        lineId: lineId,
        nextLineId: currentLine.nextLineId,
        content: currentLine.text,
        timestamp: Math.floor(Date.now() / 1000)
    });

    // Otključaj liniju
    delete lineLocks[userId];

    res.status(200).json({ message: 'Linija je uspjesno azurirana!' });
});

/**
 * POST /api/scenarios/:scenarioId/characters/lock
 * Zaključava ime lika za promjenu
 */
app.post('/api/scenarios/:scenarioId/characters/lock', (req, res) => {
    const scenarioId = parseInt(req.params.scenarioId);
    const { userId, characterName } = req.body;

    // Provjeri da li scenario postoji
    const scenario = loadScenario(scenarioId);
    if (!scenario) {
        return res.status(404).json({ message: 'Scenario ne postoji!' });
    }

    // Provjeri da li je ime lika već zaključano od strane drugog korisnika
    for (let [uid, lock] of Object.entries(characterLocks)) {
        if (lock.scenarioId === scenarioId && lock.characterName === characterName && parseInt(uid) !== userId) {
            return res.status(409).json({ message: 'Konflikt! Ime lika je vec zakljucano!' });
        }
    }

    // Zaključaj ime lika
    characterLocks[userId] = { scenarioId, characterName };

    res.status(200).json({ message: 'Ime lika je uspjesno zakljucano!' });
});

/**
 * POST /api/scenarios/:scenarioId/characters/update
 * Mijenja ime lika u cijelom scenariju
 */
app.post('/api/scenarios/:scenarioId/characters/update', (req, res) => {
    const scenarioId = parseInt(req.params.scenarioId);
    const { userId, oldName, newName } = req.body;

    // Provjeri da li scenario postoji
    const scenario = loadScenario(scenarioId);
    if (!scenario) {
        return res.status(404).json({ message: 'Scenario ne postoji!' });
    }

    // Provjeri da li je ime zaključano od strane ovog korisnika
    if (!characterLocks[userId] || characterLocks[userId].characterName !== oldName || characterLocks[userId].scenarioId !== scenarioId) {
        // Nije zaključano ili je zaključano drugo ime
        return res.status(409).json({ message: 'Konflikt! Ime lika je vec zakljucano!' });
    }

    // Promijeni ime u svim linijama (case-sensitive)
    scenario.content.forEach(line => {
        // Zamijeni SVE pojave starog imena u tekstu linije
        if (line.text.includes(oldName)) {
            line.text = line.text.replaceAll(oldName, newName);
        }
    });

    // Sačuvaj scenario
    saveScenario(scenario);

    // Dodaj delta
    addDelta({
        scenarioId: scenarioId,
        type: 'char_rename',
        oldName: oldName,
        newName: newName,
        timestamp: Math.floor(Date.now() / 1000)
    });

    // Otključaj
    delete characterLocks[userId];

    res.status(200).json({ message: 'Ime lika je uspjesno promijenjeno!' });
});

/**
 * GET /api/scenarios/:scenarioId/deltas
 * Vraća sve promjene nakon određenog timestamp-a
 */
app.get('/api/scenarios/:scenarioId/deltas', (req, res) => {
    const scenarioId = parseInt(req.params.scenarioId);
    const since = parseInt(req.query.since) || 0;

    // Provjeri da li scenario postoji
    const scenario = loadScenario(scenarioId);
    if (!scenario) {
        return res.status(404).json({ message: 'Scenario ne postoji!' });
    }

    // Učitaj sve deltas
    const allDeltas = loadDeltas();

    // Filtriraj deltas za ovaj scenario i timestamp > since
    const filteredDeltas = allDeltas.filter(delta => {
        return delta.scenarioId === scenarioId && delta.timestamp > since;
    });

    // Sortiraj rastuće po timestamp-u
    filteredDeltas.sort((a, b) => a.timestamp - b.timestamp);

    res.status(200).json({ deltas: filteredDeltas });
});

/**
 * GET /api/scenarios/:scenarioId
 * Vraća kompletan scenarij
 */
app.get('/api/scenarios/:scenarioId', (req, res) => {
    const scenarioId = parseInt(req.params.scenarioId);

    const scenario = loadScenario(scenarioId);
    if (!scenario) {
        return res.status(404).json({ message: 'Scenario ne postoji!' });
    }

    res.status(200).json(scenario);
});

// Pokreni server
app.listen(PORT, () => {
    console.log(`Server je pokrenut na http://localhost:${PORT}`);
});
