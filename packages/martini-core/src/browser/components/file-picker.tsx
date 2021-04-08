import * as React from "react";

export interface FilePickerProps {
    extensions?: string;
    placeholder?: string;
    value?: File | string;
    onChange?: (fileOrUrl: File | string) => void;
}

export const FilePicker: React.FC<FilePickerProps> = ({extensions, placeholder, value, onChange, children}) => {
    const [file, setFile] = React.useState(!value ? "" : value instanceof File ? value.name : value);
    const fileInput = React.useRef<HTMLInputElement>(null);
    const [invalidDrop, setInvalidDrop] = React.useState(false);

    const isValidFile = (file: File) => {
        if (!extensions)
            return true;
        return extensions.split(/,/).some(ext => file.name.endsWith(ext));
    };
    const handleFiles = (files: FileList) => {
        if (files && files.length !== 0) {
            const first = files.item(0);
            if (first && isValidFile(first)) {
                setFile(first.name);
                if (onChange)
                    onChange(first);
                return true;
            }
        }
    };
    const handleFileInputChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files)
            handleFiles(files);
    };
    const handleTextInputChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.value);
        onChange!(e.target.value);
    };

    const handleDrop = (e: React.DragEvent) => {
        if (!handleFiles(e.dataTransfer.files)) {
            e.dataTransfer.dropEffect = "none";
            e.dataTransfer.effectAllowed = "none";
            setInvalidDrop(true);
            setTimeout(() => setInvalidDrop(false), 3000);
        }
    };

    return <div
        style={{display: "grid", gridTemplateColumns: "1fr max-content"}}
        onDrop={handleDrop}>
        <input type="file"
               style={{display: "none"}}
               ref={fileInput}
               accept={extensions}
               onChange={handleFileInputChanged}/>
        <input type="text"
               className="theia-input"
               placeholder={placeholder}
               onChange={handleTextInputChanged}
               style={{border: !invalidDrop ? "" : "var(--theia-border-width) solid var(--theia-errorForeground)"}}
               value={file}/>
        <input type="button"
               className="theia-button"
               value="Browse..."
               onClick={() => fileInput.current && fileInput.current.click()}/>
        {children}
    </div>;
};
