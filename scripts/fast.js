/* Group each pixel together by colour */
const group = pixmap => {
	const out = {};

	pixmap.each((x, y) => {
		const pixel = pixmap.getPixel(x, y);
		const r = (pixel >> 24) & 0xff,
			g = (pixel >> 16) & 0xff,
			b = (pixel >> 8) & 0xff;

		const colour = "draw color " + r + " " + g + " " + b;
		const pos = {x: x, y: y};
		if (out[colour]) {
			out[colour].push(pos);
		} else {
			out[colour] = [pos];
		}
	});

	return out;
};

// TODO: group by rects
// TODO: 'index' colours with a quality threshold (see pngquant, port to js)

module.exports = group;
/* pixmap => {
	index(pixmap);
	return rects(group(pixmap));
} */
