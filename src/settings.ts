import { type App, PluginSettingTab, Setting } from "obsidian";
import type MyPlugin from "./main";

export interface WeeklyNotesSettings {
    titleFormat: string;
}

export const DEFAULT_SETTINGS: WeeklyNotesSettings = {
    titleFormat: "YYYY-MM-DD",
};

export class WeeklyNotesSettingsTab extends PluginSettingTab {
    plugin: MyPlugin;

    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("Please enter a format.")
            .setDesc("Or else.")
            .addText((text) =>
                text
                    .setPlaceholder("Enter your secret")
                    .setValue(this.plugin.settings.titleFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.titleFormat = value;
                        await this.plugin.saveSettings();
                    }),
            );
    }
}
