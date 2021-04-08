import * as React from "react";
import * as Renderer from "react-test-renderer";
import { PropertyTable } from "../../../browser/properties-view/table/property-table";
import { PropertyDescriptor } from "../../../browser/properties-view/table/property-descriptor";

const descriptors: PropertyDescriptor[] = [
    {
        name: "firstName",
        displayName: "First Name",
        description: "It's the first name, duh!",
        value: "John",
        defaultValue: "Jean",
        hasDefaultValue: true,
        target: {},
        readOnly: false
    },
    {
        name: "lastName",
        displayName: "Last Name",
        description: "C'mon, it's the last name, dude...",
        value: "Doe",
        target: {},
        readOnly: false
    },
    {
        name: "age",
        displayName: "Age",
        description: "C'est l'age, idiot.",
        value: 30,
        target: {},
        readOnly: true
    }
];

test("PropertyTable should be rendered with the descriptors", () => {
    const component = Renderer.create(
        <PropertyTable descriptors={descriptors} onApply={() => { }} />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("PropertyTable should be rendered without descriptors", () => {
    const component = Renderer.create(
        <PropertyTable descriptors={[]} onApply={() => { }} />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});
