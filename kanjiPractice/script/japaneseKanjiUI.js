// -*- coding: utf-8 -*-
/**
   @author Jérôme Maillot
   @fileOverview Main file for japanese practice sheet

   <dl>
   <dt class='heading'>Creation date:</dt>
   <dd>Sat Sep 27 18:47:42 2014</dd>
   </dl>
*/



(function($) {
	'use strict';

    var controls = ['#kanji',
		            '#kun', '#kunkata', '#kunroma',
		            '#on', '#onhira', '#onroma',
	                '#english',
                    '#order'];
    var selGrades = ['Grade 1'];

    var nbGood = 0;
    var nbBad = 0;

	// Update the UI after the Display or Config parameters changed
	function updateUI() {
        for (var i = 0; i < controls.length; i++) {
            var opacity = 0;
            if ($(controls[i]+'CHK').attr('checked')) {
                opacity = 1;
            }
		    $(controls[i]).css('opacity', opacity);
        }
    }

	function updateDB() {
        var selected = [];
        var grades = JapaneseDB.grades();
        for (var i=0 ; i<grades.length ; i++) {
            var elem = document.getElementById(grades[i]);
            if (elem.checked) {
                selected.push(grades[i])
            }
        }

        JapaneseDB.initDB(selected);
        updateUI();
    }

	// Show the answer
	function showAnswer(event) {
        for (var i = 0; i < controls.length; i++) {
		    $(controls[i]).css('opacity', 1);
        }
    }

	// Check if the answer is correct
	function nextBad(event) {
        nbBad++;
        JapaneseDB.markGoodBad(false);
        nextQuestion();
    }

	// Check if the answer is correct
	function nextGood(event) {
        nbGood++;
        JapaneseDB.markGoodBad(true);
        nextQuestion();
    }

    // Transform the SVG data to adjust it to the page scheme:
    // - recursively change stroke color
    function fixSVGColor(elem) {
        if (elem.tagName.toLowerCase() === 'g') {
            var style = elem.getAttribute('style');
            if (style) {
                var styles = style.split(';');
                for (var i=0 ; i<styles.length ; i++) {
                    if (styles[i].toLowerCase().startsWith('stroke:')) {
                        styles[i] = 'stroke:#C0D0E0';
                    }
                }
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
        root.setAttribute('width', 300);
        root.setAttribute('height', 300);
        fixSVGColor(root);
        return root;
    }

	// Get to the next Kanji
	function nextQuestion(event) {
        // Reset the display state
        for (var i = 0; i < controls.length; i++) {
            $(controls[i]+'CHK').prop('checked', !!$(controls[i]+'CHK0').attr('checked'));
        }

		// Hide the answers
        updateUI();
		var data = JapaneseDB.next($('skipKnown').attr('checked') ? 1 : 0);

        $('#kanji').text(data.kanji);
        $('#kun').text(data.kun);
        $('#kunkata').text(data.kunkata);
        $('#kunroma').text(data.kunroma);
        $('#on').text(data.on);
        $('#onhira').text(data.onhira);
        $('#onroma').text(data.onroma);
        $('#english').text(data.eng);
        $('#grade').text(data.grade);

        var cc = data.kanji.charCodeAt(0);
        var code = cc.toString(16).toLowerCase();
		while (code.length < 5) { code = '0'+code; }

        var node = document.getElementById('order');
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }

        var xhr = new XMLHttpRequest();
        xhr.addEventListener('load', function() {
            node.appendChild(fixSVG(this.responseXML.documentElement));
        });
        xhr.open('GET','kanjiStrokeOrder/'+code+'.svg');
        xhr.send();

        $('#results').text('Good answers: '+nbGood+'/'+(nbGood+nbBad));
    }

	function main() {
		// For iOS: disable page scrolling to get mouse move events
		$('body').on('touchmove', function(e){ e.preventDefault(); });

		$.finalizeUI();
		updateUI();

		// Bind the buttons callbacks
		$('#showAnsw').click(showAnswer)
		$('#hideAnsw').click(updateUI)
		$('#nextBad').click(nextBad)
		$('#nextGood').click(nextGood)

        for (var i = 0; i < controls.length; i++) {
            $(controls[i]+'CHK').change(updateUI);
        }

        // Add the controls for all the grades
        var grades = JapaneseDB.grades();
        var len1 = Math.max(6, Math.floor((grades.length+1)/2));
        for (var i=0 ; i<grades.length ; i++) {
            var grade = grades[i];
            var colId = i>=len1 ? 'lessonsC2' : 'lessonsC1';
            var col = document.getElementById(colId);
            var div = document.createElement('div');
            var input = document.createElement('input');
            input.setAttribute('type', 'checkbox');
            input.setAttribute('id', grade);
            if (selGrades.indexOf(grade) >= 0) {
                input.setAttribute('checked', 'true');
            }
            div.appendChild(input);
            div.appendChild(document.createTextNode(grade));
            col.appendChild(div);
            input.addEventListener('click', updateDB);
        }

        updateDB();
		nextQuestion();
	}

	$('document').ready(main);
})(jQuery);
