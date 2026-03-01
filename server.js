const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sequelize, Scenario, Line, Delta, Checkpoint } = require('./models');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

let lineLocks = {};
let characterLocks = {};

function countWords(text) {
    if (!text || text.trim() === '') return 0;
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function wrapText(text) {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = [];

    for (let i = 0; i < words.length; i++) {
        currentLine.push(words[i]);
        if (countWords(currentLine.join(' ')) >= 20) {
            lines.push(currentLine.join(' '));
            currentLine = [];
        }
    }

    if (currentLine.length > 0) {
        lines.push(currentLine.join(' '));
    }

    return lines.length > 0 ? lines : [''];
}

async function getMaxLineId(scenarioId) {
    const maxLine = await Line.findOne({
        where: { scenarioId: scenarioId },
        order: [['lineId', 'DESC']]
    });
    return maxLine ? maxLine.lineId : 0;
}

async function loadScenario(scenarioId) {
    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) return null;

    const lines = await Line.findAll({
        where: { scenarioId: scenarioId }
    });

    const lineMap = {};
    const nextIds = new Set();

    lines.forEach(line => {
        lineMap[line.lineId] = {
            lineId: line.lineId,
            nextLineId: line.nextLineId,
            text: line.text || ''
        };
        if (line.nextLineId !== null) {
            nextIds.add(line.nextLineId);
        }
    });

    let firstLineId = null;
    for (let i = 0; i < lines.length; i++) {
        if (!nextIds.has(lines[i].lineId)) {
            firstLineId = lines[i].lineId;
            break;
        }
    }

    const sadrzaj = [];
    let currentId = firstLineId;
    let iter = 0;

    while (currentId !== null && lineMap[currentId] && iter < lines.length) {
        sadrzaj.push(lineMap[currentId]);
        currentId = lineMap[currentId].nextLineId;
        iter++;
    }

    return {
        id: scenario.id,
        title: scenario.title,
        content: sadrzaj
    };
}

async function seedInitialData() {
    const existingScenario = await Scenario.findByPk(1);
    if (existingScenario) {
        return;
    }

    await Scenario.create({ id: 1, title: 'Test Scenarij' });

    const linesData = [
        { lineId: 1, text: 'INT. KAFIC - DAY', nextLineId: 2, scenarioId: 1 },
        { lineId: 2, text: 'ALICE sjedi za stolom.', nextLineId: 3, scenarioId: 1 },
        { lineId: 3, text: 'Prazna linija za test prelamanja.', nextLineId: 4, scenarioId: 1 },
        { lineId: 4, text: 'ALICE', nextLineId: 5, scenarioId: 1 },
        { lineId: 5, text: 'Dobar dan, kako ste?', nextLineId: 6, scenarioId: 1 },
        { lineId: 6, text: 'BOB', nextLineId: 7, scenarioId: 1 },
        { lineId: 7, text: 'Dobro, hvala na pitanju.', nextLineId: null, scenarioId: 1 }
    ];

    await Line.bulkCreate(linesData);
}

app.post('/api/scenarios', async (req, res) => {
    try {
        const { title } = req.body;
        const scenarioTitle = (title && title.trim() !== '') ? title : 'Neimenovani scenarij';

        const newScenario = await Scenario.create({ title: scenarioTitle });

        await Line.create({
            lineId: 1,
            nextLineId: null,
            text: '',
            scenarioId: newScenario.id
        });

        res.status(200).json({
            id: newScenario.id,
            title: newScenario.title,
            content: [{ lineId: 1, nextLineId: null, text: '' }]
        });
    } catch (error) {
        res.status(500).json({ message: 'Interna greška servera' });
    }
});

app.post('/api/scenarios/:scenarioId/lines/:lineId/lock', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const lineId = parseInt(req.params.lineId);
        const { userId } = req.body;

        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: 'Scenario ne postoji!' });
        }

        const line = await Line.findOne({
            where: { scenarioId: scenarioId, lineId: lineId }
        });
        if (!line) {
            return res.status(404).json({ message: 'Linija ne postoji!' });
        }

        for (let [uid, lock] of Object.entries(lineLocks)) {
            if (lock.scenarioId === scenarioId && lock.lineId === lineId && parseInt(uid) !== userId) {
                return res.status(409).json({ message: 'Linija je vec zakljucana!' });
            }
        }

        if (lineLocks[userId]) {
            delete lineLocks[userId];
        }

        lineLocks[userId] = { scenarioId, lineId };
        res.status(200).json({ message: 'Linija je uspjesno zakljucana!' });
    } catch (error) {
        res.status(500).json({ message: 'Interna greška servera' });
    }
});

app.put('/api/scenarios/:scenarioId/lines/:lineId', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const lineId = parseInt(req.params.lineId);
        const { userId, newText } = req.body;

        if (!Array.isArray(newText) || newText.length === 0) {
            return res.status(400).json({ message: 'Niz new_text ne smije biti prazan!' });
        }

        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: 'Scenario ne postoji!' });
        }

        const line = await Line.findOne({
            where: { scenarioId: scenarioId, lineId: lineId }
        });
        if (!line) {
            return res.status(404).json({ message: 'Linija ne postoji!' });
        }

        for (let [uid, lock] of Object.entries(lineLocks)) {
            if (lock.scenarioId === scenarioId && lock.lineId === lineId && parseInt(uid) !== userId) {
                return res.status(409).json({ message: 'Linija je vec zakljucana!' });
            }
        }

        if (!lineLocks[userId] || lineLocks[userId].lineId !== lineId || lineLocks[userId].scenarioId !== scenarioId) {
            return res.status(409).json({ message: 'Linija nije zakljucana!' });
        }

        const oldNextLineId = line.nextLineId;

        let allLines = [];
        newText.forEach(text => {
            allLines = allLines.concat(wrapText(text));
        });

        line.text = allLines[0] || '';

        let maxLineId = await getMaxLineId(scenarioId);
        const timestamp = Math.floor(Date.now() / 1000);

        for (let i = 1; i < allLines.length; i++) {
            maxLineId++;
            const newNextLineId = (i === allLines.length - 1) ? oldNextLineId : maxLineId + 1;

            await Line.create({
                lineId: maxLineId,
                nextLineId: newNextLineId,
                text: allLines[i],
                scenarioId: scenarioId
            });

            await Delta.create({
                scenarioId: scenarioId,
                type: 'line_update',
                lineId: maxLineId,
                nextLineId: newNextLineId,
                content: allLines[i],
                timestamp: timestamp
            });
        }

        if (allLines.length > 1) {
            line.nextLineId = maxLineId - allLines.length + 2;
        } else {
            line.nextLineId = oldNextLineId;
        }

        await line.save();

        await Delta.create({
            scenarioId: scenarioId,
            type: 'line_update',
            lineId: lineId,
            nextLineId: line.nextLineId,
            content: line.text,
            timestamp: timestamp
        });

        delete lineLocks[userId];
        res.status(200).json({ message: 'Linija je uspjesno azurirana!' });
    } catch (error) {
        res.status(500).json({ message: 'Interna greška servera' });
    }
});

app.post('/api/scenarios/:scenarioId/characters/lock', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const { userId, characterName } = req.body;

        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: 'Scenario ne postoji!' });
        }

        for (let [uid, lock] of Object.entries(characterLocks)) {
            if (lock.scenarioId === scenarioId && lock.characterName === characterName && parseInt(uid) !== userId) {
                return res.status(409).json({ message: 'Konflikt! Ime lika je vec zakljucano!' });
            }
        }

        characterLocks[userId] = { scenarioId, characterName };
        res.status(200).json({ message: 'Ime lika je uspjesno zakljucano!' });
    } catch (error) {
        res.status(500).json({ message: 'Interna greška servera' });
    }
});

app.post('/api/scenarios/:scenarioId/characters/update', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const { userId, oldName, newName } = req.body;

        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: 'Scenario ne postoji!' });
        }

        if (!characterLocks[userId] || characterLocks[userId].characterName !== oldName || characterLocks[userId].scenarioId !== scenarioId) {
            return res.status(409).json({ message: 'Konflikt! Ime lika je vec zakljucano!' });
        }

        const lines = await Line.findAll({
            where: { scenarioId: scenarioId }
        });

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].text && lines[i].text.includes(oldName)) {
                lines[i].text = lines[i].text.split(oldName).join(newName);
                await lines[i].save();
            }
        }

        await Delta.create({
            scenarioId: scenarioId,
            type: 'char_rename',
            oldName: oldName,
            newName: newName,
            timestamp: Math.floor(Date.now() / 1000)
        });

        delete characterLocks[userId];
        res.status(200).json({ message: 'Ime lika je uspjesno promijenjeno!' });
    } catch (error) {
        res.status(500).json({ message: 'Interna greška servera' });
    }
});

app.get('/api/scenarios/:scenarioId/deltas', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const since = parseInt(req.query.since) || 0;

        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: 'Scenario ne postoji!' });
        }

        const deltas = await Delta.findAll({
            where: { scenarioId: scenarioId },
            order: [['timestamp', 'ASC']]
        });

        const formattedDeltas = [];
        for (let i = 0; i < deltas.length; i++) {
            let delta = deltas[i];
            if (delta.timestamp <= since) continue;

            let stavka = { type: delta.type, timestamp: delta.timestamp };

            if (delta.type === 'line_update') {
                stavka.lineId = delta.lineId;
                stavka.nextLineId = delta.nextLineId;
                stavka.content = delta.content;
            } else if (delta.type === 'char_rename') {
                stavka.oldName = delta.oldName;
                stavka.newName = delta.newName;
            }

            formattedDeltas.push(stavka);
        }

        res.status(200).json({ deltas: formattedDeltas });
    } catch (error) {
        res.status(500).json({ message: 'Interna greška servera' });
    }
});

app.get('/api/scenarios/:scenarioId', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);

        const scenario = await loadScenario(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: 'Scenario ne postoji!' });
        }

        res.status(200).json(scenario);
    } catch (error) {
        res.status(500).json({ message: 'Interna greška servera' });
    }
});

app.post('/api/scenarios/:scenarioId/checkpoint', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const { userId } = req.body;

        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: 'Scenario ne postoji!' });
        }

        await Checkpoint.create({
            scenarioId: scenarioId,
            timestamp: Math.floor(Date.now() / 1000)
        });

        res.status(200).json({ message: 'Checkpoint je uspjesno kreiran!' });
    } catch (error) {
        res.status(500).json({ message: 'Interna greška servera' });
    }
});

app.get('/api/scenarios/:scenarioId/checkpoints', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);

        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: 'Scenario ne postoji!' });
        }

        const checkpoints = await Checkpoint.findAll({
            where: { scenarioId: scenarioId },
            order: [['timestamp', 'ASC']]
        });

        res.status(200).json(checkpoints.map(cp => ({
            id: cp.id,
            timestamp: cp.timestamp
        })));
    } catch (error) {
        res.status(500).json({ message: 'Interna greška servera' });
    }
});

app.get('/api/scenarios/:scenarioId/restore/:checkpointId', async (req, res) => {
    try {
        const scenarioId = parseInt(req.params.scenarioId);
        const checkpointId = parseInt(req.params.checkpointId);

        const scenario = await Scenario.findByPk(scenarioId);
        if (!scenario) {
            return res.status(404).json({ message: 'Scenario ne postoji!' });
        }

        const checkpoint = await Checkpoint.findByPk(checkpointId);
        if (!checkpoint || checkpoint.scenarioId !== scenarioId) {
            return res.status(404).json({ message: 'Checkpoint ne postoji!' });
        }

        let stanje = {
            id: scenario.id,
            title: scenario.title,
            content: [{ lineId: 1, nextLineId: null, text: '' }]
        };

        const deltas = await Delta.findAll({
            where: { scenarioId: scenarioId },
            order: [['timestamp', 'ASC']]
        });

        for (let i = 0; i < deltas.length; i++) {
            let delta = deltas[i];
            if (delta.timestamp > checkpoint.timestamp) continue;

            if (delta.type === 'line_update') {
                let lineIndex = -1;
                for (let j = 0; j < stanje.content.length; j++) {
                    if (stanje.content[j].lineId === delta.lineId) {
                        lineIndex = j;
                        break;
                    }
                }

                if (lineIndex === -1) {
                    stanje.content.push({
                        lineId: delta.lineId,
                        nextLineId: delta.nextLineId,
                        text: delta.content || ''
                    });
                } else {
                    stanje.content[lineIndex].text = delta.content || '';
                    stanje.content[lineIndex].nextLineId = delta.nextLineId;
                }
            } else if (delta.type === 'char_rename') {
                for (let j = 0; j < stanje.content.length; j++) {
                    if (stanje.content[j].text && stanje.content[j].text.includes(delta.oldName)) {
                        stanje.content[j].text = stanje.content[j].text.split(delta.oldName).join(delta.newName);
                    }
                }
            }
        }

        res.status(200).json(stanje);
    } catch (error) {
        res.status(500).json({ message: 'Interna greška servera' });
    }
});

async function startServer() {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ force: true });
        await seedInitialData();

        app.listen(PORT, () => {
            console.log(`Server je pokrenut na http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Greška pri pokretanju servera:', error);
    }
}

startServer();
