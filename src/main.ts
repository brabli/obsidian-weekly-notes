import { Notice, normalizePath, Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS, type WeeklyNotesSettings, WeeklyNotesSettingsTab } from "./settings";
import { replaceTemplateVariables, weekdayToIsoIndex } from "./utils";

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
            const startDay = this.settings.startDay;
            const startDayIndex = weekdayToIsoIndex(startDay);
            const today = window.moment();
            const isoWeekdayIndex = today.weekday() + 1; // momentjs uses 1-7, ISO 8601 uses 0-6.
            const daysToSubtract = (isoWeekdayIndex - startDayIndex + 7) % 7;
            let weekStart = today.clone().subtract(daysToSubtract, "days").startOf("day");

            new Notice("About to check changing day.");

            // Workaround for Android issue where the day is off by one
            if (weekStart.format("dddd") !== this.settings.startDay) {
                new Notice("Changind day.");
                weekStart = weekStart.clone().add(1, "days").startOf("day");
            }

            const weeklyNoteTitle = weekStart.format(this.settings.titleFormat);
            const weeklyNoteFilepath = normalizePath(`${weeklyNoteTitle}.md`);

            const existingWeeklyNote = this.app.vault.getFileByPath(weeklyNoteFilepath);

            // Open the file if it already exists
            if (existingWeeklyNote instanceof TFile) {
                let opened = false;

                this.app.workspace.iterateRootLeaves(async (leaf) => {
                    if (weeklyNoteTitle === leaf.getDisplayText()) {
                        this.app.workspace.setActiveLeaf(leaf);
                        opened = true;
                    }
                });

                if (!opened) {
                    const leaf = this.app.workspace.getLeaf(true); // `true` opens leaf in new tab
                    await leaf.openFile(existingWeeklyNote);
                }

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

            const startDayName = weekStart.format("dddd");
            const msg1 = `\nDetected start day: ${startDayName}`;
            const msg2 = `\nSettings start day: ${startDay}`;
            const msg3 = `\nBeta 3.`;

            content = `${content}${msg1}${msg2}${msg3}`;

            const file = await this.app.vault.create(weeklyNoteFilepath, content);
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(file);
        } catch (e: unknown) {
            const error = e as Error;
            console.error(error);
            new Notice(`[ERROR]: ${error.message}`);
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<WeeklyNotesSettings>);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
