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

	ptl.cont.add("[coral]1.[] Copy [green]base64 -w 0 < image.png[] to your clipboard.");
	ptl.cont.row();
	ptl.cont.add("[coral]2.[] Click [stat]Export[] to create a schematic.");
	ptl.cont.row();

	ptl.addCloseButton();
	ptl.buttons.button("$settings", Icon.settings, () => {
		core.settings.show();
	}).width(150);
	ptl.buttons.button("Export", Icon.export, () => {
		try {
			const raw = Packages.arc.util.serialization.Base64Coder.decode(Core.app.clipboardText);;
			const pixmap = new Pixmap(raw);
			core.export(pixmap);
		} catch (e) {
			ui.showError("Failed to export schematic", e);
		}
	});

	core.build();
});
