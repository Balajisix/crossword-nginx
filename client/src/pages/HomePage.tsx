import React, { useEffect, useState, useRef, KeyboardEvent } from 'react';
import axios from 'axios';
import { LogOut, Clock, Check, Award, AlertTriangle, Coffee } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// const BASE_URL = "http://localhost:5000;
const BASE_URL = "https://crossword-game-ca-backend.vercel.app";

interface Clue {
  number: number;
  clue: string;
  answer: string;
  row?: number;
  col?: number;
}

interface Puzzle {
  grid: string[][];
  clues: {
    across: Clue[];
    down: Clue[];
  };
}

const HomePage: React.FC = () => {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentPlayerSro, setCurrentPlayerSro] = useState<string>(''); // for displaying sroNumber
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [userGrid, setUserGrid] = useState<string[][]>([]);
  const [resultMessage, setResultMessage] = useState<string>('');
  const [timer, setTimer] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [score, setScore] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null);
  const [gameCompleted, setGameCompleted] = useState<boolean>(false);
  const [highlightedClue, setHighlightedClue] = useState<number | null>(null); void(highlightedClue)
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0); void(tabSwitchCount)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reference to input elements for focusing
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  // Start game session and fetch puzzle on mount
  useEffect(() => {
    startGame();
  }, []);

  const startGame = async () => {
    setLoading(true);
    setError('');
    setUserGrid([]);
    setResultMessage('');
    setTimer(0);
    setScore(null);
    setIsTimerActive(true);
    setGameCompleted(false);

    try {
      // Start game session by sending the userId to backend.
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError("User not found. Please login again.");
        setLoading(false);
        return;
      }
      const sessionRes = await axios.post(`${BASE_URL}/api/game/start`, { userId });
      const sessionData = sessionRes.data.session;
      setSessionId(sessionData.sessionId);
      if (sessionData.currentPlayer && sessionData.currentPlayer.sroNumber) {
        setCurrentPlayerSro(sessionData.currentPlayer.sroNumber);
      }

      // Fetch puzzle data
      const puzzleRes = await axios.get(`${BASE_URL}/api/game/puzzle`);
      setPuzzle(puzzleRes.data);

      // Initialize empty user grid based on puzzle grid dimensions
      const initialGrid = puzzleRes.data.grid.map((row: any[]) => row.map(() => ''));
      setUserGrid(initialGrid);

      // Initialize inputRefs array
      inputRefs.current = puzzleRes.data.grid.map((row: any[]) => Array(row.length).fill(null));
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load game. Please try again later.");
      setLoading(false);
      setIsTimerActive(false);
    }
  };

  // Set initial selected cell when puzzle loads
  useEffect(() => {
    if (puzzle && puzzle.grid && puzzle.grid.length > 0) {
      const initialGrid = puzzle.grid.map(row => row.map(() => ''));
      setUserGrid(initialGrid);

      // Find the first available cell with a letter
      for (let r = 0; r < puzzle.grid.length; r++) {
        for (let c = 0; c < puzzle.grid[r].length; c++) {
          if (puzzle.grid[r][c] !== '') {
            setSelectedCell({ row: r, col: c });
            return;
          }
        }
      }
    }
  }, [puzzle]);

  // Timer functionality
  useEffect(() => {
    let interval: number | undefined;
    if (isTimerActive) {
      interval = window.setInterval(() => {
        setTimer(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (interval !== undefined) {
        window.clearInterval(interval);
      }
    };
  }, [isTimerActive]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Terminate game session on tab switch after three switches (backend sets isPlayed in DB)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && sessionId) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          if (newCount === 3) {
            toast.warn("You have switched tabs too many times. Your game will now terminate.");
            axios
              .post(`${BASE_URL}/api/game/terminate`, { userId: localStorage.getItem('userId'), sessionId })
              .then(() => {
                window.location.href = '/login';
              })
              .catch(error => {
                console.error('Error terminating game:', error);
                window.location.href = '/login';
              });
          } else if (newCount === 2) {
            toast.warn("Warning: Next tab switch will terminate your game!");
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (sessionId) {
        axios.post(`${BASE_URL}/api/game/terminate`, { sessionId })
          .catch(error => console.error('Error terminating game on unmount:', error));
      }
    };
  }, [sessionId]);

  // Focus input when selected cell changes and set direction based on clue
  useEffect(() => {
    if (selectedCell && inputRefs.current[selectedCell.row] && inputRefs.current[selectedCell.row][selectedCell.col]) {
      inputRefs.current[selectedCell.row][selectedCell.col]?.focus();

      if (puzzle) {
        const acrossClue = puzzle.clues.across.find(
          c => c.row === selectedCell.row && c.col === selectedCell.col
        );
        const downClue = puzzle.clues.down.find(
          c => c.row === selectedCell.row && c.col === selectedCell.col
        );
        if (acrossClue && !downClue) {
          setDirection('across');
        } else if (!acrossClue && downClue) {
          setDirection('down');
        }
      }
    }
    if (selectedCell && puzzle) {
      const clueNumber = findClueNumberForCell(selectedCell.row, selectedCell.col, direction);
      setHighlightedClue(clueNumber);
    }
  }, [selectedCell, direction, puzzle]);

  const findClueNumberForCell = (row: number, col: number, dir: 'across' | 'down'): number | null => {
    if (!puzzle) return null;
    const clues = dir === 'across' ? puzzle.clues.across : puzzle.clues.down;
    for (const clue of clues) {
      if (clue.row === row && clue.col === col) {
        return clue.number;
      }
      if (dir === 'across') {
        if (clue.row === row && clue.col !== undefined && col >= clue.col) {
          let continuous = true;
          for (let c = clue.col; c <= col; c++) {
            if (puzzle.grid[row][c] === '') {
              continuous = false;
              break;
            }
          }
          if (continuous) return clue.number;
        }
      } else {
        if (clue.col === col && clue.row !== undefined && row >= clue.row) {
          let continuous = true;
          for (let r = clue.row; r <= row; r++) {
            if (puzzle.grid[r][col] === '') {
              continuous = false;
              break;
            }
          }
          if (continuous) return clue.number;
        }
      }
    }
    return null;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    if (!puzzle) return;
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setDirection('across');
        navigateToNextCell(rowIndex, colIndex, 0, 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setDirection('across');
        navigateToNextCell(rowIndex, colIndex, 0, -1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setDirection('down');
        navigateToNextCell(rowIndex, colIndex, 1, 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setDirection('down');
        navigateToNextCell(rowIndex, colIndex, -1, 0);
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          navigateToPrevWord();
        } else {
          navigateToNextWord();
        }
        break;
      case 'Backspace':
        e.preventDefault();
        if (userGrid[rowIndex][colIndex] !== '') {
          setUserGrid(prevGrid => {
            const newGrid = prevGrid.map(row => [...row]);
            newGrid[rowIndex][colIndex] = '';
            return newGrid;
          });
        } else {
          if (direction === 'across') {
            navigateToNextCell(rowIndex, colIndex, 0, -1);
          } else {
            navigateToNextCell(rowIndex, colIndex, -1, 0);
          }
        }
        break;
    }
  };

  const navigateToNextCell = (currentRow: number, currentCol: number, rowDelta: number, colDelta: number) => {
    if (!puzzle) return;
    const rows = puzzle.grid.length;
    const cols = puzzle.grid[0].length;
    let nextRow = currentRow + rowDelta;
    let nextCol = currentCol + colDelta;
    while (nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols) {
      if (puzzle.grid[nextRow][nextCol] !== '') {
        setSelectedCell({ row: nextRow, col: nextCol });
        return;
      }
      nextRow += rowDelta;
      nextCol += colDelta;
    }
  };

  const navigateToNextWord = () => {
    if (!puzzle || !selectedCell) return;
    const clues = direction === 'across' ? puzzle.clues.across : puzzle.clues.down;
    let currentClueIndex = clues.findIndex(clue =>
      clue.number === findClueNumberForCell(selectedCell.row, selectedCell.col, direction)
    );
    if (currentClueIndex < 0) return;
    const nextClueIndex = (currentClueIndex + 1) % clues.length;
    const nextClue = clues[nextClueIndex];
    if (nextClue.row !== undefined && nextClue.col !== undefined) {
      setSelectedCell({ row: nextClue.row, col: nextClue.col });
    }
  };

  const navigateToPrevWord = () => {
    if (!puzzle || !selectedCell) return;
    const clues = direction === 'across' ? puzzle.clues.across : puzzle.clues.down;
    let currentClueIndex = clues.findIndex(clue =>
      clue.number === findClueNumberForCell(selectedCell.row, selectedCell.col, direction)
    );
    if (currentClueIndex < 0) return;
    const prevClueIndex = (currentClueIndex - 1 + clues.length) % clues.length;
    const prevClue = clues[prevClueIndex];
    if (prevClue.row !== undefined && prevClue.col !== undefined) {
      setSelectedCell({ row: prevClue.row, col: prevClue.col });
    }
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const letter = value.slice(-1).toUpperCase();
    if (letter && /[A-Z]/.test(letter)) {
      setUserGrid(prevGrid => {
        const newGrid = prevGrid.map(row => [...row]);
        newGrid[rowIndex][colIndex] = letter;
        return newGrid;
      });
      if (direction === 'across') {
        navigateToNextCell(rowIndex, colIndex, 0, 1);
      } else {
        navigateToNextCell(rowIndex, colIndex, 1, 0);
      }
    }
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    if (gameCompleted) return;
    if (puzzle?.grid[rowIndex][colIndex] !== '') {
      if (selectedCell?.row === rowIndex && selectedCell?.col === colIndex) {
        setDirection(prev => (prev === 'across' ? 'down' : 'across'));
      } else {
        setSelectedCell({ row: rowIndex, col: colIndex });
      }
    }
  };

  const getCurrentQuestion = (): string => {
    if (!selectedCell || !puzzle) return "";
    const clueNumber = findClueNumberForCell(selectedCell.row, selectedCell.col, direction);
    if (clueNumber === null) return "";
    const clues = direction === 'across' ? puzzle.clues.across : puzzle.clues.down;
    const clue = clues.find(c => c.number === clueNumber);
    return clue ? `${clue.number} ${direction === 'across' ? 'Across' : 'Down'}: ${clue.clue}` : "";
  };

  const computeScore = (): number => {
    if (!puzzle) return 0;
    let computedScore = 0;
    const extractWord = (row: number, col: number, isAcross: boolean, length: number): string => {
      let word = '';
      for (let i = 0; i < length; i++) {
        if (row < 0 || row >= userGrid.length || col < 0 || col >= userGrid[row].length) break;
        word += userGrid[row][col];
        if (isAcross) {
          col++;
        } else {
          row++;
        }
      }
      return word;
    };
    puzzle.clues.across.forEach(clue => {
      if (clue.row === undefined || clue.col === undefined) return;
      const expectedLength = clue.answer.length;
      const userAnswer = extractWord(clue.row, clue.col, true, expectedLength);
      if (userAnswer.trim().toUpperCase() === clue.answer.trim().toUpperCase()) {
        computedScore++;
      }
    });
    puzzle.clues.down.forEach(clue => {
      if (clue.row === undefined || clue.col === undefined) return;
      const expectedLength = clue.answer.length;
      const userAnswer = extractWord(clue.row, clue.col, false, expectedLength);
      if (userAnswer.trim().toUpperCase() === clue.answer.trim().toUpperCase()) {
        computedScore++;
      }
    });
    return computedScore;
  };

  const handleSubmitGame = async () => {
    if (!puzzle || !sessionId) return;
    setIsSubmitting(true);
    setIsTimerActive(false);
    const computedScore = computeScore();
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setIsSubmitting(false);
      setResultMessage("User information missing. Cannot submit score.");
      return;
    }
    try {
      await axios.post(`${BASE_URL}/api/game/submit`, {
        sessionId,
        userId,
        score: computedScore
      });
      setResultMessage("Game submitted successfully! Results will be announced soon!");
    } catch (err: any) {
      console.error(err);
      setResultMessage("Failed to submit game. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-indigo-900 to-gray-900 text-white">
        <div className="text-xl flex items-center">
          <span className="animate-spin mr-3">
            <Coffee size={24} />
          </span>
          Loading puzzle...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-indigo-900 to-gray-900 text-white p-4">
        <div className="bg-red-900/50 p-6 rounded-lg max-w-md text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
          <div className="text-xl mb-4 text-red-300">{error}</div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors cursor-pointer"
          >
            <LogOut size={18} className="inline mr-2" /> Logout
          </button>
        </div>
      </div>
    );
  }

  if (!puzzle || !puzzle.grid || puzzle.grid.length === 0) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-indigo-900 to-gray-900 text-white p-4">
        <div className="bg-gray-800/50 p-6 rounded-lg max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">No puzzle available</h1>
          <p className="mb-4">Please contact your CA association members if no puzzle is found.</p>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
          >
            <LogOut size={18} className="inline mr-2" /> Logout
          </button>
        </div>
      </div>
    );
  }

  const cols = puzzle.grid[0].length;

  return (
    <div className="min-h-screen p-3 md:p-6 bg-gradient-to-b from-indigo-900 via-purple-900 to-gray-900 text-white">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      {/* Header with timer, current player's SRO, and logout */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-black/30 p-4 rounded-xl shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          Crossword Challenge
        </h1>
        <div className="flex items-center space-x-3 mt-3 sm:mt-0">
          <div className="flex items-center bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm shadow-inner">
            <Clock size={18} className="mr-2 text-yellow-400" />
            <span className="font-mono text-lg text-yellow-200">{formatTime(timer)}</span>
          </div>
          {currentPlayerSro && (
            <div className="ml-4 px-3 py-1 bg-black/40 rounded-full text-sm text-white">
              SRO number: {currentPlayerSro}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center bg-red-800 hover:bg-red-700 px-3 py-1 rounded-full transition-colors shadow-md"
          >
            <LogOut size={18} className="mr-1" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current question display */}
        <div className="lg:col-span-3 mb-2">
          <div className="bg-blue-900/40 p-4 rounded-xl shadow-lg backdrop-blur-sm border-l-4 border-blue-500">
            <h2 className="text-xl font-bold text-blue-200">Current Question:</h2>
            <p className="text-lg text-white mt-1">{getCurrentQuestion()}</p>
          </div>
        </div>
        

        {/* Crossword grid */}
        <div className="lg:col-span-2 flex flex-col items-center">
          <div className="bg-black/20 p-3 md:p-6 rounded-xl mb-6 shadow-lg backdrop-blur-sm w-full">
            <div className="flex justify-center relative">
              <div className="bg-gray-900/80 p-2 md:p-3 rounded-xl transform rotate-0 shadow-2xl w-full overflow-x-auto">
                <div
                  className="grid gap-px mx-auto"
                  style={{ 
                    gridTemplateColumns: `repeat(${cols}, minmax(min(8vw, 2.5rem), min(10vw, 3rem)))`,
                    maxWidth: '100%',
                  }}
                >
                  {puzzle.grid.map((row, rowIndex) =>
                    row.map((cell, colIndex) => {
                      const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                      const isPartOfSelectedWord = selectedCell && 
                        findClueNumberForCell(rowIndex, colIndex, direction) === 
                        findClueNumberForCell(selectedCell.row, selectedCell.col, direction);
                      if (cell === '') {
                        return (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className="w-full aspect-square bg-black border border-gray-800 rounded-sm"
                          />
                        );
                      } else {
                        return (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`relative w-full aspect-square ${
                              isSelected 
                                ? 'border-2 border-yellow-500 shadow-lg z-10 scale-105' 
                                : isPartOfSelectedWord 
                                  ? 'border border-blue-500 bg-blue-900/20' 
                                  : 'border border-gray-600'
                            } ${
                              gameCompleted 
                                ? userGrid[rowIndex][colIndex] === cell 
                                  ? 'bg-green-200' 
                                  : userGrid[rowIndex][colIndex] 
                                    ? 'bg-red-200'
                                    : 'bg-white'
                                : 'bg-white'
                            } flex items-center justify-center cursor-pointer transition-all rounded-sm`}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                          >
                            <input
                              type="text"
                              maxLength={1}
                              disabled={gameCompleted}
                              className={`w-full h-full text-center ${
                                gameCompleted 
                                  ? userGrid[rowIndex][colIndex] === cell
                                    ? 'text-green-800'
                                    : 'text-red-800'
                                  : 'text-gray-900'
                              } bg-transparent outline-none font-bold text-base md:text-lg`}
                              value={userGrid[rowIndex][colIndex] || ''}
                              onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                              ref={el => {
                                if (inputRefs.current[rowIndex]) {
                                  inputRefs.current[rowIndex][colIndex] = el;
                                }
                              }}
                            />
                            {(puzzle.clues.across.some(c => c.row === rowIndex && c.col === colIndex) || 
                              puzzle.clues.down.some(c => c.row === rowIndex && c.col === colIndex)) && (
                              <span className="absolute top-0 left-0.5 text-xs text-gray-600 pointer-events-none">
                                {puzzle.clues.across.find(c => c.row === rowIndex && c.col === colIndex)?.number || 
                                  puzzle.clues.down.find(c => c.row === rowIndex && c.col === colIndex)?.number}
                              </span>
                            )}
                          </div>
                        );
                      }
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="w-full px-4">
            {!gameCompleted && (
              <button
                onClick={handleSubmitGame}
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 rounded-xl flex items-center justify-center transition-all transform hover:scale-105 font-bold text-lg shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  <>
                    <Check size={20} className="mr-2" />
                    Submit Answers
                  </>
                )}
              </button>
            )}
          </div>

          {/* Result message */}
          {resultMessage && (
            <div className="mt-6 p-6 bg-black/30 rounded-xl text-center w-full backdrop-blur-sm shadow-lg border border-blue-900/30">
              <div className="flex items-center justify-center mb-4">
                <Award size={28} className="text-yellow-300 mr-3" />
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-500">
                  {resultMessage}
                </p>
              </div>
              {score !== null && (
                <div className="w-full bg-gray-800 rounded-full h-5 mt-4 overflow-hidden shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 via-green-400 to-blue-500 h-5 rounded-full transition-all duration-1000 ease-out shadow-md"
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* All Clues list */}
        <div className="bg-black/30 p-4 rounded-xl max-h-[70vh] overflow-y-auto backdrop-blur-sm shadow-lg border border-purple-900/30">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-3 sticky top-0 bg-black/70 pb-2 border-b border-gray-700 p-2 -m-2 rounded-t-xl backdrop-blur">
              Across Clues
            </h2>
            <ul className="space-y-1">
              {puzzle.clues.across.map(clue => {
                const isHighlighted = direction === 'across' && 
                                      selectedCell && 
                                      findClueNumberForCell(selectedCell.row, selectedCell.col, 'across') === clue.number;
                return (
                  <li 
                    key={`across-${clue.number}`} 
                    className={`border-b border-gray-700/50 py-2 px-3 ${isHighlighted ? 'bg-blue-900/40 rounded-lg font-medium shadow-md border-l-4 border-l-blue-500' : 'hover:bg-gray-800/30 rounded-lg'} cursor-pointer transition-all`}
                    onClick={() => {
                      if (clue.row !== undefined && clue.col !== undefined && !gameCompleted) {
                        setDirection('across');
                        setSelectedCell({ row: clue.row, col: clue.col });
                      }
                    }}
                  >
                    <span className={`font-bold mr-2 ${isHighlighted ? 'text-yellow-400' : 'text-blue-400'}`}>
                      {clue.number}.
                    </span> 
                    {clue.clue}
                  </li>
                );
              })}
            </ul>
          </div>
          
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3 sticky top-0 bg-black/70 pb-2 border-b border-gray-700 p-2 -m-2 rounded-t-xl backdrop-blur">
              Down Clues
            </h2>
            <ul className="space-y-1">
              {puzzle.clues.down.map(clue => {
                const isHighlighted = direction === 'down' && 
                                      selectedCell && 
                                      findClueNumberForCell(selectedCell.row, selectedCell.col, 'down') === clue.number;
                return (
                  <li 
                    key={`down-${clue.number}`} 
                    className={`border-b border-gray-700/50 py-2 px-3 ${isHighlighted ? 'bg-blue-900/40 rounded-lg font-medium shadow-md border-l-4 border-l-blue-500' : 'hover:bg-gray-800/30 rounded-lg'} cursor-pointer transition-all`}
                    onClick={() => {
                      if (clue.row !== undefined && clue.col !== undefined && !gameCompleted) {
                        setDirection('down');
                        setSelectedCell({ row: clue.row, col: clue.col });
                      }
                    }}
                  >
                    <span className={`font-bold mr-2 ${isHighlighted ? 'text-yellow-400' : 'text-purple-400'}`}>
                      {clue.number}.
                    </span> 
                    {clue.clue}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Game instructions */}
      {!gameCompleted && (
        <div className="mt-6 p-4 bg-black/20 rounded-xl text-sm text-gray-300 backdrop-blur-sm border border-gray-800/30">
          <p className="mb-2"><strong>Instructions:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Do not switch the tabs otherwise your game will be terminated automatically</li>
            <li>Use arrow keys to navigate between cells</li>
            <li>Click a cell twice to switch between across and down</li>
            <li>Press Tab to move to the next clue, Shift+Tab for previous</li>
            <li>Use backspace to delete a letter</li>
            <li>Your score is based on how many words you answered correctly</li>
          </ul>
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-8 text-center text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Crossword Challenge. All rights reserved.</p>
      </div>
    </div>
  );
};

export default HomePage;
