import { type App, moment, Notice, normalizePath, TFile, TFolder } from "obsidian";
import type { Weekday } from "settings";

export interface CoreTemplatesPluginConfig {
    dateFormat: string;
    timeFormat: string;
    folder: string;
}

/**
 * Replace Obsidian template variables using settings from core Templates plugin if set.
 *
 * {{title}} - The title of the new file
 * {{date}} - The current date
 * {{time}} - The current time
 *
 * @param app             - The Obsidian App instance
 * @param templateContent - The content of the template file
 * @param title           - The title of the new file
 *
 * @returns The template content with the variables replaced
 */
export async function replaceTemplateVariables(app: App, templateContent: string, title: string): Promise<string> {
    if (!templateContent) {
        return templateContent;
    }

    let coreTemplatesPluginConfig: CoreTemplatesPluginConfig | null = null;

    try {
        coreTemplatesPluginConfig = await readCoreTemplatesPluginConfig(app);
    } catch (error) {
        console.error(error);
        new Notice("Failed to read template plugin config.");
    }

    let dateFormat = "YYYY-MM-DD";
    let timeFormat = "HH:mm";

    if (coreTemplatesPluginConfig?.timeFormat) {
        timeFormat = coreTemplatesPluginConfig.timeFormat;
    }

    if (coreTemplatesPluginConfig?.dateFormat) {
        dateFormat = coreTemplatesPluginConfig.dateFormat;
    }

    // Handle one-off format strings such as {{date:YYYY-[W]WW}} or {{time:HH}}
    // Docs: https://help.obsidian.md/plugins/templates#Template+variables
    const matches = templateContent.matchAll(/{{(date|time):(.*)}}/g);

    for (const match of matches) {
        const fullMatch = match[0];
        const formatString = match[2];
        templateContent = templateContent.replace(fullMatch, moment().format(formatString));
    }

    templateContent = templateContent.replace(/{{date}}/g, moment().format(dateFormat));
    templateContent = templateContent.replace(/{{time}}/g, moment().format(timeFormat));
    templateContent = templateContent.replace(/{{title}}/g, title);

    return templateContent;
}

export async function readCoreTemplatesPluginConfig(app: App): Promise<CoreTemplatesPluginConfig> {
    const templatesPluginConfigPath = normalizePath(`${app.vault.configDir}/templates.json`);
    const jsonConfig = await app.vault.adapter.read(templatesPluginConfigPath);
    const parsedJson = JSON.parse(jsonConfig) as CoreTemplatesPluginConfig;

    return parsedJson;
}

export function recursivelyFindMarkdownFiles(directory: TFolder): TFile[] {
    const markdownFiles = [];

    for (const child of directory.children) {
        if (child instanceof TFile && "md" === child.extension) {
            markdownFiles.push(child);
        }

        if (child instanceof TFolder) {
            const children = recursivelyFindMarkdownFiles(child);
            markdownFiles.push(...children);
        }
    }

    return markdownFiles;
}

export function weekdayToIsoIndex(weekday: Weekday): number {
    switch (weekday) {
        case "Monday":
            return 1;
        case "Tuesday":
            return 2;
        case "Wednesday":
            return 3;
        case "Thursday":
            return 4;
        case "Friday":
            return 5;
        case "Saturday":
            return 6;
        case "Sunday":
            return 0;
    }
}
