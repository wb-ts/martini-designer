
import * as React from "react";
import * as Renderer from "react-test-renderer";
import { ContentProposal } from "../../browser/content-assist/content-assist";
import { InfoPopup } from "../../browser/content-assist/info-popup";

test("Should render InfoPopup with proposal information", () => {
    const proposal: ContentProposal = {
        apply: jest.fn(),
        label: "Test",
        get information() {
            return <p>Hello</p>;
        }
    };
    const component = Renderer.create(<InfoPopup
        proposal={proposal}
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});
