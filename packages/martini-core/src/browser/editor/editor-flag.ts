import { Widget } from "@theia/core/lib/browser";

export namespace EditorFlag {
    export function flag(object: object) {
        Object.assign(object, {
            editorFlag: true
        });
    }

    export function is(object: any): boolean {
        return (!!object && object.editorFlag) || (object instanceof Widget && object.hasClass("theia-editor"));
    }
}
