import * as React from "react";

export interface TextHighlighterProps {
    /**
     * Boolean which determines if the search should be
     * case sensitive or not. Default is false
     */
    isCaseSensitive?: boolean;
    /**
     * Boolean which determines if the search is global
     * or stops at first occurence. Default is true
     */
    isGlobalSearch?: boolean;
    /**
     * Custom css class for highlighted nodes
     */
    highlightClass?: string;
    /**
     * Custom css class for non highlighted nodes
     */
    className?: string;
    /**
     * Custom css style for highlighted nodes. Default is
     *  `font-weight: bold`
     */
    highlightStyle?: React.CSSProperties;
    /**
     * custom wrap element for non highlighted texts. Default is
     * `span`
     */
    wrapElement?: string;
    /**
     * custom wrap element for highlighted texts. Default is
     * `span`
     */
    highlightWrapElement?: string;

    /**
     * Search string or regex or an array of strings
     */
    search?: string | RegExp | string[];
}

/**
 * This component is used to highlight a search pattern in its children.
 * Port of `react-highlight-textinput`.
 * See https://www.npmjs.com/package/react-highlight-textinput
 */
export class TextHighlighter extends React.Component<TextHighlighterProps> {
    static readonly defaultProps: TextHighlighterProps = {
        isCaseSensitive: false,
        wrapElement: "span",
        highlightWrapElement: "span",
        highlightStyle: { backgroundColor: "var(--theia-list-filterMatchBackground)" },
        isGlobalSearch: true
    };

    /**
     * Renders given text into a span element
     * @param str input string expression to render plain element
     * @param key unique key for the element
     */
    private renderNormal(str: string, key: any): React.ReactNode {
        const props = {
            key,
            className: this.props.className ? this.props.className : null
        };
        const children = str;
        return React.createElement(this.props.wrapElement!, props, children);
    }

    /**
     * Renders given text into a highlighted span element
     * @param str input string expression to render highlighted element
     * @param key unique key for the element
     */
    private renderHighlighted(str: string, key: any) {
        const { highlightClass, highlightStyle } = this.props;
        const props = {
            key,
            className: highlightClass ? highlightClass : null,
            style: !highlightClass ? highlightStyle : {}
        };
        const children = str;
        return React.createElement(this.props.highlightWrapElement!, props, children);

    }

    /**
    * Searches for given expression in a string and render it into a collection of
    * highlighted and plain elements
    * @param text  string expression to search in
    * @param search regular expression to search for
    */
    private highlight(text: string, search: RegExp) {
        const resultHTML = [];
        let key = 0;
        if (!this.props.isGlobalSearch) {
            const matchedArr = search.exec(text);
            if (!matchedArr) {
                resultHTML.push(this.renderNormal(text, key));
                return resultHTML;
            } else {
                const begin = matchedArr.index, end = matchedArr.index + matchedArr[0].length;

                const normal = text.slice(0, begin), highlight = text.slice(begin, end);
                if (normal) { resultHTML.push(this.renderNormal(normal, key)); key++; }
                if (highlight) { resultHTML.push(this.renderHighlighted(highlight, key)); key++; }
                resultHTML.push(this.renderNormal(text.slice(end), key));

            }

            return resultHTML;
        }

        while (text) {
            const matchedArr = search.exec(text);
            if (!matchedArr) {
                resultHTML.push(this.renderNormal(text, key));
                return resultHTML;
            } else {
                const begin = matchedArr.index, end = matchedArr.index + matchedArr[0].length;
                if (begin === 0 && end === 0) {
                    return resultHTML;
                }
                const normal = text.slice(0, begin), highlight = text.slice(begin, end);
                if (normal) { resultHTML.push(this.renderNormal(normal, key)); key++; }
                if (highlight) { resultHTML.push(this.renderHighlighted(highlight, key)); key++; }

                text = text.slice(end);
            }


        }

        return resultHTML;
    }

    /**
     * Recursively parses the html inside parent node and highlights the passed string
     * @param children valid object of children elements of parent node
     * @param search regular expression to search for
     */
    private parseAndHighlight(children: React.ReactElement, search: RegExp): any {
        if (!children) {
            return children;
        }
        return React.Children.map(children, (child, idx) => {

            if (this.isChildrenPrimitive(child)) {
                return this.highlight(child as unknown as string, search);
            } else {
                const chld = child || <React.Fragment />;
                const childOfChild = chld.props && chld.props.children;
                const parsedChildren = this.parseAndHighlight(childOfChild, search);
                return React.cloneElement(chld, chld.props, parsedChildren);
            }
        });

    }

    /**
     * Determines if the children passed are primitives or not
     * @param children child elements
     */
    private isChildrenPrimitive(children: React.ReactNode): boolean {
        return (/string|number|boolean/).test(typeof children);
    }

    /**
     * Get the escaped version of given string
     * @param str Input string for converting into escaped string
     * @return Escaped string
     */
    private escapeString(str: string) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
    * Convert a given seacrh string in the form of a regular expression.
    * @param search search string for converting into RegExp Object
    * @param isEscaped detemines whether the search string is escaped or not
    * @return output RegExp object
    */
    private getSearchRegex(search: string | RegExp, isEscaped: boolean): RegExp {
        if (search instanceof RegExp) {
            return search;
        }
        const escapedSearch = isEscaped ? search : this.escapeString(search);
        const caseSense = this.props.isCaseSensitive ? '' : 'i';
        return new RegExp(escapedSearch, caseSense);
    }


    render() {
        const { search, children } = this.props;
        if (!search) {
            return children;
        }
        let sRegex;
        /**If search prop is an Array then escape each value */
        if (search instanceof Array) {
            const finalStr = search.map(search => this.escapeString(search)).join("|");
            sRegex = this.getSearchRegex(finalStr, true);
        } else {
            sRegex = this.getSearchRegex(search, false);
        }

        /**
         * If childdren of TextHighlighter are not text elements then
         * parse the nodes first
         */
        if (!this.isChildrenPrimitive(children)) {
            if (React.Children.count(children) > 1) {
                console.error("TextHighlighter must contain one wrapper element as a child");
                return;
            } else if (!React.isValidElement(children)) {
                console.error("TextHighlighter does not contain valid react elements");
                return;
            }

            /**the immediate child of TextHighlighter will be considered parent for parsed elements**/
            const parentNode = children;
            /**Parse and highlight search words in children */
            const parsedChildren = this.parseAndHighlight(parentNode.props.children, sRegex);
            /**Clone the parent element */
            const parsedParentNode = React.cloneElement(parentNode, parentNode.props, parsedChildren);
            return (
                <React.Fragment>
                    {
                        parsedParentNode
                    }
                </React.Fragment>

            );

        }

        return <span className="thWrapper">
            {
                this.highlight(this.props.children as string, sRegex)
            }
        </span>;
    }
}
