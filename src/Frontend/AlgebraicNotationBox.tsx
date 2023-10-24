import './CSS/NotationBox.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy } from '@fortawesome/free-solid-svg-icons'

interface NotationProps {
    children?: JSX.Element;
    notation?: string;

}

function copyToClipboard(str: string | undefined) {
    if (!str) return;
    
    navigator.clipboard.writeText(str);


  }

export default function AlgebraicNotationBox(props: NotationProps) {
    function handleCopy() {
        copyToClipboard(props.notation);
      }

  return (
    <div className="algebraic-notation-box">
      {props.notation }

      <FontAwesomeIcon size={"xl"} className='copyButton'  onClick={handleCopy} icon={faCopy} />


    </div>
  );
};

