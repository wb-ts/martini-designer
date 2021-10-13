import * as React from "react";
import { BaseDialog, applySize } from "../../../dialogs/dialogs";
import messages from "martini-messages/lib/messages";
import { ListItem, List } from "../../../components/list";
import { HostType } from "./host-type";

export class HostTypeSelectionDialog extends BaseDialog<HostType>{
    value: HostType;

    constructor(private readonly hostTypes: HostType[]) {
        super({
            title: messages.select_host_type_title
        });
        this.value = this.hostTypes[0];
        applySize(this.contentNode, {
            height: 280
        });

        this.appendCloseButton(messages.cancel_btn);
        this.appendAcceptButton(messages.select_btn);
    }

    protected doRender(): React.ReactNode {
        const items: ListItem[] = this.hostTypes && this.hostTypes.map((type, i) => ({
            label: `${type.name}`,
            data: type,
            selected: i === 0
        }));

        return this.hostTypes && <List
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
