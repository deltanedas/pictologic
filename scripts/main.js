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
		core.dialog.show();
	}).width(150);
	ptl.row();
	ptl.add("Copy [green]base64 -w 0 < file.png[] to your clipboard!");
	ptl.row();
	ptl.add("Click [stat]export[] to make a schematic.");
	ptl.row();

	ptl.addCloseButton();
	ptl.buttons.button("$export", Icon.export, () => {
		try {
			const raw = Packages.arc.util.serialization.Base64Coder.decode(Core.app.clipboardText);
			const pixmap = new Pixmap(raw);
			core.export(pixmap);
		} catch (e) {
			ui.showError("Failed to export schematic", e);
		}
	});

	core.build();
});
