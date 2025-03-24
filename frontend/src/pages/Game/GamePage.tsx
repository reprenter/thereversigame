import './Game.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

const API_URL = 'http://localhost:8080';

type GameMode = 'bot' | 'human';
type Difficulty = 1 | 2 | 3;

// Направления для проверки ходов
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

// Создаем начальную доску
const createInitialBoard = () => {
  const board = Array(8).fill(null).map(() => Array(8).fill(EMPTY));
  board[3][3] = WHITE;
  board[3][4] = BLACK;
  board[4][3] = BLACK;
  board[4][4] = WHITE;
  return board;
};

// Проверка валидности хода
const isValidMove = (board: number[][], x: number, y: number, player: number): boolean => {
  if (x < 0 || x >= 8 || y < 0 || y >= 8 || board[x][y] !== EMPTY) {
    return false;
  }

  const opponent = player === BLACK ? WHITE : BLACK;
  
  return DIRECTIONS.some(([dx, dy]) => {
    let nx = x + dx;
    let ny = y + dy;
    let foundOpponent = false;

    while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
      if (board[nx][ny] === opponent) {
        foundOpponent = true;
      } else if (board[nx][ny] === player && foundOpponent) {
        return true;
      } else {
        break;
      }
      nx += dx;
      ny += dy;
    }
    return false;
  });
};

// Получение всех возможных ходов
const getValidMoves = (board: number[][], player: number): [number, number][] => {
  const moves: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (isValidMove(board, i, j, player)) {
        moves.push([i, j]);
      }
    }
  }
  return moves;
};

// Выполнение хода с захватом фишек
const makeMove = (board: number[][], x: number, y: number, player: number): number[][] => {
  const newBoard = board.map(row => [...row]);
  newBoard[x][y] = player;
  const opponent = player === BLACK ? WHITE : BLACK;

  DIRECTIONS.forEach(([dx, dy]) => {
    let nx = x + dx;
    let ny = y + dy;
    const toFlip: [number, number][] = [];

    while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
      if (newBoard[nx][ny] === opponent) {
        toFlip.push([nx, ny]);
      } else if (newBoard[nx][ny] === player && toFlip.length > 0) {
        toFlip.forEach(([fx, fy]) => {
          newBoard[fx][fy] = player;
        });
        break;
      } else {
        break;
      }
      nx += dx;
      ny += dy;
    }
  });

  return newBoard;
};

// Конфигурация axios для CORS
axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
axios.defaults.headers.common['Content-Type'] = 'application/json';

const Game = () => {
  const [board, setBoard] = useState<number[][]>(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<number>(BLACK);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('human');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [blackScore, setBlackScore] = useState(2);
  const [whiteScore, setWhiteScore] = useState(2);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);

  useEffect(() => {
    startNewGame();
  }, []);

  useEffect(() => {
    if (board.length > 0) {
      updateScores();
      const moves = getValidMoves(board, currentPlayer);
      setValidMoves(moves);
      
      if (moves.length === 0) {
        const opponentMoves = getValidMoves(board, currentPlayer === BLACK ? WHITE : BLACK);
        if (opponentMoves.length === 0) {
          setGameOver(true);
          if (blackScore > whiteScore) setWinner(BLACK);
          else if (whiteScore > blackScore) setWinner(WHITE);
          else setWinner(0);
        } else {
          setCurrentPlayer(currentPlayer === BLACK ? WHITE : BLACK);
        }
      }
    }
  }, [board, currentPlayer]);

  useEffect(() => {
    if (gameMode === 'bot' && currentPlayer === WHITE && !gameOver) {
      makeBotMove();
    }
  }, [currentPlayer, gameMode, gameOver]);

  const startNewGame = async () => {
    try {
      const response = await axios.post(`${API_URL}/new-game`);
      if (response.data.status === 'ok') {
        setBoard(response.data.board);
        setCurrentPlayer(BLACK);
        setGameOver(false);
        setWinner(null);
      } else {
        setBoard(createInitialBoard());
        setCurrentPlayer(BLACK);
        setGameOver(false);
        setWinner(null);
      }
    } catch (error) {
      console.error('Error starting new game:', error);
      setBoard(createInitialBoard());
      setCurrentPlayer(BLACK);
      setGameOver(false);
      setWinner(null);
    }
  };

  const updateScores = () => {
    let black = 0;
    let white = 0;
    board.forEach(row => {
      row.forEach(cell => {
        if (cell === BLACK) black++;
        if (cell === WHITE) white++;
      });
    });
    setBlackScore(black);
    setWhiteScore(white);
  };

  const makeBotMove = async () => {
    try {
      const response = await axios.post(`${API_URL}/bot-move`, {
        difficulty,
        player: currentPlayer,
        board: board
      });
      
      if (response.data.status === 'ok') {
        setBoard(response.data.board);
        setCurrentPlayer(BLACK);
      }
    } catch (error) {
      console.error('Error making bot move:', error);
      // В случае ошибки сервера, делаем случайный ход
      const moves = getValidMoves(board, currentPlayer);
      if (moves.length > 0) {
        const [x, y] = moves[Math.floor(Math.random() * moves.length)];
        const newBoard = makeMove(board, x, y, currentPlayer);
        setBoard(newBoard);
        setCurrentPlayer(BLACK);
      }
    }
  };

  const handleCellClick = async (x: number, y: number) => {
    if (gameOver || (gameMode === 'bot' && currentPlayer === WHITE)) return;
    
    if (!validMoves.some(([moveX, moveY]) => moveX === x && moveY === y)) return;

    try {
      const response = await axios.post(`${API_URL}/make-move`, {
        x,
        y,
        player: currentPlayer,
        board: board
      });

      if (response.data.status === 'ok') {
        setBoard(response.data.board);
        setCurrentPlayer(currentPlayer === BLACK ? WHITE : BLACK);
      }
    } catch (error) {
      console.error('Error making move:', error);
      // В случае ошибки сервера, используем локальную логику
      const newBoard = makeMove(board, x, y, currentPlayer);
      setBoard(newBoard);
      setCurrentPlayer(currentPlayer === BLACK ? WHITE : BLACK);
    }
  };

  const getCellClassName = (x: number, y: number) => {
    let className = 'cell';
    if (validMoves.some(([moveX, moveY]) => moveX === x && moveY === y)) {
      className += ' valid-move';
    }
    return className;
  };

  return (
    <div className="game-container">
      <div className="game-main">
        <div className="game-controls">
          <div className="mode-selector">
            <button 
              onClick={() => {
                setGameMode('human');
                startNewGame();
              }}
              className={gameMode === 'human' ? 'active' : ''}
            >
              Игра с человеком
            </button>
            <button 
              onClick={() => {
                setGameMode('bot');
                startNewGame();
              }}
              className={gameMode === 'bot' ? 'active' : ''}
            >
              Игра с ботом
            </button>
          </div>
          
          {gameMode === 'bot' && (
            <div className="difficulty-selector">
              <button 
                onClick={() => setDifficulty(1)}
                className={difficulty === 1 ? 'active' : ''}
              >
                Легкий
              </button>
              <button 
                onClick={() => setDifficulty(2)}
                className={difficulty === 2 ? 'active' : ''}
              >
                Средний
              </button>
              <button 
                onClick={() => setDifficulty(3)}
                className={difficulty === 3 ? 'active' : ''}
              >
                Сложный
              </button>
            </div>
          )}
          
          <button onClick={startNewGame} className="new-game-btn">
            Новая игра
          </button>
        </div>

        <div className="game-board">
          {board.map((row, x) => (
            <div key={`row-${x}`} style={{ display: 'contents' }}>
              {row.map((cell, y) => (
                <div 
                  key={`${x}-${y}`}
                  className={getCellClassName(x, y)}
                  onClick={() => handleCellClick(x, y)}
                >
                  {cell !== EMPTY && (
                    <div 
                      className="piece"
                      style={{ backgroundColor: cell === BLACK ? 'black' : 'white' }}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="game-info">
        <div className="scores">
          <div className="score black">Черные: {blackScore}</div>
          <div className="score white">Белые: {whiteScore}</div>
        </div>
        
        <div className="current-player">
          Ход: {currentPlayer === BLACK ? 'Черных' : 'Белых'}
        </div>

        {gameOver && (
          <div className="game-over">
            <h2>Игра окончена!</h2>
            {winner === 0 ? (
              <p>Ничья!</p>
            ) : (
              <p>Победили {winner === BLACK ? 'черные' : 'белые'}!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;