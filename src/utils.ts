import { App, TFile, TFolder } from "obsidian";
import { moment, Notice } from "obsidian";

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
        console.debug(coreTemplatesPluginConfig);
    } catch (error) {
        new Notice("Failed to read Template plugin config, but it's ok we'll push through.");
        console.error(`[weekly-notes]: Failed to read core templates plugin config.`);
        console.log(error);
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
    const templatesPluginConfigPath = `${app.vault.configDir}/templates.json`;
    const jsonConfig = await app.vault.adapter.read(templatesPluginConfigPath);
    return JSON.parse(jsonConfig);
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
