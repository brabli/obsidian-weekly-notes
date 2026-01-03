import { Notice, Plugin, TFile } from "obsidian";
import {
    DEFAULT_SETTINGS,
    WeeklyNotesSettingsTab,
    type WeeklyNotesSettings,
} from "./settings";

export default class WeeklyNotes extends Plugin {
    settings: WeeklyNotesSettings;

    async onload() {
        await this.loadSettings();

        const createWeeklyNote = async () => {
            try {
                const name = window
                    .moment()
                    .startOf("isoWeek")
                    .format(this.settings.titleFormat);
                const filepath = `${name}.md`;

                const existingFile = this.app.vault.getFileByPath(filepath);

                console.debug(existingFile);

                if (existingFile instanceof TFile) {
                    new Notice("File already exists, backing down.");
                    const leaf = this.app.workspace.getLeaf();
                    await leaf.openFile(existingFile);
                    return;
                }

                console.debug(existingFile, filepath);

                const file = await this.app.vault.create(filepath, "");
                const leaf = this.app.workspace.getLeaf();
                await leaf.openFile(file);
            } catch (e: unknown) {
                const error = e as Error;
                new Notice(`[ERROR]: ${error.message}`);
            }
        };

        this.addCommand({
            id: "create-weekly-note",
            name: "Create weekly note",
            callback: createWeeklyNote,
        });

        // This creates an icon in the left ribbon.
        this.addRibbonIcon("dice", "Open weekly note", (_event: MouseEvent) => {
            createWeeklyNote();
        });

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new WeeklyNotesSettingsTab(this.app, this));

        // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
        this.registerInterval(
            window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000),
        );
    }

    onunload() {}

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            (await this.loadData()) as Partial<WeeklyNotesSettings>,
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
