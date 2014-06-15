/* vim: set filetype=javascript: */

(function(plot, $, undefined) {


function get_spacing(min, max, pixels, text_size, spacings) {
    var i, n;

    for (i = spacings.length - 1; i >= 0; i--) {
        n = (max - min) / spacings[i];
        if (1.2 * n * text_size <= pixels)
            return spacings[i];
    }
    return spacings[0];
}

function zfill(a,b){return(1e15+a+"").slice(-b)}

plot.Plot = function(jcanvas, use_dates, select_cb) {
    var ct, i = 0, l, x, y, sx, sy, 
        dx1, dy1, dx2, dy2, x1, y1, x2, y2, ex1, ey1, ex2, ey2,
        series = [],
        canvas = jcanvas[0],
        ct = canvas.getContext('2d'),
        ymargin, xmargin1, xmargin2,
        mousedown = false, mouse_x, mouse_y, mouse_data = [],
        that = this;

    this.properties = {
        color : jcanvas.css('color'),
        selection : {strokeStyle : '#fff', lineWidth : 1, 
            strokeStyle : 'yellow', 
            size: 14,
            shape : 'crosshair' }


    }

    function set_xmargin(margin, side) {
        if (side == 'right') {
            xmargin2 = margin;
        }
        else {
            xmargin1 = margin;
        }
    }
    function set_ymargin(nlines) {
        ymargin = nlines * ct.measureText('e').width * 2 + 4
    }

    set_xmargin(20, 'right');
    set_xmargin(0, 'left');
    set_ymargin(1);

    function x2p(x) {
        return xmargin1 + (x - x1) * sx;
    }
    function y2p(y) {
        return canvas.height - ymargin - (y - y1) * sy;
    }

    function set_viewport(nx1, ny1, nx2, ny2) {
        var s, i, j;

        if (ex1 === undefined) {
            ex1 = x1 = nx1;
            ey1 = y1 = ny1;
            ex2 = x2 = nx2;
            ey2 = y2 = ny2;
        }
        else {
            x1 = Math.max(nx1, ex1);
            y1 = Math.max(ny1, ey1);
            x2 = Math.min(nx2, ex2);
            y2 = Math.min(ny2, ey2);
        }
        sx = (canvas.width - xmargin1 - xmargin2) / (x2 - x1);
        sy = (canvas.height - ymargin) / (y2 - y1);

        for (j = 0; j < series.length; j++) {
            s = series[j];
            s.pxs = [], s.pys = [];
            for (i = 0; i < s.x.length; i++) {
                s.pxs[i] = x2p(s.x[i]);
                s.pys[i] = y2p(s.y[i]);
            }
        }
    }

    function yscale(side) {
        var y, py, px1, spacing, fix;

        spacing = get_spacing(y1, y2, canvas.height - ymargin,
                ct.measureText('e').width*2.5, // aprox of height
                [100, 50, 20, 10, 5, 1,.5,.1,.05, .02, .01, .005, .002, .001]);

        fix = -Math.floor(Math.log(spacing) / Math.LN10);
        set_xmargin(ct.measureText(y2.toFixed(fix)).width + 5, side);
        px1 = x2p(x1);

        ct.textAlign = 'right';
        ct.fillStyle = that.properties.color;
        ct.strokeStyle = that.properties.color;
        ct.textBaseline = "middle";
        ct.lineWidth = .5;
        ct.beginPath();
        px1 = side == 'right' ? canvas.width - 2 : xmargin1 - 2;
        for (y = Math.ceil(y1/spacing)*spacing; y < y2; y+=spacing){
            py = y2p(y);
            ct.fillText(y.toFixed(fix), px1, py);
            ct.moveTo(xmargin1, py);
            ct.lineTo(canvas.width - xmargin2, py);
        }
        ct.stroke();
    }

    function tscale() {
        var x, px, ym, spacings, spacarray, spacing, text_size;
        var inc, line1, line2;
        var next, next2, format, format2;
        var lower_line;

        spacings = { yr10 : 315576000000,
            yr5 : 157788000000,
            yr2 : 63115200000,
            yr1 : 31557600000,
            mn4 : 10368000000,
            mn3 : 7776000000,
            mn2 : 5184000000,
            mn1 : 2592000000,
            dy7 : 604800000,
            dy3 : 259200000,
            dy2 : 172800000,
            dy1 : 86400000,
            hr12 : 43200000,
            hr6 : 21600000,
            hr2 : 7200000,
            hr1 : 3600000,
            m30 : 1200000,
            m10 : 600000,
            m5 : 300000,
            m2 : 120000,
            m1 : 60000
        };
        spacarray = [];
        for (k in spacings) { spacarray.push(spacings[k]); }

        text_size = ct.measureText('00:00').width;
        spacing = get_spacing(x1, x2, canvas.width - xmargin1 - xmargin2,
                text_size, spacarray);

        function mname(n) {
                return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
                       'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][n];
        }

        line1 = new Date(x1);
        line1.setSeconds(0);

        // Date(year, month, date[, hours[, minutes[, seconds[,ms]]]]);
        if (spacing >= spacings.yr1) {
            inc = spacing / spacings.yr1;
            line1.setFullYear(Math.max(line1.getFullYear() + 1,
                        Math.ceil(line1.getFullYear() / inc) * inc));
            line1.setMonth(0);
            line1.setDate(1);
            line1.setHours(0);
            line1.setMinutes(0);

            next = function() {
                line1.setFullYear(line1.getFullYear() + inc);
            }
            format = function() {
                return line1.getFullYear();
            }
        }
        else if (spacing >= spacings.mn1) {
            inc = spacing / spacings.mn1;
            line1.setMonth(Math.max(Math.ceil(line1.getMonth() / inc) * inc,
                        line1.getMonth() + 1));
            line1.setDate(1);
            line1.setHours(0);
            line1.setMinutes(0);
            line2 = new Date(line1);

            next = function() {
                line1.setMonth(line1.getMonth() + inc);
            }
            format = function() {
                return mname(line1.getMonth());
            }
            next2 = function() {
                line2.setFullYear(line2.getFullYear() + 1);
            }
            format2 = function() {
                return line2.getFullYear();
            }
        }
        else if (spacing >= spacings.dy1) {
            inc = spacing / spacings.dy1;
            line1.setDate(Math.max(line1.getDate() + 1,
                        Math.ceil(line1.getDate() / inc) * inc));
            line1.setHours(0);
            line1.setMinutes(0);
            line2 = new Date(line1);

            next = function() {
                line1.setDate(line1.getDate() + inc);
            }
            format = function() {
                return line1.getDate();
            }
            next2 = function() {
                line2.setMonth(line2.getMonth() + 1);
            }
            format2 = function() {
                return mname(line2.getMonth()) + ' ' + line2.getFullYear();
            }
        }
        else if (spacing >= spacings.hr1) {
            inc = spacing / spacings.hr1;
            line1.setHours(Math.max(line1.getHours() + 1,
                        Math.ceil(line1.getHours() / inc) * inc));
            line1.setMinutes(0);
            line2 = new Date(line1);

            next = function() {
                line1.setHours(line1.getHours() + inc);
            }
            format = function() {
                return zfill(line1.getHours(), 2) + ':00'
            }
            next2 = function() {
                line2.setDate(line2.getDate() + 1);
            }
            format2 = function() {
                return mname(line2.getMonth()) + ' ' + 
                        line2.getDate() + ', ' +
                        line2.getFullYear();
            }
        }
        else {
            inc = spacing / spacings.m1;
            line1.setMinutes(Math.max(line1.getMinutes() + 1,
                        Math.ceil(line1.getMinutes() / inc) * inc));
            line2 = new Date(line1);

            next = function() {
                line1.setMinutes(line1.getMinutes() + inc);
            }
            format = function() {
                return zfill(line1.getHours(), 2) + ':' + 
                    zfill(line1.getMinutes(), 2);
            }
            next2 = function() {
                line2.setHours(line2.getHours() + 1);
            }
            format2 = function() {
                return mname(line2.getMonth()) + ' ' + 
                        line2.getDate() + ', ' +
                        line2.getFullYear();
            }
        }

        ct.fillStyle = that.properties.color;
        ct.strokeStyle = that.properties.color;
        ct.textAlign = "center";
        ct.lineWidth = .5;
        ct.beginPath();

        if (line2 != undefined) {
            set_ymargin(2);
            ct.textBaseline = "bottom";
            for (; line2.getTime() < x2; next2()) {
                px = x2p(line2.getTime());
                ct.fillText(format2(), px, canvas.height-2);
            }
        } 
        else {
            set_ymargin(1);
        }

        ct.textBaseline = "top";
        for (; line1.getTime() < x2; next()) {
            px = x2p(line1.getTime());
            ct.fillText(format(), px, canvas.height - ymargin + 2);
            ct.moveTo(px, canvas.height - ymargin);
            ct.lineTo(px, 0);
        }
        ct.stroke();
    }

    function xscale() {
        var x, px, f, spacing, text_size;

        text_size = ct.measureText('-0.00').width;
        spacing = get_spacing(x1, x2, canvas.width - xmargin1 - xmargin2,
                text_size,
                [100, 50, 20, 10, 5, 1, .5, .2, .1, .05, .02, .01, 
                 .005, .002, .001]);

        //f = Math.pow(10, Math.round(Math.log(spacing) / Math.LN10)); 

        ct.fillStyle = that.properties.color;
        ct.strokeStyle = that.properties.color;
        ct.textBaseline = "bottom";
        ct.textAlign = "center";
        ct.lineWidth = .5;
        ct.beginPath();
        for (x = Math.ceil(x1/spacing)*spacing; x < x2; x+=spacing) {
            px = x2p(x);
            //ct.save();
            //ct.moveTo(px, canvas.height-2);
            //ct.rotate(45 * Math.PI/180);
            //ct.fillText(Math.round(x/spacing)*spacing, 0, 0);
            if (spacing < 10) {
                ct.fillText(x.toPrecision(2), px, canvas.height-2);
            }
            else {
                ct.fillText(x, px, canvas.height-2);
            }
            //ct.restore();
            ct.moveTo(px, canvas.height - ymargin);
            ct.lineTo(px, 0);
        }
        ct.stroke();
    }

    this.circle = function(pxs, pys, stroke_fill, sz) {
        var a = 2*Math.PI;
        
        sz /= 2;
        for (i = 0; i < pxs.length; i++) {
            ct.beginPath();
            ct.arc(pxs[i], pys[i], sz, 0, a, 0);
            stroke_fill();
        }
    }

    this.square = function(pxs, pys, stroke_fill, sz) {
        var h = sz/2;

        for (i = 0; i < pxs.length; i++) {
            ct.beginPath();
            ct.rect(pxs[i]-h, pys[i]-h, sz, sz);
            stroke_fill();
        }
    }

    this.uptri = function(pxs, pys, stroke_fill, sz) {
        var h = sz/2;

        for (i = 0; i < pxs.length; i++) {
            ct.beginPath();
            ct.moveTo(pxs[i], pys[i]-h);
            ct.lineTo(pxs[i]-h, pys[i]+h);
            ct.lineTo(pxs[i]+h, pys[i]+h);
            ct.closePath();
            stroke_fill();
        }
    }

    this.dntri = function(pxs, pys, stroke_fill, sz) {
        var h = sz/2;

        for (i = 0; i < pxs.length; i++) {
            ct.beginPath();
            ct.moveTo(pxs[i], pys[i]-h);
            ct.lineTo(pxs[i]-h, pys[i]+h);
            ct.lineTo(pxs[i]+h, pys[i]+h);
            ct.closePath();
            stroke_fill();
        }
    }

    this.crosshair = function(pxs, pys, stroke_fill, sz) {
        var x, y, h = sz/2;

        for (i = 0; i < pxs.length; i++) {
            x = pxs[i];
            y = pys[i];
            ct.beginPath();
            ct.moveTo(x, y-h);
            ct.lineTo(x, y+h);
            ct.moveTo(x-h, y);
            ct.lineTo(x+h, y);
            ct.rect(x-h, y-h, sz, sz);
            stroke_fill();
        }
    }

    this.line = function(pxs, pys, stroke_fill) {
        ct.beginPath();
        ct.moveTo(pxs[0], pys[0]);
        for (i = 1; i < pxs.length; i++) {
            ct.lineTo(pxs[i], pys[i]);
        }
        stroke_fill();
    }

    function apply_styles(s) {
        var style;

        for (style in s) {
            if (style in ct) {
                ct[style] = s[style];
            }
        }
    }

    function data() {
        var s, i, sz, calls;

        for (i = 0; i < series.length; i++) {
            s = series[i];

            apply_styles(s);

            stroke_fill = s.fillStyle ? function() {ct.fill()} : 
                function() {ct.stroke()};

            sz = s.size ? s.size : 3;

            if (s.image) {
                ct.save();
                ct.translate(s.pxs[0], s.pys[0]);
                ct.scale((s.pxs[1] - s.pxs[0])/s.width, (s.pys[1] -
                            s.pys[0])/s.height);
                ct.drawImage(s.image, 0, 0);
                ct.restore();
            }
            else {
                if (typeof(s.shape) == 'string') {
                    s.shape = that[s.shape];
                }
                s.shape(s.pxs, s.pys, stroke_fill, sz);
            }
        }
    }

    function repaint() {
        ct.clearRect(0, 0, canvas.width, canvas.height);
        data();
        yscale('right');
        xscale();
        if (mouse_data.length) {
            var s, i, sz;

            s = mouse_data[0];
            sz = mouse_data[0].size || 10;
            i = mouse_data[1]
            that.crosshair(s.pxs[i], s.pys[i], sz);
        }
    }

    function zoom(zx, zy) {
        var w, h, cx, cy;

        w = x2 - x1;
        h = y2 - y1;
        cx = x1 + w/2;
        cy = y1 + h/2;
        w /= zx*2;
        h /= zy*2;
        set_viewport(cx-w, cy-h, cx+w, cy+h);
        repaint();
    }

    function pan(dx, dy) {
        var nx1, ny1, nx2, ny2;

        dx /= sx;
        dy /= sy;
        nx1 = x1 + dx;
        ny1 = y1 + dy;
        nx2 = x2 + dx;
        ny2 = y2 + dy;
        if (nx1 >= ex1 && ny1 >= ey1 && nx2 <= ex2 && ny2 <= ey2) {
            set_viewport(x1 + dx, y1 + dy, x2 + dx, y2 + dy);
            repaint();
        }
    }

    function select(x, y, sz) {
        var props = that.properties.selection;

        apply_styles(props);
        if (typeof(props.shape) == 'string') {
            props.shape = that[props.shape];
        }
        props.shape([x], [y], function() {ct.stroke()}, sz);
    }

    function on_mousemove(ev) {
        var x, y, i, j = -1, k, s, d, dx, dy, sz, mind = 9999;

        x = ev.clientX - canvas.offsetLeft + $('body')[0].scrollLeft;
        y = ev.clientY - canvas.offsetTop + $('body')[0].scrollTop;
        for (var par = canvas.offsetParent; par != $('body')[0]; 
                par = par.offsetParent) {
            x -= par.offsetLeft;
            y -= par.offsetTop;
        }

        // panning allowed only when the mouse is not over data
        if (mousedown && mouse_data.length == 0) {
            dx = mouse_x - x;
            dy = y - mouse_y;
            if (dx != 0 || dy != 0) {
               pan(dx, dy); 
            }
            mouse_x = x;
            mouse_y = y;
        }
        else {
            mousedown = false;
            for (k = 0; j == -1 && k < series.length; k++) {
                s = series[k];
                if (! s.test) continue;
                sz = s.size || 10;
                for (i = 0; i < s.pxs.length; i++) {
                    d = Math.sqrt(Math.pow(x - s.pxs[i], 2) +
                            Math.pow(y - s.pys[i], 2));
                    if (d < sz && d < mind) {
                        mind = d;
                        j = i;
                    }
                }
            }
            if (mouse_data.length) {
                mouse_data = [];
                repaint();
            }
            if (j > -1) {
                select(s.pxs[j], s.pys[j], sz);
                mouse_data = [s, j];
            }
        }
    }

    function on_mouseup(ev) {
        mousedown = false;
        if (mouse_data.length) {
            if (select_cb != null) {
                select_cb(mouse_data);
            }
            mouse_data = [];
            repaint();
        }
    }

    function on_mousedown(ev) {
        var x, y;

        mousedown = true;
        x = ev.clientX - canvas.offsetLeft;
        y = ev.clientY - canvas.offsetTop;
        mouse_x = x;
        mouse_y = y;
    }

    function on_mousewheel(ev) {
        d = ev.detail | ev.wheelData | ev.wheelDelta;
        d = (ev.wheelDelta) ? -d : d;
        if (d > 0) {
            zoom(.833, .833);
        }
        else {
            zoom(1.2, 1.2);
        }
    }
        
    jcanvas.mousemove(on_mousemove);
    jcanvas.mouseup(on_mouseup);
    jcanvas.mousedown(on_mousedown);

    //jquery does not have mousewheel
    //FF doesn't recognize mousewheel as of FF3.x
    var mousewheelevt=(/Firefox/i.test(navigator.userAgent)) ? 
        "DOMMouseScroll" : "mousewheel" 

    //if IE (and Opera depending on user setting)
    if (canvas.attachEvent) {
        canvas.attachEvent("on"+mousewheelevt, on_mousewheel);
    }
    //WC3 browsers
    else if (canvas.addEventListener) {
        canvas.addEventListener(mousewheelevt, on_mousewheel, false);
    }

    function data2image(rgba, w, h) {
        var canvas, ct, image;

        canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        /* This needs image-rendering property to be set. */
        //canvas['image-rendering'] = '-moz-crisp-edges';
        ct = canvas.getContext('2d');
        image = ct.createImageData(w, h);
        //image = ct.getImageData(0, 0, w, h);
        for (var i = 0; i < image.data.length; i++) {
            image.data[i] = rgba[i];
        }
        ct.putImageData(image, 0, 0);

        return ct.canvas;
    }

    this.set_data = function() {
        var dx1, dy1, dx2, dy2, x, y, i;
        var s;

        series = arguments;

        if (use_dates) {
            xscale = tscale;
        }

        for (i = 0; i < series.length; i++) {
            s = series[i];
            if (s.rgba) {
                s.image = data2image(s.rgba, s.width, s.height);
            }
        }

        // data extents are kept to apply to the scales.
        // They are taken from the first element in the series.
        s = series[0];
        dx1 = Math.min.apply(Math, s.x);
        dy1 = Math.min.apply(Math, s.y);
        dx2 = Math.max.apply(Math, s.x);
        dy2 = Math.max.apply(Math, s.y);
        x = (dx2 - dx1) * .1;
        y = (dy2 - dy1) * .1;
        set_viewport(dx1 - x, dy1 - y, dx2 + x, dy2 + y);

        mouse_data = [];

        repaint();
    }

}

}(window.plot = window.plot || {}, jQuery));

