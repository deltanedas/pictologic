const dist = (a, b) => {
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
	// Average difference of each channel
	return (dr + dg + db) / 3;
};

module.exports = (core, pixmap) => {
	const palette = [];
	const percent = core.size / 100;
	const quality = 255 - core.quality;
	for (var x = 0; x < pixmap.width; x++) {
		core.stage = "Optimising: Indexing: " + Math.floor(x / percent) + "%";
		for (var y = 0; y < pixmap.height; y++) {
			var pixel = pixmap.getPixel(x, y);
			var add = true;
			for (var other of palette) {
				if (dist(pixel, other) < quality) {
					pixmap.draw(x, y, other);
					add = false;
					break;
				}
			}

			if (add) {
				// This pixel is unique
				palette.push(pixel);
			}
		}
	}
	print("finish");
};
