import { SelectionService } from "@theia/core";
import { OpenerService } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { Field, Form, Formik, FormikErrors, FormikProps } from "formik";
import { inject, injectable } from "inversify";
import { noop } from "lodash";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import * as Yup from "yup";
import {
    DatabaseType,
    getTypeLabel, MartiniDatabaseConnectionManager
} from "../../../common/database-connection/martini-database-connection-manager";
import { UpDownLabel } from "../../components/up-down-label";
import { FormEffect, FormRow, OnFormChange, validateSchema } from "../../form/form";
import { Progress } from "../../progress/progress-service";
import { AbstractWizard, AbstractWizardPage, Wizard } from "../../wizard/wizard";
import { WizardContribution } from "../../wizard/wizard-contribution";
import { isDbConnectionSelection } from "../database-connection-contribution";
import { DatabaseConnectionEditor } from "../editor/database-connection-editor";

@injectable()
export class DatabaseConnectionWizardContribution implements WizardContribution {
    @inject(SelectionService)
    private selectionService: SelectionService;
    @inject("Factory<DatabaseConnectionWizard>")
    private factory: () => DatabaseConnectionWizard;

    readonly wizardType = "new";
    readonly id = "database-connection";
    readonly label = messages.database_connection;
    readonly description = messages.create_db_connection;
    readonly iconClass = "martini-icon martini-database-icon";
    readonly keybinding = "ctrlcmd+alt+n d";
    readonly primary = true;

    async createWizard(): Promise<Wizard> {
        return this.factory();
    }

    isVisible() {
        const selection = this.selectionService.selection;
        return isDbConnectionSelection(selection) || (selection instanceof Array && selection[0] === "Databases");
    }

}

@injectable()
export class DatabaseConnectionWizardPage extends AbstractWizardPage {
    existingNames: string[] = [];
    private readonly defaultConfig: DatabaseConnectionConfig = {
        type: DatabaseType.JDBC,
        name: "MyConnection"
    };
    config: DatabaseConnectionConfig = this.defaultConfig;

    render(): React.ReactNode {
        return <CreateDatabaseConnectionForm
            existingNames={this.existingNames}
            defaultConfig={this.defaultConfig}
            onValidate={errors => this.handleValidate(errors)}
            onChange={config => this.handleChange(config)}
        />;
    }

    private handleValidate(errors: FormikErrors<DatabaseConnectionConfig>) {
        this.complete = Object.keys(errors).length === 0;
    }

    private handleChange(config: DatabaseConnectionConfig) {
        this.config = config;
    }
}

export interface DatabaseConnectionConfig {
    type: DatabaseType;
    name: string;
}

export interface CreateDatabaseConnectionFormProps {
    existingNames: string[];
    defaultConfig?: DatabaseConnectionConfig;
    onValidate: (errors: FormikErrors<DatabaseConnectionConfig>) => void;
    onChange: (config: DatabaseConnectionConfig) => void;
}

const databaseConnectionNameRegExp = /^[a-zA-Z0-9\\_-]+$/;

export const CreateDatabaseConnectionForm: React.FC<CreateDatabaseConnectionFormProps> = (
    { existingNames, defaultConfig, onValidate, onChange }) => {

    const schema = React.useMemo(() => Yup.object().shape<Omit<DatabaseConnectionConfig, "type">>({
        name: Yup.string()
            .required()
            .max(30)
            .matches(databaseConnectionNameRegExp, messages.only_alphanumeric)
            .test("unique-name", messages.connection_name_exists, value => !existingNames.includes(value!))
    }), []);
    const validate = (config: DatabaseConnectionConfig) => validateSchema(schema, config, onValidate);

    const handleKeyDown = (e: React.KeyboardEvent, props: FormikProps<DatabaseConnectionConfig>) => {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown")
            return;
        const types = Object.values(DatabaseType);
        let index = types.indexOf(props.values.type);
        if (e.key === "ArrowUp")
            index = index - 1 < 0 ? types.length - 1 : index - 1;
        else if (e.key === "ArrowDown")
            index = index + 1 >= types.length ? 0 : index + 1;
        const type = types[index];
        props.setValues({
            ...props.values,
            type
        });
        e.preventDefault();
    };

    return <Formik
        initialValues={defaultConfig}
        initialTouched={{
            type: true,
            name: true
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
                <FormEffect deps={[existingNames]} />
                <OnFormChange onChange={onChange} />
                <FormRow name="type" label={messages.type}>
                    <Field as="select" name="type" className="theia-select">
                        {Object.values(DatabaseType).map(type => (
                            <option key={type}
                                value={type}>{getTypeLabel(type)}</option>))}
                    </Field>
                </FormRow>
                <FormRow name="name" label={messages.name} gridTemplateColumns="1fr max-content">
                    <Field
                        type="text"
                        name="name"
                        className="theia-input"
                        autoFocus
                        onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e, props)}
                    />
                    <UpDownLabel toolTip={messages.pressing_updown_changes_type} />
                </FormRow>
            </Form>)}
    </Formik>;
};

@injectable()
export class DatabaseConnectionWizard extends AbstractWizard {
    readonly title = messages.create_db_connection_title;

    constructor(
        @inject(MartiniDatabaseConnectionManager)
        private readonly dbConnectionMngr: MartiniDatabaseConnectionManager,
        @inject(DatabaseConnectionWizardPage)
        private readonly page: DatabaseConnectionWizardPage,
        @inject(OpenerService)
        private readonly openerService: OpenerService) {
        super();
        this.pages.push(page);
    }

    async init(progress: Progress): Promise<void> {
        progress.report({
            message: messages.fetching_database_connections
        });
        const connections = await this.dbConnectionMngr.getAll();
        this.page.existingNames = connections.map(c => c.name);
        return super.init(progress);
    }

    async performFinish(): Promise<boolean> {
        const uri: URI = new URI(`${DatabaseConnectionEditor.URI_SCHEME}://${encodeURI(this.page.config.name)}`
            + `?type=${this.page.config.type}&new=true`);
        const handler = await this.openerService.getOpener(uri);
        handler.open(uri);
        return true;
    }

}
