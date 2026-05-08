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
  const headerButtonStyle: React.CSSProperties = {
    background: "transparent",
    border: 0,
    padding: 0,
    cursor: "pointer",
    display: "block",
    width: "100%",
    textAlign: "left",
  };
  return (
    <span
      className="button button-type-header"
      title={"Header"}
      role="button"
      tabIndex={0}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <i className={`rmel-iconfont rmel-icon-font-size`} />
      {/* @ts-ignore todo */}
      <DropList show={visible} onClose={hide}>
        <ul className="header-list">
          <li className="list-item">
            <button
              type="button"
              style={headerButtonStyle}
              aria-label="Insérer un titre de niveau 2"
              onClick={() => handleHeader("h2")}
            >
              <h2 style={{ margin: 0 }}>H2</h2>
            </button>
          </li>
          <li className="list-item">
            <button
              type="button"
              style={headerButtonStyle}
              aria-label="Insérer un titre de niveau 3"
              onClick={() => handleHeader("h3")}
            >
              <h3 style={{ margin: 0 }}>H3</h3>
            </button>
          </li>
          <li className="list-item">
            <button
              type="button"
              style={headerButtonStyle}
              aria-label="Insérer un titre de niveau 4"
              onClick={() => handleHeader("h4")}
            >
              <h4 style={{ margin: 0 }}>H4</h4>
            </button>
          </li>
          <li className="list-item">
            <button
              type="button"
              style={headerButtonStyle}
              aria-label="Insérer un titre de niveau 5"
              onClick={() => handleHeader("h5")}
            >
              <h5 style={{ margin: 0 }}>H5</h5>
            </button>
          </li>
          <li className="list-item">
            <button
              type="button"
              style={headerButtonStyle}
              aria-label="Insérer un titre de niveau 6"
              onClick={() => handleHeader("h6")}
            >
              <h6 style={{ margin: 0 }}>H6</h6>
            </button>
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
