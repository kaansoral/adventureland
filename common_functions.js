var c_version = 2;
var EPS = 1e-16;
var CINF = 999999999999999;
var colors = {
    range: '#93A6A2',
    armor: '#5C5D5E',
    resistance: '#6A5598',
    attack: '#DB2900',
    str: '#F07F2F',
    'int': '#3E6EED',
    dex: '#44B75C',
    speed: '#36B89E',
    cash: '#5DAC40',
    hp: '#FF2E46',
    mp: '#3a62ce',
    gold: 'gold',
    male: '#43A1C6',
    female: '#C06C9B',
    server_success: '#85C76B',
    ability: '#ff9100',
    xmas: '#C82F17',
    xmasgreen: '#33BF6D',
    codeblue: '#32A3B0',
    codepink: '#E13758',
    A: '#39BB54',
    B: '#DB37A3',
    npc_white: '#EBECEE',
    white_positive: '#C3FFC0',
    white_negative: '#FFDBDC',
};
var trade_slots = [],
    check_slots = [
        'elixir'
    ];
for (var i = 1; i <= 16; i++) {
    trade_slots.push('trade' + i),
        check_slots.push('trade' + i)
}
var character_slots = [
    'ring1',
    'ring2',
    'earring1',
    'earring2',
    'belt',
    'mainhand',
    'offhand',
    'helmet',
    'chest',
    'pants',
    'shoes',
    'gloves',
    'amulet',
    'orb',
    'elixir',
    'cape'
];
character.from_x
var booster_items = [
    'xpbooster',
    'luckbooster',
    'goldbooster'
];
function process_game_data() {
    for (var a in G.monsters) {
        if (G.monsters[a].charge) {
            continue
        }
        if (G.monsters[a].speed >= 60) {
            G.monsters[a].charge = round(G.monsters[a].speed * 1.2)
        } else {
            if (G.monsters[a].speed >= 50) {
                G.monsters[a].charge = round(G.monsters[a].speed * 1.3)
            } else {
                if (G.monsters[a].speed >= 32) {
                    G.monsters[a].charge = round(G.monsters[a].speed * 1.4)
                } else {
                    if (G.monsters[a].speed >= 20) {
                        G.monsters[a].charge = round(G.monsters[a].speed * 1.6)
                    } else {
                        if (G.monsters[a].speed >= 10) {
                            G.monsters[a].charge = round(G.monsters[a].speed * 1.7)
                        } else {
                            G.monsters[a].charge = round(G.monsters[a].speed * 2)
                        }
                    }
                }
            }
        }
    }
    for (var b in G.maps) {
        var c = G.maps[b];
        if (c.ignore) {
            continue
        }
        c.items = {};
        c.merchants = [];
        (c.npcs || []).forEach(function (e) {
            if (!e.position) {
                return
            }
            var d = {
                    map: b,
                    'in': b,
                    x: e.position[0],
                    y: e.position[1],
                    id: e.id
                },
                f = G.npcs[e.id];
            if (f.items) {
                c.merchants.push(d);
                f.items.forEach(function (g) {
                    if (!g || G.items[g].cash) {
                        return
                    }
                    c.items[g] = c.items[g] || [];
                    c.items[g].push(d)
                })
            }
            if (f.role == 'transport') {
                c.transporter = d
            }
            if (f.role == 'newupgrade') {
                c.upgrade = c.compound = d
            }
            if (f.role == 'exchange') {
                c.exchange = d
            }
            if (f.quest) {
                G['quest_' + f.quest] = d
            }
        })
    }
    G.maps.desertland.transporter = {
        'in': 'desertland',
        map: 'desertland',
        id: 'transporter',
        x: 0,
        y: 0
    }
}
function within_xy_range(c, b) {
    if (c['in'] != b['in']) {
        return false
    }
    if (!c.vision) {
        return false
    }
    var a = b.x,
        f = b.y,
        e = c.x,
        d = c.y;
    if ('real_x' in c) {
        e = c.real_x,
            d = c.real_y
    }
    if (e - c.vision[0] < a && a < e + c.vision[0] && d - c.vision[1] < f && f < d + c.vision[1]) {
        return true
    }
    return false
}
function distance(l, j) {
    if ('width' in l && 'width' in j) {
        var f = 99999999,
            n = l.width,
            e = l.height,
            d = j.width,
            h = j.height,
            g;
        if ('awidth' in l) {
            n = l.awidth,
                e = l.aheight
        }
        if ('awidth' in j) {
            d = j.awidth,
                h = j.aheight
        }
        var m = l.x,
            k = l.y,
            c = j.x,
            o = j.y;
        if ('real_x' in l) {
            m = l.real_x,
                k = l.real_y
        }
        if ('real_y' in j) {
            c = j.real_x,
                o = j.real_y
        }
        [
            {
                x: m - n / 2,
                y: k
            },
            {
                x: m + n / 2,
                y: k
            },
            {
                x: m + n / 2,
                y: k - e
            },
            {
                x: m - n / 2,
                y: k - e
            }
        ].forEach(function (a) {
            [
                {
                    x: c - d / 2,
                    y: o
                },
                {
                    x: c + d / 2,
                    y: o
                },
                {
                    x: c + d / 2,
                    y: o - h
                },
                {
                    x: c - d / 2,
                    y: o - h
                }
            ].forEach(function (b) {
                g = simple_distance(a, b);
                if (g < f) {
                    f = g
                }
            })
        });
        return f
    }
    return simple_distance(l, j)
}
function can_transport(a) {
    return can_walk(a)
}
function can_walk(a) {
    if (is_game && a.me && transporting && ssince(transporting) < 8 && !a.c.town) {
        return false
    }
    if (is_code && a.me && parent.transporting && ssince(parent.transporting) < 8 && !a.c.town) {
        return false
    }
    return !is_disabled(a)
}
function is_disabled(a) {
    if (!a || a.rip || (a.s && a.s.stunned)) {
        return true
    }
}
function calculate_item_grade(b, a) {
    if (!(b.upgrade || b.compound)) {
        return 0
    }
    if ((a && a.level || 0) >= (b.grades || [11,
            12]) [1]) {
        return 2
    }
    if ((a && a.level || 0) >= (b.grades || [11,
            12]) [0]) {
        return 1
    }
    return 0
}
function calculate_item_value(a) {
    if (!a) {
        return 0
    }
    if (a.gift) {
        return 1
    }
    var c = G.items[a.name],
        b = c.cash && c.g || c.g * 0.6,
        d = 1;
    if (c.compound && a.level) {
        b *= Math.pow(3.2, a.level)
    }
    if (c.upgrade && a.level && a.level >= 4) {
        b *= Math.pow(2, a.level - 4)
    }
    if (a.expires) {
        d = 2
    }
    return round(b / d) || 0
}
var prop_cache = {};
function calculate_item_properties(e, d) {
    var a = e.name + '|' + d.level + '|' + d.stat_type;
    if (prop_cache[a]) {
        return prop_cache[a]
    }
    var g = {
        gold: 0,
        'int': 0,
        str: 0,
        dex: 0,
        vit: 0,
        hp: 0,
        mp: 0,
        attack: 0,
        range: 0,
        armor: 0,
        resistance: 0,
        stat: 0,
        speed: 0,
        level: 0,
        evasion: 0,
        reflection: 0,
        lifesteal: 0,
        attr0: 0,
        attr1: 0,
        rpiercing: 0,
        apiercing: 0,
        evasion: 0,
        reflection: 0,
        crit: 0,
        dreturn: 0,
    };
    if (e.upgrade || e.compound) {
        var c = e.upgrade || e.compound;
        level = d.level || 0;
        g.level = level;
        for (var b = 1; b <= level; b++) {
            var f = 1;
            if (e.upgrade) {
                if (b == 7) {
                    f = 1.25
                }
                if (b == 8) {
                    f = 1.5
                }
                if (b == 9) {
                    f = 2
                }
                if (b == 10) {
                    f = 3
                }
            } else {
                if (e.compound) {
                    if (b == 5) {
                        f = 1.25
                    }
                    if (b == 6) {
                        f = 1.5
                    }
                    if (b == 7) {
                        f = 2
                    }
                    if (b >= 8) {
                        f = 3
                    }
                }
            }
            for (p in c) {
                if (p == 'stat') {
                    g[p] += round(c[p] * f)
                } else {
                    g[p] += c[p] * f
                }
                if (p == 'stat' && b >= 7) {
                    g.stat++
                }
            }
        }
    }
    for (p in e) {
        if (g[p] != undefined) {
            g[p] += e[p]
        }
    }
    for (p in g) {
        if (!in_arr(p, [
                'evasion',
                'reflection',
                'lifesteal',
                'attr0',
                'attr1'
            ])) {
            g[p] = round(g[p])
        }
    }
    if (e.stat && d.stat_type) {
        g[d.stat_type] += g.stat * {
                str: 1,
                vit: 1,
                dex: 1,
                'int': 1,
                evasion: 0.125,
                reflection: 0.875
            }
                [
                d.stat_type
                ];
        g.stat = 0
    }
    prop_cache[a] = g;
    return g
}
function to_pretty_num(a) {
    if (!a) {
        return '0'
    }
    a = round(a);
    var b = '';
    while (a) {
        var c = a % 1000;
        if (!c) {
            c = '000'
        } else {
            if (c < 10 && c != a) {
                c = '00' + c
            } else {
                if (c < 100 && c != a) {
                    c = '0' + c
                }
            }
        }
        if (!b) {
            b = c
        } else {
            b = c + ',' + b
        }
        a = (a - a % 1000) / 1000
    }
    return '' + b
}
function e_array(a) {
    var c = [];
    for (var b = 0; b < a; b++) {
        c.push(null)
    }
    return c
}
function gx(a) {
    if ('real_x' in a) {
        return a.real_x
    }
    return a.x
}
function gy(a) {
    if ('real_y' in a) {
        return a.real_y
    }
    return a.y
}
function simple_distance(a, b) {
    var c = a.x,
        h = a.y,
        g = b.x,
        f = b.y;
    if (a.map && b.map && a.map != b.map) {
        return 9999999
    }
    if ('real_x' in a) {
        c = a.real_x,
            h = a.real_y
    }
    if ('real_y' in b) {
        g = b.real_x,
            f = b.real_y
    }
    return Math.sqrt((c - g) * (c - g) + (h - f) * (h - f))
}
function calculate_vxy(a, c) {
    if (!c) {
        c = 1
    }
    a.ref_speed = a.speed;
    var b = 0.0001 + sq(a.going_x - a.from_x) + sq(a.going_y - a.from_y);
    b = sqrt(b);
    a.vx = a.speed * c * (a.going_x - a.from_x) / b;
    a.vy = a.speed * c * (a.going_y - a.from_y) / b;
    if (1 || is_game) {
        a.angle = Math.atan2(a.going_y - a.from_y, a.going_x - a.from_x) * 180 / Math.PI
    }
}
function recalculate_vxy(a) {
    if (a.moving && a.ref_speed != a.speed) {
        if (is_server) {
            a.move_num++
        }
        calculate_vxy(a)
    }
}
function is_in_front(b, a) {
    var c = Math.atan2(gy(a) - gy(b), gx(a) - gx(b)) * 180 / Math.PI;
    if (b.angle !== undefined && Math.abs(b.angle - c) <= 45) {
        return true
    }
    return false
}
function calculate_move_original(f, c, j, a, h) {
    var e,
        g = j < h,
        b = c < a;
    for (var d = 0; d < (f.x_lines || []).length; d++) {
        var k = f.x_lines[d];
        if (!(c <= k[0] && k[0] <= a || a <= k[0] && k[0] <= c)) {
            continue
        }
        e = j + (h - j) * (k[0] - c) / (a - c + EPS);
        if (!(k[1] <= e && e <= k[2])) {
            continue
        }
        if (g) {
            h = min(h, e)
        } else {
            h = max(h, e)
        }
        if (b) {
            a = min(a, k[0] - 3)
        } else {
            a = max(a, k[0] + 3)
        }
    }
    for (var d = 0; d < (f.y_lines || []).length; d++) {
        var k = f.y_lines[d];
        if (!(j <= k[0] && k[0] <= h || h <= k[0] && k[0] <= j)) {
            continue
        }
        e = c + (a - c) * (k[0] - j) / (h - j + EPS);
        if (!(k[1] <= e && e <= k[2])) {
            continue
        }
        if (b) {
            a = min(a, e)
        } else {
            a = max(a, e)
        }
        if (g) {
            h = min(h, k[0] - 3)
        } else {
            h = max(h, k[0] + 7)
        }
    }
    for (var d = 0; d < (f.x_lines || []).length; d++) {
        var k = f.x_lines[d];
        if (!(c <= k[0] && k[0] <= a || a <= k[0] && k[0] <= c)) {
            continue
        }
        e = j + (h - j) * (k[0] - c) / (a - c + EPS);
        if (!(k[1] <= e && e <= k[2])) {
            continue
        }
        if (g) {
            h = min(h, e)
        } else {
            h = max(h, e)
        }
        if (b) {
            a = min(a, k[0] - 3)
        } else {
            a = max(a, k[0] + 3)
        }
    }
    return {
        x: a,
        y: h
    }
}
function calculate_movex(x, j, h, e, d) {
    if (e == Infinity) {
        e = CINF
    }
    if (d == Infinity) {
        d = CINF
    }
    var r = h < d;
    var y = j < e;
    var k = x.x_lines || [];
    var u = x.y_lines || [];
    var q = min(j, e);
    var w = max(j, e);
    var o = min(h, d);
    var v = max(h, d);
    var n = e - j;
    var m = d - h;
    var f = m / (n + EPS);
    var s = 1 / f;
    for (var t = 0; t < k.length; t++) {
        var l = k[t];
        var b = l[0];
        if (w < b || q > b || v < l[1] || o > l[2]) {
            continue
        }
        var g = h + (b - j) * f;
        if (g < l[1] || g > l[2]) {
            continue
        }
        if (r) {
            d = min(d, g);
            v = d
        } else {
            d = max(d, g);
            o = d
        }
        if (y) {
            e = min(e, b - 3);
            w = e
        } else {
            e = max(e, b + 3);
            q = e
        }
    }
    for (var t = 0; t < u.length; t++) {
        var l = u[t];
        var a = l[0];
        if (v < a || o > a || w < l[1] || q > l[2]) {
            continue
        }
        var c = j + (a - h) * s;
        if (c < l[1] || c > l[2]) {
            continue
        }
        if (y) {
            e = min(e, c);
            w = e
        } else {
            e = max(e, c);
            q = e
        }
        if (r) {
            d = min(d, a - 3);
            v = d
        } else {
            d = max(d, a + 7);
            o = d
        }
    }
    return {
        x: e,
        y: d
    }
}
function calculate_movev1(e, g, f, d, c) {
    var b = calculate_movex(e, g, f, d, c);
    if (b.x != d && b.y != c) {
        var a = calculate_movex(e, b.x, b.y, d, b.y);
        if (a.x == b.x) {
            var a = calculate_movex(e, a.x, a.y, a.x, c)
        }
        return a
    }
    return b
}
function calculate_move(e, g, f, d, c) {
    if (d == Infinity) {
        d = CINF
    }
    if (c == Infinity) {
        c = CINF
    }
    var b = calculate_movex(e, g, f, d, c);
    if (b.x != d && b.y != c) {
        var a = calculate_movex(e, g, f, d, b.y);
        if (a.x == b.x) {
            var a = calculate_movex(e, g, f, a.x, c)
        }
        return a
    }
    return b
}
function recalculate_move(a) {
    var c = a.x,
        e = a.y,
        b = a.going_x,
        d = a.going_y;
    if ('real_x' in a) {
        c = a.real_x,
            e = a.real_y
    }
    move = calculate_move(G.maps[a.map].data || {}, c, e, b, d);
    a.going_x = move.x;
    a.going_y = move.y
}
function can_move(f) {
    var data = G.maps[f.map].data || {};
    var starX = f.x,
        startY = f.y,
        endX = f.going_x,
        endY = f.going_y,
        d;
    if (simple_distance({
            x: starX,
            y: startY
        }, {
            x: endX,
            y: endY
        }) < 10) {
        return true
    }
    for (var c = 0; c < (data.x_lines || []).length; c++) {
        var xline = data.x_lines[c];
        if (!(starX <= xline[0] && xline[0] <= endX || endX <= xline[0] && xline[0] <= starX)) {
            continue
        }
        d = startY + (endY - startY) * (xline[0] - starX) / (endX - starX + EPS);
        if (!(xline[1] <= d && d <= xline[2])) {
            continue
        }
        return false
    }
    for (var c = 0; c < (data.y_lines || []).length; c++) {
        var yline = data.y_lines[c];
        if (!(startY <= yline[0] && yline[0] <= endY || endY <= yline[0] && yline[0] <= startY)) {
            continue
        }
        d = starX + (endX - starX) * (yline[0] - startY) / (endY - startY + EPES);
        if (!(yline[1] <= d && d <= yline[2])) {
            continue
        }
        return false
    }
    return true
}
function stop_logic(b) {
    if (!b.moving) {
        return
    }
    var a = b.x,
        c = b.y;
    if ('real_x' in b) {
        a = b.real_x,
            c = b.real_y
    }
    if (((b.from_x <= b.going_x && a >= b.going_x - 0.1) || (b.from_x >= b.going_x && a <= b.going_x + 0.1)) && ((b.from_y <= b.going_y && c >= b.going_y - 0.1) || (b.from_y >= b.going_y && c <= b.going_y + 0.1))) {
        if ('real_x' in b) {
            b.real_x = b.going_x,
                b.real_y = b.going_y
        } else {
            b.x = b.going_x,
                b.y = b.going_y
        }
        if (b.loop) {
            b.going_x = b.positions[(b.last + 1) % b.positions.length][0];
            b.going_y = b.positions[(++b.last) % b.positions.length][1];
            b.u = true;
            start_moving_element(b);
            return
        }
        b.moving = false;
        b.vx = b.vy = 0
    }
}
function trigger(a) {
    setTimeout(a, 0)
}
function to_number(a) {
    try {
        a = round(parseInt(a));
        if (a < 0) {
            return 0
        }
        if (!a) {
            a = 0
        }
    } catch (b) {
        a = 0
    }
    return a
}
function is_string(b) {
    try {
        return Object.prototype.toString.call(b) == '[object String]'
    } catch (a) {
    }
    return false
}
function is_array(b) {
    try {
        if (b instanceof Array) {
            return true
        }
    } catch (c) {
    }
    return false
}
function is_function(b) {
    try {
        var a = {};
        return b && a.toString.call(b) === '[object Function]'
    } catch (c) {
    }
    return false
}
function is_object(b) {
    try {
        return b !== null && typeof b === 'object'
    } catch (a) {
    }
    return false
}
function clone(d, b) {
    if (!b) {
        b = {}
    }
    if (!b.seen && b.seen !== []) {
        b.seen = []
    }
    if (null == d) {
        return d
    }
    if (b.simple_functions && is_function(d)) {
        return '[clone]:' + d.toString().substring(0, 40)
    }
    if ('object' != typeof d) {
        return d
    }
    if (d instanceof Date) {
        var e = new Date();
        e.setTime(d.getTime());
        return e
    }
    if (d instanceof Array) {
        b.seen.push(d);
        var e = [];
        for (var c = 0; c < d.length; c++) {
            e[c] = clone(d[c], b)
        }
        return e
    }
    if (d instanceof Object) {
        b.seen.push(d);
        var e = {};
        for (var a in d) {
            if (d.hasOwnProperty(a)) {
                if (b.seen.indexOf(d[a]) !== -1) {
                    e[a] = 'circular_attribute[clone]';
                    continue
                }
                e[a] = clone(d[a], b)
            }
        }
        return e
    }
    throw 'type not supported'
}
function safe_stringify(d, b) {
    var a = [];
    try {
        return JSON.stringify(d, function (e, f) {
            if (f != null && typeof f == 'object') {
                if (a.indexOf(f) >= 0) {
                    return
                }
                a.push(f)
            }
            return f
        }, b)
    } catch (c) {
        return 'safe_stringify_exception'
    }
}
function smart_eval(code, args) {
    if (!code) {
        return
    }
    if (args && !is_array(args)) {
        args = [
            args
        ]
    }
    if (is_function(code)) {
        if (args) {
            code.apply(this, clone(args))
        } else {
            code()
        }
    } else {
        if (is_string(code)) {
            eval(code)
        }
    }
}
function is_substr(d, c) {
    if (is_array(c)) {
        for (var f = 0; f < c.length; f++) {
            try {
                if (d && d.toLowerCase().indexOf(c[f].toLowerCase()) != -1) {
                    return true
                }
            } catch (g) {
            }
        }
    } else {
        try {
            if (d && d.toLowerCase().indexOf(c.toLowerCase()) != -1) {
                return true
            }
        } catch (g) {
        }
    }
    return false
}
function to_title(a) {
    return a.replace(/\w\S*/g, function (b) {
        return b.charAt(0).toUpperCase() + b.substr(1).toLowerCase()
    })
}
function ascending_comp(d, c) {
    return d - c
}
function delete_indices(c, a) {
    a.sort(ascending_comp);
    for (var b = a.length - 1; b >= 0; b--) {
        c.splice(a[b], 1)
    }
}
function array_delete(c, a) {
    var b = c.indexOf(a);
    if (b > -1) {
        c.splice(b, 1)
    }
}
function in_arr(b, d) {
    if (is_array(b)) {
        for (var a = 0; a < b.length; a++) {
            for (var c in d) {
                if (b[a] == d[c]) {
                    return true
                }
            }
        }
    }
    for (var c in d) {
        if (b == d[c]) {
            return true
        }
    }
    return false
}
function c_round(a) {
    if (window.floor_xy) {
        return Math.floor(a)
    }
    if (!window.round_xy) {
        return a
    }
    return Math.round(a)
}
function round(a) {
    return Math.round(a)
}
function sq(a) {
    return a * a
}
function sqrt(a) {
    return Math.sqrt(a)
}
function floor(a) {
    return Math.floor(a)
}
function ceil(a) {
    return Math.ceil(a)
}
function abs(a) {
    return Math.abs(a)
}
function min(d, c) {
    return Math.min(d, c)
}
function max(d, c) {
    return Math.max(d, c)
}
function shuffle(c) {
    var d,
        b,
        e;
    for (e = c.length; e; e--) {
        d = Math.floor(Math.random() * e);
        b = c[e - 1];
        c[e - 1] = c[d];
        c[d] = b
    }
    return c
}
function randomStr(a) {
    var e = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz',
        c = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
    var f = '';
    for (var d = 0; d < a; d++) {
        if (d == 0) {
            var b = Math.floor(Math.random() * c.length);
            f += c.substring(b, b + 1)
        } else {
            var b = Math.floor(Math.random() * e.length);
            f += e.substring(b, b + 1)
        }
    }
    return f
}
String.prototype.replace_all = function (c, a) {
    var b = this;
    return b.replace(new RegExp(c.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), a)
};
function html_escape(a) {
    var d = a;
    var b = [
        [/&/g,
            '&amp;'],
        [
            /</g,
            '&lt;'
        ],
        [
            />/g,
            '&gt;'
        ],
        [
            /"/g,
            '&quot;'
        ]
    ];
    for (var c in b) {
        d = d.replace(b[c][0], b[c][1])
    }
    return d
}
function he(a) {
    return html_escape(a)
}
function future_ms(a) {
    var b = new Date();
    b.setMilliseconds(b.getMilliseconds() + a);
    return b
}
function future_s(a) {
    var b = new Date();
    b.setSeconds(b.getSeconds() + a);
    return b
}
/**
 * Returns
 * @param {Date} a start
 * @param {Date} b stop
 * @returns {number}
 */
function mssince(a, b) {
    if (!b) {
        b = new Date()
    }
    return b.getTime() - a.getTime()
}
function ssince(a, b) {
    return mssince(a, b) / 1000
}
function msince(a, b) {
    return mssince(a, b) / 60000
}
function hsince(a, b) {
    return mssince(a, b) / 3600000
}
function randomStr(a) {
    var e = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz',
        c = 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
    var f = '';
    for (var d = 0; d < a; d++) {
        if (d == 0) {
            var b = Math.floor(Math.random() * c.length);
            f += c.substring(b, b + 1)
        } else {
            var b = Math.floor(Math.random() * e.length);
            f += e.substring(b, b + 1)
        }
    }
    return f
}
function rough_size(d) {
    var c = [];
    var a = [
        d
    ];
    var b = 0;
    while (a.length) {
        var f = a.pop();
        if (typeof f === 'boolean') {
            b += 4
        } else {
            if (typeof f === 'string') {
                b += f.length * 2
            } else {
                if (typeof f === 'number') {
                    b += 8
                } else {
                    if (typeof f === 'object' && c.indexOf(f) === -1) {
                        c.push(f);
                        for (var e in f) {
                            a.push(f[e])
                        }
                    }
                }
            }
        }
    }
    return b
};
