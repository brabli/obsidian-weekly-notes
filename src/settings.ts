import { type App, PluginSettingTab, Setting } from "obsidian";
import { readCoreTemplatesPluginConfig } from "utils";
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

        new Setting(containerEl)
            .setName("Template file")
            .setDesc("Select the template file to use")
            .addDropdown(async (dropdown) => {
                dropdown.addOption("", "No template selected");

                try {
                    const coreTemplatesPluginConfig = await readCoreTemplatesPluginConfig(this.app);
                    // Load template files
                } catch (e) {
                    console.log(e);
                }

                this.app.vault.getMarkdownFiles().forEach((markdownFile) => {
                    dropdown.addOption(markdownFile.path, markdownFile.path);
                });

                dropdown.setValue(this.plugin.settings.templatePath).onChange(async (value) => {
                    this.plugin.settings.templatePath = value;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Start day")
            .setDesc("Day of the week to start on")
            .addDropdown(async (dropdown) => {
                dropdown.addOptions({
                    monday: "Monday",
                    tuesday: "Tuesday",
                    wednesday: "Wednesday",
                    thursday: "Thursday",
                    friday: "Friday",
                    saturday: "Saturday",
                    sunday: "Sunday",
                });
            });
    }
}
