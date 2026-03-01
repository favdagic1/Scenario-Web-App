let editor;

document.addEventListener('DOMContentLoaded', function () {
    try {
        let divEditor = document.getElementById('divEditor');
        editor = EditorTeksta(divEditor);

        let porukeDiv = document.getElementById('poruke');

        document.getElementById('btnBrojRijeci').addEventListener('click', function () {
            let rezultat = editor.dajBrojRijeci();
            porukeDiv.innerHTML = `
                <h3>Broj riječi</h3>
                <p><strong>Ukupno riječi:</strong> ${rezultat.ukupno}</p>
                <p><strong>Boldirane riječi:</strong> ${rezultat.boldiranih}</p>
                <p><strong>Italic riječi:</strong> ${rezultat.italic}</p>
            `;
        });

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

                    if (pojava.prethodni) {
                        html += `
                            <div style="margin-bottom: 10px; padding: 8px; background-color: #f0f0f0; border-radius: 4px;">
                                <p style="font-size: 12px; color: #666; margin-bottom: 4px;">Prethodni:</p>
                                <p style="font-weight: 600; margin-bottom: 4px;">${pojava.prethodni.uloga}</p>
                                <p style="font-size: 13px;">${pojava.prethodni.linije}</p>
                            </div>
                        `;
                    }

                    html += `
                        <div style="margin-bottom: 10px; padding: 8px; background-color: #E9EEFF; border-radius: 4px;">
                            <p style="font-size: 12px; color: #5B3FFF; margin-bottom: 4px;">Trenutni:</p>
                            <p style="font-weight: 600; margin-bottom: 4px;">${pojava.trenutni.uloga}</p>
                            <p style="font-size: 13px;">${pojava.trenutni.linije}</p>
                        </div>
                    `;

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

        document.getElementById('btnBold').addEventListener('click', function () {
            let uspjeh = editor.formatirajTekst('bold');
            if (!uspjeh) {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo selektujte tekst koji želite formatirati.</p>';
            } else {
                porukeDiv.innerHTML = '<p style="color: #059669;">Tekst je uspješno boldiran.</p>';
            }
        });

        document.getElementById('btnItalic').addEventListener('click', function () {
            let uspjeh = editor.formatirajTekst('italic');
            if (!uspjeh) {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo selektujte tekst koji želite formatirati.</p>';
            } else {
                porukeDiv.innerHTML = '<p style="color: #059669;">Tekst je uspješno formatiran kao italic.</p>';
            }
        });

        document.getElementById('btnUnderline').addEventListener('click', function () {
            let uspjeh = editor.formatirajTekst('underline');
            if (!uspjeh) {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo selektujte tekst koji želite formatirati.</p>';
            } else {
                porukeDiv.innerHTML = '<p style="color: #059669;">Tekst je uspješno podvučen.</p>';
            }
        });

        document.getElementById('btnCreateScenario').addEventListener('click', function () {
            const title = prompt('Unesite naslov scenarija:', 'Moj Novi Scenarij');
            if (title === null) return;

            PoziviAjaxFetch.postScenario(title, function(status, response) {
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
                    document.getElementById('inputScenarioId').value = response.id;
                } else {
                    porukeDiv.innerHTML = `<p style="color: #dc2626;">Greška: ${response.message}</p>`;
                }
            });
        });

        document.getElementById('btnLoadScenario').addEventListener('click', function () {
            const scenarioId = parseInt(document.getElementById('inputScenarioId').value);

            if (isNaN(scenarioId) || scenarioId < 1) {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo unesite validan Scenario ID!</p>';
                return;
            }

            PoziviAjaxFetch.getScenario(scenarioId, function(status, response) {
                if (status === 200) {
                    let html = '';
                    for (let i = 0; i < response.content.length; i++) {
                        html += '<p>' + (response.content[i].text || '') + '</p>';
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

        document.getElementById('btnLockLine').addEventListener('click', function () {
            const userId = parseInt(document.getElementById('inputUserId').value);
            const scenarioId = parseInt(document.getElementById('inputScenarioId').value);
            const lineId = parseInt(document.getElementById('inputLineId').value);

            if (isNaN(userId) || userId < 1) {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo unesite validan User ID!</p>';
                return;
            }
            if (isNaN(scenarioId) || scenarioId < 1) {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo unesite validan Scenario ID!</p>';
                return;
            }
            if (isNaN(lineId) || lineId < 1) {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo unesite validan Line ID!</p>';
                return;
            }

            PoziviAjaxFetch.lockLine(scenarioId, lineId, userId, function(status, response) {
                if (status === 200) {
                    porukeDiv.innerHTML = `
                        <h3 style="color: #059669;">${response.message}</h3>
                        <p>Linija ${lineId} u scenariju ${scenarioId} je zaključana za korisnika ${userId}.</p>
                    `;
                } else {
                    porukeDiv.innerHTML = `<p style="color: #dc2626;">Greška: ${response.message}</p>`;
                }
            });
        });

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

            const lineId = 1;

            PoziviAjaxFetch.lockLine(scenarioId, lineId, userId, function(lockStatus, lockResponse) {
                if (lockStatus === 200) {
                    const editorText = (divEditor.innerText || divEditor.textContent || '').trim();

                    PoziviAjaxFetch.updateLine(scenarioId, lineId, userId, [editorText], function(updateStatus, updateResponse) {
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

        document.getElementById('btnRenameCharacter').addEventListener('click', function () {
            const userId = parseInt(document.getElementById('inputUserId').value);
            const scenarioId = parseInt(document.getElementById('inputScenarioId').value);
            const oldName = document.getElementById('inputOldName').value.trim();
            const newName = document.getElementById('inputNewName').value.trim();

            if (isNaN(userId) || userId < 1) {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo unesite validan User ID!</p>';
                return;
            }
            if (isNaN(scenarioId) || scenarioId < 1) {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo unesite validan Scenario ID!</p>';
                return;
            }
            if (oldName === '') {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo unesite staro ime lika!</p>';
                return;
            }
            if (newName === '') {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo unesite novo ime lika!</p>';
                return;
            }

            PoziviAjaxFetch.lockCharacter(scenarioId, oldName, userId, function(lockStatus, lockResponse) {
                if (lockStatus === 200) {
                    PoziviAjaxFetch.updateCharacter(scenarioId, userId, oldName, newName, function(updateStatus, updateResponse) {
                        if (updateStatus === 200) {
                            porukeDiv.innerHTML = `
                                <h3 style="color: #059669;">✓ Lik uspješno preimenovan!</h3>
                                <p><strong>Staro ime:</strong> ${oldName}</p>
                                <p><strong>Novo ime:</strong> ${newName}</p>
                                <p style="margin-top: 10px; font-size: 13px; color: #6b7280;">
                                    Sve pojave imena "${oldName}" su zamijenjene sa "${newName}" u scenariju ${scenarioId}.
                                </p>
                            `;
                            document.getElementById('inputOldName').value = '';
                            document.getElementById('inputNewName').value = '';
                        } else {
                            porukeDiv.innerHTML = `<p style="color: #dc2626;">Greška pri preimenovanju: ${updateResponse.message}</p>`;
                        }
                    });
                } else {
                    porukeDiv.innerHTML = `<p style="color: #dc2626;">Greška pri zaključavanju: ${lockResponse.message}</p>`;
                }
            });
        });

        document.getElementById('btnGetDeltas').addEventListener('click', function () {
            const scenarioId = parseInt(document.getElementById('inputScenarioId').value);
            const since = parseInt(document.getElementById('inputSinceTimestamp').value) || 0;

            if (isNaN(scenarioId) || scenarioId < 1) {
                porukeDiv.innerHTML = '<p style="color: #dc2626;">Molimo unesite validan Scenario ID!</p>';
                return;
            }

            PoziviAjaxFetch.getDeltas(scenarioId, since, function(status, response) {
                if (status === 200) {
                    if (response.deltas.length === 0) {
                        porukeDiv.innerHTML = `
                            <h3>Promjene za scenarij ${scenarioId}</h3>
                            <p>Nema promjena od timestamp-a ${since}.</p>
                        `;
                    } else {
                        let html = `<h3>Promjene za scenarij ${scenarioId} (od timestamp ${since})</h3>`;
                        html += `<p><strong>Ukupno promjena:</strong> ${response.deltas.length}</p>`;
                        html += '<div style="margin-top: 15px;">';

                        for (let i = 0; i < response.deltas.length; i++) {
                            let delta = response.deltas[i];
                            let date = new Date(delta.timestamp * 1000).toLocaleString();

                            if (delta.type === 'line_update') {
                                html += `
                                    <div style="margin-bottom: 12px; padding: 10px; background-color: #f0f4ff; border-radius: 6px; border-left: 3px solid #5B3FFF;">
                                        <p><strong>#${i + 1} - Ažuriranje linije</strong></p>
                                        <p style="font-size: 13px;">Linija ID: ${delta.lineId}</p>
                                        <p style="font-size: 13px;">Sadržaj: "${delta.content}"</p>
                                        <p style="font-size: 12px; color: #6b7280;">Vrijeme: ${date}</p>
                                    </div>
                                `;
                            } else if (delta.type === 'char_rename') {
                                html += `
                                    <div style="margin-bottom: 12px; padding: 10px; background-color: #f0fff4; border-radius: 6px; border-left: 3px solid #28a745;">
                                        <p><strong>#${i + 1} - Preimenovanje lika</strong></p>
                                        <p style="font-size: 13px;">"${delta.oldName}" → "${delta.newName}"</p>
                                        <p style="font-size: 12px; color: #6b7280;">Vrijeme: ${date}</p>
                                    </div>
                                `;
                            }
                        }

                        html += '</div>';
                        porukeDiv.innerHTML = html;
                    }
                } else {
                    porukeDiv.innerHTML = `<p style="color: #dc2626;">Greška: ${response.message}</p>`;
                }
            });
        });

    } catch (error) {
        console.error('Greška pri inicijalizaciji editora:', error);
        alert('Greška: ' + error.message);
    }
});
