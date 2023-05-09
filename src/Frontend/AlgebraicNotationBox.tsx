import { useMemo } from "react";
import './CSS/NotationBox.css';

interface NotationProps {
    children?: JSX.Element;
    notation?: string;

}

function copyToClipboard(str: string | undefined) {
    if (!str) return;
    
    const el = document.createElement('textarea');
    el.value = str;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }

export default function AlgebraicNotationBox(props: NotationProps) {
    function handleCopy() {
        copyToClipboard(props.notation);
      }

  return (
    <div className="algebraic-notation-box">

      {props.notation }
      <button className="copyButton" onClick={handleCopy}>Copy to Clipboard</button>

    </div>
  );
};

