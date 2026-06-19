// -*- coding: utf-8 -*-
/*!
   @fileOverview Main file for Japanese slides view
*/

/* global NihongoDB SlideDB */

(function () {
    let __nihongoDB = null;
    let __slideDB = null;
    let __loadedCount = 0;
    let __isExporting = false;
    let __messageTimeout = null;

    function setMessage(msg) {
        let msgBox = document.getElementById('messageBox');
        if (!msgBox) return;

        if (msg) {
            if (__messageTimeout) {
                clearTimeout(__messageTimeout);
                __messageTimeout = null;
            }
            msgBox.innerText = msg;
            msgBox.classList.add('visible');
        } else {
            if (msgBox.classList.contains('visible') && !__messageTimeout) {
                __messageTimeout = setTimeout(() => {
                    msgBox.classList.remove('visible');
                    setTimeout(() => {
                        if (!msgBox.classList.contains('visible')) {
                            msgBox.innerText = "";
                        }
                    }, 1000);
                    __messageTimeout = null;
                }, 5000);
            }
        }
    }

    function checkReady() {
        __loadedCount++;
        if (__loadedCount === 2) {
            // Both DBs are loaded
            populateSlideSelector();
            restoreUIState();
        }
    }

    function populateSlideSelector() {
        let selector = document.getElementById('slide-selector');
        let slideNames = __slideDB.getSlideNames();

        slideNames.sort();

        selector.innerHTML = ''; // Reset the control
        for (let i = 0; i < slideNames.length; i++) {
            let name = slideNames[i];
            let option = document.createElement('option');
            option.value = name;
            option.innerText = `${i + 1} | ${name}`;
            selector.appendChild(option);
        }
    }

    function saveUIState() {
        let slideName = document.getElementById('slide-selector').value;
        let showRomaji = document.getElementById('show-romaji-toggle').checked;
        localStorage.setItem('nihongoSlides_slideName', slideName);
        localStorage.setItem('nihongoSlides_showRomaji', showRomaji);
    }

    function restoreUIState() {
        let savedSlideName = localStorage.getItem('nihongoSlides_slideName');
        let savedShowRomaji = localStorage.getItem('nihongoSlides_showRomaji');

        if (savedShowRomaji !== null) {
            document.getElementById('show-romaji-toggle').checked = (savedShowRomaji === 'true');
        }

        if (savedSlideName !== null) {
            let selector = document.getElementById('slide-selector');
            for (let i = 0; i < selector.options.length; i++) {
                if (selector.options[i].value === savedSlideName) {
                    selector.selectedIndex = i;
                    break;
                }
            }
        }

        renderSlide();
    }

    function updateSlideButtons() {
        let selector = document.getElementById('slide-selector');
        let prevButton = document.getElementById('prev-slide');
        let nextButton = document.getElementById('next-slide');

        let index = selector.selectedIndex;
        let length = selector.options.length;

        prevButton.disabled = (index == 0);
        nextButton.disabled = index >= length - 1;

        let indexDiv = document.getElementById('slide-index');
        if (indexDiv) {
            if (length > 0 && index >= 0) {
                indexDiv.innerText = `${index + 1}/${length}`;
            } else {
                indexDiv.innerText = `-/-`;
            }
        }
    }

    function prevSlide() {
        let selector = document.getElementById('slide-selector');
        if (selector.selectedIndex > 0) {
            selector.selectedIndex--;
            renderSlide();
        }
    }

    function nextSlide() {
        let selector = document.getElementById('slide-selector');
        if (selector.selectedIndex < selector.options.length - 1) {
            selector.selectedIndex++;
            renderSlide();
        }
    }

    function goToSlide(slideName) {
        console.log(`Going to slide "${slideName}"`);
        let select = document.getElementById('slide-selector');
        select.value = slideName;
        renderSlide();
    }

    function openExportModal() {
        const modal = document.getElementById('export-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('export-filename').value = "Nihongo_Vocabulary.pptx";
            document.getElementById('export-pages-select').value = "all";
            document.getElementById('custom-pages-container').classList.add('hidden');
            document.getElementById('custom-pages-input').value = '';
            document.getElementById('custom-pages-error').classList.add('hidden');
            document.getElementById('export-ratio').value = "16/9";
        }
    }

    function closeExportModal() {
        const modal = document.getElementById('export-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    function parsePageRange(inputStr, maxPages) {
        if (!inputStr || !inputStr.trim()) {
            throw new Error("Page selection cannot be empty.");
        }

        const pages = new Set();
        const parts = inputStr.split(',');

        for (let part of parts) {
            part = part.trim();
            if (!part) continue;

            if (/^\d+$/.test(part)) {
                const p = parseInt(part, 10);
                if (p < 1 || p > maxPages) {
                    throw new Error(`Slide index ${p} is out of range (1-${maxPages}).`);
                }
                pages.add(p);
            } else if (/^\d+-\d+$/.test(part)) {
                const match = part.split('-');
                const start = parseInt(match[0], 10);
                const end = parseInt(match[1], 10);

                if (start < 1 || end < 1 || start > maxPages || end > maxPages) {
                    throw new Error(`Slide range ${part} contains indices out of range (1-${maxPages}).`);
                }
                if (start > end) {
                    throw new Error(`Invalid range: ${part}. Start index must be less than or equal to end index.`);
                }

                for (let i = start; i <= end; i++) {
                    pages.add(i);
                }
            } else {
                throw new Error(`Invalid page range syntax: "${part}". Use numbers or ranges like 1-5.`);
            }
        }

        if (pages.size === 0) {
            throw new Error("No valid slides selected.");
        }

        return Array.from(pages).sort((a, b) => a - b);
    }

    function runExport() {
        let select = document.getElementById('slide-selector');
        const allOptions = Array.from(select.options);
        
        let optionsToExport = [];
        const isCustom = document.getElementById('export-pages-select').value === 'custom';
        if (isCustom) {
            const inputStr = document.getElementById('custom-pages-input').value;
            try {
                const pageIndices = parsePageRange(inputStr, allOptions.length);
                optionsToExport = pageIndices.map(p => allOptions[p - 1]);
            } catch (err) {
                const errorDiv = document.getElementById('custom-pages-error');
                errorDiv.innerText = err.message;
                errorDiv.classList.remove('hidden');
                return;
            }
        } else {
            optionsToExport = allOptions;
        }

        // Hide modal
        closeExportModal();

        const filename = document.getElementById('export-filename').value.trim() || "Nihongo_Vocabulary.pptx";
        const ratio = document.getElementById('export-ratio').value;
        const pptxManager = new PptxManager(filename, ratio);

        // Hide the UI while snapshoting the slides to get the
        // proper absolute coordinates
        let UIdiv = document.getElementById('UI');
        UIdiv.classList.add('hidden');

        __isExporting = true;

        const progressCB = (status, current, total, fn) => {
            if (status === 'preparing') {
                setMessage("Preparing " + current + " slide out of " + total + ".");
            } else if (status === 'exporting') {
                setMessage("exporting...");
            } else if (status === 'done') {
                setMessage("exported slides to " + fn);
                setMessage("");
            }
        };

        pptxManager.runMultiPageExport(optionsToExport, goToSlide, progressCB)
            .then(() => {
                UIdiv.classList.remove('hidden');
                __isExporting = false;
            })
            .catch(err => {
                console.error("Export failed:", err);
                UIdiv.classList.remove('hidden');
                __isExporting = false;
                setMessage("Export failed: " + err.message);
                setMessage("");
            });
    }

    function exportPptx() {
        openExportModal();
    }

    /*
      If text has extra text in [] or (), normalize and use a smaller font.
     */
    function formatExtra(text) {
        // First convert all () into []
        text = text.replace(/\(/g, '[');
        text = text.replace(/（/g, '[');
        text = text.replace(/\)/g, ']');
        text = text.replace(/）/g, ']');

        // Surround all [...] parts with "extra" span, and replace with ()
        text = text.replace(/\[(.*?)\]/g, '<span class="extra">($1)</span>');

        // Consider extra all text following ・(Japanese dot). It's used to indicate the ~masu form
        text = text.replace(/(・.*?)$/, '<span class="extra">$1</span>');

        // 「な」is used to indicate ~na adjectives
        text = text.replace(/(「.*?」)/g, '<span class="extra">$1</span>');

        return text;
    }

    function renderSlide() {
        let slideName = document.getElementById('slide-selector').value;
        let table = document.getElementById('slide-table');
        table.innerHTML = ''; // Clear table

        updateSlideButtons();
        saveUIState();

        if (!slideName) {
            setMessage("Please select a slide.");
            return;
        }

        if (!__isExporting) {
            setMessage("");
        }
        let slideData = __slideDB.getSlideData(slideName);
        let showRomaji = document.getElementById('show-romaji-toggle').checked;

        for (let row of slideData) {
            let tr = document.createElement('tr');

            for (let item of row) {
                let td = document.createElement('td');

                item = item.trim();
                // Optional text in { } is for image name only
                let key = item.replace(/\{[^\}]+\}/g, '');

                if (key === "") {
                    // Empty space
                    tr.appendChild(td);
                    continue;
                }

                let entry = __nihongoDB.findWordByEnglish(key);
                // Kepp only whjayt is inside the {}
                let imgName = item.replace(/[{}]/gi, '')+".png";
                let content = '';
                if (!entry) {
                    // Display image, english, and "Not found"
                    content = `
                         <div class="not-found">Not found</div>
                         <div class="english">${item}</div>
                        `;
                } else {
                    var kana = entry.Kana;
                    var kanji = entry.Kanji;
                    var roma = entry.Romaji;

                    if (kana == entry.Kanji) {
                        // ideographic space, invisible in print
                        kana = '&#x3000;';
                    }

                    // Maximal allowed number of characters for kanji
                    // is 7. After that we need to reduce the font size.
                    // Need to call 'countGlyphs' because of UTF-16
                    // encoding
                    // FIXME: this does not take into account the
                    // "extra" parts and sometimes renders a bit too small
                    //
                    let nbJpChar = NihongoDB.countGlyphs(kanji);
                    let moreKanjiClasses = "";
                    if (nbJpChar > 9) {
                        moreKanjiClasses = " tiny";
                    } else if (nbJpChar > 7) {
                        moreKanjiClasses = " small";
                    }

                    // format [] or () in kanji and kana
                    kanji = formatExtra(kanji);
                    kana = formatExtra(kana);
                    roma = formatExtra(roma);
                    let romajiHtml = showRomaji ? `<div class="romaji as-text">${roma}</div>` : '';

                    content = `
                        ${romajiHtml}
                        <div class="kana as-text">${kana}</div>
                        <div class="kanji as-text${moreKanjiClasses}">${kanji}</div>
                        <div class="english as-text">${entry.English}</div>
                `;

                    td.innerHTML = `
                    <div class="slide-card">
                        <div class="img"><img src="./VocabularyImages/${imgName}" alt="${imgName}"></div>
${content}
                    </div>
                    `;
                }
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
    }
    /*
    function PptxGenJSLoaded() {
        console.log('\nPptxGenJSLoaded is loaded now\n');
        document.getElementById('export-pptx').disabled = false;
    }
    */
    function handleRefresh() {
        if (__loadedCount >= 2) {
            populateSlideSelector();
            restoreUIState();
        }
    }

    function main() {
        setMessage("Loading data...");

        __nihongoDB = new NihongoDB(checkReady, handleRefresh);
        __slideDB = new SlideDB(checkReady, handleRefresh);

        document.getElementById('slide-selector').addEventListener('change', renderSlide);
        document.getElementById('show-romaji-toggle').addEventListener('change', renderSlide);
        document.getElementById('prev-slide').addEventListener('click', prevSlide);
        document.getElementById('next-slide').addEventListener('click', nextSlide);
        document.getElementById('export-pptx').addEventListener('click', exportPptx);

        // Modal event listeners
        document.getElementById('modal-close-btn').addEventListener('click', closeExportModal);
        document.getElementById('modal-cancel-btn').addEventListener('click', closeExportModal);
        document.getElementById('modal-confirm-btn').addEventListener('click', runExport);
        document.getElementById('export-pages-select').addEventListener('change', (e) => {
            const customContainer = document.getElementById('custom-pages-container');
            if (e.target.value === 'custom') {
                customContainer.classList.remove('hidden');
                document.getElementById('custom-pages-input').focus();
            } else {
                customContainer.classList.add('hidden');
                document.getElementById('custom-pages-error').classList.add('hidden');
            }
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('export-modal');
            if (e.target === modal) {
                closeExportModal();
            }
        });

        updateSlideButtons();
    }

    document.addEventListener('DOMContentLoaded', main);
})();
