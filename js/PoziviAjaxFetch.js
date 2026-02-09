
const PoziviAjaxFetch = (function() {
    const BASE_URL = 'http://localhost:3000/api';

    function makeFetchRequest(url, options, callback) {
        fetch(url, options)
            .then(response => {
                const status = response.status;
                return response.json().then(data => {
                    callback(status, data);
                });
            })
            .catch(error => {
                console.error('Greška pri AJAX zahtjevu:', error);
                callback(0, { message: 'Network error: ' + error.message });
            });
    }

    return {
        postScenario: function(title, callback) {
            const url = `${BASE_URL}/scenarios`;
            const options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: title })
            };
            makeFetchRequest(url, options, callback);
        },

        lockLine: function(scenarioId, lineId, userId, callback) {
            const url = `${BASE_URL}/scenarios/${scenarioId}/lines/${lineId}/lock`;
            const options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId })
            };
            makeFetchRequest(url, options, callback);
        },

        updateLine: function(scenarioId, lineId, userId, newText, callback) {
            const url = `${BASE_URL}/scenarios/${scenarioId}/lines/${lineId}`;
            const options = {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId, newText: newText })
            };
            makeFetchRequest(url, options, callback);
        },

        lockCharacter: function(scenarioId, characterName, userId, callback) {
            const url = `${BASE_URL}/scenarios/${scenarioId}/characters/lock`;
            const options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId, characterName: characterName })
            };
            makeFetchRequest(url, options, callback);
        },

        updateCharacter: function(scenarioId, userId, oldName, newName, callback) {
            const url = `${BASE_URL}/scenarios/${scenarioId}/characters/update`;
            const options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId, oldName: oldName, newName: newName })
            };
            makeFetchRequest(url, options, callback);
        },

        getDeltas: function(scenarioId, since, callback) {
            const url = `${BASE_URL}/scenarios/${scenarioId}/deltas?since=${since}`;
            const options = {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            };
            makeFetchRequest(url, options, callback);
        },

        getScenario: function(scenarioId, callback) {
            const url = `${BASE_URL}/scenarios/${scenarioId}`;
            const options = {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            };
            makeFetchRequest(url, options, callback);
        }
    };
})();
