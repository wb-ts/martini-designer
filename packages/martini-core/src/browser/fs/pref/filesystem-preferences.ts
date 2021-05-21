import {
    createPreferenceProxy,
    PreferenceContribution,
    PreferenceProxy,
    PreferenceSchema,
    PreferenceService
} from "@theia/core/lib/browser";
import { interfaces } from "inversify";
import messages from "martini-messages/lib/messages";

export const fsPreferenceSchema: PreferenceSchema = {
    type: "object",
    properties: {
        "navigator.hideFileExtensions": {
            type: "boolean",
            default: true,
            description: messages.hide_file_extensions_desc
        }
    }
};

export interface FilesystemConfiguration {
    "navigator.hideFileExtensions": boolean;
}

export const FilesystemPreferences = Symbol("FilesystemPreferences");
export type FilesystemPreferences = PreferenceProxy<FilesystemConfiguration>;

export function createFsPreferences(preferences: PreferenceService): FilesystemPreferences {
    return createPreferenceProxy(preferences, fsPreferenceSchema);
}

export function bindFsPreferences(bind: interfaces.Bind): void {
    bind(FilesystemPreferences)
        .toDynamicValue(ctx => {
            const preferences = ctx.container.get<PreferenceService>(PreferenceService);
            return createFsPreferences(preferences);
        })
        .inSingletonScope();
    bind(PreferenceContribution).toConstantValue({ schema: fsPreferenceSchema });
}
