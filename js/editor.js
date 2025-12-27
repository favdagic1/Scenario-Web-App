// Inicijalizacija editora
let editor;

document.addEventListener('DOMContentLoaded', function () {
    try {
        let divEditor = document.getElementById('divEditor');
        editor = EditorTeksta(divEditor);

        // Referenca na div za prikaz poruka
        let porukeDiv = document.getElementById('poruke');

        // Event handleri za dugmad

        // Broj riječi
        document.getElementById('btnBrojRijeci').addEventListener('click', function () {
            let rezultat = editor.dajBrojRijeci();
            porukeDiv.innerHTML = `
                <h3>Broj riječi</h3>
                <p><strong>Ukupno riječi:</strong> ${rezultat.ukupno}</p>
                <p><strong>Boldirane riječi:</strong> ${rezultat.boldiranih}</p>
                <p><strong>Italic riječi:</strong> ${rezultat.italic}</p>
            `;
        });

        // Prikaži uloge
        document.getElementById('btnDajUloge').addEventListener('click', function () {
            let uloge = editor.dajUloge();
            if (uloge.length === 0) {
                porukeDiv.innerHTML = '<p>Nema pronađenih uloga u scenariju.</p>';
            } else {
                let lista = uloge.map(uloga => `<li>${uloga}</li>`).join('');
                porukeDiv.innerHTML = `
                    <h3>Pronađene uloge</h3>
                    <ul>${lista}</ul>
                `;
            }
        });

        // Provjeri uloge
        document.getElementById('btnPogresnaUloga').addEventListener('click', function () {
            let rezultat = editor.pogresnaUloga();
            if (rezultat.length === 0) {
                porukeDiv.innerHTML = '<p>Nema pronađenih sličnih uloga (moguće greške).</p>';
            } else {
                let lista = rezultat.map(uloga => `<li>${uloga}</li>`).join('');
                porukeDiv.innerHTML = `
                    <h3>Potencijalno pogrešno napisane uloge</h3>
                    <p><em>Sljedeće uloge mogu biti pogrešno napisane:</em></p>
                    <ul>${lista}</ul>
                `;
            }
        });

        // Broj linija za ulogu
        document.getElementById('btnBrojLinija').addEventListener('click', function () {
            let inputUloga = document.getElementById('inputUloga').value.trim();
            if (inputUloga === '') {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo unesite ime uloge u polje iznad.</p>';
                return;
            }
            let brojLinija = editor.brojLinijaTeksta(inputUloga);
            porukeDiv.innerHTML = `
                <h3>Broj linija za ulogu "${inputUloga}"</h3>
                <p><strong>Broj linija dijaloga:</strong> ${brojLinija}</p>
            `;
        });

        // Scenarij uloge
        document.getElementById('btnScenarijUloge').addEventListener('click', function () {
            let inputUloga = document.getElementById('inputUloga').value.trim();
            if (inputUloga === '') {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo unesite ime uloge u polje iznad.</p>';
                return;
            }
            let scenarij = editor.scenarijUloge(inputUloga);
            if (scenarij.length === 0) {
                porukeDiv.innerHTML = `<p>Uloga "${inputUloga}" nije pronađena u scenariju.</p>`;
            } else {
                let html = `<h3>Scenarij uloge "${inputUloga.toUpperCase()}"</h3>`;
                scenarij.forEach((pojava, index) => {
                    html += `
                        <div style="margin-bottom: 20px; padding: 12px; background-color: #f9fafb; border-radius: 6px; border-left: 3px solid #5B3FFF;">
                            <p><strong>Pojavljivanje #${index + 1}</strong> - Scena: ${pojava.scena}</p>
                            <p style="color: #6b7280; font-size: 13px; margin-bottom: 10px;">Pozicija u sceni: ${pojava.pozicijaUTekstu}</p>
                    `;

                    // Prethodna uloga
                    if (pojava.prethodni) {
                        html += `
                            <div style="margin-bottom: 10px; padding: 8px; background-color: #f0f0f0; border-radius: 4px;">
                                <p style="font-size: 12px; color: #666; margin-bottom: 4px;">Prethodni:</p>
                                <p style="font-weight: 600; margin-bottom: 4px;">${pojava.prethodni.uloga}</p>
                                <p style="font-size: 13px;">${pojava.prethodni.linije}</p>
                            </div>
                        `;
                    }

                    // Trenutna uloga
                    html += `
                        <div style="margin-bottom: 10px; padding: 8px; background-color: #E9EEFF; border-radius: 4px;">
                            <p style="font-size: 12px; color: #5B3FFF; margin-bottom: 4px;">Trenutni:</p>
                            <p style="font-weight: 600; margin-bottom: 4px;">${pojava.trenutni.uloga}</p>
                            <p style="font-size: 13px;">${pojava.trenutni.linije}</p>
                        </div>
                    `;

                    // Sljedeća uloga
                    if (pojava.sljedeci) {
                        html += `
                            <div style="padding: 8px; background-color: #f0f0f0; border-radius: 4px;">
                                <p style="font-size: 12px; color: #666; margin-bottom: 4px;">Sljedeći:</p>
                                <p style="font-weight: 600; margin-bottom: 4px;">${pojava.sljedeci.uloga}</p>
                                <p style="font-size: 13px;">${pojava.sljedeci.linije}</p>
                            </div>
                        `;
                    }

                    html += `</div>`;
                });
                porukeDiv.innerHTML = html;
            }
        });

        // Grupisi uloge
        document.getElementById('btnGrupisiUloge').addEventListener('click', function () {
            let grupe = editor.grupisiUloge();
            if (grupe.length === 0) {
                porukeDiv.innerHTML = '<p>Nema pronađenih dijalog-segmenata u scenariju.</p>';
            } else {
                let html = '<h3>Grupe uloga po dijalog-segmentima</h3>';
                grupe.forEach((grupa) => {
                    let ulogeList = grupa.uloge.join(', ');
                    html += `
                        <div style="margin-bottom: 16px; padding: 12px; background-color: #f0f4ff; border-radius: 6px; border-left: 3px solid #5B3FFF;">
                            <p><strong>Scena:</strong> ${grupa.scena}</p>
                            <p><strong>Segment:</strong> #${grupa.segment}</p>
                            <p><strong>Uloge:</strong> ${ulogeList}</p>
                        </div>
                    `;
                });
                porukeDiv.innerHTML = html;
            }
        });

        // Formatiranje teksta - Bold
        document.getElementById('btnBold').addEventListener('click', function () {
            let uspjeh = editor.formatirajTekst('bold');
            if (!uspjeh) {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo selektujte tekst koji želite formatirati.</p>';
            } else {
                porukeDiv.innerHTML = '<p style="color: #059669;">Tekst je uspješno boldiran.</p>';
            }
        });

        // Formatiranje teksta - Italic
        document.getElementById('btnItalic').addEventListener('click', function () {
            let uspjeh = editor.formatirajTekst('italic');
            if (!uspjeh) {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo selektujte tekst koji želite formatirati.</p>';
            } else {
                porukeDiv.innerHTML = '<p style="color: #059669;">Tekst je uspješno formatiran kao italic.</p>';
            }
        });

        // Formatiranje teksta - Underline
        document.getElementById('btnUnderline').addEventListener('click', function () {
            let uspjeh = editor.formatirajTekst('underline');
            if (!uspjeh) {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo selektujte tekst koji želite formatirati.</p>';
            } else {
                porukeDiv.innerHTML = '<p style="color: #059669;">Tekst je uspješno podvučen.</p>';
            }
        });

        // ============================================
        // SPIRALA 3 - Backend API funkcionalnosti
        // ============================================

        // Kreiraj novi scenarij
        document.getElementById('btnCreateScenario').addEventListener('click', function () {
            const title = prompt('Unesite naslov scenarija:', 'Moj Novi Scenarij');
            if (title === null) return; // Korisnik je kliknuo Cancel

            PoziviAjax.postScenario(title, function(status, response) {
                if (status === 200) {
                    porukeDiv.innerHTML = `
                        <h3 style="color: #059669;">✓ Scenarij uspješno kreiran!</h3>
                        <p><strong>ID:</strong> ${response.id}</p>
                        <p><strong>Naslov:</strong> ${response.title}</p>
                        <p><strong>Broj linija:</strong> ${response.content.length}</p>
                        <p style="margin-top: 10px; font-size: 13px; color: #6b7280;">
                            Postavite Scenario ID na ${response.id} i kliknite "Učitaj Scenarij" da učitate scenarij.
                        </p>
                    `;
                    // Automatski postavi scenario ID
                    document.getElementById('inputScenarioId').value = response.id;
                } else {
                    porukeDiv.innerHTML = `<p style="color: #dc2626;">Greška: ${response.message}</p>`;
                }
            });
        });

        // Učitaj scenarij sa servera
        document.getElementById('btnLoadScenario').addEventListener('click', function () {
            const scenarioId = parseInt(document.getElementById('inputScenarioId').value);

            if (isNaN(scenarioId) || scenarioId < 1) {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo unesite validan Scenario ID!</p>';
                return;
            }

            PoziviAjax.getScenario(scenarioId, function(status, response) {
                if (status === 200) {
                    // Učitaj scenarij u editor
                    let html = '';

                    // Rekonstruiši scenarij u pravilnom redoslijedu koristeći nextLineId
                    let lineMap = {};
                    response.content.forEach(line => {
                        lineMap[line.lineId] = line;
                    });

                    // Pronađi prvu liniju (ona koja nije nextLineId ni jedne linije)
                    let allNextIds = new Set(response.content.map(l => l.nextLineId).filter(id => id !== null));
                    let firstLine = response.content.find(l => !allNextIds.has(l.lineId));

                    if (firstLine) {
                        let currentLine = firstLine;
                        while (currentLine) {
                            html += `<p>${currentLine.text || ''}</p>`;
                            currentLine = currentLine.nextLineId ? lineMap[currentLine.nextLineId] : null;
                        }
                    }

                    divEditor.innerHTML = html;

                    porukeDiv.innerHTML = `
                        <h3 style="color: #059669;">✓ Scenarij učitan!</h3>
                        <p><strong>ID:</strong> ${response.id}</p>
                        <p><strong>Naslov:</strong> ${response.title}</p>
                        <p><strong>Broj linija:</strong> ${response.content.length}</p>
                    `;
                } else {
                    porukeDiv.innerHTML = `<p style="color: #dc2626;">Greška: ${response.message}</p>`;
                }
            });
        });

        // Sačuvaj trenutni tekst na backend
        document.getElementById('btnSaveToBackend').addEventListener('click', function () {
            const userId = parseInt(document.getElementById('inputUserId').value);
            const scenarioId = parseInt(document.getElementById('inputScenarioId').value);

            if (isNaN(userId) || userId < 1) {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo unesite validan User ID!</p>';
                return;
            }

            if (isNaN(scenarioId) || scenarioId < 1) {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo unesite validan Scenario ID!</p>';
                return;
            }

            // Demonstracija: Zaključaj prvu liniju, ažuriraj je sa trenutnim sadržajem editora
            const lineId = 1; // Za demonstraciju koristimo prvu liniju

            // 1. Zaključaj liniju
            PoziviAjax.lockLine(scenarioId, lineId, userId, function(lockStatus, lockResponse) {
                if (lockStatus === 200) {
                    // 2. Ažuriraj liniju sa novim tekstom
                    const editorText = divEditor.innerText || divEditor.textContent || '';
                    const lines = editorText.split('\n').filter(line => line.trim() !== '');

                    PoziviAjax.updateLine(scenarioId, lineId, userId, lines, function(updateStatus, updateResponse) {
                        if (updateStatus === 200) {
                            porukeDiv.innerHTML = `
                                <h3 style="color: #059669;">✓ Scenarij sačuvan na backend!</h3>
                                <p>${updateResponse.message}</p>
                                <p style="margin-top: 10px; font-size: 13px; color: #6b7280;">
                                    Tekst je automatski prelomnjen ako sadrži više od 20 riječi po liniji.
                                </p>
                            `;
                        } else {
                            porukeDiv.innerHTML = `<p style="color: #dc2626;">Greška pri ažuriranju: ${updateResponse.message}</p>`;
                        }
                    });
                } else {
                    porukeDiv.innerHTML = `<p style="color: #dc2626;">Greška pri zaključavanju: ${lockResponse.message}</p>`;
                }
            });
        });

    } catch (error) {
        console.error('Greška pri inicijalizaciji editora:', error);
        alert('Greška: ' + error.message);
    }
});
