import { Path } from "@theia/core";
import { Field, Form, Formik, FormikErrors } from "formik";
import { inject, injectable } from "inversify";
import { noop } from "lodash";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import * as Yup from "yup";
import { codeDirRegExp, codeDirResourceRegExp, packageDirRegExp } from "../../../common/fs/file-util";
import { Directory, Resource } from "../../../common/fs/martini-filesystem";
import { UpDownLabel } from "../../components/up-down-label";
import { FormRow, OnFormChange, validateSchemaAsync } from "../../form/form";
import { Progress } from "../../progress/progress-service";
import { AbstractWizard, AbstractWizardPage, Wizard, WizardDialogProps } from "../../wizard/wizard";
import { WizardContribution, WizardType } from "../../wizard/wizard-contribution";
import { FileBrowserDialog, FileBrowserDialogProps } from "../file-browser/file-browser-dialog";
import { ResourceLocationValidator } from "../resource-location-validator";
import { ResourceNameValidator } from "../resource-name-validator";
import { FileWizardHelper } from "./file-wizard-helper";

export interface FileConfig {
    location: string;
    name: string;
}

export interface CreateFileFormProps {
    initialLocation: string;
    initialName: string;
    fileExt: string;
    validateName?: (path: string, name: string) => Promise<true | string>;
    validateLocation?: (parentPath: string) => Promise<true | string>;
    onBrowseLocation?: (location: string) => Promise<string | undefined>;
    onValidate: (config: FileConfig, errors: FormikErrors<FileConfig>) => void;
    onChange: (config: FileConfig) => void;
    nameFieldProps?: NameFieldProps;
}

export interface NameFieldProps {
    onUpDownKey?: (key: "up" | "down") => void;
    upDownLabelTooltip?: string;
}

export const CreateFileForm: React.FC<CreateFileFormProps> = ({
    initialLocation,
    initialName,
    fileExt,
    validateName,
    validateLocation,
    onBrowseLocation,
    onValidate,
    onChange,
    nameFieldProps,
    children
}) => {
    const nameInput = React.useRef<HTMLInputElement>();
    React.useEffect(() => {
        if (nameInput.current) {
            nameInput.current.focus();
            nameInput.current.select();
        }
    }, []);

    const schema = React.useMemo(() => Yup.object().shape<FileConfig>({
        location: Yup.string().required()
            .test("valid-location", "", async function (location) {
                if (!validateLocation || location?.length === 0)
                    return true;
                const result = await validateLocation(location!);
                if (result !== true)
                    return this.createError({ message: result });
                return true;
            }),
        name: Yup.string().required()
            .test("valid-name", "", async function (name) {
                if (!validateName)
                    return true;
                const fullName = fileExt ? name + "." + fileExt : name;
                const result = await validateName(
                    new Path(this.parent.location).toString(),
                    fullName!
                );

                if (result !== true)
                    return this.createError({ message: result });
                return true;
            })
    }), []);

    const validate = async (config: FileConfig) => validateSchemaAsync(schema, config, errors => onValidate(config, errors!));

    return (
        <Formik
            initialValues={{
                location: initialLocation,
                name: initialName
            }}
            initialTouched={{
                location: true,
                name: true
            }}
            validate={validate}
            validateOnMount={true}
            onSubmit={noop}
        >
            {context => {
                const locationInput = React.useRef<HTMLInputElement>();
                const handleBrowse = async () => {
                    if (onBrowseLocation) {
                        const newLocation = await onBrowseLocation(context.values.location);
                        if (newLocation)
                            context.setFieldValue("location", newLocation);
                        locationInput.current?.focus();
                    }
                };

                let locationField: React.ReactNode;

                if (onBrowseLocation) {
                    locationField = <FormRow name="location" label={messages.location} gridTemplateColumns="1fr max-content">
                        <Field name="location" type="text" className="theia-input" innerRef={locationInput} />
                        <input type="button" className="theia-button" value={messages.browse_btn} onClick={handleBrowse} />
                    </FormRow>;
                } else {
                    locationField = <FormRow name="location" label={messages.location}>
                        <Field name="location" type="text" className="theia-input" innerRef={locationInput} />
                    </FormRow>;
                }

                let nameField: React.ReactNode;
                if (nameFieldProps && nameFieldProps.onUpDownKey) {
                    const handleKeyDown = (e: React.KeyboardEvent) => {
                        if (e.key === "ArrowUp") {
                            nameFieldProps.onUpDownKey!("up");
                            e.preventDefault();
                        }
                        else if (e.key === "ArrowDown") {
                            nameFieldProps.onUpDownKey!("down");
                            e.preventDefault();
                        }
                    };
                    nameField = <FormRow name="name" label={messages.name} gridTemplateColumns="1fr max-content">
                        <Field name="name" type="text" className="theia-input"
                            innerRef={nameInput} onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e)} />
                        <UpDownLabel toolTip={nameFieldProps.upDownLabelTooltip || ""} />
                    </FormRow>;
                } else {
                    nameField = <FormRow name="name" label={messages.name}>
                        <Field name="name" type="text" className="theia-input" innerRef={nameInput} />
                    </FormRow>;
                }
                return <Form
                    style={{
                        display: "grid",
                        gridColumnGap: 10,
                        gridTemplateColumns: "max-content 1fr"
                    }}
                >
                    <OnFormChange onChange={onChange} />
                    {locationField}
                    {nameField}
                    {children}
                </Form>;
            }}
        </Formik>
    );
};

export const FileWizardPageProps = Symbol("FileWizardPageProps");

export interface FileWizardPageProps {
    defaultName?: string;
    fileExt?: string;
}

export type FileWizardPageFactory = (props: Partial<FileWizardPageProps>) => FileWizardPage;

@injectable()
export class FileWizardPage extends AbstractWizardPage {
    config: FileConfig;

    @inject("Factory<FileBrowserDialog>")
    protected readonly browseFileDialogFactory: (props: FileBrowserDialogProps) => FileBrowserDialog;
    @inject(ResourceNameValidator)
    protected readonly nameValidator: ResourceNameValidator;
    @inject(ResourceLocationValidator)
    protected readonly locationValidator: ResourceLocationValidator;
    defaultLocation = "";
    protected nameFieldProps: NameFieldProps;

    constructor(
        @inject(FileWizardPageProps)
        protected readonly props: FileWizardPageProps
    ) {
        super();
    }

    render(): React.ReactNode {
        const initialLocation = this.config ? this.config.location : this.defaultLocation || "";
        const initialName = this.config ? this.config.name : this.props.defaultName || "";
        return (
            <CreateFileForm
                initialLocation={initialLocation}
                initialName={initialName}
                fileExt={this.props.fileExt || ""}
                validateName={(parentPath, name) =>
                    this.nameValidator.validate(parentPath, name)}
                validateLocation={location => this.locationValidator.validate(location)}
                onBrowseLocation={location => this.handleBrowserLocation(location)}
                onValidate={(values, errors) => this.handleValidate(values, errors)}
                onChange={config => this.handleChange(config)}
                nameFieldProps={this.nameFieldProps}
            >
                {this.renderChildren()}
            </CreateFileForm>
        );
    }

    protected renderChildren(): React.ReactNode {
        return undefined;
    }

    protected handleValidate(config: FileConfig, errors: FormikErrors<FileConfig>) {
        this.complete = Object.keys(errors).length === 0;
    }

    protected handleChange(config: FileConfig) {
        this.config = config;
    }

    protected async handleBrowserLocation(location: string) {
        return this.browseFileDialogFactory({
            title: messages.select_directory_title,
            resourceFilter: resource => this.filterResource(resource)
        }).open();
    }

    protected filterResource(resource: Resource): boolean {
        return Directory.is(resource) &&
            !codeDirRegExp.test(resource.location) &&
            !codeDirResourceRegExp.test(resource.location);
    }
}

export const DefaultFileWizardProps = Symbol("DefaultFileWizardProps");

export interface DefaultFileWizardProps extends FileWizardPageProps {
    title: string;
    fileContent?: string;
    dir?: boolean;
}

@injectable()
export class DefaultFileWizard extends AbstractWizard {
    @inject(FileWizardHelper)
    protected readonly wizardHelper: FileWizardHelper;
    title = "";

    constructor(
        @inject(DefaultFileWizardProps)
        protected readonly props: DefaultFileWizardProps,
        @inject(FileWizardPage)
        protected readonly page: FileWizardPage) {
        super();
        this.title = this.props.title;
        this.pages.push(page);
    }

    async init(progress: Progress): Promise<void> {
        this.page.defaultLocation = this.wizardHelper.getTargetDirectoryPath() ||
            await this.wizardHelper.getDefaultTargetDirectory() || "";
        return super.init(progress);
    }

    async performFinish(progress: Progress): Promise<boolean> {
        progress.report({
            message: messages.creating_file
        });
        const config = this.page.config;
        if (!config)
            return false;
        if (this.props.dir !== undefined && this.props.dir)
            return await this.createDir(config);
        return await this.createFile(config, this.getFileContent(config));
    }

    protected async createDir(config: FileConfig): Promise<boolean> {
        await this.wizardHelper.makeDir(config.location, config.name);
        return true;
    }

    protected async createFile(config: FileConfig, content: string): Promise<boolean> {
        await this.wizardHelper.createFile(
            config.location,
            config.name + (this.props.fileExt ? "." + this.props.fileExt : ""),
            content);
        return true;
    }

    protected getFileContent(config: FileConfig): string {
        return this.props.fileContent || "";
    }
}

export class CodeFileWizardPage extends FileWizardPage {
    protected filterResource(resource: Resource): boolean {
        return Directory.is(resource) &&
            (codeDirRegExp.test(resource.location) ||
                codeDirResourceRegExp.test(resource.location));
    }
}

export type DefaultFileWizardFactory = (props: Partial<DefaultFileWizardProps>) => DefaultFileWizard;

@injectable()
export class DefaultCodeFileWizard extends DefaultFileWizard {

    constructor(
        @inject(DefaultFileWizardProps)
        protected readonly props: DefaultFileWizardProps,
        @inject(CodeFileWizardPage)
        protected readonly page: CodeFileWizardPage) {
        super(props, page);
    }

    async init(progress: Progress): Promise<void> {
        await super.init(progress);
        if (packageDirRegExp.test(this.page.defaultLocation))
            this.page.defaultLocation += "/code";
    }
}

export type DefaultCodeFileWizardFactory = (props: Partial<DefaultFileWizardProps>) => DefaultCodeFileWizard;

export interface CodeFileWizardContributionProps {
    title: string;
    defaultName: string;
    fileExt: string;
}

@injectable()
export abstract class AbstractCodeFileWizardContribution implements WizardContribution {
    static readonly DEFAULT_PROPS: WizardDialogProps = {
        acceptLabel: messages.create
    };

    @inject(FileWizardHelper)
    protected readonly wizardHelper: FileWizardHelper;
    @inject("Factory<DefaultCodeFileWizard>")
    protected readonly fileWizardFactory: DefaultCodeFileWizardFactory;

    id: string;
    label: string;
    wizardType: WizardType;

    async createWizard(...args: any[]): Promise<Wizard> {
        return this.fileWizardFactory(this.getFileWizardProps());
    }

    protected getFileWizardProps(): DefaultFileWizardProps {
        return {
            title: messages.create_file_title
        };
    }

    isVisible() {
        const targetDirectoryPath = this.wizardHelper.getTargetDirectoryPath();
        return targetDirectoryPath !== undefined &&
            (codeDirRegExp.test(targetDirectoryPath) ||
                codeDirResourceRegExp.test(targetDirectoryPath) ||
                packageDirRegExp.test(targetDirectoryPath));
    }
}
