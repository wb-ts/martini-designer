import { CommandRegistry as PhosphorCommandRegistry } from "@phosphor/commands";
import { Menu } from "@phosphor/widgets";
import { debounce } from "lodash";
import messages from "martini-messages/lib/messages";
import * as React from "react";
import { CellProps } from "react-table";
import styled from "styled-components";
import { Icon, OverlayIcon } from "../components/icon-overlay";
import { Loader } from "../components/loader";
import { CellClickEvent, Table, TableColumn } from "../components/table";
import { ApplyMode, ContentProposal, ContentProposalProvider, Selection } from "./content-assist";

export interface ContentAssistPopupProps {
    proposalProviders: ContentProposalProvider[];
    context: {
        selection: Selection;
        target: any;
    };
    defaultSearch?: string;
    searchPlaceholder?: string;
    onSelectionChange?: (proposal?: ContentProposal) => void;
    onApply: (e: ApplyEvent) => void;
    onCancel: () => void;
}

export interface ApplyEvent {
    proposal: ContentProposal,
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
}

interface ContentAssistPopupState {
    search: string;
    proposals: ContentProposal[];
    selectedRow: number;
    applyModes?: ApplyMode[];
    activeApplyMode?: ApplyMode;
    loading: boolean;
}

const Styles = styled.div`
    display: grid;
    grid-row-gap: 0;
    grid-template-rows: max-content 1fr max-content;
    width: 100%;
    height: 100%;
    background-color: var(--theia-editorWidget-background);
    border: 1px solid var(--theia-contrastBorder);
    box-shadow: 0 0px 8px var(--theia-widget-shadow);

    .table {
        .tbody {
            width: 100%;
            height: 100%;

            .td {
                width: 100% !important;
            }
        }
    }

    .no-matches-label {
        text-align: center;
        padding: 10px;
    }

    .footer {
        padding-left: 4px;
        padding-right: 4px;
        font-size: 11px;
        display: grid;
        align-items: center;
        grid-template-columns: 1fr max-content;
        min-height: 20px;
        background-color: var(--theia-titleBar-activeBackground);

        .settings {
            cursor: pointer;
        }
    }
`;

const ContentProposalCell = styled.div`
    display: grid;
    grid-template-columns: max-content 1fr;
    align-items: center;
    padding-left: 2px;
    font-size: 12px;

    > * {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow-x: hidden;
    }
`;

export class ContentAssistPopup extends React.Component<ContentAssistPopupProps, ContentAssistPopupState> {
    private searchSession: number = 0;
    private readonly column: TableColumn = {
        accessor: "label",
        disableResizing: true,
        Cell: props => this.renderProposal(props)
    };
    private readonly currentModifiers = {
        metaKey: false,
        altKey: false,
        shiftKey: false,
        ctrlKey: false
    };
    private sortByName = false;
    private searchInput: HTMLInputElement | null;
    private container: HTMLDivElement | null;
    private settingsMenuOpened = false;
    lock: Promise<void> = Promise.resolve();

    constructor(props: ContentAssistPopupProps) {
        super(props);
        this.state = {
            proposals: [],
            search: this.props.defaultSearch || "",
            selectedRow: -1,
            loading: false,
        };
    }

    componentDidMount() {
        this.container?.addEventListener("focusout", e => this.handleFocusout(e));
        this.searchInput?.focus();
        this.searchInput?.select();
        this.doSearch();
    }

    componentDidUpdate(_: Readonly<ContentAssistPopupProps>, prevState: Readonly<ContentAssistPopupState>) {
        if (prevState.selectedRow !== this.state.selectedRow)
            this.props.onSelectionChange?.(this.state.proposals[this.state.selectedRow]);
    }

    componentWillUnmount() {
        this.search.cancel();
    }

    private handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            ...this.state,
            search: e.target.value
        });
        this.search();
    }

    private readonly search = debounce(() => this.doSearch(), 300);

    private doSearch() {
        if (!this.props.proposalProviders.length)
            return;

        const session = this.searchSession = Date.now();
        const { selection, target } = this.props.context;
        const search = this.state.search.trim().toLowerCase();
        this.setState({
            ...this.state,
            proposals: [],
            selectedRow: -1,
            loading: true
        });
        let acceptCounter = 0;
        const acceptor = async (proposals: ContentProposal[]) => {
            if (session !== this.searchSession)
                return;

            await this.lock;

            this.lock = new Promise(resolve => {
                acceptCounter++;
                const combinedProposals = [...this.state.proposals, ...proposals];
                let sortedProposals: ContentProposal[];

                if (search.length !== 0 && !this.sortByName)
                    sortedProposals = combinedProposals.sort((p1, p2) => (p1.relevance || 0) - (p2.relevance || 0));
                else
                    sortedProposals = combinedProposals.sort((p1, p2) => (p1.sortValue || "").localeCompare(p2.sortValue || ""));

                const selectedRow = sortedProposals.length !== 0 ? 0 : -1;
                const applyModes = this.getApplyModes(sortedProposals[selectedRow]);
                this.setState({
                    ...this.state,
                    selectedRow,
                    proposals: sortedProposals,
                    applyModes,
                    activeApplyMode: this.matchApplyMode(applyModes),
                    loading: !this.state.loading ? false : (acceptCounter !== this.props.proposalProviders.length && proposals.length === 0)
                }, resolve);
            });
        };
        this.props.proposalProviders.forEach(provider => {
            provider.getProposals({
                search,
                target,
                selection
            }, acceptor);
        });
    }

    private getApplyModes(proposal?: ContentProposal): ApplyMode[] {
        if (!proposal || !proposal.getApplyModes)
            return [];
        const { selection, target } = this.props.context;
        return proposal.getApplyModes!(selection, target);
    }

    private matchApplyMode(applyModes: ApplyMode[]): ApplyMode | undefined {
        return applyModes.find(ap => ApplyMode.matches(ap, this.currentModifiers)) || applyModes.find(ap => ApplyMode.noKey(ap));
    }

    private handleGlobalKeyUp(e: React.KeyboardEvent) {
        this.updateModifiers(e);
        if (e.key === "Enter" && this.state.selectedRow >= 0) {
            this.props.onApply({
                proposal: this.state.proposals[this.state.selectedRow],
                altKey: e.altKey,
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                metaKey: e.metaKey
            });
            e.preventDefault();
        }
        else if (e.key === "Escape")
            this.props.onCancel();
        else if (this.searchInput !== document.activeElement && e.key.length === 1) {
            this.setState({
                ...this.state,
                search: this.state.search + e.key
            });
            this.search();
            this.searchInput?.focus();
        }
    }

    private handleGlobalKeyDown(e: React.KeyboardEvent) {
        this.updateModifiers(e);
    }

    private updateModifiers(e: React.KeyboardEvent) {
        const { altKey, metaKey, shiftKey, ctrlKey } = this.currentModifiers;

        if (altKey === e.altKey && metaKey === e.metaKey && shiftKey === e.shiftKey && ctrlKey === e.ctrlKey)
            return;

        Object.assign(this.currentModifiers, {
            altKey: e.altKey,
            metaKey: e.metaKey,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey
        });

        const activeApplyMode = this.matchApplyMode(this.state.applyModes || []);

        this.setState({
            ...this.state,
            activeApplyMode
        });
    }

    private getApplyModeLabel(applyMode: ApplyMode) {
        let label = applyMode.name + " ";

        if (applyMode.metaKey)
            label += PhosphorCommandRegistry.formatKeystroke("Accel");
        if (applyMode.shiftKey)
            label += PhosphorCommandRegistry.formatKeystroke("Shift");
        if (applyMode.altKey)
            label += PhosphorCommandRegistry.formatKeystroke("Alt");
        if (applyMode.ctrlKey)
            label += PhosphorCommandRegistry.formatKeystroke("Ctrl");

        // "+" is appended on linux/windows
        return label.replace("+", "");
    }

    private handleTextInputKeyDown(e: React.KeyboardEvent) {
        if (this.state.proposals.length !== 0 && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
            let index = this.state.selectedRow;

            if (e.key === "ArrowUp")
                index--;
            else
                index++;

            if (index < 0)
                index = this.state.proposals.length - 1;
            else if (index >= this.state.proposals.length)
                index = 0;
            e.preventDefault();
            e.stopPropagation();
            this.handleSelectionChange([index]);
        }
    }

    private handleSelectionChange(selectedRows: number[]) {
        this.setState({
            ...this.state,
            selectedRow: selectedRows[0]
        });
    }

    private handleProposalDoubleClick(e: CellClickEvent) {
        this.props.onApply({
            proposal: e.value,
            altKey: e.mouseEvent.altKey,
            shiftKey: e.mouseEvent.shiftKey,
            ctrlKey: e.mouseEvent.ctrlKey,
            metaKey: e.mouseEvent.metaKey
        });
    }

    private handleSettingsClick(e: React.MouseEvent) {
        const commands = new PhosphorCommandRegistry();
        commands.addCommand("sortByName", {
            label: messages.sort_by_name,
            isToggled: () => this.sortByName,
            execute: async () => {
                this.sortByName = !this.sortByName;
                this.doSearch();
            }
        });
        const menu = new Menu({
            commands
        });
        menu.addItem({
            command: "sortByName"
        });
        menu.aboutToClose.connect(() => {
            this.settingsMenuOpened = false;
            this.searchInput?.focus();
        });
        const bounds = e.currentTarget.getBoundingClientRect();
        this.settingsMenuOpened = true;
        menu.open(bounds.left, bounds.bottom);
    }

    private handleFocusout(e: FocusEvent) {
        if (this.settingsMenuOpened) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    private renderProposal(props: React.PropsWithChildren<CellProps<any, any>>): React.ReactNode {
        const proposal = props.row.original as ContentProposal;
        return <ContentProposalCell>
            <Icon iconClass={proposal.iconClass || ""}>
                {proposal.overlayIcons &&
                    proposal.overlayIcons.map((props, i) => (<OverlayIcon key={i} {...props} />))}
            </Icon>
            {proposal.label}
        </ContentProposalCell>;
    }

    render(): React.ReactNode {
        let body: React.ReactNode;

        if (!this.state.loading && this.state.proposals.length) {
            body = <Table
                columns={[this.column]}
                data={this.state.proposals}
                showTableHeader={false}
                multiSelection={false}
                focusable={true}
                onSelectionChange={rows => this.handleSelectionChange(rows)}
                onCellDoubleClick={e => this.handleProposalDoubleClick(e)}
                selectedRows={[this.state.selectedRow]}
            />;

        }
        else if (!this.props.proposalProviders.length || (!this.state.proposals.length && !this.state.loading))
            body = <div className="no-matches-label">{messages.no_matches}</div>;
        else if (this.state.loading)
            body = <Loader style={{ position: "relative" }} />;

        return <Styles
            onKeyUp={e => this.handleGlobalKeyUp(e)}
            onKeyDown={e => this.handleGlobalKeyDown(e)}
            ref={elem => this.container = elem}
        >
            <input
                type="text"
                className="theia-input"
                placeholder={this.props.searchPlaceholder || messages.search_placeholder}
                value={this.state.search}
                onChange={e => this.handleSearch(e)}
                onKeyDown={e => this.handleTextInputKeyDown(e)}
                ref={elem => this.searchInput = elem}
            />
            {body}
            <div className="footer" onMouseDown={e => e.preventDefault()}>
                <div
                    className="apply-mode"
                    title={this.state.applyModes?.map(ap => this.getApplyModeLabel(ap)).join("\n")}>
                    {this.state.activeApplyMode && messages.add_mode(this.state.activeApplyMode.name)}
                </div>
                <i
                    className="codicon codicon-settings-gear settings"
                    title={messages.settings}
                    onClick={e => this.handleSettingsClick(e)}
                />
            </div>
        </Styles>;
    }
}
