import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import * as React from "react";
import * as Renderer from "react-test-renderer";
import "reflect-metadata";
import { MessageType, SendJmsMessageForm } from "../../browser/jms/send-jms-message-dialog";

Enzyme.configure({ adapter: new Adapter() });

test("SendJmsMessageForm should be rendered", () => {
    const component = Renderer.create(<SendJmsMessageForm onChange={config => { }} config={{
        destination: "queue://testing",
        message: "Testing!",
        messageType: MessageType.RAW_TEXT,
        messageFileOrUrl: ""
    }} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

describe("When selecting message type", () => {
    let wrapper: Enzyme.ReactWrapper;

    beforeEach(async () => {
        wrapper = Enzyme.mount(<SendJmsMessageForm onChange={config => { }} config={{
            destination: "queue://testing",
            message: "Testing!",
            messageType: MessageType.RAW_TEXT,
            messageFileOrUrl: ""
        }} />);
    });

    afterEach(() => {
        wrapper.unmount();
    });

    test("Should display raw text message", () => {
        expect(wrapper.find("textarea[name='message']")).toHaveLength(1);
    });

    test("Should display file message", () => {
        const messageFileBtn = wrapper.find(`[type='radio'][name='messageType'][value=${MessageType.FILE}]`).first();
        expect(messageFileBtn).toBeTruthy();

        expect(wrapper.find("[type='file']")).toHaveLength(0);
        expect(wrapper.find("textarea[name='message']")).toHaveLength(1);

        messageFileBtn.simulate("change", {
            target: { checked: true }
        });

        expect(wrapper.find("[type='file']")).toHaveLength(1);
        expect(wrapper.find("textarea[name='message']")).toHaveLength(0);
    });
});
