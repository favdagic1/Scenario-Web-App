let EditorTeksta = function (divRef) {
    if (!divRef || divRef.tagName !== 'DIV') {
        throw new Error("Pogresan tip elementa!");
    }

    if (divRef.getAttribute('contenteditable') !== 'true') {
        throw new Error("Neispravan DIV, ne posjeduje contenteditable atribut!");
    }

    let editorDiv = divRef;

    let dajCistiTekst = function(element) {
        return element.textContent || element.innerText || '';
    };

    let dajLinije = function() {
        let linije = [];
        let children = editorDiv.childNodes;

        for (let i = 0; i < children.length; i++) {
            let child = children[i];

            if (child.nodeType === Node.ELEMENT_NODE) {
                let tagName = child.tagName.toUpperCase();

                if (tagName === 'P' || tagName === 'DIV') {
                    let innerHtml = child.innerHTML;
                    let dijelovi = innerHtml.split(/<br\s*\/?>/gi);

                    for (let d = 0; d < dijelovi.length; d++) {
                        let tempDiv = document.createElement('div');
                        tempDiv.innerHTML = dijelovi[d].trim();
                        let cistTekst = dajCistiTekst(tempDiv).trim();
                        linije.push({
                            element: tempDiv,
                            tekst: cistTekst
                        });
                    }
                } else if (tagName === 'BR') {
                    linije.push({
                        element: document.createElement('div'),
                        tekst: ''
                    });
                } else {
                    let cistTekst = dajCistiTekst(child).trim();
                    if (cistTekst !== '') {
                        linije.push({
                            element: child,
                            tekst: cistTekst
                        });
                    }
                }
            } else if (child.nodeType === Node.TEXT_NODE) {
                let tekst = child.textContent.trim();
                if (tekst !== '') {
                    let tempDiv = document.createElement('div');
                    tempDiv.textContent = tekst;
                    linije.push({
                        element: tempDiv,
                        tekst: tekst
                    });
                }
            }
        }

        if (linije.length === 0) {
            linije.push({
                element: document.createElement('div'),
                tekst: ''
            });
        }

        return linije;
    };

    let prebrojiRijeci = function(tekst) {
        if (!tekst || tekst.trim() === '') return 0;

        tekst = tekst.replace(/[,.]/g, ' ');
        let rijeci = tekst.trim().split(/\s+/);
        let broj = 0;

        for (let i = 0; i < rijeci.length; i++) {
            if (rijeci[i].length > 0 && /[a-zA-Z]/.test(rijeci[i])) {
                broj++;
            }
        }

        return broj;
    };

    let jeLiNaslovScene = function(tekst) {
        tekst = tekst.trim();

        if (tekst !== tekst.toUpperCase()) return false;
        if (!tekst.startsWith('INT.') && !tekst.startsWith('EXT.')) return false;

        let kljucneRijeci = ['DAY', 'NIGHT', 'AFTERNOON', 'MORNING', 'EVENING'];
        for (let i = 0; i < kljucneRijeci.length; i++) {
            if (tekst.includes('- ' + kljucneRijeci[i])) {
                return true;
            }
        }

        return false;
    };

    let jeLiImeUloge = function(linije, index) {
        let tekst = linije[index].tekst.trim();

        if (tekst !== tekst.toUpperCase()) return false;
        if (jeLiNaslovScene(tekst)) return false;
        if (tekst === '') return false;
        if (/[0-9,.]/.test(tekst)) return false;
        if (!/[A-Z]/.test(tekst)) return false;

        let j = index + 1;
        while (j < linije.length) {
            let sljedecaTekst = linije[j].tekst.trim();

            if (sljedecaTekst === '') return false;
            if (sljedecaTekst === sljedecaTekst.toUpperCase()) return false;

            if (!jeLiLinijaUZagradama(sljedecaTekst)) {
                return true;
            }

            j++;
        }

        return false;
    };

    let jeLiLinijaUZagradama = function(tekst) {
        tekst = tekst.trim();
        return tekst.startsWith('(') && tekst.endsWith(')');
    };

    let dajBrojRijeci = function () {
        let ukupnoTekst = editorDiv.innerText || '';
        let boldTekst = '';
        let italicTekst = '';

        editorDiv.querySelectorAll('b, strong').forEach(function(el) {
            boldTekst += ' ' + (el.textContent || '');
        });

        editorDiv.querySelectorAll('i, em').forEach(function(el) {
            italicTekst += ' ' + (el.textContent || '');
        });

        return {
            ukupno: prebrojiRijeci(ukupnoTekst),
            boldiranih: prebrojiRijeci(boldTekst),
            italic: prebrojiRijeci(italicTekst)
        };
    };

    let dajUloge = function () {
        let linije = dajLinije();
        let uloge = [];

        for (let i = 0; i < linije.length; i++) {
            if (jeLiImeUloge(linije, i)) {
                let trenutnaTekst = linije[i].tekst;
                if (!uloge.includes(trenutnaTekst)) {
                    uloge.push(trenutnaTekst);
                }
            }
        }

        return uloge;
    };

    let pogresnaUloga = function () {
        let linije = dajLinije();
        let mapa = {};

        for (let i = 0; i < linije.length; i++) {
            if (jeLiImeUloge(linije, i)) {
                let ime = linije[i].tekst;
                if (!mapa[ime]) mapa[ime] = 0;
                mapa[ime]++;
            }
        }

        let imena = Object.keys(mapa);
        let pogresne = [];

        for (let i = 0; i < imena.length; i++) {
            let imeA = imena[i];

            for (let j = 0; j < imena.length; j++) {
                if (i === j) continue;

                let imeB = imena[j];

                if (Math.abs(imeA.length - imeB.length) <= 2 && imeA.substring(0, 3) === imeB.substring(0, 3)) {
                    if (mapa[imeB] >= 4 && (mapa[imeB] - mapa[imeA]) >= 3) {
                        if (!pogresne.includes(imeA)) {
                            pogresne.push(imeA);
                        }
                    }
                }
            }
        }

        return pogresne;
    };

    let brojLinijaTeksta = function (uloga) {
        uloga = uloga.toUpperCase();
        let linije = dajLinije();
        let ukupnoLinija = 0;

        for (let i = 0; i < linije.length; i++) {
            let trenutnaTekst = linije[i].tekst;

            if (jeLiImeUloge(linije, i) && trenutnaTekst === uloga) {
                let j = i + 1;
                while (j < linije.length) {
                    let linijaTekst = linije[j].tekst;

                    if (linijaTekst === '') break;
                    if (jeLiImeUloge(linije, j)) break;
                    if (jeLiNaslovScene(linijaTekst)) break;

                    if (!jeLiLinijaUZagradama(linijaTekst)) {
                        ukupnoLinija++;
                    }

                    j++;
                }
            }
        }

        return ukupnoLinija;
    };

    let scenarijUloge = function (uloga) {
        uloga = uloga.toUpperCase();
        let linije = dajLinije();
        let rezultat = [];
        let trenutnaScena = '';
        let pozUSceni = 0;

        for (let i = 0; i < linije.length; i++) {
            let tekst = linije[i].tekst;

            if (jeLiNaslovScene(tekst)) {
                trenutnaScena = tekst;
                pozUSceni = 0;
                continue;
            }

            if (!jeLiImeUloge(linije, i)) continue;

            pozUSceni++;

            if (tekst !== uloga) continue;

            let linijeGovora = [];
            let j = i + 1;
            while (j < linije.length) {
                let lt = linije[j].tekst;
                if (lt === '' || jeLiImeUloge(linije, j) || jeLiNaslovScene(lt)) break;
                linijeGovora.push(lt);
                j++;
            }

            let prethodni = null;
            for (let k = i - 1; k >= 0; k--) {
                if (jeLiNaslovScene(linije[k].tekst)) break;
                if (jeLiImeUloge(linije, k)) {
                    let govor = [];
                    let m = k + 1;
                    while (m < linije.length) {
                        let lt = linije[m].tekst;
                        if (lt === '' || jeLiImeUloge(linije, m) || jeLiNaslovScene(lt)) break;
                        govor.push(lt);
                        m++;
                    }
                    prethodni = { uloga: linije[k].tekst, linije: govor.join('\n') };
                    break;
                }
            }

            let sljedeci = null;
            for (let k = j; k < linije.length; k++) {
                if (jeLiNaslovScene(linije[k].tekst)) break;
                if (jeLiImeUloge(linije, k)) {
                    let govor = [];
                    let m = k + 1;
                    while (m < linije.length) {
                        let lt = linije[m].tekst;
                        if (lt === '' || jeLiImeUloge(linije, m) || jeLiNaslovScene(lt)) break;
                        govor.push(lt);
                        m++;
                    }
                    sljedeci = { uloga: linije[k].tekst, linije: govor.join('\n') };
                    break;
                }
            }

            rezultat.push({
                scena: trenutnaScena,
                pozicijaUTekstu: pozUSceni,
                prethodni: prethodni,
                trenutni: { uloga: uloga, linije: linijeGovora.join('\n') },
                sljedeci: sljedeci
            });

            i = j - 1;
        }

        return rezultat;
    };

    let grupisiUloge = function () {
        let linije = dajLinije();
        let rezultat = [];

        let trenutnaScena = '';
        let segmentBrojPoSceni = {};
        let trenutniSegment = [];

        let i = 0;
        while (i < linije.length) {
            let tekst = linije[i].tekst;

            if (jeLiNaslovScene(tekst)) {
                if (trenutniSegment.length > 0 && trenutnaScena !== '') {
                    let uloge = [];
                    for (let s = 0; s < trenutniSegment.length; s++) {
                        if (!uloge.includes(trenutniSegment[s])) {
                            uloge.push(trenutniSegment[s]);
                        }
                    }

                    if (uloge.length > 0) {
                        let segmentBroj = segmentBrojPoSceni[trenutnaScena] || 0;
                        segmentBroj++;
                        segmentBrojPoSceni[trenutnaScena] = segmentBroj;

                        rezultat.push({
                            scena: trenutnaScena,
                            segment: segmentBroj,
                            uloge: uloge
                        });
                    }
                }

                trenutnaScena = tekst;
                trenutniSegment = [];
                i++;
                continue;
            }

            if (tekst === '') {
                i++;
                continue;
            }

            if (jeLiImeUloge(linije, i)) {
                trenutniSegment.push(tekst);

                i++;
                while (i < linije.length) {
                    let linijaTekst = linije[i].tekst;

                    if (linijaTekst === '') break;
                    if (jeLiImeUloge(linije, i)) break;
                    if (jeLiNaslovScene(linijaTekst)) break;

                    i++;
                }
                continue;
            }

            if (trenutniSegment.length > 0 && trenutnaScena !== '') {
                let uloge = [];
                trenutniSegment.forEach(ime => {
                    if (!uloge.includes(ime)) {
                        uloge.push(ime);
                    }
                });

                if (uloge.length > 0) {
                    let segmentBroj = segmentBrojPoSceni[trenutnaScena] || 0;
                    segmentBroj++;
                    segmentBrojPoSceni[trenutnaScena] = segmentBroj;

                    rezultat.push({
                        scena: trenutnaScena,
                        segment: segmentBroj,
                        uloge: uloge
                    });
                }

                trenutniSegment = [];
            }

            i++;
        }

        if (trenutniSegment.length > 0 && trenutnaScena !== '') {
            let uloge = [];
            trenutniSegment.forEach(ime => {
                if (!uloge.includes(ime)) {
                    uloge.push(ime);
                }
            });

            if (uloge.length > 0) {
                let segmentBroj = segmentBrojPoSceni[trenutnaScena] || 0;
                segmentBroj++;
                segmentBrojPoSceni[trenutnaScena] = segmentBroj;

                rezultat.push({
                    scena: trenutnaScena,
                    segment: segmentBroj,
                    uloge: uloge
                });
            }
        }

        return rezultat;
    };

    let formatirajTekst = function (komanda) {
        if (komanda !== 'bold' && komanda !== 'italic' && komanda !== 'underline') {
            return false;
        }

        let selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            return false;
        }

        let range = selection.getRangeAt(0);
        let ancestor = range.commonAncestorContainer;
        let parentEl = ancestor.nodeType === Node.TEXT_NODE ? ancestor.parentNode : ancestor;

        if (!editorDiv.contains(parentEl)) {
            return false;
        }

        try {
            return document.execCommand(komanda, false, null);
        } catch (e) {
            return false;
        }
    };

    return {
        dajBrojRijeci: dajBrojRijeci,
        dajUloge: dajUloge,
        pogresnaUloga: pogresnaUloga,
        brojLinijaTeksta: brojLinijaTeksta,
        scenarijUloge: scenarijUloge,
        grupisiUloge: grupisiUloge,
        formatirajTekst: formatirajTekst
    };
};
