import { Notice, Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS, type WeeklyNotesSettings, WeeklyNotesSettingsTab } from "./settings";
import { replaceTemplateVariables } from "./utils";

export default class WeeklyNotes extends Plugin {
    settings: WeeklyNotesSettings;

    async onload() {
        await this.loadSettings();

        this.addCommand({
            id: "create-weekly-note",
            name: "Create weekly note",
            callback: () => {
                this.createWeeklyNote();
            },
        });

        this.addRibbonIcon("calendar-days", "Open weekly note", (_event: MouseEvent) => {
            this.createWeeklyNote();
        });

        this.addSettingTab(new WeeklyNotesSettingsTab(this.app, this));
    }

    async createWeeklyNote() {
        try {
            const weeklyNoteTitle = window
                .moment()
                .startOf("isoWeek")
                .format(this.settings.titleFormat);

            const weeklyNoteFilepath = `${weeklyNoteTitle}.md`;
            const existingWeeklyNote = this.app.vault.getFileByPath(weeklyNoteFilepath);

            // File already exists, so just open it
            if (existingWeeklyNote instanceof TFile) {
                const leaf = this.app.workspace.getLeaf();
                await leaf.openFile(existingWeeklyNote);
                return;
            }

            const templatePath = this.settings.templatePath;
            const templateFile = this.app.vault.getFileByPath(templatePath);

            let content = "";

            if (null === templateFile) {
                if ("" !== templatePath) {
                    new Notice(`Template file not found "${this.settings.templatePath}".`);
                }
            } else {
                content = await this.app.vault.read(templateFile);
            }

            content = await replaceTemplateVariables(this.app, content, weeklyNoteTitle);

            const file = await this.app.vault.create(weeklyNoteFilepath, content);
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(file);
        } catch (e: unknown) {
            const error = e as Error;
            new Notice(`[ERROR]: ${error.message}`);
            console.error(error);
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<WeeklyNotesSettings>);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
