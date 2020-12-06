const ui = this.global.ui;
const fast = require("pictologic/fast");

const core = {
	// settings //
	display: Blocks.logicDisplay,
	size: Blocks.logicDisplay.displaySize,
	speed: LExecutor.maxInstructions,
	quality: 255,
	hsv: false,

	stage: "",
	settings: null,
	image: null
};

const stile = (tile, config) => new Schematic.Stile(tile.block(),
	tile.x, tile.y, config, 0);

core.build = () => {
	const d = new BaseDialog("$settings");
	core.settings = d;

	const displays = Vars.content.blocks().select(block => block instanceof LogicDisplay);
	d.cont.pane(t => {
		t.defaults().growX().center();

		const icon = new TextureRegionDrawable(core.display.icon(Cicon.full));
		t.button("Display", icon, () => {
			ui.select("Select Display", displays, d => {
				core.display = d;
				core.size = d.displaySize;
				icon.region = d.icon(Cicon.full);
			}, i => displays.get(i).localizedName);
		}).height(120).row();

		const speed = new Table();
		speed.add("Speed: ").right();
		speed.field(core.speed, str => {
			core.speed = parseInt(str);
		}).growX().left().get().validator = str => !isNaN(parseInt(str));
		t.add(speed).height(64).row();

		const quality = new Table();
		quality.add("Quality:").center().row();
		quality.defaults().growX().center();

		var slider;
		const field = quality.field("" + core.quality, t => {
			const n = parseInt(t);
			core.quality = "" + n;
			slider.value = n;
		}).get();
		field.validator = t => !isNaN(parseInt(t));

		quality.row();
		slider = quality.slider(0, 255, 1, core.quality, n => {
			core.quality = n;
			field.text = "" + n;
		}).get();

		quality.row();
		quality.check("Use HSV", core.hsv, b => {core.hsv = b})
			.disabled(() => core.quality == 255);
		t.add(quality).height(160);
	}).growY().width(400);

	d.addCloseButton();
};

core.export = pixmap => {
	// Only resize if it's not perfect (uses linear filtering, for cubic use gimp, imagemagick or something)
	if (pixmap.width != core.size || pixmap.height != core.size) {
		core.stage = "Scaling...";
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

	core.stage = "Optimising...";
	const out = fast(core, pixmap);
	core.stage = "Building code...";
	for (var colour in out) {
		curColour = colour;
		if (check()) current.push(colour);
		for (var rect of out[colour]) {
			check();
			// 0, 0 is the top left of a PNG and bottom left of a display, flip y
			current.push("draw rect " + [rect.x, core.size - rect.y - rect.h, rect.w, rect.h].join(" "));
		}
	}

	if (current.length > 0) {
		current.push("drawflush display1");
		code.push(current.join("\n"));
	}

	core.stage = "Building schematic...";
	const xs = [], ys = [];
	// 14 processors + 9 display = 23 tiles, fits in a 5x5 square
	const min = Math.ceil(Math.sqrt(core.display.size * core.display.size + code.length));
	const offset = min - core.display.size;
	const dispMin = Math.floor(offset / 2);
	const dispMax = core.display.size + dispMin - 1;
	var i = 0;

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

	const coord = dispMax - Math.floor(core.display.size / 2);
	const disp = new Tile(coord, coord,
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

	core.stage = "Saving...";
	// Create a schematic
	const tags = new StringMap();
	tags.put("name", "!!name me");
	const schem = new Schematic(tiles, tags, width, height);
	// Import it
	Vars.schematics.add(schem);
	// Select it
	Vars.ui.schematics.hide();
	Vars.control.input.useSchematic(schem);

	core.stage = "";
};

module.exports = core;
