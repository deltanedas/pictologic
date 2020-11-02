const ui = this.global.ui;
const fast = require("pictologic/fast");

const core = {
	// settings //
	display: Blocks.logicDisplay,
	size: Blocks.logicDisplay.displaySize,
	speed: LExecutor.maxInstructions,
	settings: null
};

const stile = (tile, config) => new Schematic.Stile(tile.block(),
	tile.x, tile.y, config, 0);

core.build = () => {
	const d = new BaseDialog("$settings");
	core.settings = d;

	const displays = Vars.content.blocks().select(block => block instanceof LogicDisplay);

	const icon = new TextureRegionDrawable(core.display.icon(Cicon.full));
	d.cont.button("display", icon, () => {
		ui.select("select display", displays, d => {
			core.display = d;
			core.size = d.displaySize;
			icon.region = d.icon(Cicon.full);
		}, i => displays.get(i).localizedName);
	}).width(200);

	d.cont.row();

	const speed = new Table();
	speed.add("Speed: ").left();
	speed.field(core.speed, str => {
		core.speed = parseInt(str);
	}).growX().left().get().validator = str => !isNaN(parseInt(str));
	d.cont.add(speed).size(64, 350);

	d.addCloseButton();
};

core.export = pixmap => {
	if (pixmap.width != core.size || pixmap.height != core.size) {
		pixmap = Pixmaps.scale(pixmap,
			core.size / pixmap.width, core.size / pixmap.height);
	}

	const code = [];
	var current = [];
	var drawCalls = 0;
	var curColour;

	const check = () => {
		var ret = true;
		if ((current.length + 2) >= core.speed) {
			current.push("drawflush display1");
			code.push(current.join("\n"));
			current = [curColour];
			drawCalls = 1;
			ret = false;
		}

		if (++drawCalls >= LExecutor.maxGraphicsBuffer) {
			current.push("drawflush display1");
			current.push(curColour);
			drawCalls = 1;
			ret = false;
		}

		return ret;
	};

	const out = fast(pixmap);
	for (var colour in out) {
		curColour = colour;
		if (check()) current.push(colour);
		for (var pix of out[colour]) {
			check();
			current.push("draw rect " + pix.x + " " + (core.size - pix.y - 1) + " 1 1");
		}
	}

	if (current.length > 0) {
		current.push("drawflush display1");
		code.push(current.join("\n"));
	}

	const xs = [], ys = [];
	// 14 processors + 9 display = 23 tiles, fits in a 5x5 square
	const min = Math.ceil(Math.sqrt(core.display.size * core.display.size + code.length));
	const offset = min - core.display.size;
	const dispMin = Math.floor(offset / 2);
	const dispMax = core.display.size + dispMin - 1;
	var i = 0;

	print([min, offset, dispMin, dispMax])
	for (var x = 0; x < min; x++) {
		for (var y = 0; y < min; y++) {
			if (i == code.length) {
				// Have enough processors now, stop
				x = null;
				break;
			}

			// Don't put processors inside the display
			if (!(x >= dispMin && x <= dispMax &&
					y >= dispMin && y <= dispMax)) {
				xs[i] = x;
				ys[i++] = y;
			}
		}
		if (x === null) break;
	}
	const disp = new Tile(offset, offset,
		Blocks.stone, Blocks.air, core.display);

	const tiles = Seq.with(stile(disp, null));

	var x, y, width = 0, height = 0;
	for (var i in code) {
		x = xs[i];
		y = ys[i];

		if (x > width) width = x;
		if (y > height) height = y;

		const build = Blocks.microProcessor.newBuilding();
		build.tile = new Tile(x, y, Blocks.stone, Blocks.air, Blocks.microProcessor);
		// Link the display to the processor
		build.links.add(new LogicBlock.LogicLink(disp.x, disp.y, "display1", true));
		// Add the image segment code
		build.updateCode(code[i]);

		tiles.add(stile(build.tile, build.config()));
	}

	// Create a schematic
	const tags = new StringMap();
	tags.put("name", "!!name me");
	const schem = new Schematic(tiles, tags, width, height);
	// Import it
	Vars.schematics.add(schem);
};

module.exports = core;
