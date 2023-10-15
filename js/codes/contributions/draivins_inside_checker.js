const GRAPH_RESOLUTION = 8;

class Box {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    width() {
        return this.x2 - this.x1;
    }

    height() {
        return this.y2 - this.y1;
    }

    contains(x, y) {
        return (this.x1 < x && x < this.x2 &&
                this.y1 < y && y < this.y2);
    }

    intersects(box) {
        return (this.x1 <= box.x2 &&
                box.x1 <= this.x2 &&
                this.y1 <= box.y2 &&
                box.y1 <= this.y2);
    }

    static square(cx, cy, side) {
        let half_side = side / 2;
        return new Box(cx - half_side, cy - half_side, cx + half_side, cy + half_side);
    }
}


class NodeTree {
    constructor(region, obstacles, root, level) {
        if (!level) {
            this.level = Math.ceil(Math.log2(region.width() / GRAPH_RESOLUTION));
        } else {
            this.level = level;
        }

        if (root) {
            this.root = root;
        } else {
            this.root = this;
        }

        this.region = region;

        this.x = (region.x1 + region.x2) / 2;
        this.y = (region.y1 + region.y2) / 2;

        this.obstacles = obstacles;

        this.crossable = true;
        this.is_leaf = false;

        if (this.obstacles.length == 0) {
            this.is_leaf = true;
        } else if (this.level == 0) {
            this.is_leaf = true;
            this.crossable = false;
        }

        this.quads = null;
        this.neighbors = null;

        this.is_inside = false;

        if (!this.is_leaf) {
            this.subdivide();
        }
    }

    get_quad(x, y) {
        if (x < this.x && y < this.y) return this.quads[0];
        else if (x >= this.x && y < this.y) return this.quads[1];
        else if (x < this.x && y >= this.y) return this.quads[2];
        return this.quads[3];
    }

    subdivide() {
        this.quads = [];

        let l = this.region.x1;
        let r = this.region.x2;
        let t = this.region.y1;
        let b = this.region.y2;

        let x = this.x;
        let y = this.y;

        let subregions = [
            new Box(l, t, x, y),
            new Box(x, t, r, y),
            new Box(l, y, x, b),
            new Box(x, y, r, b),
        ];

        let obstacles = this.obstacles;
        for (let i = 0; i < subregions.length; i++) {
            let subregion = subregions[i];
            let subregion_obstacles = [];

            for (let j = 0; j < obstacles.length; j++) {
                let obstacle = obstacles[j];
                if (subregion.intersects(obstacle)) {
                    subregion_obstacles.push(obstacle);
                }
            }

            this.quads[i] = new NodeTree(subregion, subregion_obstacles, this.root, this.level - 1);
        }
    }

    get(x, y) {
        if (!this.region.contains(x, y)) return null;
        if (this.is_leaf) return this;
        return this.get_quad(x, y).get(x, y);
    }

    get_neighbors() {
        if (!this.is_leaf) throw new Error('Tried getting neighbors of non-leaf node');
        if (this.neighbors) return this.neighbors;

        if (!this.crossable) {
            this.neighbors = [];
            return this.neighbors;
        }

        let left = this.region.x1;
        let right = this.region.x2;
        let top = this.region.y1;
        let bottom = this.region.y2;

        let min_size = this.region.width() * (2 ** -this.level);
        let num_neighbors = 2 ** this.level;

        let neighbor_set = new Set();

        // Top and bottom (and corners).
        for (let x = -(num_neighbors + 1); x <= (num_neighbors + 1); x += 2) {
            let real_x = this.x + min_size * (x / 2);

            let neighbor = this.root.get(real_x, top - min_size / 2);
            if (neighbor) neighbor_set.add(neighbor);

            neighbor = this.root.get(real_x, bottom + min_size / 2);
            if (neighbor) neighbor_set.add(neighbor);
        }

        // Left and right.
        for (let y = -(num_neighbors - 1); y <= (num_neighbors - 1); y += 2) {
            let real_y = this.y + min_size * (y / 2);

            let neighbor = this.root.get(left - min_size / 2, real_y);
            if (neighbor) neighbor_set.add(neighbor);

            neighbor = this.root.get(right + min_size / 2, real_y);
            if (neighbor) neighbor_set.add(neighbor);
        }

        this.neighbors = [...neighbor_set];

        return this.neighbors;
    }

    flood_fill() {
        if (this.is_inside) return;
        this.is_inside = true;

        for (let neighbor of this.get_neighbors()) {
            neighbor.flood_fill();
        }
    }

}

function calculate_size(actual_size) {
    let cur_size = GRAPH_RESOLUTION;

    while (cur_size < actual_size) {
        cur_size *= 2;
    }

    return cur_size;
}

function initialize_graph(map_name) {
    let map_data = G.maps[map_name].data;

    let min_x = Infinity;
    let max_x = -Infinity;
    let min_y = Infinity;
    let max_y = -Infinity;


    let obstacles = [];

    for (let line of map_data.x_lines) {
        min_x = Math.min(min_x, line[0]);
        max_x = Math.max(max_x, line[0]);
        obstacles.push(new Box(
            line[0] - 3,
            line[1] - 3,
            line[0] + 3,
            line[2] + 7
        ));
    }

    for (let line of map_data.y_lines) {
        min_y = Math.min(min_y, line[0]);
        max_y = Math.max(max_y, line[0]);
        obstacles.push(new Box(
            line[1] - 3,
            line[0] - 3,
            line[2] + 3,
            line[0] + 7
        ));
    }

    let largest_side = Math.max(max_x - min_x, max_y - min_y);
    let side = calculate_size(largest_side);

    let center_x = (max_x + min_x) / 2;
    let center_y = (max_y + min_y) / 2;
    let region = Box.square(center_x, center_y, side);

    let map_tree = new NodeTree(region, obstacles);

    let spawns = G.maps[map_name].spawns;
    for (let [x, y] of spawns) {
        map_tree.get(x, y).flood_fill();
    }

    return map_tree;
}
