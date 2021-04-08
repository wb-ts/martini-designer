import { Theme } from "@theia/core/lib/browser/theming";
import { MonacoThemeRegistry } from "@theia/monaco/lib/browser/textmate/monaco-theme-registry";

const DARK_CSS = require("../../src/browser/style/dark.useable.css");
export const DARK_THEME = MonacoThemeRegistry.SINGLETON.register(
    require("../../src/browser/data/dark_martini.json"),
    {
        "./dark_defaults.json": require("../../src/browser/data/dark_defaults.json"),
        "./dark_vs.json": require("../../src/browser/data//dark_vs.json"),
        "./dark_plus.json": require("../../src/browser/data/dark_plus.json")
    },
    "martini-dark",
    "vs-dark"
).name!;

export class MartiniDarkTheme {
    static readonly dark: Theme = {
        id: "martini-dark-theme",
        type: "dark",
        label: "Martini Dark Theme",
        description: "Martini Dark Theme",
        editorTheme: "martini-dark",
        activate() {
            DARK_CSS.use();
        },
        deactivate() {
            DARK_CSS.unuse();
        }
    };

    static readonly themes: Theme[] = [MartiniDarkTheme.dark];
}
