import React from 'react';
import './CSS/Menu.css';
import pawn from '../Assets/wp.png';
import console from '../Assets/desktop.png';
import playChessIcon from '../Assets/playIcon.svg';

interface MenuOptions {
    
}

export default function Menu(props: MenuOptions) {
  return (
    <div className="menu">
        <button className="menuPlayOnlineButton">
            <img src={playChessIcon} alt="chessPawn" className="onlineIcon" />
            <span className='onlineText'>Online</span> 
        </button>
      <button className="menuPlayComputerButton">
            <img src={console} alt="Console Logo" className='consoleIcon'/>
            <span className='consoleText'>Computer</span> 
      </button>

      <button className="menuPlayComputerButton">
            <img src={pawn} alt="whitePawn" className='consoleIcon'/>
            <span className='consoleText'>Idk something</span> 
      </button>
    </div>
  );
};
