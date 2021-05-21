import { SelectionService } from "@theia/core";
import { OpenerService } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { Field, Form, Formik, FormikErrors, FormikProps } from "formik";
import { inject, injectable, postConstruct } from "inversify";
import { flatten, noop } from "lodash";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import * as Yup from "yup";
import { EndpointType, getDisplayName, MartiniEndpoint, MartiniEndpointManager } from "../../../common/endpoint/martini-endpoint-manager";
import { MartiniPackageManager, PartialMartiniPackage } from "../../../common/package/martini-package-manager";
import { UpDownLabel } from "../../components/up-down-label";
import { FormEffect, FormRow, OnFormChange, validateSchema } from "../../form/form";
import { Progress } from "../../progress/progress-service";
import { AbstractWizard, AbstractWizardPage, Wizard } from "../../wizard/wizard";
import { WizardContribution } from "../../wizard/wizard-contribution";
import { EndpointEditor } from "../editor/endpoint-editor";
import { isEndpointSelection } from "../endpoint-contribution";
import { EndpointListTreeNode } from "../endpoint-navigator-contribution";

@injectable()
export class EndpointWizardContribution implements WizardContribution {
    @inject(SelectionService)
    private selectionService: SelectionService;
    @inject("Factory<EndpointWizard>")
    private factory: () => EndpointWizard;

    readonly wizardType = "new";
    readonly id = "martini-endpoint";
    readonly label = messages.endpoint;
    readonly description = messages.create_endpoint;
    readonly iconClass = "martini-icon martini-endpoint-icon";
    readonly keybinding = "ctrlcmd+alt+n e";
    readonly primary = true;
    readonly menuGroup = "11_package";

    async createWizard(..._: any[]): Promise<Wizard> {
        return this.factory();
    }

    isVisible() {
        const selection = this.selectionService.selection;
        return isEndpointSelection(selection) ||
            (selection instanceof Array &&
                (EndpointListTreeNode.is(selection[0]) ||
                    (PartialMartiniPackage.is(selection[0]) && selection[0].name !== "core")));
    }

}

@injectable()
export class EndpointWizardPage extends AbstractWizardPage {
    @inject(SelectionService)
    private readonly selectionService: SelectionService;
    packageNames: string[] = [];
    existingNames: string[] = [];
    private readonly defaultConfig: EndpointConfig = {
        type: EndpointType.DIR_WATCHER,
        name: "MyEndpoint",
        packageName: "",
    };
    config: EndpointConfig = this.defaultConfig;
    private _existingEndpoints: MartiniEndpoint[] = [];

    @postConstruct()
    protected init() {
        const selection = this.selectionService.selection;
        if (isEndpointSelection(selection)) {
            this.defaultConfig.type = selection[0].type;
            this.defaultConfig.packageName = selection[0].packageName;
        }
        else if (selection instanceof Array) {
            if (EndpointListTreeNode.is(selection[0]))
                this.defaultConfig.packageName = selection[0].martiniPackage.name;
            else if (PartialMartiniPackage.is(selection[0]))
                this.defaultConfig.packageName = selection[0].name;
        }
    }

    render(): React.ReactNode {
        return <CreateEndpointForm
            packageNames={this.packageNames}
            existingNames={this.existingNames}
            defaultConfig={this.defaultConfig}
            onValidate={errors => this.handleValidate(errors)}
            onChange={config => this.handleChange(config)}
        />;
    }

    set existingEndpoints(existingEndpoints: MartiniEndpoint[]) {
        this._existingEndpoints = existingEndpoints;
        this.existingNames = this._existingEndpoints
            .filter(e => e.packageName === this.config.packageName)
            .map(e => e.name);
    }

    private handleValidate(errors: FormikErrors<EndpointConfig>) {
        this.complete = Object.keys(errors).length === 0;
    }

    private handleChange(config: EndpointConfig) {
        const oldPackageName = this.config.packageName;
        this.config = config;
        if (oldPackageName !== config.packageName) {
            this.existingNames = this._existingEndpoints
                .filter(e => e.packageName === config.packageName)
                .map(e => e.name);
            this.onUpdateEmitter.fire();
        }
    }
}

export interface EndpointConfig {
    type: EndpointType;
    name: string;
    packageName: string;
}

export interface CreateEndpointFormProps {
    packageNames: string[];
    existingNames: string[];
    defaultConfig?: EndpointConfig;
    onValidate: (errors: FormikErrors<EndpointConfig>) => void;
    onChange: (config: EndpointConfig) => void;
}

const endpointNameRegExp = /^[a-zA-Z0-9\\_-]+$/;

export const CreateEndpointForm: React.FC<CreateEndpointFormProps> = (
    { packageNames, existingNames, defaultConfig, onValidate, onChange }) => {

    const schema = React.useMemo(() => Yup.object().shape<Omit<EndpointConfig, "type" | "packageName">>({
        name: Yup.string()
            .required()
            .max(50)
            .matches(endpointNameRegExp, messages.only_alphanumeric)
            .test("unique-name", messages.endpoint_name_exists, value => !existingNames.includes(value!))
    }), []);
    const validate = (config: EndpointConfig) => validateSchema(schema, config, onValidate);

    const handleKeyDown = (e: React.KeyboardEvent, props: FormikProps<EndpointConfig>) => {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown")
            return;
        const elements = e.altKey ? packageNames : Object.values(EndpointType);
        let index = elements.indexOf(e.altKey ? props.values.packageName : props.values.type);
        if (e.key === "ArrowUp")
            index = index - 1 < 0 ? elements.length - 1 : index - 1;
        else if (e.key === "ArrowDown")
            index = index + 1 >= elements.length ? 0 : index + 1;
        const selected = elements[index];
        if (e.altKey) {
            props.setValues({
                ...props.values,
                packageName: selected
            });
        }
        else {
            props.setValues({
                ...props.values,
                type: selected as EndpointType
            });
        }
        e.preventDefault();
    };

    return <Formik
        initialValues={defaultConfig}
        initialTouched={{
            type: true,
            name: true,
            packageName: true
        }}
        validate={validate}
        validateOnMount={true}
        onSubmit={noop}
    >
        {props => (
            <Form style={{
                display: "grid",
                gridColumnGap: 10,
                gridTemplateColumns: "max-content 1fr"
            }}>
                <OnFormChange onChange={onChange} />
                <FormEffect deps={[existingNames]} />
                <FormRow name="packageName" label={messages.package}>
                    <Field as="select" name="packageName" className="theia-select">
                        {packageNames.sort().map(name => <option key={name} value={name}>{name}</option>)}
                    </Field>
                </FormRow>
                <FormRow name="type" label={messages.type}>
                    <Field as="select" name="type" className="theia-select">
                        {Object.values(EndpointType).sort().map(type => (
                            <option key={type}
                                value={type}>{getDisplayName(type)}</option>))}
                    </Field>
                </FormRow>
                <FormRow name="name" label={messages.name} gridTemplateColumns="1fr max-content">
                    <Field
                        type="text"
                        name="name"
                        className="theia-input"
                        autoFocus
                        onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e, props)} />
                    <UpDownLabel
                        toolTip={messages.pressing_updown_changes_package_or_type} />
                </FormRow>
            </Form>)}
    </Formik>;
};

@injectable()
export class EndpointWizard extends AbstractWizard {
    readonly title = messages.create_endpoint_title;

    initialSize = {
        width: 340
    };

    constructor(
        @inject(EndpointWizardPage)
        private readonly page: EndpointWizardPage,
        @inject(MartiniPackageManager)
        private readonly packageManager: MartiniPackageManager,
        @inject(MartiniEndpointManager)
        private readonly endpointManager: MartiniEndpointManager,
        @inject(OpenerService)
        private readonly openerService: OpenerService
    ) {
        super();
        this.pages.push(page);
    }

    async init(progress: Progress): Promise<void> {
        progress.report({
            message: messages.fetching_martini_packages
        });
        const packages = await this.packageManager.getAll();
        progress.report({
            message: messages.fetching_endpoints
        });
        const endpoints = flatten<MartiniEndpoint>(await Promise.all(
            packages.map(pckage => this.endpointManager.getAll(pckage.name))
        ));
        this.page.existingEndpoints = endpoints;
        this.page.packageNames = packages.filter(pckage => pckage.name !== 'core').map(pckage => pckage.name);
        return super.init(progress);
    }

    async performFinish(): Promise<boolean> {
        const uri: URI = new URI(`${EndpointEditor.URI_SCHEME}://${encodeURI(this.page.config.packageName)}/${encodeURI(this.page.config.name)}`
            + `?type=${this.page.config.type}&new=true`);
        const handler = await this.openerService.getOpener(uri);
        handler.open(uri);
        return true;
    }

}
