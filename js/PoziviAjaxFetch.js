
const PoziviAjaxFetch = (function() {
    const BASE_URL = 'http://localhost:3000/api';

    return {
        postScenario: function(title, callback) {
            fetch(`${BASE_URL}/scenarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: title })
            })
            .then(response => {
                let status = response.status;
                return response.json().then(data => callback(status, data));
            })
            .catch(error => {
                callback(0, { message: 'Greška: ' + error.message });
            });
        },

        lockLine: function(scenarioId, lineId, userId, callback) {
            fetch(`${BASE_URL}/scenarios/${scenarioId}/lines/${lineId}/lock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId })
            })
            .then(response => {
                let status = response.status;
                return response.json().then(data => callback(status, data));
            })
            .catch(error => {
                callback(0, { message: 'Greška: ' + error.message });
            });
        },

        updateLine: function(scenarioId, lineId, userId, newText, callback) {
            fetch(`${BASE_URL}/scenarios/${scenarioId}/lines/${lineId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId, newText: newText })
            })
            .then(response => {
                let status = response.status;
                return response.json().then(data => callback(status, data));
            })
            .catch(error => {
                callback(0, { message: 'Greška: ' + error.message });
            });
        },

        lockCharacter: function(scenarioId, characterName, userId, callback) {
            fetch(`${BASE_URL}/scenarios/${scenarioId}/characters/lock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId, characterName: characterName })
            })
            .then(response => {
                let status = response.status;
                return response.json().then(data => callback(status, data));
            })
            .catch(error => {
                callback(0, { message: 'Greška: ' + error.message });
            });
        },

        updateCharacter: function(scenarioId, userId, oldName, newName, callback) {
            fetch(`${BASE_URL}/scenarios/${scenarioId}/characters/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId, oldName: oldName, newName: newName })
            })
            .then(response => {
                let status = response.status;
                return response.json().then(data => callback(status, data));
            })
            .catch(error => {
                callback(0, { message: 'Greška: ' + error.message });
            });
        },

        getDeltas: function(scenarioId, since, callback) {
            fetch(`${BASE_URL}/scenarios/${scenarioId}/deltas?since=${since}`)
            .then(response => {
                let status = response.status;
                return response.json().then(data => callback(status, data));
            })
            .catch(error => {
                callback(0, { message: 'Greška: ' + error.message });
            });
        },

        getScenario: function(scenarioId, callback) {
            fetch(`${BASE_URL}/scenarios/${scenarioId}`)
            .then(response => {
                let status = response.status;
                return response.json().then(data => callback(status, data));
            })
            .catch(error => {
                callback(0, { message: 'Greška: ' + error.message });
            });
        }
    };
})();
