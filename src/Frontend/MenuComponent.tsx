import React from 'react';
import './CSS/Menu.css';
import pawn from '../Assets/wp.png';
import console from '../Assets/desktop.png';
import playChessIcon from '../Assets/playIcon.svg';
import { useGameContext } from './GameContext';
import { GameType } from './ChessBoardComponent';
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';

interface MenuOptions {}

interface DecodedToken {
  email: string;
  name?: string;
  sub: string;
}

export default function Menu(props: MenuOptions) {
  const { handleGameTypeChange } = useGameContext();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const isSignedIn = !!token;

  let username: string | null = null;
  if (token) {
    try {
      const decoded: DecodedToken = jwtDecode(token);
      username = decoded.name || decoded.sub;
    } catch {
      username = null;
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/"); // redirect to home or login page
  };

  return (
    <div className="menu">
      <button
        className="defaultMenuButton"
        onClick={() => handleGameTypeChange(GameType.HumanVsHuman)}
      >
        <img src={playChessIcon} alt="chessPawn" className="onlineIcon" />
        <span className="onlineText">Online</span>
      </button>

      <button
        className="defaultMenuButton"
        onClick={() => handleGameTypeChange(GameType.HumanVsComputer)}
      >
        <img src={console} alt="Console Logo" className="consoleIcon" />
        <span className="consoleText">Computer</span>
      </button>

      <button
        className="defaultMenuButton"
        onClick={() => handleGameTypeChange(GameType.SingleHuman)}
      >
        <img src={pawn} alt="whitePawn" className="consoleIcon" />
        <span className="consoleText">Single Play</span>
      </button>

      <div className="authButtons">
      {!isSignedIn ? (
        <>
          <button
            className="signUpButton"
            onClick={() => navigate("/signup")}
          >
            <div className="signUpText">Sign Up</div>
          </button>

          <button
            className="loginButtonMenu"
            onClick={() => navigate("/login")}
          >
            <div className="loginText">Login</div>
          </button>
        </>
      ) : (
        <>
          {username && <span className="usernameDisplay">Hi, {username}!</span>}
          <button className="logoutButton" onClick={handleLogout}>
            Logout
          </button>
        </>
      )}
      </div>
    </div>

    
  );
}
