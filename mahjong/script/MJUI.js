/*!
  Utility module to generate UI elements
*/

// for eslint
/* global Tile:false Meld:false Hand:false HandRules:false
   HandSamples:false Menu:false strRes:false
*/

window.MJUI = (function() {
    "use strict";
    var MJUI = {};
    var currentHand = new Hand();

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

	    var rules = new HandRules();
	    var result = rules.compute(hand);

	    if (result !== 0) {
	        var title = strRes("HAND_VALUE").format(result);
	        document.getElementById("HandValue").style.backgroundColor = "";
	        if (result !== hand._valueHint) {
                title += strRes("EXPECTED").format(hand._valueHint);
		        document.getElementById("HandValue").style.backgroundColor = "#FFC0C0";
	        }
		    document.getElementById("valueTitle").innerHTML = title;
	        document.getElementById("valueDesc").innerHTML = rules._rulesDescriptions.join("<br/>");
	    } else {
	        document.getElementById("valueTitle").innerHTML = strRes("INCOMPLETE");
	        document.getElementById("valueDesc").innerHTML = "";
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
	    setIcon(hand._tableWind, "wind");
	    setIcon(hand._playerWind, "player");

	    if (hand._isNormal) {
	        // Update the pair
	        setIcon(hand._melds[4]._firstTile, "pair1");
	        setIcon(hand._melds[4]._firstTile, "pair2");

	        // Update the melds
	        for (i=1 ; i<5 ; i++ ) {
		        var meld = hand._melds[i-1];
		        var meldName = "meld"+String(i);
		        var tile = meld._firstTile;

		        document.getElementById(meldName+"_concealed").setAttribute("checked", meld._isConcealed);

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
		        if (meld._type === Meld.MeldType.KONG) {
		            setIcon(tile, meldName+"4_tile");
		            val = 2;
		        } else {
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

		document.getElementById("SelfDrawn")   .setAttribute("checked", hand._selfDrawn);
	    document.getElementById("Special")     .setAttribute("checked", !hand._isNormal);
	    document.getElementById("Replacement") .setAttribute("checked", hand._replacementTile);
	    document.getElementById("Robbing")     .setAttribute("checked", hand._robbedKong);
	    document.getElementById("Last")        .setAttribute("checked", hand._lastTileDrawn);
	    document.getElementById("LastExisting").setAttribute("checked", hand._lastExistingTile);

	    selectTile(hand._lastTile, hand._isNormal);
	    updateHandType(hand);
	    updateHandValue(hand);
    }

    var handSampleNum = 0;
    MJUI.otherSample = function(offset) {
        handSampleNum += offset;
	    var max = HandSamples.length;
	    if (handSampleNum < 1)    {handSampleNum = 1;}
	    if (handSampleNum >= max) {handSampleNum = max-1;}

	    MJUI.loadSample(handSampleNum);
    };

    function addMeld(parent) {
	    var prefix = parent.dataset.prefix;
	    var title  = parent.dataset.title;

	    // Titled section

		var main = makeChild("div", parent, "titBody", {id: prefix+"_main"});
		var titSection = makeChild("div", main, "titName", {id: prefix+"_title"});

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
                                    '<img class="tile updatable" id="'+
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

        if (id.startsWith("flower")) {
            var flowerId = Number(id.substring(6, 7))-1;
            currentHand._flowers[flowerId] = new Tile(type, num);
        } else if (id.startsWith("wind")) {
            currentHand._tableWind = new Tile(type, num);
        } else if (id.startsWith("player")) {
            currentHand._playerWind = new Tile(type, num);
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

    MJUI.loadSample = function(sampleNum) {

		var text = document.getElementById("valueTitle");
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
    };

    return MJUI;
})();

/*


    updateData: function(event) {
	    var who = event.currentTarget.id;
	    var data = who.split("_");
	    var value = "";
	    switch(data[1]) {
	    case "tile":
	        value = document.getElementById(who).data("value");
	        break;

	    case "type":
	    XXXXX    value = document.getElementById(who+">option:selected").text();
	        break;

	    case "concealed":
	        value = document.getElementById(who).attr("checked");
	        break;
	    }
    },

    updateMeld: function(prefix) {
	    var type = window.MJ_UI.dataModel[prefix+"_type"];
	    if (type == "Kong") {
	        document.getElementById(prefix+"4_tile").attr("style", "opacity:1;");
	    } else {
	        document.getElementById(prefix+"4_tile").attr("style", "opacity:0.4;");
	    }
    },
}

var xmlhttp = new XMLHttpRequest();
xmlhttp.open("GET", "userData/defaultSamples.json", false);
xmlhttp.send();
MJUI.prototype._Hand_samples = JSON.parse(xmlhttp.responseText);
*/
