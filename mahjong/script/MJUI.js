/*!
  Utility module to generate UI elements
*/

// For eslint
/* global Tile:false Meld:false Hand:false
   HandRulesInternational:false
   HandRulesRiichi:false
   HandSamples:false Menu:false strRes:false
*/

window.MJUI = (function() {
    "use strict";
    var MJUI = {};
    var currentHand = new Hand();
    var rulesType = "international";

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

    function replaceNode(tag, node, className, attrs) {
        var child = makeNode(tag, className, attrs);
        node.parentNode.replaceChild(child, node);
        return child;
    }

    // Mark this tile as selected
    function selectTile(tileId, normal) {
	    var tiles = document.getElementsByClassName("tile selected");
	    for (var i=0 ; i<tiles.length ; i++) {
		    tiles[i].classList.remove("selected");
	    }

	    var name = "";
	    if (normal) {
	        var meld = Math.floor(tileId/3);
	        var pos = tileId - meld*3;
	        if (meld === 4) {
		        name = "pair1";
	        } else {
		        name = "meld"+String(meld+1)+String(pos+1)+"_tile";
            }
	    } else {
	        name = "tile"+String(tileId+1);
	    }
	    document.getElementById(name).classList.add("selected");
    }

    function updateHandType(hand) {

	    var section = document.getElementsByClassName("specialHand");
	    for (var i=0 ; i<section.length ; i++) {
	        if (hand._isNormal) {
		        section[i].classList.add("hidden");
            } else {
		        section[i].classList.remove("hidden");
            }
	    }

	    section = document.getElementsByClassName("normalHand");
	    for (i=0 ; i<section.length ; i++) {
	        if (hand._isNormal) {
		        section[i].classList.remove("hidden");
            } else {
		        section[i].classList.add("hidden");
            }
	    }

        section = document.getElementsByClassName("normalHand2");
	    for (i=0 ; i<section.length ; i++) {
	        if (hand._isNormal) {
		        section[i].classList.remove("transparent");
            } else {
		        section[i].classList.add("transparent");
            }
	    }
    }

    function updateHandValue(hand) {

        if (!hand.isComplete()) {
	        document.getElementById("valueTitle").innerHTML = strRes("INCOMPLETE");
	        document.getElementById("valueDesc").innerHTML = "";
            return;
        } else if (!hand.isValid()) {
	        document.getElementById("valueTitle").innerHTML = strRes("INVALID HAND");
	        document.getElementById("valueDesc").innerHTML = "";
            return;
        } else {
	        var rules;
            switch (rulesType) {
            case "international":
                rules = new HandRulesInternational();
                break;
            case "riichi":
                rules = new HandRulesRiichi();
                break;
            }

	        var result = rules.compute(hand);

	        var title = strRes("HAND_VALUE").format(result.nbPoints);
	        document.getElementById("HandValue").style.backgroundColor = "";
	        if (hand._valueHint && (result.nbPoints !== hand._valueHint)) {
                title += strRes("EXPECTED").format(hand._valueHint);
		        document.getElementById("HandValue").style.backgroundColor = "#FFC0C0";
	        }
		    document.getElementById("valueTitle").innerHTML = title;
	        document.getElementById("valueDesc").innerHTML = result.desc.join("<br/>");
	    }

	    var d = new Date();
	    document.getElementById("valueDesc").insertAdjacentHTML("beforeend", "<br/><br/>"+d.toISOString());
    }

	var tileDirectory = "img/default/";
	function setIcon(tile, id) {
		var img = document.getElementById(id);
	    var tileName = tile.fileName();
        img.setAttribute("src", tileDirectory+tileName+".png");
	}

    function updateUIFromHand(hand) {
	    // Update flowers
	    for (var i=1 ; i<9 ; i++ ) {
	        setIcon(hand._flowers[i-1], "flower"+String(i));
	    }

	    // Update winds
	    setIcon(hand._tableWind,  "wind");
	    setIcon(hand._playerWind, "player");
	    setIcon(hand._dora,       "dora");
	    setIcon(hand._uradora,    "uradora");

	    if (hand._isNormal) {
	        // Update the pair
	        setIcon(hand._melds[4]._firstTile, "pair1");
	        setIcon(hand._melds[4]._firstTile, "pair2");

	        // Update the melds
	        for (i=1 ; i<5 ; i++ ) {
		        var meld = hand._melds[i-1];
		        var meldName = "meld"+String(i);
		        var tile = meld._firstTile;

		        document.getElementById(meldName+"_concealed").checked = meld._isConcealed;

		        setIcon(tile, meldName+"1_tile");
		        var val = 1;
		        if (meld._type === Meld.MeldType.CHOW) {
		            setIcon(tile.next(1), meldName+"2_tile");
		            setIcon(tile.next(2), meldName+"3_tile");
		            val = 0;
		        } else {
		            setIcon(tile, meldName+"2_tile");
		            setIcon(tile, meldName+"3_tile");
		        }
		        var img = document.getElementById(meldName+"4_tile");
		        if (meld._type === Meld.MeldType.KONG) {
                    img.classList.remove("transparent");
		            setIcon(tile, meldName+"4_tile");
		            val = 2;
		        } else {
                    img.classList.add("transparent");
		            setIcon(Tile._kBadTile, meldName+"4_tile");
		        }

		        document.getElementById(meldName+"_type").setAttribute("selectedIndex", val);
	        }
	    } else {
	        // Update the special hand
	        for (i=0 ; i<14 ; i++ ) {
		        var tileName = "tile"+String(i+1);
		        setIcon(hand._tiles[i], tileName);
	        }
	    }

	    // Update the global flags

		document.getElementById("SelfDrawn")   .checked = hand._selfDrawn;
	    document.getElementById("Special")     .checked = !hand._isNormal;
	    document.getElementById("Replacement") .checked = hand._replacementTile;
	    document.getElementById("Robbing")     .checked = hand._robbedKong;
	    document.getElementById("Last")        .checked = hand._lastTileDrawn;
	    document.getElementById("LastExisting").checked = hand._lastExistingTile;
	    document.getElementById("tenho").checked        = hand._tenho;
	    document.getElementById("renho").checked        = hand._renho;
	    document.getElementById("chiho").checked        = hand._chiho;

	    selectTile(hand._lastTile, hand._isNormal);
	    updateHandType(hand);
	    updateHandValue(hand);
    }

    var handSampleNum = 0;
    MJUI.otherSample = function(offset) {
        handSampleNum += offset;
	    var max = HandSamples.length;
	    if (handSampleNum < 0)    {handSampleNum = 0;}
	    if (handSampleNum >= max) {handSampleNum = max-1;}

	    MJUI.loadSample(handSampleNum);
    };

    function addMeld(parent) {
	    var prefix = parent.dataset.prefix;
	    var title  = parent.dataset.title;

	    // Titled section

		var main = makeChild("div", parent, "titBody", {id: prefix+"_main"});
		var titSection = makeChild("div", main, "titName", {id: prefix+"_title"});
        titSection.innerHTML = title;
	    // Create choice + concealed checkbox
	    main.insertAdjacentHTML("beforeend",
                                '<table style="width:100px;float:left">'+
		                        '<tr><td><select id="'+prefix+'_type" class="updatable">'+
		                        "<option>Chow</option> <option>Pung</option> <option>Kong</option>"+
		                        "</select></td></tr><tr><td>"+
		                        '<input type="checkbox" id="'+prefix+'_concealed" class="updatable">Concealed</input>'+
		                        "</td></tr></table>");

	    // Add the 4 tiles
	    for (var i = 1 ; i<5 ; i++) {
	        main.insertAdjacentHTML("beforeend",
                                    '<img class="tile" id="'+
                                    prefix+String(i)+
                                    '_tile" src="img/default/empty.png" data-value="empty"/>');
	    }
    }

    function expandTile(elem) {
        var name = elem.getAttribute("img");
        var idVal = elem.getAttribute("id");
        return replaceNode("img", elem, "tile", {src: tileDirectory+name+".png",
                                                 id: idVal});
    }

    function assignTile(type, num, id) {
        currentHand._valueHint = undefined;
        if (id.startsWith("flower")) {
            var flowerId = Number(id.substring(6, 7))-1;
            currentHand._flowers[flowerId] = new Tile(type, num);
        } else if (id.startsWith("wind")) {
            currentHand._tableWind = new Tile(type, num);
        } else if (id.startsWith("player")) {
            currentHand._playerWind = new Tile(type, num);
        } else if (id.startsWith("dora")) {
            currentHand._dora = new Tile(type, num);
        } else if (id.startsWith("uradora")) {
            currentHand._uradora = new Tile(type, num);
        }

	    if (currentHand._isNormal) {
            if (id.startsWith("pair")) {
                currentHand._melds[4]._firstTile = new Tile(type, num);
            } else if (id.startsWith("meld")) {
                var meldName = id.substring(0, 5);
                var meldId = Number(id.substring(4, 5));
                var meldTypeCtrl = document.getElementById(meldName+"_type");
                if (meldTypeCtrl.selectedIndex === 0) { // Chow
                    var pos = Number(id.substring(5, 6))-1;
                    num -= pos;
                }
                currentHand._melds[meldId-1]._firstTile = new Tile(type, num);
            }
        } else {
            if (id.startsWith("tile")) {
                var tileId = Number(id.substring(4));
                currentHand._tiles[tileId-1] = new Tile(type, num);
            }
        }

		var text = document.getElementById("HandDesc");
        text.innerHTML = "Edited";
        updateUIFromHand(currentHand);
    }

    function addTileMenu(tile) {
	    tile.addEventListener("click", function(event) {
            var id = tile.getAttribute("id");
            var menuType = "";
            if (id.startsWith("flower")) {
                menuType = "flower";
            } else if (id.startsWith("pair")) {
                menuType = "any";
            } else if ((id === "wind") || (id === "player")) {
                menuType = "wind";
            } else if (id.startsWith("meld")) {
                var meldName = id.substring(0, 5);
                var meldTypeCtrl = document.getElementById(meldName+"_type");
                if (meldTypeCtrl.selectedIndex === 0) { // Chow
                    var pos = id.substring(5, 6);
                    menuType = "chow"+pos;
                } else {
                    menuType = "any";
                }
            }
            Menu.postTileMenu("50px", "50px", menuType, id, assignTile);

            // Make sure the same event does not close the menu itself
            event.stopPropagation();
        });
    }

    MJUI.updateRulesDisplay = function() {
	    var NORiichi = document.getElementsByClassName("NOriichi");
	    var riichi = document.getElementsByClassName("riichi");
        var NORiichiViz = "initial";
        var riichiViz = "initial";
        switch (rulesType) {
        case "international":
            riichiViz = "none";
            break;
        case "riichi":
            NORiichiViz = "none";
            break;
        }

	    for (var i=0 ; i<riichi.length ; i++) {
		    riichi[i].style.display = riichiViz;
	    }
	    for (i=0 ; i<NORiichi.length ; i++) {
		    NORiichi[i].style.display = NORiichiViz;
	    }
    }

    function rulesHaveChanged(event) {
        var indx = event.target.selectedIndex;
        var val  = event.target.options[indx].value;

        rulesType = val;
        MJUI.updateRulesDisplay();
        updateHandValue(currentHand);
    }

    function langHasChanged(event) {
        console.error("NOT IMPLEMENTED");
    }

    /**
        Called when a checkbox or an option menu changed

        @param {Event} event The event which was triggered
        @return {undefined}
    */
    function UIhasChanged(event) {
        switch(event.target.id) {
        case "SelfDrawn":
            currentHand._selfDrawn = event.target.checked;
            break;
	    case "Special":
            currentHand._isNormal = !event.target.checked;
            break;
	    case "Replacement":
            currentHand._replacementTile = event.target.checked;
            break;
	    case "Robbing":
            currentHand._robbedKong = event.target.checked;
            break;
	    case "Last":
            currentHand._lastTileDrawn = event.target.checked;
            break;
	    case "LastExisting":
            currentHand._lastExistingTile = event.target.checked;
            break;
	    case "tenho":
            currentHand._tenho = event.target.checked;
            break;
	    case "renho":
            currentHand._renho = event.target.checked;
            break;
	    case "chiho":
            currentHand._chiho = event.target.checked;
            break;
        }

	    for (var i=1 ; i<5 ; i++ ) {
            if (event.target.id === ("meld"+i+"_concealed")) {
                currentHand._melds[i-1]._isConcealed = event.target.checked;
            } else if (event.target.id === ("meld"+i+"_type")) {
                var indx = event.target.selectedIndex;
                switch (indx) {
                case 0:
                    currentHand._melds[i-1]._type = Meld.MeldType.CHOW;
                    break;
                case 1:
                    currentHand._melds[i-1]._type = Meld.MeldType.PUNG;
                    break;
                case 2:
                    currentHand._melds[i-1]._type = Meld.MeldType.KONG;
                    break;
                }
            }
        }
        currentHand._valueHint = undefined;
		var text = document.getElementById("HandDesc");
        text.innerHTML = "Edited";
        updateUIFromHand(currentHand);
    }

    MJUI.loadSample = function(sampleNum) {

		var text = document.getElementById("HandDesc");
        text.innerHTML = "Sample #"+String(sampleNum+1);

	    currentHand = Hand.fromSimplifiedJSON(HandSamples[sampleNum]);

        updateUIFromHand(currentHand);
    };

    MJUI.expandUI = function() {
        var table = {"tile": expandTile};
        for (var tag in table) {
            var elems = document.getElementsByTagName(tag);
            // Loop backward because replace child messes up the
            // element list otherwise.
            for (var i=elems.length ; i-- ; ) {
                table[tag](elems[i]);
            }
        }

        // Expand the UI from divs
	    var melds = document.getElementsByClassName("meldBlock");
	    for (i=0 ; i<melds.length ; i++) {
		    addMeld(melds[i]);
	    }

        // Add the tile menus
	    var tiles = document.getElementsByClassName("tile");
	    for (i=0 ; i<tiles.length ; i++) {
		    addTileMenu(tiles[i]);
	    }

        // Add the callbacks to update the UI
	    elems = document.getElementsByClassName("updatable");
	    for (i=0 ; i<elems.length ; i++) {
            elems[i].addEventListener("change", UIhasChanged);
	    }

	    var rules = document.getElementById("ruleSet");
        rules.addEventListener("change", rulesHaveChanged);
	    var language = document.getElementById("language");
        language.addEventListener("change", langHasChanged);
    };

    MJUI.dumpCurrentHand = function() {
        var simplified = currentHand.simplifiedJSON();
        console.info(JSON.stringify(simplified));
    }

    return MJUI;
})();
