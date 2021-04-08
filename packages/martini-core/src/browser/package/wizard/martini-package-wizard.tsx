import { SelectionService } from "@theia/core";
import { Field, Form, Formik, FormikErrors } from "formik";
import { inject, injectable } from "inversify";
import { noop } from "lodash";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import * as Yup from "yup";
import { MartiniPackageCreateConfig, MartiniPackageManager } from "../../../common/package/martini-package-manager";
import { FormEffect, FormRow, OnFormChange, validateSchema } from "../../form/form";
import { Progress } from "../../progress/progress-service";
import { AbstractWizard, AbstractWizardPage, Wizard } from "../../wizard/wizard";
import { WizardContribution } from "../../wizard/wizard-contribution";
import { isPackageSelection } from "../martini-package-contribution";

@injectable()
export class MartiniPackageWizardContribution implements WizardContribution {
    @inject(SelectionService)
    private selectionService: SelectionService;
    @inject("Factory<MartiniPackageWizard>")
    private factory: () => MartiniPackageWizard;

    readonly wizardType = "new";
    readonly id = "martini-package";
    readonly label = messages.martini_package;
    readonly description = messages.create_package;
    readonly iconClass = "martini-icon martini-package-icon";
    readonly keybinding = "ctrlcmd+alt+n p";
    readonly primary = true;

    async createWizard(_: any[]): Promise<Wizard> {
        return this.factory();
    }

    isVisible() {
        return isPackageSelection(this.selectionService.selection);
    }

}

@injectable()
export class MartiniPackageWizard extends AbstractWizard {
    readonly title = messages.create_package_title;
    private page: MartiniPackageWizardPage;
    @inject(MartiniPackageManager)
    private packageManager: MartiniPackageManager;

    initialSize = {
        width: 340
    };

    constructor() {
        super();
        this.pages.push((this.page = new MartiniPackageWizardPage()));
    }

    async init(progress: Progress): Promise<void> {
        await super.init(progress);
        progress.report({
            message: messages.fetching_martini_packages
        });
        const existingNames = (await this.packageManager.getAll()).map(p => p.name);
        this.page.existingNames = existingNames;
    }

    async performFinish(progress: Progress): Promise<boolean> {
        const config = this.page.config;
        if (!config)
            return false;
        await this.createPackage(config, progress);
        return true;
    }

    private async createPackage(config: MartiniPackageCreateConfig, progress: Progress) {
        progress.report({
            message: messages.creating_martini_package(config.name)
        });
        await this.packageManager.create(config);
    }
}

class MartiniPackageWizardPage extends AbstractWizardPage {
    private readonly defaultConfig: MartiniPackageCreateConfig = {
        name: "new-package",
        marketplaceId: "com.company.new-package",
        version: "1.0.0-SNAPSHOT",
        stateOnStartUp: "STARTED"
    };
    config: MartiniPackageCreateConfig = this.defaultConfig;
    existingNames: string[] = [];

    render(): React.ReactNode {
        return (
            <div style={{ flex: 0 }}>
                <CreatePackageForm
                    existingNames={this.existingNames}
                    defaultConfig={this.defaultConfig}
                    onValidate={errors => this.handleValidate(errors)}
                    onChange={config => this.handleChange(config)}
                />
            </div>
        );
    }

    private handleValidate(errors: FormikErrors<MartiniPackageCreateConfig>) {
        this.complete = Object.keys(errors).length === 0;
    }

    private handleChange(config: MartiniPackageCreateConfig) {
        this.config = config;
    }
}

interface CreatePackageFormProps {
    existingNames: string[];
    defaultConfig: MartiniPackageCreateConfig;
    onValidate: (errors: FormikErrors<MartiniPackageCreateConfig>) => void;
    onChange: (config: MartiniPackageCreateConfig) => void;
}

const CreatePackageForm: React.FC<CreatePackageFormProps> = ({
    existingNames,
    defaultConfig,
    onValidate,
    onChange
}) => {
    const schema = React.useMemo(() => Yup.object().shape<MartiniPackageCreateConfig>({
        name: Yup.string()
            .required()
            .matches(packageNameRegExp, messages.only_alphanumeric)
            .test("unique-name", messages.package_name_exists, name => !existingNames.includes(name!)),
        marketplaceId: Yup.string().required().matches(marketplaceIdRegExp, messages.invalid_marketplace_id),
        version: Yup.string().required(),
        stateOnStartUp: Yup.mixed().required().oneOf(["STARTED", "LOADED", "UNLOADED"])
    }), []);

    return (
        <Formik
            initialValues={defaultConfig}
            initialTouched={{
                name: true,
                marketplaceId: true,
                version: true
            }}
            validate={config => validateSchema(schema, config, onValidate)}
            validateOnMount={true}
            onSubmit={noop}
        >
            <Form
                style={{
                    display: "grid",
                    gridColumnGap: 10,
                    gridTemplateColumns: "max-content 1fr"
                }}
            >
                <FormEffect deps={[existingNames]} />
                <OnFormChange onChange={onChange} />
                <FormRow name="name" label={messages.name}>
                    <Field
                        name="name"
                        type="text"
                        className="theia-input"
                        autoFocus
                    />
                </FormRow>
                <FormRow name="marketplaceId" label={messages.marketplace_id}>
                    <Field name="marketplaceId" type="text" className="theia-input" />
                </FormRow>
                <FormRow name="version" label={messages.version}>
                    <Field name="version" type="text" className="theia-input" />
                </FormRow>
                <FormRow name="stateOnStartUp" label={messages.state_on_create}>
                    <Field name="stateOnStartUp" as="select" className="theia-input">
                        <option value="STARTED">{messages.started}</option>
                        <option value="LOADED">{messages.loaded}</option>
                        <option value="UNLOADED">{messages.unloaded}</option>
                    </Field>
                </FormRow>
            </Form>
        </Formik >
    );
};

const packageNameRegExp = /^[\w\d_-]{1,50}$/;
const marketplaceIdRegExp = /^[a-zA-Z][a-zA-Z0-9]+(-[a-zA-Z0-9]+)*(\.[a-zA-Z][a-zA-Z0-9]*(-[a-zA-Z0-9]+)*)*/;
