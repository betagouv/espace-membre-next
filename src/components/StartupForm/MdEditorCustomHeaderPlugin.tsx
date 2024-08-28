import * as React from "react";

import { PluginComponent, DropList } from "react-markdown-editor-lite";

interface State {
    show: boolean;
}

export default class Header extends PluginComponent<State> {
    static pluginName = "header2";

    constructor(props: any) {
        super(props);

        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);

        this.state = {
            show: false,
        };
    }

    private show() {
        this.setState({
            show: true,
        });
    }

    private hide() {
        this.setState({
            show: false,
        });
    }
    onSelectHeader?: (header: string) => void;
    handleHeader(header: string) {
        this.editor.insertMarkdown(header);
    }

    render() {
        return (
            <span
                className="button button-type-header"
                title={"Header"}
                onMouseEnter={this.show}
                onMouseLeave={this.hide}
            >
                <i className={`rmel-iconfont rmel-icon-font-size`} />
                <DropList show={this.state.show} onClose={this.hide}>
                    <ul className="header-list">
                        <li className="list-item">
                            <h2 onClick={this.handleHeader.bind(this, "h2")}>
                                H2
                            </h2>
                        </li>
                        <li className="list-item">
                            <h3 onClick={this.handleHeader.bind(this, "h3")}>
                                H3
                            </h3>
                        </li>
                        <li className="list-item">
                            <h4 onClick={this.handleHeader.bind(this, "h4")}>
                                H4
                            </h4>
                        </li>
                        <li className="list-item">
                            <h5 onClick={this.handleHeader.bind(this, "h5")}>
                                H5
                            </h5>
                        </li>
                        <li className="list-item">
                            <h6 onClick={this.handleHeader.bind(this, "h6")}>
                                H6
                            </h6>
                        </li>
                    </ul>
                </DropList>
            </span>
        );
    }
}
