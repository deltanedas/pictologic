const indexer = require("pictologic/indexer");
var used;

function isUsed(x, y) {
	return used[x + "," + y];
}

function mark(x, y) {
	used[x + "," + y] = true;
}

// Mark a fully expanded rect's pixels as used
function markRect(rect) {
	for (var x = 0; x < rect.w; x++) {
		for (var y = 0; y < rect.h; y++) {
			mark(rect.x + x, rect.y + y);
		}
	}
}

function expandRight(pixmap, rect, colour) {
	const x = rect.x + rect.w;
	for (var i = 0; i < rect.h; i++) {
		var y = rect.y + i;
		if (pixmap.getPixel(x, y) != colour || isUsed(x, y)) {
			return false;
		}
	}

	// All pixels to the right of the rect are the same, expand
	rect.w++;
	return true;
}

function expandDown(pixmap, rect, colour) {
	const y = rect.y + rect.h;
	for (var i = 0; i < rect.w; i++) {
		var x = rect.x + i;
		// TODO: check for out-of-bounds
		if (pixmap.getPixel(x, y) != colour || isUsed(x, y)) {
			return false;
		}
	}

	// All pixels below the rect are the same, expand
	rect.h++;
	return true;
}

function rects(pixmap, rect, colour) {
	// For marking new pixels as used
	while (expandRight(pixmap, rect, colour));
	while (expandDown(pixmap, rect, colour));
	markRect(rect);
}

function getColour(pixel) {
	const r = (pixel >> 24) & 0xff,
		g = (pixel >> 16) & 0xff,
		b = (pixel >> 8) & 0xff;

	return "draw color " + r + " " + g + " " + b;
}

/* Group identically-coloured rectangles */
function group(core, pixmap) {
	// Merge colours by similarity
	if (core.quality < 255) {
		print("Index @ " + core.quality)
		indexer(core, pixmap);
	}

	const percent = core.size / 100;
	const out = {};
	used = {};

	pixmap.each((x, y) => {
		if (y == 0) {
			core.stage = "Opimising: Grouping: " + Math.floor(x / percent) + "%";
		}

		// If pixel is included in another rect, skip
		if (isUsed(x, y)) return;

		const pixel = pixmap.getPixel(x, y);
		const colour = getColour(pixel);
		const rect = {x: x, y: y, w: 1, h: 1};

		// Merge many adjacent identical pixels as possible
		rects(pixmap, rect, pixel);

		if (out[colour]) {
			out[colour].push(rect);
		} else {
			out[colour] = [rect];
		}
	});

	return out;
};

module.exports = group;
