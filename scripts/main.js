const ui = require("ui-lib/library");

const core = require("pictologic/core");

var ptl;

ui.addMenuButton("PicToLogic", "paste", () => {
	ptl.show();
});

ui.onLoad(() => {
	// Add button in Schematics dialog
	Vars.ui.schematics.buttons.button("PicToLogic", Icon.paste, () => {
		ptl.show();
	});

	ptl = new BaseDialog("PicToLogic");

	ptl.cont.add("[coral]1.[] Select a PNG image.");
	ptl.cont.row();
	ptl.cont.add("[coral]2.[] Click [stat]Export[] to create a schematic.");
	ptl.cont.row();

	ptl.cont.button("Select Image", () => {
		readBinFile("png", "Schematic's source image", bytes => {
			core.image = bytes;
		});
	});

	ptl.addCloseButton();
	ptl.buttons.button("$settings", Icon.settings, () => {
		core.settings.show();
	});
	ptl.buttons.button("Export", Icon.export, () => {
		try {
			core.export(new Pixmap(core.image));
		} catch (e) {
			ui.showError("Failed to export schematic", e);
		}
	}).disabled = () => !core.image;

	core.build();
});
