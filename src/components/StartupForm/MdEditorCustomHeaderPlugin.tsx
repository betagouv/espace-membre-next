import * as React from "react";
import { useState } from "react";

import { PluginComponent, DropList } from "react-markdown-editor-lite";

interface State {
  show: boolean;
}

// from https://github.com/HarryChen0506/react-markdown-editor-lite/blob/master/src/plugins/header/index.tsx
const Header2Plugin = (props) => {
  const [visible, setVisible] = useState(false);
  const show = () => {
    setVisible(true);
  };
  const hide = () => {
    setVisible(false);
  };
  const handleHeader = (header) => {
    props.handleHeader(header);
  };
  return (
    <span
      className="button button-type-header"
      title={"Header"}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <i className={`rmel-iconfont rmel-icon-font-size`} />
      {/* @ts-ignore todo */}
      <DropList show={visible} onClose={hide}>
        <ul className="header-list">
          <li className="list-item">
            <h2 onClick={() => handleHeader("h2")}>H2</h2>
          </li>
          <li className="list-item">
            <h3 onClick={() => handleHeader("h3")}>H3</h3>
          </li>
          <li className="list-item">
            <h4 onClick={() => handleHeader("h4")}>H4</h4>
          </li>
          <li className="list-item">
            <h5 onClick={() => handleHeader("h5")}>H5</h5>
          </li>
          <li className="list-item">
            <h6 onClick={() => handleHeader("h6")}>H6</h6>
          </li>
        </ul>
      </DropList>
    </span>
  );
};

export class Header extends PluginComponent<State> {
  static pluginName = "header2";

  constructor(props: any) {
    super(props);
  }

  handleHeader(header: string) {
    this.editor.insertMarkdown(header);
  }

  render() {
    return <Header2Plugin handleHeader={this.handleHeader.bind(this)} />;
  }
}

export default Header;
