import { CommandRegistry } from "@phosphor/commands";
import { Menu } from "@phosphor/widgets";
import { SingleTextInputDialog } from "@theia/core/lib/browser";
import * as React from "react";
import { isValidUrl } from "../../common/fs/file-util";

export interface ImportButtonProps {
    onFileImport?: (file: File) => void;
    onUrlImport?: (url: string) => void;
    extensions?: string;
}

export const ImportButton: React.FC<ImportButtonProps> = ({ onFileImport, onUrlImport, extensions }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
        const commands = new CommandRegistry();
        if (onFileImport) {
            commands.addCommand("fromFile", {
                label: "From File",
                execute: () => {
                    fileInputRef.current?.click();
                }
            });
        }

        if (onUrlImport) {
            commands.addCommand("fromUrl", {
                label: "From URL",
                execute: async () => {
                    const dlg = new SingleTextInputDialog({
                        title: "Enter a URL",
                        confirmButtonLabel: "Import",
                        validate: (url: string) => {
                            if (!isValidUrl(url))
                                return "Not a valid URL.";
                            return true;
                        }
                    });
                    const result = await dlg.open();
                    if (result) onUrlImport(result);
                }
            });
        }
        const menu = new Menu({
            commands
        });
        if (onFileImport)
            menu.addItem({
                command: "fromFile"
            });
        if (onUrlImport)
            menu.addItem({
                command: "fromUrl"
            });
        const bounds = e.currentTarget.getBoundingClientRect();
        menu.open(bounds.left, bounds.bottom);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length !== 0) {
            const first = files.item(0);
            if (first) onFileImport!(first);
        }
    };

    return <div>
        <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept={extensions}
            onChange={handleFileInput}
        />
        <input
            type="button"
            className="theia-button"
            style={{ marginLeft: 0 }}
            value="Import..."
            onClick={handleClick} />
    </div>;
};
