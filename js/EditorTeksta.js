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

                    dijelovi.forEach(dio => {
                        let tempDiv = document.createElement('div');
                        tempDiv.innerHTML = dio.trim();
                        let cistTekst = dajCistiTekst(tempDiv).trim();
                        linije.push({
                            element: tempDiv,
                            tekst: cistTekst
                        });
                    });
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

        rijeci = rijeci.filter(rijec => {
            if (rijec.length === 0) return false;
            if (/^[\d.]+$/.test(rijec)) return false;
            if (/^[^\w\s'-]+$/.test(rijec)) return false;
            return true;
        });

        return rijeci.length;
    };

    let jeLiNaslovScene = function(tekst) {
        tekst = tekst.trim();

        if (tekst !== tekst.toUpperCase()) return false;
        if (!tekst.startsWith('INT.') && !tekst.startsWith('EXT.')) return false;

        let kljucneRijeci = ['DAY', 'NIGHT', 'AFTERNOON', 'MORNING', 'EVENING'];
        let imaKljucnuRijec = kljucneRijeci.some(rijec =>
            tekst.includes('- ' + rijec)
        );

        return imaKljucnuRijec;
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

    let levenshteinDistanca = function(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = [];

        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[len1][len2];
    };

    let dajBrojRijeci = function () {
        let ukupno = 0;
        let boldiranih = 0;
        let italic = 0;

        let obradiElement = function(element) {
            for (let child of element.childNodes) {
                if (child.nodeType === Node.TEXT_NODE) {
                    let tekst = child.textContent || '';
                    let tekstZaBrojanje = tekst.replace(/[,.]/g, ' ');
                    let rijeci = tekstZaBrojanje.trim().split(/\s+/);

                    rijeci = rijeci.filter(rijec => {
                        if (rijec.length === 0) return false;
                        if (/^[\d.]+$/.test(rijec)) return false;
                        if (/^[^\w\s'-]+$/.test(rijec)) return false;
                        return true;
                    });

                    let brojRijeci = rijeci.length;

                    if (brojRijeci === 0) continue;

                    ukupno += brojRijeci;

                    let parent = child.parentElement;

                    if (parent && (parent.tagName === 'B' || parent.tagName === 'STRONG')) {
                        let roditeljTekst = parent.textContent || '';
                        let ovajTekst = tekst.trim();

                        if (roditeljTekst.trim() === ovajTekst) {
                            boldiranih += brojRijeci;
                        }
                    }

                    if (parent && (parent.tagName === 'I' || parent.tagName === 'EM')) {
                        let roditeljTekst = parent.textContent || '';
                        let ovajTekst = tekst.trim();

                        if (roditeljTekst.trim() === ovajTekst) {
                            italic += brojRijeci;
                        }
                    }
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    obradiElement(child);
                }
            }
        };

        obradiElement(editorDiv);

        return { ukupno: ukupno, boldiranih: boldiranih, italic: italic };
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
                let trenutnaTekst = linije[i].tekst;
                if (!mapa[trenutnaTekst]) {
                    mapa[trenutnaTekst] = 0;
                }
                mapa[trenutnaTekst]++;
            }
        }

        let imena = Object.keys(mapa);
        let pogresne = [];

        for (let i = 0; i < imena.length; i++) {
            let imeA = imena[i];
            let brojA = mapa[imeA];

            for (let j = 0; j < imena.length; j++) {
                if (i === j) continue;

                let imeB = imena[j];
                let brojB = mapa[imeB];

                let distanca = levenshteinDistanca(imeA, imeB);
                let maxDozvoljenaDistanca = (imeA.length > 5 && imeB.length > 5) ? 2 : 1;

                if (distanca <= maxDozvoljenaDistanca) {
                    if (brojB >= 4 && (brojB - brojA) >= 3) {
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
        let sveReplike = [];
        let sceneMapping = [];
        let segmentGranice = new Set();

        for (let i = 0; i < linije.length; i++) {
            let tekst = linije[i].tekst;

            if (jeLiNaslovScene(tekst)) {
                trenutnaScena = tekst;
                if (sveReplike.length > 0) {
                    segmentGranice.add(sveReplike.length);
                }
                continue;
            }

            if (jeLiImeUloge(linije, i)) {
                let imeUloge = tekst;
                let linijeGovora = [];

                let j = i + 1;
                while (j < linije.length) {
                    let linijaTekst = linije[j].tekst;

                    if (linijaTekst === '') break;
                    if (jeLiImeUloge(linije, j)) break;
                    if (jeLiNaslovScene(linijaTekst)) break;

                    linijeGovora.push(linijaTekst);
                    j++;
                }

                sveReplike.push({
                    uloga: imeUloge,
                    linije: linijeGovora.join('\n')
                });
                sceneMapping.push(trenutnaScena);
                i = j - 1;

                let nextIdx = j;
                while (nextIdx < linije.length && linije[nextIdx].tekst === '') {
                    nextIdx++;
                }

                if (nextIdx < linije.length) {
                    let sljedeciTekst = linije[nextIdx].tekst;

                    if (!jeLiImeUloge(linije, nextIdx) && sljedeciTekst !== '') {
                        segmentGranice.add(sveReplike.length);
                    }
                }
            }
        }

        for (let idx = 0; idx < sveReplike.length; idx++) {
            if (sveReplike[idx].uloga === uloga) {
                let scena = sceneMapping[idx];

                let pozicijaUSceni = 1;
                for (let k = 0; k < idx; k++) {
                    if (sceneMapping[k] === scena) {
                        pozicijaUSceni++;
                    }
                }

                let prethodni = null;
                let sljedeci = null;

                if (!segmentGranice.has(idx) && idx > 0 && sceneMapping[idx - 1] === scena) {
                    prethodni = sveReplike[idx - 1];
                }

                if (!segmentGranice.has(idx + 1) && idx < sveReplike.length - 1 && sceneMapping[idx + 1] === scena) {
                    sljedeci = sveReplike[idx + 1];
                }

                rezultat.push({
                    scena: scena,
                    pozicijaUTekstu: pozicijaUSceni,
                    prethodni: prethodni,
                    trenutni: sveReplike[idx],
                    sljedeci: sljedeci
                });
            }
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

        let commonAncestor = range.commonAncestorContainer;
        let parentElement = commonAncestor.nodeType === Node.TEXT_NODE
            ? commonAncestor.parentNode
            : commonAncestor;

        if (!editorDiv.contains(parentElement)) {
            return false;
        }

        let startContainer = range.startContainer;
        let endContainer = range.endContainer;

        let startParent = startContainer.nodeType === Node.TEXT_NODE
            ? startContainer.parentNode
            : startContainer;
        let endParent = endContainer.nodeType === Node.TEXT_NODE
            ? endContainer.parentNode
            : endContainer;

        if (!editorDiv.contains(startParent) || !editorDiv.contains(endParent)) {
            return false;
        }

        try {
            let success = document.execCommand(komanda, false, null);
            return success;
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
