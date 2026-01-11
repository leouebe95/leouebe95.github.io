// -*- coding: utf-8 -*-

/*!
  Manage a tennis canvas
 */
class tennisCanvas {
    static __prop = {
        color_out:  '#3593db',
        color_in:   '#24bd5e',
        color_line: '#ffffff',
        color_post: '#679c62',

        line_width: '5'
    }

    /*!
       @function
       @name constructor
    */
    constructor(canvas) {
        this._ball = [-8, 30];

        this._canvas = canvas;
        this._ctx = this._canvas.getContext('2d');

        var that = this;
        window.addEventListener('resize', () => {
            that.fitToWindow();
            that.refresh();
        });

        this._img = {};
        var icons = document.getElementById('icons');
        var nodes = icons.getElementsByTagName('img')
        for (let i = 0; i < nodes.length; i++) {
            this._img[nodes[i].id] = nodes[i];
        }

        this.fitToWindow();
        this.refresh();
    }

    /*!
       Return the dictionary of all graphics properties
  -*  */
    prop(name) {
        return tennisCanvas.__prop[name];
    }

    /*!
       Get a value of a global CSS property.
       All values are stored globally as --tennis-color-*
    */
    color(name) {
        var prefix = 'color_';
        return tennisCanvas.__prop[prefix+name];
    }

    /*!
       @function
       @name fitToWindow
       Fit the canvas to the entire window.
    */
    fitToWindow() {
        this._canvas.width = window.innerWidth;
        this._canvas.height = window.innerHeight;
        this.computeScale();
    }

    /*!
       @function
       @name courtToCanvas
       @param[in] pts point(s) in court coordinates. [x0, y0, x1, y1, ...]
       Return the same point(s) in canvas coordinates
    */
    courtToCanvas(pts) {
        var res = [];
        for (let i = 0 ; i<pts.length-1 ; i += 2) {
            var x = pts[i];
            var y = pts[i+1];

            x = x * this._scale + this._ox;
            y = y * this._scale + this._oy;

            res = res.concat(this._flip ? [y, x] : [x, y]);
        }
        return res;
    }

    line(corners) {
        var pts = this.courtToCanvas(corners);
        this._ctx.moveTo(pts[0], pts[1]);
        this._ctx.lineTo(pts[2], pts[3]);
    }

    rect(ends) {
        var pts = this.courtToCanvas(ends);
        this._ctx.rect(pts[0], pts[1], pts[2]-pts[0], pts[3]-pts[1]);
    }

    // Circle with fixed radius size
    circle(x, y, r) {
        var center = this.courtToCanvas([x, y]);
        this._ctx.arc(center[0], center[1], r, 0, 2 * Math.PI);
    }

    computeScale() {
        var w = this._canvas.width;
        var h = this._canvas.height;

        this._ox = this._canvas.width / 2;
        this._oy = this._canvas.height / 2;

        // All sizes in feet. Court is drawn in portrait mode by default

        // Overall 1/4 court size + wiggle room. Compute the coordinate mapping.
        var sx = 18 + 14;
        var sy = 39 + 20;

        this._flip = false;
        if (h < w) {
            let swap = sx; sx = sy ; sy = swap;
            swap = this._ox; this._ox = this._oy ; this._oy = swap;
            this._flip = true;
        }
        var scx = this._canvas.width / (2 * sx);
        var scy = this._canvas.height / (2 * sy);
        this._scale = Math.min(scx, scy);
    }

    /*!
       @function
       @name courtToCanvas
       Draw the court lines

       [0, 0] is the center of the net. 
       dimentions are in feet (39 ft deep, 36 ft wide on each side)
    */
    drawCourt() {
        var ctx = this._ctx;

        // Draw the entire surface
        ctx.fillStyle = this.color('out');
        ctx.beginPath();
        ctx.rect(0, 0, this._canvas.width, this._canvas.height);
        ctx.fill();
        
        // Draw the court itself
        ctx.lineWidth = this.prop('line_width');
        ctx.strokeStyle = this.color('line');
        ctx.fillStyle = this.color('in');
        ctx.beginPath();
        this.rect([-18, -39, 18, 39]); // Double court
        ctx.fill();

        // Draw inside lines
        this.rect([-13.5, -39, 13.5, 39]); // Single court
        this.rect([-13.5, -21, 13.5, 21]); // Service
        this.line([0, -21, 0,  21]); // Service center line
        this.line([0, -39, 0,  -38]); // Service tee 1
        this.line([0,  39, 0,   38]); // Service tee 2
        this.line([-21, 0, 21, 0]); // Net
        ctx.stroke();

        // Draw posts
        ctx.fillStyle = this.color('post');
        ctx.lineWidth = "1";
        ctx.beginPath(); // Double
        this.circle(-21, 0, 5);
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); // Double
        this.circle(21, 0, 5);
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); // Single
        this.circle(-16.5, 0, 5);
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); // Single
        this.circle(16.5, 0, 5);
        ctx.fill(); ctx.stroke();
    }

    drawIcon(center, icon, rotate=0) {
        const size = 32;
        var ctx = this._ctx;
        var pos = this.courtToCanvas(center);

        ctx.save();
        ctx.translate(pos[0], pos[1]);
        ctx.rotate(rotate * Math.PI / 180);
        ctx.drawImage(icon, -size/2, -size/2);
        ctx.restore();
    }

    refresh() {
        this.drawCourt();
        this.drawIcon(this._ball, this._img['ball']);
        this.drawIcon([12, -45],  this._img['player'], 180);
        this.drawIcon([-2, -20],  this._img['player'], 180);
        this.drawIcon([-10, 39],  this._img['player'], 0);
        this.drawIcon([10, 10],  this._img['player'], 0);
    }
}
