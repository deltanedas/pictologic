function diff(a, b) {
	const ar = (a >> 16) & 0xFF,
		ag = (a >> 8) & 0xFF,
		ab = a & 0xFF;
	// get in
	const br = (b >> 16) & 0xFF,
		bg = (b >> 8) & 0xFF,
		bb = b & 0xFF;
	const dr = Math.abs(ar - br),
		dg = Math.abs(ag - bg),
		db = Math.abs(ab - bb);
	return dr + dg + db;
}

module.exports = (core, pixmap) => {
	const palette = [];
	const percent = core.size / 100;
	const quality = (255 - core.quality) * 3;
	for (var x = 0; x < pixmap.width; x++) {
		core.stage = "Optimising: RGB: Indexing: " + Math.floor(x / percent) + "%";
		for (var y = 0; y < pixmap.height; y++) {
			var pixel = pixmap.get(x, y);

			var add = true;
			for (var other of palette) {
				if (diff(pixel, other) < quality) {
					pixmap.draw(x, y, other);
					add = false;
					break;
				}
			}

			if (add) {
				// This pixel is unique, base similar ones on it
				palette.push(pixel);
			}
		}
	}
};
