// -*- coding: utf-8 -*-
/*!
   @fileOverview Main file for Japanese slides view
*/

/* global NihongoDB SlideDB */

(function() {
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
            setMessage("Data loaded. Please select a slide.");
        }
    }

    function populateSlideSelector() {
        let selector = document.getElementById('slide-selector');
        let slideNames = __slideDB.getSlideNames();
        
        slideNames.sort();
        
        for (let name of slideNames) {
            let option = document.createElement('option');
            option.value = name;
            option.innerText = name;
            selector.appendChild(option);
        }
    }

    function getBaseImageName(cellName) {
        // "remove any character after (and including) , or /"
        let baseName = cellName;
        let commaIdx = baseName.indexOf(',');
        if (commaIdx !== -1) {
            baseName = baseName.substring(0, commaIdx);
        }
        let slashIdx = baseName.indexOf('/');
        if (slashIdx !== -1) {
            baseName = baseName.substring(0, slashIdx);
        }
        return baseName.trim();
    }

    window.handleImageError = function(img) {
        let noErrorToggle = document.getElementById('no-error-toggle').checked;
        if (noErrorToggle) {
            img.style.display = 'none';
        }
    };

    function renderSlide() {
        let slideName = document.getElementById('slide-selector').value;
        let table = document.getElementById('slide-table');
        table.innerHTML = ''; // Clear table

        if (!slideName) {
            setMessage("Please select a slide.");
            return;
        }

        setMessage("");
        let slideData = __slideDB.getSlideData(slideName);
        let noErrorToggle = document.getElementById('no-error-toggle').checked;

        for (let row of slideData) {
            let tr = document.createElement('tr');
            
            for (let cellName of row) {
                let td = document.createElement('td');
                
                cellName = cellName.trim();
                
                if (cellName === "") {
                    // Empty space
                    tr.appendChild(td);
                    continue;
                }

                let entry = __nihongoDB.findWordByEnglish(cellName);
                let baseName = getBaseImageName(cellName);

                if (!entry) {
                    if (noErrorToggle) {
                        // Leave totally empty
                        tr.appendChild(td);
                        continue;
                    } else {
                        // Display image, english, and "Not found"
                        td.innerHTML = `
                            <div class="slide-card">
                                <img src="./VocabularyImages/${baseName}.png" alt="${baseName}.png" onerror="handleImageError(this)">
                                <div class="not-found">Not found</div>
                                <div class="english">${cellName}</div>
                            </div>
                        `;
                        tr.appendChild(td);
                        continue;
                    }
                }

                // Entry found
                td.innerHTML = `
                    <div class="slide-card">
                        <img src="./VocabularyImages/${baseName}.png" alt="${baseName}.png" onerror="handleImageError(this)">
                        <div class="kana">${entry.Kana}</div>
                        <div class="kanji">${entry.Kanji}</div>
                        <div class="romaji">${entry.Romaji}</div>
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
        document.getElementById('no-error-toggle').addEventListener('change', renderSlide);
    }

    document.addEventListener('DOMContentLoaded', main);
})();
