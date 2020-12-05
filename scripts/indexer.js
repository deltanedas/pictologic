// Default indexer, is colourblind but clean
const rgb = require("pictologic/indexer_rgb");
// Proper indexer, respects colour hue but FIXME adds grey noise for some reason
const hsv = require("pictologic/indexer_hsv");

module.exports = (core, pixmap) => {
	print("Hsv " + core.hsv);
	(core.hsv ? hsv : rgb)(core, pixmap);
};
