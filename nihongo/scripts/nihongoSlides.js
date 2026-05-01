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

        if (index <= 1) {
            prevButton.disabled = true;
        } else {
            prevButton.disabled = false;
        }

        if (index === 0 || index === length - 1) {
            nextButton.disabled = true;
        } else {
            nextButton.disabled = false;
        }
    }

    function prevSlide() {
        let selector = document.getElementById('slide-selector');
        if (selector.selectedIndex > 1) {
            selector.selectedIndex--;
            renderSlide();
        }
    }

    function nextSlide() {
        let selector = document.getElementById('slide-selector');
        if (selector.selectedIndex > 0 && selector.selectedIndex < selector.options.length - 1) {
            selector.selectedIndex++;
            renderSlide();
        }
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

                if (!entry) {
                    // Display image, english, and "Not found"
                    td.innerHTML = `
                            <div class="slide-card">
                                <img src="./VocabularyImages/${imgName}" alt="${imgName}">
                                <div class="not-found">Not found</div>
                                <div class="english">${item}</div>
                            </div>
                        `;
                    tr.appendChild(td);
                    continue;
                }

                var kana = entry.Kana;
                if (kana == entry.Kanji) { kana = ' '; }

                let romajiHtml = showRomaji ? `<div class="romaji">${entry.Romaji}</div>` : '';

                // Entry found
                td.innerHTML = `
                    <div class="slide-card">
                        <div class="img">
                        <img src="./VocabularyImages/${imgName}" alt="${imgName}"></div>
                        ${romajiHtml}
                        <div class="kana">${kana}</div>
                        <div class="kanji">${entry.Kanji}</div>
                        <div class="english">${entry.English}</div>
                    </div>
                `;
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
    }

    function main() {
        setMessage("Loading data...");

        __nihongoDB = new NihongoDB(checkReady, null);
        __slideDB = new SlideDB(checkReady, null);

        document.getElementById('slide-selector').addEventListener('change', renderSlide);
        document.getElementById('show-romaji-toggle').addEventListener('change', renderSlide);
        document.getElementById('prev-slide').addEventListener('click', prevSlide);
        document.getElementById('next-slide').addEventListener('click', nextSlide);

        updateSlideButtons();
    }

    document.addEventListener('DOMContentLoaded', main);
})();
