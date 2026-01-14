
const PoziviAjax = (function() {
    const BASE_URL = 'http://localhost:3000/api';

    /**
     * Pomoćna funkcija za izvršavanje fetch zahtjeva
     */
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
        /**
         * Kreira novi scenarij
         * @param {string} title - Naslov scenarija
         * @param {function} callback - Callback funkcija (statusKod, odgovor)
         */
        postScenario: function(title, callback) {
            const url = `${BASE_URL}/scenarios`;
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: title })
            };

            makeFetchRequest(url, options, callback);
        },

        /**
         * Zaključava liniju za uređivanje
         * @param {number} scenarioId - ID scenarija
         * @param {number} lineId - ID linije
         * @param {number} userId - ID korisnika
         * @param {function} callback - Callback funkcija (statusKod, odgovor)
         */
        lockLine: function(scenarioId, lineId, userId, callback) {
            const url = `${BASE_URL}/scenarios/${scenarioId}/lines/${lineId}/lock`;
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: userId })
            };

            makeFetchRequest(url, options, callback);
        },

        /**
         * Ažurira sadržaj linije
         * @param {number} scenarioId - ID scenarija
         * @param {number} lineId - ID linije
         * @param {number} userId - ID korisnika
         * @param {array} newText - Niz stringova sa novim tekstom
         * @param {function} callback - Callback funkcija (statusKod, odgovor)
         */
        updateLine: function(scenarioId, lineId, userId, newText, callback) {
            const url = `${BASE_URL}/scenarios/${scenarioId}/lines/${lineId}`;
            const options = {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    newText: newText
                })
            };

            makeFetchRequest(url, options, callback);
        },

        /**
         * Zaključava ime lika
         * @param {number} scenarioId - ID scenarija
         * @param {string} characterName - Ime lika
         * @param {number} userId - ID korisnika
         * @param {function} callback - Callback funkcija (statusKod, odgovor)
         */
        lockCharacter: function(scenarioId, characterName, userId, callback) {
            const url = `${BASE_URL}/scenarios/${scenarioId}/characters/lock`;
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    characterName: characterName
                })
            };

            makeFetchRequest(url, options, callback);
        },

        /**
         * Mijenja ime lika u scenariju
         * @param {number} scenarioId - ID scenarija
         * @param {number} userId - ID korisnika
         * @param {string} oldName - Staro ime lika
         * @param {string} newName - Novo ime lika
         * @param {function} callback - Callback funkcija (statusKod, odgovor)
         */
        updateCharacter: function(scenarioId, userId, oldName, newName, callback) {
            const url = `${BASE_URL}/scenarios/${scenarioId}/characters/update`;
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    oldName: oldName,
                    newName: newName
                })
            };

            makeFetchRequest(url, options, callback);
        },

        /**
         * Dobavlja promjene (deltas) od određenog timestamp-a
         * @param {number} scenarioId - ID scenarija
         * @param {number} since - Timestamp od kojeg se traže promjene
         * @param {function} callback - Callback funkcija (statusKod, odgovor)
         */
        getDeltas: function(scenarioId, since, callback) {
            const url = `${BASE_URL}/scenarios/${scenarioId}/deltas?since=${since}`;
            const options = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            makeFetchRequest(url, options, callback);
        },

        /**
         * Dobavlja kompletan scenarij
         * @param {number} scenarioId - ID scenarija
         * @param {function} callback - Callback funkcija (statusKod, odgovor)
         */
        getScenario: function(scenarioId, callback) {
            const url = `${BASE_URL}/scenarios/${scenarioId}`;
            const options = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            makeFetchRequest(url, options, callback);
        }
    };
})();
