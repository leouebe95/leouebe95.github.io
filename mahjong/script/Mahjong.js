// eslint
/* global I18N:false MJUI:false */


window.Mahjong = (function() {
    'use strict';
    
    var Mahjong = {};
/*
    function info(msg) {
	    alert("INFO: "+msg);
    }

    function test(msg) {
	    alert("Messages d'alerte: (法國) "+msg);
    }

    function addItem(prefix, value) {
	    var new_elem = $('<li>').appendTo('#lst1')
	    new_elem.text(prefix+value);
	    new_elem.click(function(ee){alert($("LI Callback" + ee.currentTarget).text())});

	    // Highlight the last element added
	    $('li').removeClass("class1")
	    new_elem.addClass("class1");
    }

    // Communication asynchrone
    function commAsynch(event) {
	    var comm = new XMLHttpRequest();	// Create a request object
	    var value = $('#txt1').val();		// Get the value of the text field
	    comm.open("GET", "services/webService.php?INFO="+value, true);	// true -> asynchronous

	    comm.onreadystatechange = function() {
		    // 4 == DONE (success)
		    if (comm.readyState == 4) {
			    var answer = comm.responseText;
			    var obj = JSON.parse(answer);
			    if (obj.coderet == 0) {
				    addItem("點心 asynch ： ", obj.message);
			    } else {
				    alert("ERROR: when parsing "+answer);
			    }
		    }
	    };

	    // Send request (asynch)
	    comm.send(null);
    }

    // Communication synchrone
    function commSynch(event) {
	    var comm = new XMLHttpRequest();	// Create a request object
	    var value = $('#txt1').val();		// Get the value of the text field
	    comm.open("GET", "services/webService.php?INFO="+value, false);	// false -> synchronous

	    // Blocking!
	    comm.send(null);
	    // 200 == Success
	    if (comm.status == 200) {
		    var answer = comm.responseText;
		    var obj = JSON.parse(answer);
		    if (obj.coderet == 0) {
			    addItem("點心 ： ", obj.message);
		    } else {
			    alert("ERROR: when parsing "+answer);
		    }
	    } else {
		    alert("ERROR: "+comm.status);
	    }
    }

    //Communication synchrone
    function commJQuery(event) {
	    var comm = new XMLHttpRequest();	// Create a request object
	    var value = $('#txt1').val();		// Get the value of the text field
	    $.get("services/webService.php?INFO="+value,
		      function(data) {
			      if (data.coderet == 0) {
				      addItem("JQuery 點心 ： ", data.message);
			      }
		      }, 'json');
    }


*/
    Mahjong.main = function() {
	    I18N.loadAllTransationTables('mahjongStr', 'En', 'AU');
        MJUI.expandUI();

        // Show / hide sections depending on rules
        MJUI.updateRulesDisplay();
        // Initialize with the first sample hand
        MJUI.otherSample(0);

        // Display the page after all UI was created to avoid flickering
        document.body.style.visibility = 'visible';

        /*
	    // Redirect alerts
	    alert = function(message) {console.log(message);}

	    window.MJ_UI = new MJUI();
        window.MJ_UI._sampleNum = 1;


	    $('.updatable').change(window.MJ_UI.updateData);
	    $('.tile').click(window.MJ_UI.updateData);

	    // $ == jquery
	    // $('#xxx') match id
	    $('#ButListener').click(test);

	    $('#ButClick').click(function(ee){
		var value = $('#txt1').val();
		$('#txt1').val(":" + value);
		addItem("XX ： ", obj.message);
	    });

	    $('#ButSynch').click(commSynch);
	    $('#ButAsynch').click(commAsynch);
	    $('#ButJQuery').click(commJQuery);

	    // All elements with matching types
	    $('li').click(function(ee){alert($(ee.currentTarget).text() + "dfdsfsdfsdf")});

        postTileMenu('100px', '150px');
        postTileMenu('120px', '170px', true);
        */
    };

    return Mahjong;
})();
