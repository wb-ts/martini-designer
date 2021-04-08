import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import { noop } from "lodash";
import * as React from "react";
import * as Renderer from "react-test-renderer";
import { ContentProposal, ContentProposalProvider } from "../../browser/content-assist/content-assist";
import { ApplyEvent, ContentAssistPopup } from "../../browser/content-assist/content-assist-popup";

Enzyme.configure({ adapter: new Adapter() });

test("Should render ContentAssistPopup", () => {
    const component = Renderer.create(<ContentAssistPopup
        proposalProviders={[]}
        onApply={noop}
        onCancel={noop}
        context={{
            selection: [],
            target: undefined
        }}
        searchPlaceholder="Test..."
        defaultSearch="Test"
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Should call proposal providers on mount", done => {
    const provider: ContentProposalProvider = {
        getProposals: (query) => {
            expect(query.search).toBe("");
            expect(query.selection[0]).toBe("test");
            expect(query.target).toBe("test");
            done();
        }
    };
    Enzyme.mount(<ContentAssistPopup
        proposalProviders={[provider]}
        onApply={noop}
        onCancel={noop}
        context={{
            selection: ["test"],
            target: "test"
        }}
    />);
});

test("Should render proposals on search", async done => {
    const proposals: ContentProposal[] = [{
        label: "Test 1",
        iconClass: "test-icon",
        apply: () => []
    }, {
        label: "Test 2",
        apply: () => []
    }];

    const providerRef: { provider?: ContentProposalProvider; } = {
        provider: undefined
    };

    const popup = Enzyme.mount(<ContentAssistPopup
        proposalProviders={[{
            getProposals: (query, acceptor) => {
                providerRef.provider?.getProposals(query, acceptor);
            }
        }]}
        onApply={noop}
        onCancel={noop}
        context={{
            selection: ["test"],
            target: "test"
        }}
    />);
    const provider: ContentProposalProvider = {
        getProposals: (_, acceptor) => {
            acceptor(proposals);
            (popup.instance() as ContentAssistPopup).lock.then(() => {
                popup.update();
                const wrappers = popup.find(".td");
                expect(wrappers.length).toBe(2);
                expect(wrappers.at(0).text()).toBe("Test 1");
                expect(wrappers.at(0).find(".test-icon").length).toBe(1);
                expect(wrappers.at(1).text()).toBe("Test 2");
                expect(wrappers.at(1).find(".test-icon").length).toBe(0);
                done();
            });
        }
    };
    providerRef.provider = provider;
    popup.find("input").first().simulate("change", {
        target: {
            value: "test"
        }
    });
});

test("Should apply proposals on enter key pressed", done => {
    const proposals: ContentProposal[] = [{
        label: "Test 1",
        apply: () => undefined
    }];

    const providerRef: { provider?: ContentProposalProvider; } = {
        provider: undefined
    };

    const handleApply = (e: ApplyEvent) => {
        expect(e.shiftKey).toBe(true);
        expect(e.proposal.label).toBe("Test 1");
        done();
        return undefined;
    };

    const popup = Enzyme.mount(<ContentAssistPopup
        proposalProviders={[{
            getProposals: (query, acceptor) => {
                providerRef.provider?.getProposals(query, acceptor);
            }
        }]}
        onApply={handleApply}
        onCancel={noop}
        context={{
            selection: ["test"],
            target: "test"
        }}
    />);
    const provider: ContentProposalProvider = {
        getProposals: (_, acceptor) => {
            acceptor(proposals);
            (popup.instance() as ContentAssistPopup).lock.then(() => {
                popup.update();
                const wrapper = popup.find(".td").at(0);
                wrapper.simulate("keyup", {
                    key: "Enter",
                    shiftKey: true
                });
            });
        }
    };
    providerRef.provider = provider;
    popup.find("input").first().simulate("change", {
        target: {
            value: "test"
        }
    });
});

test("Should select proposal on arrow up and down key pressed when input is focused", done => {
    const proposals: ContentProposal[] = [{
        label: "Test 1",
        apply: () => undefined
    }, {
        label: "Test 2",
        apply: () => undefined
    }];

    const providerRef: { provider?: ContentProposalProvider; } = {
        provider: undefined
    };

    const popup = Enzyme.mount(<ContentAssistPopup
        proposalProviders={[{
            getProposals: (query, acceptor) => {
                providerRef.provider?.getProposals(query, acceptor);
            }
        }]}
        onApply={noop}
        onCancel={noop}
        context={{
            selection: ["test"],
            target: "test"
        }}
    />);
    const provider: ContentProposalProvider = {
        getProposals: (_, acceptor) => {
            acceptor(proposals);
            (popup.instance() as ContentAssistPopup).lock.then(() => {
                popup.update();
                const wrapper = popup.find("input").first();
                wrapper.first().simulate("keydown", {
                    key: "ArrowDown"
                });
                expect(popup.state<number>("selectedRow")).toBe(1);
                expect(popup.find(".selected").at(0).text()).toBe("Test 2");
                wrapper.first().simulate("keydown", {
                    key: "ArrowUp"
                });
                expect(popup.state<number>("selectedRow")).toBe(0);
                expect(popup.find(".selected").at(0).text()).toBe("Test 1");
                wrapper.first().simulate("keydown", {
                    key: "ArrowUp"
                });
                expect(popup.state<number>("selectedRow")).toBe(1);
                expect(popup.find(".selected").at(0).text()).toBe("Test 2");
                wrapper.first().simulate("keydown", {
                    key: "ArrowDown"
                });
                expect(popup.state<number>("selectedRow")).toBe(0);
                expect(popup.find(".selected").at(0).text()).toBe("Test 1");
                done();
            });
        }
    };
    providerRef.provider = provider;
    popup.find("input").first().simulate("change", {
        target: {
            value: "test"
        }
    });
});

test("Should cancel on ESC key pressed", done => {
    const handleCancel = () => done();
    const popup = Enzyme.mount(<ContentAssistPopup
        proposalProviders={[]}
        onApply={noop}
        onCancel={handleCancel}
        context={{
            selection: ["test"],
            target: "test"
        }}
    />);
    popup.find("input").first().simulate("keyup", {
        key: "Escape"
    });
});

test("Should update apply mode on modifier pressed", done => {
    const proposals: ContentProposal[] = [{
        label: "Test 1",
        apply: () => undefined,
        getApplyModes: () => [
            {
                name: "No Key"
            },
            {
                name: "Alt Key",
                altKey: true
            },
            {
                name: "Meta Key",
                metaKey: true
            },
            {
                name: "Ctrl Key",
                ctrlKey: true
            },
            {
                name: "Shift Key",
                shiftKey: true
            }]
    },];

    const providerRef: { provider?: ContentProposalProvider; } = {
        provider: undefined
    };

    const popup = Enzyme.mount(<ContentAssistPopup
        proposalProviders={[{
            getProposals: (query, acceptor) => {
                providerRef.provider?.getProposals(query, acceptor);
            }
        }]}
        onApply={noop}
        onCancel={noop}
        context={{
            selection: ["test"],
            target: "test"
        }}
    />);
    const provider: ContentProposalProvider = {
        getProposals: (_, acceptor) => {
            acceptor(proposals);
            (popup.instance() as ContentAssistPopup).lock.then(() => {
                popup.update();
                const wrapper = popup.find("input").first();
                expect(popup.find(".apply-mode").prop("title")?.replace(/\n/g, " ")).toBe(
                    "No Key  Alt Key Alt Meta Key Ctrl Ctrl Key Ctrl Shift Key Shift"
                );
                expect(popup.find(".apply-mode").text()).toBe("Add Mode: No Key");
                wrapper.first().simulate("keydown", {
                    altKey: true,
                    shiftKey: false,
                    metaKey: false,
                    ctrlKey: false
                });
                expect(popup.find(".apply-mode").text()).toBe("Add Mode: Alt Key");
                wrapper.first().simulate("keydown", {
                    altKey: false,
                    shiftKey: true,
                    metaKey: false,
                    ctrlKey: false
                });
                expect(popup.find(".apply-mode").text()).toBe("Add Mode: Shift Key");
                wrapper.first().simulate("keydown", {
                    altKey: false,
                    shiftKey: false,
                    metaKey: true,
                    ctrlKey: false
                });
                expect(popup.find(".apply-mode").text()).toBe("Add Mode: Meta Key");
                wrapper.first().simulate("keydown", {
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    ctrlKey: true
                });
                expect(popup.find(".apply-mode").text()).toBe("Add Mode: Ctrl Key");
                done();
            });
        }
    };
    providerRef.provider = provider;
    popup.find("input").first().simulate("change", {
        target: {
            value: "test"
        }
    });
});
