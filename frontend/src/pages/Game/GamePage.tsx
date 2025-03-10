import './Game.css';
import { CSSProperties, useState } from 'react';

const Game = () => {
  const initialCells = Array(100).fill(null);

  const setCell = (x: number, y: number, color: string) => {
    const index = y * 10 + x;
    initialCells[index] = color;
  };

  setCell(4, 4, 'red');
  setCell(5, 5, 'red');
  setCell(4, 5, 'blue'); 
  setCell(5, 4, 'blue'); 

  const [gridCells, setGridCells] = useState(initialCells); 
  const [currentPlayer, setCurrentPlayer] = useState('red');
  const [redCount, setRedCount] = useState(0);
  const [blueCount, setBlueCount] = useState(0);

  const isGameOver = () => redCount + blueCount === 100;

  const handleCellClick = (index: number) => {
    if (gridCells[index] || isGameOver()) return;

    const newCells = [...gridCells];
    newCells[index] = currentPlayer;
    
    if (currentPlayer === 'red') {
      setRedCount(redCount + 1);
    } else {
      setBlueCount(blueCount + 1);
    }

    setGridCells(newCells);
    setCurrentPlayer(currentPlayer === 'red' ? 'blue' : 'red');
  };

  const containerStyle: CSSProperties = {
    width: '60vw',
    height: '95vh',
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)',
    gridTemplateRows: 'repeat(10, 1fr)',
    gap: '0',
    margin: 0,
    padding: 0,
    border: '1px solid #ccc',
    position: 'relative',
    boxSizing: 'border-box'
  };

  return (
    <div className="game-container">
      <div style={containerStyle} className="grid-container">
        {gridCells.map((cell, index) => (
          <div 
            key={index} 
            className="cell" 
            style={{
              cursor: isGameOver() ? 'default' : 'pointer'
            }}
            onClick={() => handleCellClick(index)}
          >
            {cell && ( 
              <div 
                className="circle" 
                style={{ 
                  backgroundColor: cell, 
                  borderColor: cell 
                }} 
              />
            )}
          </div>
        ))}
      </div>
      <div className="scoreboard">
        <div>Ходит: {currentPlayer === 'red' ? 'Красный' : 'Синий'}</div>
        <div>Закрашено: 
          {currentPlayer === 'red' ? redCount : blueCount}
        </div>
      </div>
    </div>
  );
};

export default Game;