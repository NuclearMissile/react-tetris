import {useCallback, useEffect, useRef, useState} from 'react';

// Tetris pieces (tetrominoes)
const PIECES = {
    I: {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#00f0f0'
    },
    O: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#f0f000'
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#a000f0'
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        color: '#00f000'
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        color: '#f00000'
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#0000f0'
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#f0a000'
    }
};
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const EMPTY_CELL = 0;

const TetrisGame = () => {
    const [board, setBoard] = useState(() =>
        Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(EMPTY_CELL))
    );
    const [currentPiece, setCurrentPiece] = useState(null);
    const [currentPosition, setCurrentPosition] = useState({x: 0, y: 0});
    const [nextPiece, setNextPiece] = useState(null);
    const [score, setScore] = useState(0);
    const [lines, setLines] = useState(0);
    const [level, setLevel] = useState(1);
    const [gameStatus, setGameStatus] = useState('waiting') // waiting, playing, paused, gameOver

    const gameLoopRef = useRef(null);
    const dropTimeRef = useRef(1000);

    // Get random piece
    const getRandomPiece = useCallback(() => {
        const pieceKeys = Object.keys(PIECES);
        const randomKey = pieceKeys[Math.floor(Math.random() * pieceKeys.length)];
        return {type: randomKey, ...PIECES[randomKey]};
    }, []);

    // Rotate piece matrix
    const rotatePiece = useCallback((piece) => {
        const rotated = piece.shape[0].map((_, index) =>
            piece.shape.map(row => row[index]).reverse()
        );
        return {...piece, shape: rotated};
    }, []);

    // Check if piece position is valid
    const isValidPosition = useCallback((piece, position, gameBoard) => {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const newX = position.x + x;
                    const newY = position.y + y;

                    if (
                        newX < 0 ||
                        newX >= BOARD_WIDTH ||
                        newY >= BOARD_HEIGHT ||
                        (newY >= 0 && gameBoard[newY][newX])
                    ) {
                        return false;
                    }
                }
            }
        }
        return true;
    }, []);

    // Place piece on board
    const placePiece = useCallback((piece, position, gameBoard) => {
        const newBoard = gameBoard.map(row => [...row]);
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardY = position.y + y;
                    const boardX = position.x + x;
                    if (boardY >= 0) {
                        newBoard[boardY][boardX] = piece.color;
                    }
                }
            }
        }
        return newBoard;
    }, []);

    // Clear completed lines
    const clearLines = useCallback((gameBoard) => {
        const newBoard = gameBoard.filter(row => row.some(cell => cell === EMPTY_CELL));
        const clearedLines = BOARD_HEIGHT - newBoard.length;

        while (newBoard.length < BOARD_HEIGHT) {
            newBoard.unshift(Array(BOARD_WIDTH).fill(EMPTY_CELL));
        }

        return {board: newBoard, clearedLines};
    }, []);

    // Spawn new piece
    const spawnPiece = useCallback(() => {
        const newPiece = nextPiece || getRandomPiece();
        const startPosition = {x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0};

        setCurrentPiece(newPiece);
        setCurrentPosition(startPosition);
        setNextPiece(getRandomPiece());

        return {piece: newPiece, position: startPosition};
    }, [nextPiece, getRandomPiece]);

    // Move piece
    const movePiece = useCallback((direction) => {
        if (!currentPiece || gameStatus !== 'playing') return;

        const newPosition = {...currentPosition};
        if (direction === 'left') newPosition.x -= 1;
        if (direction === 'right') newPosition.x += 1;
        if (direction === 'down') newPosition.y += 1;

        if (isValidPosition(currentPiece, newPosition, board)) {
            setCurrentPosition(newPosition);
        } else if (direction === 'down') {
            // Lock piece and spawn new one
            const newBoard = placePiece(currentPiece, currentPosition, board);
            const {board: clearedBoard, clearedLines} = clearLines(newBoard);

            setBoard(clearedBoard);
            setLines(prev => prev + clearedLines);
            setScore(prev => prev + (clearedLines * 100 * level) + 10);

            const {piece: newPiece, position: newPos} = spawnPiece();

            // Check game over
            if (!isValidPosition(newPiece, newPos, clearedBoard)) {
                setNextPiece(null)
                setGameStatus('gameOver');
            }
        }
    }, [currentPiece, currentPosition, board, gameStatus, isValidPosition, placePiece, clearLines, spawnPiece, level]);

    // Rotate current piece
    const rotatePieceHandler = useCallback(() => {
        if (!currentPiece || gameStatus !== 'playing') return;

        const rotated = rotatePiece(currentPiece);
        if (isValidPosition(rotated, currentPosition, board)) {
            setCurrentPiece(rotated);
        }
    }, [currentPiece, currentPosition, board, gameStatus, rotatePiece, isValidPosition]);

    // Hard drop
    const hardDrop = useCallback(() => {
        if (!currentPiece || gameStatus !== 'playing') return;

        let newY = currentPosition.y;
        while (isValidPosition(currentPiece, {...currentPosition, y: newY + 1}, board)) {
            newY++;
        }

        // Calculate bonus points for hard drop distance
        const dropDistance = newY - currentPosition.y;
        setScore(prev => prev + dropDistance * 2);

        // Immediately place the piece at the bottom position
        const finalPosition = {...currentPosition, y: newY};
        const newBoard = placePiece(currentPiece, finalPosition, board);
        const {board: clearedBoard, clearedLines} = clearLines(newBoard);

        setBoard(clearedBoard);
        setLines(prev => prev + clearedLines);
        setScore(prev => prev + (clearedLines * 100 * level) + 10);

        const {piece: newPiece, position: newPos} = spawnPiece();

        // Check game over
        if (!isValidPosition(newPiece, newPos, clearedBoard)) {
            setNextPiece(null)
            setGameStatus('gameOver');
        }
    }, [currentPiece, currentPosition, board, gameStatus, isValidPosition, placePiece, clearLines, spawnPiece, level, setScore]);

    // Game loop
    const gameLoop = useCallback(() => {
        movePiece('down');
        gameLoopRef.current = setTimeout(gameLoop, dropTimeRef.current);
    }, [movePiece]);

    // Start game
    const startGame = useCallback(() => {
        setBoard(Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(EMPTY_CELL)));
        setScore(0);
        setLines(0);
        setLevel(1);
        setGameStatus('playing');
        setCurrentPiece(getRandomPiece());
        setCurrentPosition({x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0});
        setNextPiece(getRandomPiece());
    }, [getRandomPiece]);

    // Pause/Resume game
    const togglePause = useCallback(() => {
        if (gameStatus === 'playing') {
            setGameStatus('paused');
        }
        if (gameStatus === 'paused') {
            setGameStatus('playing');
        }
    }, [gameStatus]);

    // Handle keyboard input
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === ' ') e.preventDefault();
            if (gameStatus !== 'playing') return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    movePiece('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    movePiece('right');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    movePiece('down');
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    rotatePieceHandler();
                    break;
                case ' ':
                    e.preventDefault();
                    hardDrop();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [gameStatus, movePiece, rotatePieceHandler, hardDrop, togglePause]);

    // Game loop effect
    useEffect(() => {
        if (gameStatus === 'playing') {
            gameLoopRef.current = setTimeout(gameLoop, dropTimeRef.current);
        } else {
            clearTimeout(gameLoopRef.current);
        }

        return () => clearTimeout(gameLoopRef.current);
    }, [gameStatus, gameLoop]);

    // Update level and speed
    useEffect(() => {
        const newLevel = Math.floor(lines / 10) + 1;
        setLevel(newLevel);
        dropTimeRef.current = Math.max(100, 1000 - (newLevel - 1) * 100);
    }, [lines]);

    // Render board with current piece
    const renderBoard = () => {
        const displayBoard = board.map(row => [...row]);

        // Add current piece to display
        if (currentPiece) {
            for (let y = 0; y < currentPiece.shape.length; y++) {
                for (let x = 0; x < currentPiece.shape[y].length; x++) {
                    if (currentPiece.shape[y][x]) {
                        const boardY = currentPosition.y + y;
                        const boardX = currentPosition.x + x;
                        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                            displayBoard[boardY][boardX] = currentPiece.color;
                        }
                    }
                }
            }
        }

        return displayBoard;
    };

    // Render next piece preview
    const renderNextPiece = () => {
        return (
            <div className="grid grid-cols-4 gap-0.5 w-16 h-16">
                {Array(4).fill().map((_, y) =>
                    Array(4).fill().map((_, x) => {
                        const hasBlock = nextPiece ? nextPiece.shape[y] && nextPiece.shape[y][x] : false;
                        return (
                            <div
                                key={`${y}-${x}`}
                                className="w-3 h-3 border border-gray-600"
                                style={{
                                    backgroundColor: hasBlock ? nextPiece.color : '#1a1a1a'
                                }}
                            />
                        );
                    })
                )}
            </div>
        );
    };

    const displayBoard = renderBoard();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <a href="https://github.com/NuclearMissile/react-tetris" target="_blank" rel="noreferrer noopener">
                <h1 className="text-4xl font-bold mb-6 text-blue-400">TETRIS</h1>
            </a>

            <div className="flex gap-4">
                {/* Game Board */}
                <div className="relative">
                    <div
                        className="grid gap-0.5 p-4 bg-black border-4 border-gray-600"
                        style={{gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`}}
                    >
                        {displayBoard.flat().map((cell, index) => (
                            <div
                                key={index}
                                className="w-5 h-5 border border-gray-800"
                                style={{
                                    backgroundColor: cell || '#1a1a1a'
                                }}
                            />
                        ))}
                    </div>

                    {/* Game Over Overlay */}
                    {gameStatus === 'gameOver' && (
                        <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-red-400 mb-4">GAME OVER</h2>
                            </div>
                        </div>
                    )}

                    {/* Pause Overlay */}
                    {gameStatus === 'paused' && (
                        <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center">
                            <h2 className="text-3xl font-bold text-yellow-400">PAUSED</h2>
                        </div>
                    )}
                </div>

                {/* Game Info */}
                <div className="flex flex-col gap-4">
                    {/* Score */}
                    <div className="bg-gray-800 p-3 rounded">
                        <h3 className="text-xl font-bold mb-2">Score</h3>
                        <p className="text-2xl text-green-400">{score.toLocaleString()}</p>
                    </div>

                    {/* Level */}
                    <div className="bg-gray-800 p-3 rounded">
                        <h3 className="text-xl font-bold mb-2">Level</h3>
                        <p className="text-2xl text-blue-400">{level}</p>
                    </div>

                    {/* Lines */}
                    <div className="bg-gray-800 p-3 rounded">
                        <h3 className="text-xl font-bold mb-2">Lines</h3>
                        <p className="text-2xl text-purple-400">{lines}</p>
                    </div>

                    {/* Next Piece */}
                    <div className="bg-gray-800 p-3 rounded">
                        <h3 className="text-xl font-bold mb-2">Next</h3>
                        {renderNextPiece()}
                    </div>

                    {/* Game Controls */}
                    <div className="space-y-2">
                        {gameStatus === 'waiting' || gameStatus === 'gameOver' ? (
                            <button
                                onClick={startGame}
                                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded"
                            >
                                Start
                            </button>
                        ) : (
                            <button
                                onClick={togglePause}
                                className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded"
                            >
                                {gameStatus === 'paused' ? 'Resume' : 'Pause'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TetrisGame;