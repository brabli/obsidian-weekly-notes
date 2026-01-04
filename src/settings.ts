import { type App, PluginSettingTab, Setting } from "obsidian";
import type WeeklyNotes from "./main";

export interface WeeklyNotesSettings {
    titleFormat: string;
    templatePath: string;
}

export const DEFAULT_SETTINGS: WeeklyNotesSettings = {
    titleFormat: "YYYY-MM-DD",
    templatePath: "",
};

export class WeeklyNotesSettingsTab extends PluginSettingTab {
    plugin: WeeklyNotes;

    constructor(app: App, plugin: WeeklyNotes) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        const dateDesc = document.createDocumentFragment();
        dateDesc.appendText("For a list of all available tokens, see the ");
        dateDesc.createEl("a", {
            text: "format reference",
            attr: {
                href: "https://momentjs.com/docs/#/displaying/format/",
                target: "_blank",
            },
        });
        dateDesc.createEl("br");
        dateDesc.appendText("Your current syntax looks like this: ");
        const dateSampleEl = dateDesc.createEl("b", "u-pop");
        new Setting(containerEl)
            .setName("Date format")
            .setDesc(dateDesc)
            .addMomentFormat((momentFormat) =>
                momentFormat
                    .setValue(this.plugin.settings.titleFormat)
                    .setSampleEl(dateSampleEl)
                    .setDefaultFormat("MMMM dd, yyyy")
                    .onChange(async (value) => {
                        this.plugin.settings.titleFormat = value;
                        await this.plugin.saveSettings();
                    }),
            );

        const markdownFiles = this.app.vault
            .getFiles()
            .filter((file) => file.extension === "md")
            .map((file) => file.path);

        new Setting(containerEl)
            .setName("Template file")
            .setDesc("Select the template file to use")
            .addDropdown((dropdown) => {
                dropdown.addOption("", "No template selected");

                markdownFiles.forEach((path) => {
                    dropdown.addOption(path, path);
                });

                dropdown.setValue(this.plugin.settings.templatePath).onChange(async (value) => {
                    this.plugin.settings.templatePath = value;
                    await this.plugin.saveSettings();
                });
            });
    }
}
