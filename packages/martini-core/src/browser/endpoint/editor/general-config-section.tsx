import { Field, useFormikContext } from "formik";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import Collapsible from "react-collapsible";
import * as Yup from "yup";
import { MartiniEndpoint } from "../../../common/endpoint/martini-endpoint-manager";
import { FormErrorMessage, FormErrorMessageWrapper, FormRow } from "../../form/form";
import { BaseDialog, applySize } from "../../dialogs/dialogs";
import { DocumentType } from "../../../common/tracker/document-type-manager";
import { ListItem, List } from "../../components/list";

export const generalSchema = Yup.object().shape<Partial<MartiniEndpoint>>({
    service: Yup.string().required(),
    documentType: Yup.string().required()
});

export interface GeneralConfigurationSectionProps {
    showTrack?: boolean;
    showService?: boolean;
    showDocumentType?: boolean;
    showReplicated?: boolean;
    documentTypeProvider: () => Promise<DocumentType[]>;
}

export const GeneralConfigurationSection: React.FC<GeneralConfigurationSectionProps> = ({
    showTrack = true,
    showService = true,
    showDocumentType = true,
    showReplicated = true,
    documentTypeProvider
}) => {
    const [opened, setOpened] = React.useState(true);
    const handleFocus = () => setOpened(true);
    const context = useFormikContext<MartiniEndpoint>();
    context.touched.service = true;
    context.touched.documentType = true;

    const documentTypeInputRef = React.useRef<HTMLInputElement>();
    const handleBrowseDocumentTypes = async () => {
        const dlg = new DocumentTypeSelectionDialog(documentTypeProvider);
        const docType = await dlg.open();
        if (docType) {
            context.setFieldValue("documentType", docType.id);
            documentTypeInputRef.current?.focus();
        }
    };
    return <Collapsible
        trigger={messages.general_config_title}
        open={opened}
        onClosing={() => setOpened(false)}
        onOpening={() => setOpened(true)}
    >
        <div
            style={{
                display: "grid",
                gridColumnGap: 10,
                gridTemplateColumns: "max-content 1fr",
            }}
            onFocus={handleFocus}
        >
            {showService &&
                <FormRow
                    name="service"
                    label={messages.service_field}
                    tooltip={messages.endpoint_service_tooltip}
                    showErrorMessage={false}
                    gridTemplateColumns="1fr max-content"
                >
                    <Field name="service" type="text" className="theia-input" readOnly={true} />
                    <input
                        type="button"
                        className="theia-button"
                        value={messages.browse_btn}
                    />
                    <FormErrorMessageWrapper>
                        <FormErrorMessage name="service" />
                    </FormErrorMessageWrapper>
                </FormRow>
            }
            {showDocumentType &&
                <FormRow
                    name="documentType"
                    label={messages.document_type_field}
                    tooltip={messages.endpoint_doc_type_tooltip}
                    showErrorMessage={false}
                    gridTemplateColumns="1fr max-content"
                >
                    <Field
                        name="documentType"
                        type="text"
                        className="theia-input"
                        readOnly={true}
                        innerRef={documentTypeInputRef}
                    />
                    <input
                        type="button"
                        className="theia-button"
                        value={messages.browse_btn}
                        onClick={handleBrowseDocumentTypes}
                    />
                    <FormErrorMessageWrapper>
                        <FormErrorMessage name="documentType" />
                    </FormErrorMessageWrapper>
                </FormRow>
            }
            <FormRow
                name="enabled"
                label={messages.auto_start_field}
                tooltip={messages.endpoint_auto_start_tooltip}
            >
                <Field name="enabled" type="checkbox" />
            </FormRow>
            {showTrack &&
                <FormRow
                    name="track"
                    label={messages.log_to_tracker_field}
                    tooltip={messages.endpoint_log_to_tracker_tooltip}
                >
                    <Field name="track" type="checkbox" />
                </FormRow>
            }
            {showReplicated &&
                <FormRow
                    name="replicated"
                    label={messages.replicated_field}
                    tooltip={messages.endpoint_replicated_tooltip}
                >
                    <Field name="replicated" type="checkbox" />
                </FormRow>
            }
        </div>
    </Collapsible>;
};

export class DocumentTypeSelectionDialog extends BaseDialog<DocumentType> {

    value: DocumentType;
    private documentTypes: DocumentType[] = [];

    constructor(documentTypeProvider: () => Promise<DocumentType[]>) {
        super({
            title: messages.select_doc_type_title
        });
        applySize(this.contentNode, {
            height: 200
        });

        this.appendCloseButton(messages.cancel_btn);
        this.appendAcceptButton(messages.select_btn);

        setTimeout(() => {
            this.showProgress(messages.fetching_doc_types, async () => {
                this.documentTypes = await documentTypeProvider();
                this.value = this.documentTypes[0];
            });
        });
    }

    protected doRender(): React.ReactNode {
        const items: ListItem[] = this.documentTypes.map((type, i) => ({
            label: `${type.id} - ${type.name}`,
            data: type,
            selected: i === 0
        }));
        return <List
            items={items}
            filtered={true}
            style={{ height: "100%" }}
            focus={true}
            onSelectionChanged={selection => {
                this.value = selection.data;
                this.validate();
            }}
            onDoubleClick={() => this.accept()}
        />;
    }
}
