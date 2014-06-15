/* vim: set filetype=javascript: */

function on_select(data) {

    alert("selected " + data[1]);
}

var test_data = "2000/10/01 10.1\n" +
    "2001/04/05 10.5\n" +
    "2002/06/07 11.6\n" +
    "2003/05/02 12.5\n" +
    "2004/09/12 17.8\n" +
    "2005/11/4 9.8\n" +
    "2005/11/10 9.6\n" +
    "2005/11/17 9.9\n" +
    "2005/11/24 10.1";

function make_test_data() {
    var x1, x2;
    var i, x, dx, y, n;

    x1 = (new Date("2000/01/03")).getTime();
    x2 = (new Date("2013/03/28")).getTime();
    n = 3000;
    dx = (x2 - x1)/n;
    xs = new Array(n);
    ys = new Array(n);
    for (i = 0, x = x1; i < n; i++, x += dx) {
        xs[i] = x;
        y = 1000 + 400 * Math.cos(Math.PI * 4 * i /n - Math.PI/8);
        y += Math.random() * 40 * Math.sin(Math.PI * 50 * i / n);
        ys[i] = y;
    }
    return [xs, ys];
}

function s2xy(str, use_dates) {
    var xs = new Array(), ys = new Array();
    var lines = str.split('\n');
    var parse;
    
    if (use_dates) {
        parse = function(v) {
            if (typeof(v) == 'string') {
                return (new Date(v)).getTime();
            }
            return parseFloat(v);
        }
    }
    else {
        parse = parseFloat;
    }

    for (i = 0; i < lines.length; i++) {
        x = lines[i].split(' ')[0];
        y = lines[i].split(' ')[1];
        if (x === undefined) continue;
        x = parse(x);
        xs.push(x);
        y = parseFloat(y);
        ys.push(y);
    }
    return [xs, ys];
}

function make_plot_series() {
    var s = {};

    p = make_test_data();
    //p = s2xy(test_data, true);
    //p = s2xy("1 99\n2 101\n3 1\n4 88", false);

    s.x = p[0];
    s.y = p[1];
    s.size = 12;
    s.lineWidth = 1;
    s.test = true;
    s.shape = 'line' //$("#canvas2")[0].plot.uptri
    s.strokeStyle = '#0ff';
    return s;
}

function make_plot_image() {
    var w, h, n, s = {};

    w = 60;
    h = 60;
    n = w*h;
    s.x = [0, 60];
    s.y = [0, 60];
    s.width = w;
    s.height = h;
    s.rgba = new Array(n);

    for (i = 0; i < n*4; i += 4) {
        s.rgba[i] = Math.random() > .5 ? 255 : 0;
        s.rgba[i+1] = Math.random() > .5 ? 255 : 0;
        s.rgba[i+2] = Math.random() > .5 ? 255 : 0;
        s.rgba[i+3] = 255;
    }
    return s;
}

function on_point(ev) {
    $("#nav0").hide();
    $("#nav1").show(500, function() {
        var points, s = {};

        points = s2xy("1 99\n2 101\n3 1\n4 88");

        s.x = points[0];
        s.y = points[1];
        s.size = 12;
        s.test = true;
        s.fillStyle = 'white';
        s.shape = 'circle';

        $("#canvas1")[0].plot.set_data(s);
    });
}

function on_date(ev) {
    $("#nav0").hide();
    $("#nav2").show(500, function() {
        //$("#canvas2")[0].plot.set_data(test_data);
        $("#canvas2")[0].plot.set_data(make_plot_series());
    });
}

function on_heat(ev) {
    $("#nav0").hide();
    $("#nav3").show(500, function() {
        $("#canvas3")[0].plot.set_data(make_plot_image());
    });
}


$(document).ready(function() {

    /* Post Process Setup */
    $("#point").click(on_point);
    $("#date").click(on_date);
    $("#heat").click(on_heat);
    $("#canvas1")[0].plot = new plot.Plot($("#canvas1"),
        false, on_select);
    $("#canvas2")[0].plot = new plot.Plot($("#canvas2"),
        true, on_select);
    $("#canvas3")[0].plot = new plot.Plot($("#canvas3"),
        false, on_select);

    $("#close1").click(function() {
        $("#nav1").hide();
        $("#nav0").show(500);
    });
    $("#close2").click(function() {
        $("#nav2").hide();
        $("#nav0").show(500);
    });
    $("#close3").click(function() {
        $("#nav3").hide();
        $("#nav0").show(500);
    });

});

