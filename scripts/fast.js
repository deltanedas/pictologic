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
		if (pixmap.get(x, y) != colour || isUsed(x, y)) {
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
		if (pixmap.get(x, y) != colour || isUsed(x, y)) {
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
		indexer(core, pixmap);
	}

	const percent = core.size / 100;
	const out = {};
	used = {};

	// each has a stroke idk why
	const width = pixmap.width, height = pixmap.height;
	for (var x = 0; x < width; x++) {
		core.stage = "Opimising: Grouping: " + Math.floor(x / percent) + "%";
		for (var y = 0; y < height; y++) {
			// If pixel is included in another rect, skip
			if (isUsed(x, y)) continue;

			var pixel = pixmap.get(x, y);
			var colour = getColour(pixel);

			var rect = {x: x, y: y, w: 1, h: 1};

			// Merge many adjacent identical pixels as possible
			rects(pixmap, rect, pixel);

			if (out[colour]) {
				out[colour].push(rect);
			} else {
				out[colour] = [rect];
			}
		}
	}

	return out;
}

function blackBlend(pixel, alpha) {
	const r = alpha * ((pixel >> 24) & 0xff),
		g = alpha * ((pixel >> 16) & 0xff),
		b = alpha * ((pixel >> 8) & 0xff);
	return (r << 24) | (g << 16) | (b << 8) | 255;
}

// Thread-local Tmp.c1
const tmp = new Color();
function grayBlend(pixel, alpha) {
	return tmp.set(pixel | 255).lerp(Pal.darkerMetal, 1 - alpha).rgba();
}

module.exports = (core, pixmap) => {
	const percent = core.size / 100;
	const blend = core.useGray ? grayBlend : blackBlend;
	pixmap.each((x, y) => {
		if (y == 0) {
			core.stage = "Alpha Blending: " + Math.floor(x / percent) + "%";
		}

		const pixel = pixmap.get(x, y);
		const alpha = (pixel & 0xFF) / 255;
		if (alpha == 1) return;

		pixmap.draw(x, y, blend(pixel, alpha));
	});

	return group(core, pixmap);
};
