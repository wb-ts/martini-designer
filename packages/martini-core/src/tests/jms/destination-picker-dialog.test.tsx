import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";
import * as React from "react";
import * as Renderer from "react-test-renderer";
import "reflect-metadata";
import { DestinationPicker, DestinationList } from "../../browser/jms/destination-picker-dialog";
import { Destination } from "../../common/jms/martini-broker-manager";

Enzyme.configure({ adapter: new Adapter() });

test("DestinationPicker should be rendered", () => {
    const component = Renderer.create(<DestinationPicker
        destinations={
            [
                "queue://helloWorld",
                "topic://testing",
                "queue://nice"
            ].map(dest => Destination.toDestination(dest)!)
        }
        onChange={() => { }}
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("DestinationPicker should be rendered with default selected destination", () => {
    const component = Renderer.create(<DestinationPicker
        destinations={
            [
                "queue://helloWorld",
                "topic://testing",
                "queue://nice"
            ].map(dest => Destination.toDestination(dest)!)
        }
        selectedDestination={Destination.toDestination("topic://testing")}
        onChange={() => { }}
    />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

describe("When selecting destination source", () => {
    let wrapper: Enzyme.ReactWrapper;

    beforeEach(async () => {
        wrapper = Enzyme.mount(<DestinationPicker
            destinations={
                [
                    "queue://helloWorld",
                    "topic://testing",
                    "queue://nice"
                ].map(dest => Destination.toDestination(dest)!)
            }
            onChange={() => { }}
        />);
    });

    afterEach(() => {
        wrapper.unmount();
    });

    test("Should display destination list when existing source is checked by default", () => {
        expect(wrapper.find(DestinationList).exists()).toBe(true);
    });

    test("Should display the destination name and type when new source is checked", async () => {
        const newRadioBtn = wrapper.find("input[type='radio'][name='create'][value=true]").first();
        expect(newRadioBtn.length).toBe(1);

        expect(wrapper.find(DestinationList).exists()).toBe(true);

        newRadioBtn.simulate("change", {
            target: { checked: true }
        });

        expect(wrapper.find(DestinationList).exists()).toBe(false);
    });
});
