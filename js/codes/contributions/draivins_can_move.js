function can_move(map, cur_x, cur_y, target_x, target_y) {
    var x_lines = map.x_lines || [];
    var y_lines = map.y_lines || [];

    var min_x = min(cur_x, target_x);
    var max_x = max(cur_x, target_x);
    var min_y = min(cur_y, target_y);
    var max_y = max(cur_y, target_y);

    var dx = target_x - cur_x;
    var dy = target_y - cur_y;

    var dydx = dy / (dx + EPS);
    var dxdy = 1 / dydx;

    for (var i = 0; i < x_lines.length; i++) {
        var line = x_lines[i];
        var line_x = line[0];
        if (max_x < line_x || min_x > line_x || max_y < line[1] || min_y > line[2]) {
            continue;
        }

        var y_intersect = cur_y + (line_x - cur_x) * dydx;

        if (y_intersect < line[1] || y_intersect > line[2]) {
            continue;
        }

        return false;
    }

    for (var i = 0; i < y_lines.length; i++) {
        var line = y_lines[i];
        var line_y = line[0];
        if (max_y < line_y || min_y > line_y || max_x < line[1] || min_x > line[2]) {
            continue;
        }

        var x_intersect = cur_x + (line_y - cur_y) * dxdy;

        if (x_intersect < line[1] || x_intersect > line[2]) {
            continue;
        }

        return false;
    }

    return true;
}