const ui = require("ui-lib/library");

const core = require("pictologic/core");

var ptl;

ui.addMenuButton("PicToLogic", "paste", () => {
	ptl.show();
});

ui.addButton("pictologic", "paste", () => {
	ptl.show();
});

ui.onLoad(() => {
	ptl = new BaseDialog("PicToLogic");

	ptl.button("$settings", Icon.settings, () => {
		core.settings.show();
	}).width(150);
	ptl.row();
	ptl.add("Copy the PNG image's contents to your clipboard!");
	ptl.row();
	ptl.add("Click [stat]Export[] to create a schematic.");
	ptl.row();

	ptl.addCloseButton();
	ptl.buttons.button("Export", Icon.export, () => {
		try {
			const raw = Core.app.clipboardText.bytes;
			const pixmap = new Pixmap(raw);
			core.export(pixmap);
		} catch (e) {
			ui.showError("Failed to export schematic", e);
		}
	});

	core.build();
});
