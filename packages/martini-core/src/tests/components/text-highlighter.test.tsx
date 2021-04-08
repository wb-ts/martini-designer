import * as React from "react";
import * as Renderer from "react-test-renderer";
import { TextHighlighter } from "../../browser/components/text-highlighter";

test("Should highlight the text", () => {
    const component = Renderer.create(<TextHighlighter
        search="test"
    >
        This is a test.
    </TextHighlighter>);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

test("Should highlight the text in children elements", () => {
    const component = Renderer.create(<TextHighlighter
        search="null"
    >
        <div>
            <span>Response </span>
            <span>HttpMethods.http</span>
            <span>(</span>
            <span> </span>
            <span>request: </span>
            <span>null</span>
            <span>, </span>
            <span>auth: </span>
            <span>null</span>
            <span>, </span>
            <span>returnAs: </span>
            <span>"String"</span>
            <span>, </span>
            <span>responseType: </span>
            <span>"Auto Detect"</span>
            <span>, </span>
            <span>throwHttpExceptions: </span>
            <span>false</span>
            <span>, </span>
            <span>trackable: </span>
            <span>null</span>
            <span> </span>
            <span>)</span>
            <span> throws </span>
            <span>IOException</span>
        </div>
    </TextHighlighter>);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
});

