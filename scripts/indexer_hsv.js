function diff(a, b) {
	const dh = Math.abs(a[0] - b[0]),
		ds = Math.abs(a[1] - b[1]),
		dv = Math.abs(a[2] - b[2]);
	return dh + ds + dv;
}

// Thread-local Tmp.c1
const tmp = new Color();
module.exports = (core, pixmap) => {
	const palette = [];
	const percent = core.size / 100;
	const quality = (255 - core.quality) * 3;
	for (var x = 0; x < pixmap.width; x++) {
		core.stage = "Optimising: HSV Indexing: " + Math.floor(x / percent) + "%";
		for (var y = 0; y < pixmap.height; y++) {
			var raw = pixmap.get(x, y);
			var pixel = tmp.set(raw);
			pixel = Color.RGBtoHSV(pixel);

			var add = true;
			for (var other of palette) {
				if (diff(pixel, other[1]) < quality) {
					pixmap.draw(x, y, other[0]);
					add = false;
					break;
				}
			}

			if (add) {
				// This pixel is unique, base similar ones on it
				palette.push([raw, pixel]);
			}
		}
	}
};
