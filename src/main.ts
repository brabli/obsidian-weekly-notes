import { MarkdownRenderer, Notice, Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS, type WeeklyNotesSettings, WeeklyNotesSettingsTab } from "./settings";

export default class WeeklyNotes extends Plugin {
    settings: WeeklyNotesSettings;

    async onload() {
        await this.loadSettings();

        this.addCommand({
            id: "create-weekly-note",
            name: "Create weekly note",
            callback: this.createWeeklyNote,
        });

        this.addRibbonIcon("week", "Open weekly note", (_event: MouseEvent) => {
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

            const templatePath = this.settings.templatePath;
            const templateFile = this.app.vault.getFileByPath(templatePath);

            // const constent = MarkdownRenderer.render(template);
            console.debug(templateFile);

            // File already exists
            if (existingWeeklyNote instanceof TFile) {
                const leaf = this.app.workspace.getLeaf();
                await leaf.openFile(existingWeeklyNote);
                return;
            }

            const file = await this.app.vault.create(weeklyNoteFilepath, "");
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(file);
        } catch (e: unknown) {
            const error = e as Error;
            new Notice(`[ERROR]: ${error.message}`);
        }
    }

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
