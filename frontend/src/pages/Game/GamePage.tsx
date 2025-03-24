import './Game.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

const API_URL = 'http://localhost:8080';

type GameMode = 'human' | 'bot' | 'bot-vs-bot';
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
  const [showInfo, setShowInfo] = useState(false);
  const [moveHistory, setMoveHistory] = useState<number[][][]>([]);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);

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
    if (gameMode === 'bot-vs-bot' && !gameOver) {
      makeBotMove();
    } else if (gameMode === 'bot' && currentPlayer === WHITE && !gameOver) {
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
        setMoveHistory([]);
        setIsReviewMode(false);
        setCurrentMoveIndex(-1);
      } else {
        setBoard(createInitialBoard());
        setCurrentPlayer(BLACK);
        setGameOver(false);
        setWinner(null);
        setMoveHistory([]);
        setIsReviewMode(false);
        setCurrentMoveIndex(-1);
      }
    } catch (error) {
      console.error('Error starting new game:', error);
      setBoard(createInitialBoard());
      setCurrentPlayer(BLACK);
      setGameOver(false);
      setWinner(null);
      setMoveHistory([]);
      setIsReviewMode(false);
      setCurrentMoveIndex(-1);
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

  const undoMove = () => {
    if (moveHistory.length > 0) {
      setIsReviewMode(true);
      const newIndex = currentMoveIndex - 1;
      if (newIndex >= -1) {
        setCurrentMoveIndex(newIndex);
        if (newIndex === -1) {
          setBoard(createInitialBoard());
        } else {
          setBoard(moveHistory[newIndex]);
        }
      }
    }
  };

  const redoMove = () => {
    if (currentMoveIndex < moveHistory.length - 1) {
      const newIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(newIndex);
      setBoard(moveHistory[newIndex]);
    } else if (currentMoveIndex === moveHistory.length - 1) {
      setIsReviewMode(false);
    }
  };

  const makeBotMove = async () => {
    setIsBotThinking(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Задержка 1 секунда
    
    try {
      const response = await axios.post(`${API_URL}/bot-move`, {
        difficulty,
        player: currentPlayer,
        board: board
      });
      
      if (response.data.status === 'ok') {
        setMoveHistory([...moveHistory, board]);
        setBoard(response.data.board);
        setCurrentPlayer(currentPlayer === BLACK ? WHITE : BLACK);
      }
    } catch (error) {
      console.error('Error making bot move:', error);
      const moves = getValidMoves(board, currentPlayer);
      if (moves.length > 0) {
        const [x, y] = moves[Math.floor(Math.random() * moves.length)];
        const newBoard = makeMove(board, x, y, currentPlayer);
        setMoveHistory([...moveHistory, board]);
        setBoard(newBoard);
        setCurrentPlayer(currentPlayer === BLACK ? WHITE : BLACK);
      }
    } finally {
      setIsBotThinking(false);
    }
  };

  const handleCellClick = async (x: number, y: number) => {
    if (gameOver || isReviewMode || (gameMode !== 'human' && currentPlayer === WHITE)) return;
    
    if (!validMoves.some(([moveX, moveY]) => moveX === x && moveY === y)) return;

    try {
      const response = await axios.post(`${API_URL}/make-move`, {
        x,
        y,
        player: currentPlayer,
        board: board
      });

      if (response.data.status === 'ok') {
        setMoveHistory([...moveHistory, board]);
        setBoard(response.data.board);
        setCurrentPlayer(currentPlayer === BLACK ? WHITE : BLACK);
      }
    } catch (error) {
      console.error('Error making move:', error);
      const newBoard = makeMove(board, x, y, currentPlayer);
      setMoveHistory([...moveHistory, board]);
      setBoard(newBoard);
      setCurrentPlayer(currentPlayer === BLACK ? WHITE : BLACK);
    }
  };

  const getCellClassName = (x: number, y: number) => {
    let className = 'cell';
    if (validMoves.some(([moveX, moveY]) => moveX === x && moveY === y)) {
      className += ' valid-move';
      // Добавляем класс для выгодных ходов
      const moveScore = calculateMoveScore(board, x, y, currentPlayer);
      if (moveScore >= 3) {
        className += ' good-move';
      }
    }
    return className;
  };

  // Функция для расчета выгодности хода
  const calculateMoveScore = (board: number[][], x: number, y: number, player: number): number => {
    const newBoard = makeMove(board, x, y, player);
    let score = 0;
    
    // Подсчитываем количество захваченных фишек
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (newBoard[i][j] === player && board[i][j] !== player) {
          score++;
        }
      }
    }
    
    return score;
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
            <button 
              onClick={() => {
                setGameMode('bot-vs-bot');
                startNewGame();
              }}
              className={gameMode === 'bot-vs-bot' ? 'active' : ''}
            >
              Бот против бота
            </button>
          </div>
          
          {(gameMode === 'bot' || gameMode === 'bot-vs-bot') && (
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
          
          <div className="game-actions">
            <button onClick={startNewGame} className="new-game-btn">
              Новая игра
            </button>
            {moveHistory.length > 0 && (
              <>
                <button 
                  onClick={undoMove} 
                  className="undo-btn"
                  disabled={isReviewMode && currentMoveIndex === -1}
                >
                  Ход назад
                </button>
                {isReviewMode && (
                  <button 
                    onClick={redoMove} 
                    className="redo-btn"
                    disabled={currentMoveIndex >= moveHistory.length - 1}
                  >
                    Ход вперед
                  </button>
                )}
              </>
            )}
          </div>
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
        <button 
          className="info-button"
          onClick={() => setShowInfo(true)}
        >
          i
        </button>

        <div className="scores">
          <div className="score black">Черные: {blackScore}</div>
          <div className="score white">Белые: {whiteScore}</div>
        </div>
        
        <div className="current-player">
          {isBotThinking ? (
            <div className="thinking">Бот думает...</div>
          ) : isReviewMode ? (
            <div className="review-mode">Режим просмотра</div>
          ) : (
            <div>Ход: {currentPlayer === BLACK ? 'Черных' : 'Белых'}</div>
          )}
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

      {showInfo && (
        <div className="modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowInfo(false)}>×</button>
            <h2>Правила игры Реверси</h2>
            <div className="rules-content">
              <p>1. Игра начинается с четырёх фишек в центре доски: две белые и две чёрные.</p>
              <p>2. Игроки ходят по очереди, начиная с чёрных.</p>
              <p>3. При каждом ходе игрок должен поставить одну фишку своего цвета на пустую клетку доски.</p>
              <p>4. Ход считается допустимым, если после него хотя бы одна фишка противника будет окружена фишками игрока.</p>
              <p>5. При ходе все фишки противника, которые оказались между поставленной фишкой и любой фишкой игрока, переворачиваются на другую сторону.</p>
              <p>6. Если у игрока нет допустимых ходов, он пропускает ход.</p>
              <p>7. Игра заканчивается, когда ни один из игроков не может сделать ход.</p>
              <p>8. Побеждает игрок, у которого на доске осталось больше фишек своего цвета.</p>
            </div>
            <div className="developer-info">
              <h3>Разработчик</h3>
              <p>Игра разработана в рамках учебного проекта.</p>
              <p>Используемые технологии:</p>
              <ul>
                <li>Frontend: React + TypeScript + Vite</li>
                <li>Backend: C++ + cpp-httplib</li>
                <li>AI: Alpha-beta pruning</li>
              <p>Copyright © 2025 reprenter. All Rights Reserved.</p>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;