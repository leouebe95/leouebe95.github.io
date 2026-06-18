// -*- coding: utf-8 -*-
/*!
   @fileOverview Main file for Japanese slides view
*/

/* global NihongoDB SlideDB */

(function () {
    let __nihongoDB = null;
    let __slideDB = null;
    let __loadedCount = 0;

    function setMessage(msg) {
        let msgBox = document.getElementById('messageBox');
        if (msgBox) {
            msgBox.innerText = msg;
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
        for (let name of slideNames) {
            let option = document.createElement('option');
            option.value = name;
            option.innerText = name;
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

    function exportPptx() {
        let select = document.getElementById('slide-selector');
        const pptxManager = new PptxManager();

        // Read the names of all slides
        const options = Array.from(select.options);

        // Hide the UI while snapshoting the slides to get the
        // proper absolute coordinates
        let UIdiv = document.getElementById('UI');
        UIdiv.classList.add('hidden')

        pptxManager.runMultiPageExport(options, goToSlide)

        // Display the UI again
        UIdiv.classList.remove('hidden')
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

        setMessage("");
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
    function main() {
        setMessage("Loading data...");

        __nihongoDB = new NihongoDB(checkReady, null);
        __slideDB = new SlideDB(checkReady, null);

        document.getElementById('slide-selector').addEventListener('change', renderSlide);
        document.getElementById('show-romaji-toggle').addEventListener('change', renderSlide);
        document.getElementById('prev-slide').addEventListener('click', prevSlide);
        document.getElementById('next-slide').addEventListener('click', nextSlide);
        document.getElementById('export-pptx').addEventListener('click', exportPptx);

        updateSlideButtons();
    }

    document.addEventListener('DOMContentLoaded', main);
})();
