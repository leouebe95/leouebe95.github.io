
// for eslint
/* global Tile:false
*/


window.Menu = (function() {
    "use strict";
    var Menu = {};
    
    function appendChild(parent, tag, className) {
        var node = document.createElement(tag);
        if (className) {
            node.classList.add(className);
        }
        parent.appendChild(node);
        return node;
    }

    /*
      Remove all previously created menus
     */
    function closeMenu() {
	    var menus = document.getElementsByClassName("menu");
	    for (var i=0 ; i<menus.length ; i++) {
		    menus[i].parentNode.removeChild(menus[i]);
	    }
    }

    Menu.postTileMenu = function(x, y, menuType, id, assignTileCB) {
        closeMenu();
        var menu = document.createElement("div");
        menu.classList.add("menu");
        menu.style.top = x;
        menu.style.left = y;

        var table = appendChild(menu, "table");

        var types = [Tile.TileType.BAMBOO,
	                 Tile.TileType.CHARACTER,
	                 Tile.TileType.DOT,
	                 Tile.TileType.WIND,
	                 Tile.TileType.DRAGON
                    ];

        if (menuType === "flower") {
            types = [Tile.TileType.FLOWER,
	                 Tile.TileType.SEASON
                    ];
        } else if (menuType === "wind") {
            types = [Tile.TileType.WIND
                    ];
        }
        var start = 0;
        var end = 9;
        var isChow = false;
        if (menuType.startsWith("chow")) {
            start = Number(menuType.substring(4, 5))-1;
            end = start+7;
            isChow = true;
        }
        for (var i = 0 ; i<types.length ; i++ ) {
            if (isChow && i>2) { break; }
            var tr = appendChild(table, "tr");
            let type = types[i]; // Use let because of CB created in a loop
            for (let j = start ; j<Math.min(end, type.len) ; j++) {
                var td = appendChild(tr, "td");
                var img = appendChild(td, "img");
                img.setAttribute("src", "img/default/"+Tile.prototype.fileName(type, j+1)+".png");
	            img.addEventListener("click", function(event) {
                    assignTileCB(type, j+1, id);
                });
            }
        }

        document.body.appendChild(menu);

        return menu;
    };

    // Add a listener to close the menu on any click
	document.addEventListener("click", closeMenu);

    return Menu;
})();
