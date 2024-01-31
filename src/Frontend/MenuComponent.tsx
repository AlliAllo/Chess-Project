import React from 'react';
import './CSS/Menu.css';
import pawn from '../Assets/wp.png';
import console from '../Assets/desktop.png';
import playChessIcon from '../Assets/playIcon.svg';
import { useGameContext } from './GameContext'; // Import the context hook
import { GameType } from './ChessBoardComponent';

interface MenuOptions {}

export default function Menu(props: MenuOptions) {
  const { handleGameTypeChange } = useGameContext(); // Access handleGameTypeChange from context

  return (
    <div className="menu">
      <button
        className="menuPlayOnlineButton"
        onClick={() => handleGameTypeChange(GameType.HumanVsHuman)}
      >
        <img src={playChessIcon} alt="chessPawn" className="onlineIcon" />
        <span className="onlineText">Online</span>
      </button>

      <button
        className="menuPlayComputerButton"
        onClick={() => handleGameTypeChange(GameType.HumanVsComputer)}
      >
        <img src={console} alt="Console Logo" className="consoleIcon" />
        <span className="consoleText">Computer</span>
      </button>

      <button
        className="menuPlayComputerButton"
        onClick={() => handleGameTypeChange(GameType.SingleHuman)}
      >
        <img src={pawn} alt="whitePawn" className="consoleIcon" />
        <span className="consoleText">Single Play</span>
      </button>
    </div>
  );
}
