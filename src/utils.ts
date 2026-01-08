import type { App } from "obsidian";
import { moment } from "obsidian";

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
export async function replaceTemplateVariables(
    app: App,
    templateContent: string,
    title: string,
): Promise<string> {
    if (!templateContent) return templateContent;

    const coreTemplatesConfigPath = `${app.vault.configDir}/templates.json`;

    let coreTemplatesConfig: { dateFormat: string; timeFormat: string };

    try {
        const jsonConfig = await app.vault.adapter.read(coreTemplatesConfigPath);
        coreTemplatesConfig = JSON.parse(jsonConfig);
    } catch (error) {
        console.error(
            `[weekly-notes]: Unable to read core plugin templates config at path: ${coreTemplatesConfigPath}`,
        );
        console.log(error);

        return templateContent;
    }

    let dateFormat = "YYYY-MM-DD";
    let timeFormat = "HH:mm";

    if (coreTemplatesConfig.timeFormat) {
        timeFormat = coreTemplatesConfig.timeFormat;
    }

    if (coreTemplatesConfig.dateFormat) {
        dateFormat = coreTemplatesConfig.dateFormat;
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
