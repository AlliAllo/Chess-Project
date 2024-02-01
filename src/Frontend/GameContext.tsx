import React, { createContext, useContext, useState } from 'react';
import { GameType } from './ChessBoardComponent';


interface GameContextProps {
    children?: JSX.Element;
    gameType: GameType;
    handleGameTypeChange: (newGameType: GameType) => void;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [gameType, setGameType] = useState<GameType>(GameType.SingleHuman);

  const handleGameTypeChange = (newGameType: GameType) => {
    setGameType(newGameType);
  };

  const contextValue: GameContextProps = {
    gameType,
    handleGameTypeChange,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = (): GameContextProps => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};
