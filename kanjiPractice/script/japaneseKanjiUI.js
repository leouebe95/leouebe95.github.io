// -*- coding: utf-8 -*-
/**
   @fileOverview Main file for japanese practice sheet
*/

// For eslint
/* global JapaneseDB:false */

(function() {
	"use strict";

    var controls = ["kanji",
		            "kun", "kunkata", "kunroma",
		            "on", "onhira", "onroma",
	                "english",
                    "order"];
    var selGrades = ["Grade 1"];

    var nbGood = 0;
    var nbBad = 0;
    var jpDB;

    var boolSettings = JapaneseDB.grades().concat(["skipKnown"],
                                                  controls.map(x=>x+"CHK0"));
    /**
       Save the setting into local storage.
       @return {undefined}
    */
    function saveSettings() {
        var settings = {};
        for (var i = 0; i < boolSettings.length; i++) {
            var key = boolSettings[i];
            settings[key] = !!document.getElementById(key).checked;
        }
        localStorage.japaneseKanjiUIPrefs = JSON.stringify(settings);
        localStorage.japaneseKanjiUIPrefsVersion = "1.0";
    }

    /**
       Load the settings from local storage if they exist
       @return {undefined}
    */
	function loadSettings() {
        if (localStorage.japaneseKanjiUIPrefs) {
            var settings =
                JSON.parse(localStorage.japaneseKanjiUIPrefs);
            for (var key in settings) {
                var elem = document.getElementById(key);
                if (elem) {
                    elem.checked = settings[key];
                }
            }
        }
    }

    /**
       Remove all settings from the local storage.
       @return {undefined}
    */
    function resetSettings() {
        localStorage.removeItem("japaneseKanjiUIPrefs");
        localStorage.removeItem("japaneseKanjiUIPrefsVersion");
    }

    // Update the UI after the Display or Config parameters changed
	function updateUI() {
        for (var i = 0; i < controls.length; i++) {
            var elem = document.getElementById(controls[i]);
            var elemCHK = document.getElementById(controls[i]+"CHK");
            var visibility = "hidden";
            if (elemCHK.checked) {
                visibility = "visible";
            }
		    elem.style.visibility = visibility;
        }
    }

	function updateDB() {
        var selected = [];
        var grades = JapaneseDB.grades();
        for (var i=0 ; i<grades.length ; i++) {
            var elem = document.getElementById(grades[i]);
            if (elem.checked) {
                selected.push(grades[i]);
            }
        }

        jpDB = new JapaneseDB(selected);
        updateUI();
    }

	// Show the answer
	function showAnswer(event) {
        for (var i = 0; i < controls.length; i++) {
		    document.getElementById(controls[i]).style.visibility = "visible";
        }
    }

	// Check if the answer is correct
	function nextBad(event) {
        nbBad++;
        jpDB.markGoodBad(false);
        nextQuestion();
    }

	// Check if the answer is correct
	function nextGood(event) {
        nbGood++;
        jpDB.markGoodBad(true);
        nextQuestion();
    }

    // Transform the SVG data to adjust it to the page scheme:
    // - recursively change stroke color
    function fixSVGColor(elem) {
        if (elem.tagName && (elem.tagName.toLowerCase() === "g")) {
            if (elem.style && elem.style.stroke) {
                elem.style.stroke =  "#C0D0E0";
            }
        }

        for(var child=elem.firstChild; child!==null; child=child.nextSibling) {
            fixSVGColor(child);
        }
    }

    // Transform the SVG data to adjust it to the page scheme:
    // - make the size 300x300
    // - change stroke color
    function fixSVG(root) {
        root.setAttribute("width", 300);
        root.setAttribute("height", 300);
        fixSVGColor(root);
        return root;
    }

	// Get to the next Kanji
	function nextQuestion(event) {
        // Reset the display state
        for (var i = 0; i < controls.length; i++) {
            document.getElementById(controls[i]+"CHK").checked =
                !!document.getElementById(controls[i]+"CHK0").checked;
        }

		// Hide the answers
        updateUI();
		var data = jpDB.next(document.getElementById("skipKnown").checked ? 1 : 0);

        document.getElementById("kanji").innerText = data.kanji;
        document.getElementById("kun").innerText = data.kun;
        document.getElementById("kunkata").innerText = data.kunkata;
        document.getElementById("kunroma").innerText = data.kunroma;
        document.getElementById("on").innerText = data.on;
        document.getElementById("onhira").innerText = data.onhira;
        document.getElementById("onroma").innerText = data.onroma;
        document.getElementById("english").innerText = data.eng;
        document.getElementById("grade").innerText = data.grade;

        var cc = data.kanji.charCodeAt(0);
        var code = cc.toString(16).toLowerCase();
		while (code.length < 5) { code = "0"+code; }

        var node = document.getElementById("order");
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }

        var xhr = new XMLHttpRequest();
        xhr.addEventListener("load", function() {
            node.appendChild(fixSVG(this.responseXML.documentElement));
        });
        xhr.open("GET","kanjiStrokeOrder/"+code+".svg");
        xhr.send();

        document.getElementById("results").innerText = "Good answers: "+nbGood+"/"+(nbGood+nbBad);
    }

    function makeNode(tag, className, attrs) {
		var child = document.createElement(tag);
        if (className) {child.classList.add(className);}
        if (attrs) {
            for (var attr in attrs) {
	            child.setAttribute(attr, attrs[attr]);
            }
        }
        return child;
    }

    function makeChild(tag, parent, className, attrs) {
        var child = makeNode(tag, className, attrs);
        parent.appendChild(child);
        return child;
    }

    function expandButtonUI() {
        // Expand the UI from divs
	    var buttons = document.getElementsByClassName("iconTextButton");
	    for (var i=0 ; i<buttons.length ; i++) {
            var img = buttons[i].getAttribute("img");
            var text = buttons[i].getAttribute("text");
            if (img) {
		        makeChild("img",buttons[i], "iconTextButtonImg", {src: img});
            }
            if (text) {
		        var span = makeChild("span",buttons[i], "iconTextButtonTxt");
                span.innerHTML = text;
            }
	    }
    }

    function expandUI() {
        expandButtonUI();
    }

	function main() {
        var searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get("reset")) {
            resetSettings();
        }

        expandUI();

		updateUI();

		// Bind the buttons callbacks
        document.getElementById("showAnsw").addEventListener("click", showAnswer);
		document.getElementById("hideAnsw").addEventListener("click", updateUI);
		document.getElementById("nextBad").addEventListener("click", nextBad);
		document.getElementById("nextGood").addEventListener("click", nextGood);

        for (var i = 0; i < controls.length; i++) {
            document.getElementById(controls[i]+"CHK").addEventListener("change", updateUI);
        }

        // Add the controls for all the grades
        var grades = JapaneseDB.grades();
        var len1 = Math.max(6, Math.floor((grades.length+1)/2));
        for (i=0 ; i<grades.length ; i++) {
            var grade = grades[i];
            var colId = i>=len1 ? "lessonsC2" : "lessonsC1";
            var col = document.getElementById(colId);
            var div = document.createElement("div");
            var input = document.createElement("input");
            input.setAttribute("type", "checkbox");
            input.setAttribute("id", grade);
            if (selGrades.indexOf(grade) >= 0) {
                input.setAttribute("checked", "true");
            }
            div.appendChild(input);
            div.appendChild(document.createTextNode(grade));
            col.appendChild(div);
            input.addEventListener("click", updateDB);
        }

        // Save settings everytime a checkbox changes
        for (i = 0; i < boolSettings.length; i++) {
            document.getElementById(boolSettings[i]).addEventListener("change", saveSettings);
        }
        loadSettings();
        updateDB();
		nextQuestion();
	}

    document.addEventListener("DOMContentLoaded", main);
})();
