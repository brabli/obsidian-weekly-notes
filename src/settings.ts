import { type App, Notice, PluginSettingTab, Setting } from "obsidian";
import { readCoreTemplatesPluginConfig, recursivelyFindMarkdownFiles } from "utils";
import type WeeklyNotes from "./main";

export type Weekday = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface WeeklyNotesSettings {
    startDay: Weekday;
    titleFormat: string;
    templatePath: string;
}

export const DEFAULT_SETTINGS: WeeklyNotesSettings = {
    startDay: "Monday",
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
            .setDesc("Select the template file to use.")
            .addDropdown(async (dropdown) => {
                const useAllMarkdownFiles = async () => {
                    const allMarkdownFiles = this.app.vault.getMarkdownFiles();

                    for (const file of allMarkdownFiles) {
                        dropdown.addOption(file.path, file.path);

                        dropdown.setValue(this.plugin.settings.templatePath).onChange(async (value) => {
                            this.plugin.settings.templatePath = value;
                        });
                    }
                };

                dropdown.onChange(async (value) => {
                    console.log(`Value: ${value}`);
                    this.plugin.settings.templatePath = value;
                    await this.plugin.saveSettings();
                    console.log("Saved.");
                });

                dropdown.addOption("", "No template selected");

                let coreTemplatesPluginConfig = null;

                try {
                    coreTemplatesPluginConfig = await readCoreTemplatesPluginConfig(this.app);
                } catch (e) {
                    new Notice("Error while finding core Templates plugin configuration.");
                    console.error("Error while finding core Templates plugin configuration.");
                    console.error(e);
                    await useAllMarkdownFiles();
                    dropdown.setValue(this.plugin.settings.templatePath);
                    return;
                }

                if (null === coreTemplatesPluginConfig) {
                    new Notice(`Core Templates plugin configuration was not found.`);
                    await useAllMarkdownFiles();
                    dropdown.setValue(this.plugin.settings.templatePath);
                    return;
                }

                const templatesDirectoryPath = coreTemplatesPluginConfig.folder;
                const templatesDirectory = this.app.vault.getFolderByPath(templatesDirectoryPath);

                if (null === templatesDirectory) {
                    new Notice(`Templates directory "${templatesDirectoryPath}" was not found.`);
                    await useAllMarkdownFiles();
                    dropdown.setValue(this.plugin.settings.templatePath);
                    return;
                }

                const templateFiles = recursivelyFindMarkdownFiles(templatesDirectory);

                for (const file of templateFiles) {
                    dropdown.addOption(file.path, file.path);
                }

                dropdown.setValue(this.plugin.settings.templatePath);
            });

        new Setting(containerEl)
            .setName("Start day")
            .setDesc("Day of the week to start on")
            .addDropdown(async (dropdown) => {
                dropdown.onChange(async (value: Weekday) => {
                    this.plugin.settings.startDay = value;
                    await this.plugin.saveSettings();
                });

                dropdown.addOptions({
                    Monday: "Monday",
                    Tuesday: "Tuesday",
                    Wednesday: "Wednesday",
                    Thursday: "Thursday",
                    Friday: "Friday",
                    Saturday: "Saturday",
                    Sunday: "Sunday",
                });

                dropdown.setValue(this.plugin.settings.startDay);
            });
    }
}
