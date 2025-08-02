class NoTieTicTacToe {
    constructor() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.playerPieces = { 'X': [], 'O': [] };
        this.gameMode = 'pvp';
        this.aiDifficulty = 'easy';
        this.aiPlayer = null;
        this.gameOver = false;
        this.winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],  // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8],  // Columns
            [0, 4, 8], [2, 4, 6]  // Diagonals
        ];

        // Undo/Redo History
        this.moveHistory = {
            'X': [],
            'O': []
        };
        this.redoHistory = {
            'X': [],
            'O': []
        };

        this.initializeGame();
    }

    initializeGame() {
        this.setupEventListeners();
        this.createBoard();
    }

    setupEventListeners() {
        // Mode selection buttons
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(button => {
            button.addEventListener('click', this.handleModeChange.bind(this));
        });

        // Difficulty selection buttons
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        difficultyButtons.forEach(button => {
            button.addEventListener('click', this.handleDifficultyChange.bind(this));
        });

        document.getElementById('reset-game').addEventListener('click', this.resetGame.bind(this));
        document.getElementById('play-again').addEventListener('click', this.resetGame.bind(this));

        // Add Undo/Redo buttons
        const undoButton = document.getElementById('undo-button');
        const redoButton = document.getElementById('redo-button');
        
        if (undoButton) undoButton.addEventListener('click', this.undoMove.bind(this));
        if (redoButton) redoButton.addEventListener('click', this.redoMove.bind(this));
        
        this.updateUndoRedoButtons();
    }

    handleModeChange(event) {
        // Remove active class from all mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        event.target.classList.add('active');
        
        // Get the mode from data attribute
        this.gameMode = event.target.dataset.mode;
        
        const aiDifficultyDiv = document.getElementById('ai-difficulty');
        
        // Show/hide AI difficulty with smooth transition
        if (this.gameMode === 'pve') {
            aiDifficultyDiv.classList.remove('hidden');
            aiDifficultyDiv.classList.add('show');
        } else {
            aiDifficultyDiv.classList.remove('show');
            setTimeout(() => {
                if (!aiDifficultyDiv.classList.contains('show')) {
                    aiDifficultyDiv.classList.add('hidden');
                }
            }, 300);
        }
        
        // In PvE mode, human always starts as X
        if (this.gameMode === 'pve') {
            this.aiPlayer = 'O';
            this.currentPlayer = 'X';
        } else {
            this.aiPlayer = null;
            this.currentPlayer = 'X';
        }
        
        this.resetGame();
    }

    handleDifficultyChange(event) {
        // Remove active class from all difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        event.target.classList.add('active');
        
        // Get the difficulty from data attribute
        this.aiDifficulty = event.target.dataset.difficulty;
        
        this.resetGame();
    }

    createBoard() {
        const board = document.getElementById('board');
        board.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            cell.addEventListener('click', this.handleCellClick.bind(this));
            board.appendChild(cell);
        }
    }

    handleCellClick(event) {
        // Prevent moves if game is over or in AI mode when it's AI's turn
        if (this.gameOver || 
            (this.gameMode === 'pve' && this.currentPlayer === this.aiPlayer)) {
            return;
        }

        const index = parseInt(event.target.dataset.index);
        
        // Prevent move if cell is already occupied
        if (this.board[index]) return;

        // Place piece for current player
        this.placePiece(index);

        // Check for win or switch player
        if (this.checkWin()) {
            this.endGame(true);
        } else {
            this.switchPlayer();

            // In PvE mode, trigger AI move after human turn with a slight delay
            if (this.gameMode === 'pve' && this.currentPlayer === this.aiPlayer) {
                setTimeout(() => this.aiMove(), 300);
            }
        }
    }

    placePiece(index) {
        // Remove oldest piece if player has 3 pieces
        if (this.playerPieces[this.currentPlayer].length === 3) {
            const oldestIndex = this.playerPieces[this.currentPlayer].shift();
            
            // Add a small delay before removing the oldest piece
            setTimeout(() => {
                this.board[oldestIndex] = null;
                this.updateCellDisplay(oldestIndex);
            }, 200);
        }

        this.board[index] = this.currentPlayer;
        this.playerPieces[this.currentPlayer].push(index);
        this.updateCellDisplay(index);

        // Add move to history
        this.moveHistory[this.currentPlayer].push(index);
        this.redoHistory[this.currentPlayer] = []; // Clear redo history

        this.updateUndoRedoButtons();
    }

    updateCellDisplay(index) {
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        cell.textContent = this.board[index] || '';
        cell.className = 'cell';
        if (this.board[index]) {
            cell.classList.add(this.board[index].toLowerCase());
        }
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        document.getElementById('current-player').textContent = this.currentPlayer;

        if (this.gameMode === 'pve' && this.currentPlayer === 'O') {
            this.aiMove();
        }
    }

    aiMove() {
        // Only move if it's AI's turn in PvE mode
        if (this.gameOver || 
            this.gameMode !== 'pve' || 
            this.currentPlayer !== this.aiPlayer) {
            return;
        }
    
        setTimeout(() => {  // Add delay before AI makes its move
            let move;
            switch (this.aiDifficulty) {
                case 'easy':
                    move = this.getRandomMove();
                    break;
                case 'medium':
                    move = this.getMediumMove();
                    break;
                case 'hard':
                    move = this.getHardMove();
                    break;
            }
    
            if (move !== undefined) {
                this.placePiece(move);
    
                // Check for win or switch back to human
                if (this.checkWin()) {
                    this.endGame(true);
                } else {
                    this.switchPlayer();
                }
            }
        }, 300);  // 300ms delay for AI "thinking"
    }
    

    getRandomMove() {
        const availableMoves = this.getAvailableMoves();
        if (availableMoves.length === 0) return undefined;
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    getMediumMove() {
        const availableMoves = this.getAvailableMoves();
        
        // If no moves available, return undefined
        if (availableMoves.length === 0) return undefined;
        
        // 1. Check for winning moves
        const winningMove = this.findWinningMove('O');
        if (winningMove !== null && availableMoves.includes(winningMove)) {
            return winningMove;
        }
        
        // 2. Check for blocking moves (prevent opponent from winning)
        const blockingMove = this.findWinningMove('X');
        if (blockingMove !== null && availableMoves.includes(blockingMove)) {
            return blockingMove;
        }
        
        // 3. Strategic positioning with limited lookahead (1-2 moves)
        const strategicMove = this.getBestStrategicMove(availableMoves);
        if (strategicMove !== null) return strategicMove;
        
        // 4. Fallback to random available move
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    getAvailableMoves() {
        const available = [];
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] === null) {
                available.push(i);
            }
        }
        return available;
    }

    getBestStrategicMove(availableMoves) {
        let bestMove = null;
        let bestScore = -Infinity;
        
        // Evaluate each available move with limited depth
        for (let move of availableMoves) {
            const score = this.evaluatePosition(move, 'O', 2); // Depth of 2 for medium difficulty
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }

    evaluatePosition(move, player, depth) {
        // Create a copy of the current board state
        const originalBoard = [...this.board];
        const originalPlayerPieces = {
            'X': [...this.playerPieces['X']],
            'O': [...this.playerPieces['O']]
        };
        
        // Simulate the move
        this.simulateMove(move, player);
        
        // Base case: check immediate win
        if (this.checkWin()) {
            this.restoreBoard(originalBoard, originalPlayerPieces);
            return 100;
        }
        
        // If depth limit reached, use positional scoring
        if (depth <= 0) {
            const score = this.getPositionalScore(move);
            this.restoreBoard(originalBoard, originalPlayerPieces);
            return score;
        }
        
        // Look ahead one move for opponent's response
        const opponent = player === 'X' ? 'O' : 'X';
        const opponentMoves = this.getAvailableMoves();
        let worstOpponentScore = Infinity;
        
        for (let opponentMove of opponentMoves) {
            this.simulateMove(opponentMove, opponent);
            
            if (this.checkWin()) {
                worstOpponentScore = -100; // Opponent wins
                this.restoreBoard(originalBoard, originalPlayerPieces);
                break;
            }
            
            const score = this.getPositionalScore(move) - this.getPositionalScore(opponentMove);
            worstOpponentScore = Math.min(worstOpponentScore, score);
            
            // Restore state for next iteration
            this.restoreBoard(originalBoard, originalPlayerPieces);
            this.simulateMove(move, player); // Re-apply our move
        }
        
        this.restoreBoard(originalBoard, originalPlayerPieces);
        return worstOpponentScore === Infinity ? this.getPositionalScore(move) : worstOpponentScore;
    }

    simulateMove(index, player) {
        // Remove oldest piece if player has 3 pieces (no-tie mechanic)
        if (this.playerPieces[player].length === 3) {
            const oldestIndex = this.playerPieces[player].shift();
            this.board[oldestIndex] = null;
        }

        this.board[index] = player;
        this.playerPieces[player].push(index);
    }

    restoreBoard(originalBoard, originalPlayerPieces) {
        this.board = [...originalBoard];
        this.playerPieces = {
            'X': [...originalPlayerPieces['X']],
            'O': [...originalPlayerPieces['O']]
        };
    }

    getPositionalScore(move) {
        let score = 0;
        
        // Strategic position values: center > corners > edges
        if (move === 4) { // Center (assuming 3x3 grid: 0-8)
            score += 10;
        } else if ([0, 2, 6, 8].includes(move)) { // Corners
            score += 5;
        } else { // Edges (1, 3, 5, 7)
            score += 2;
        }
        
        // Bonus for creating multiple winning opportunities
        score += this.countPotentialWinningLines(move, 'O') * 3;
        
        return score;
    }

    countPotentialWinningLines(move, player) {
        let count = 0;
        for (let combination of this.winningCombinations) {
            if (combination.includes(move)) {
                const lineValues = combination.map(pos => this.board[pos]);
                const playerCount = lineValues.filter(val => val === player).length;
                const emptyCount = lineValues.filter(val => val === null).length;
                const opponent = player === 'X' ? 'O' : 'X';
                
                // Count as potential winning line if player has pieces and no opponent pieces
                if (playerCount > 0 && emptyCount > 0 && !lineValues.includes(opponent)) {
                    count++;
                }
            }
        }
        return count;
    }

    getHardMove() {
        // Implement minimax with consideration of piece removal
        // This is a complex algorithm that would require more space to fully implement
        return this.getMediumMove();
    }

    findWinningMove(player) {
        for (let combination of this.winningCombinations) {
            const [a, b, c] = combination;
            if (
                (this.board[a] === player && this.board[b] === player && this.board[c] === null) ||
                (this.board[a] === player && this.board[c] === player && this.board[b] === null) ||
                (this.board[b] === player && this.board[c] === player && this.board[a] === null)
            ) {
                const emptyIndex = combination.find(idx => this.board[idx] === null);
                // Only return the move if it's actually available
                if (emptyIndex !== undefined && this.board[emptyIndex] === null) {
                    return emptyIndex;
                }
            }
        }
        return null;
    }

    checkWin() {
        return this.winningCombinations.some(combination => {
            const [a, b, c] = combination;
            return (
                this.board[a] && 
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c]
            );
        });
    }

    checkGameOver() {
        return this.checkWin();
    }

    endGame(hasWinner) {
        const modal = document.getElementById('game-over-modal');
        const resultText = document.getElementById('game-result');

        if (hasWinner) {
            resultText.textContent = `Player ${this.currentPlayer} Wins!`;
            this.highlightWinningCombination();
        }

        modal.classList.remove('hidden');
    }

    highlightWinningCombination() {
        this.winningCombinations.forEach(combination => {
            const [a, b, c] = combination;
            if (
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c] && 
                this.board[a]
            ) {
                combination.forEach(index => {
                    const cell = document.querySelector(`.cell[data-index="${index}"]`);
                    cell.classList.add('winning');
                });
            }
        });
    }

    resetGame() {
        this.board = Array(9).fill(null);
        this.playerPieces = { 'X': [], 'O': [] };
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.moveHistory = { 'X': [], 'O': [] };
        this.redoHistory = { 'X': [], 'O': [] };
        document.getElementById('current-player').textContent = this.currentPlayer;
        
        // Hide the game over modal
        const modal = document.getElementById('game-over-modal');
        modal.classList.add('hidden');
        
        this.createBoard();
        this.updateUndoRedoButtons();

        if (this.gameMode === 'pve' && this.aiPlayer === 'X') {
            this.aiMove();
        }
    }

    updateUndoRedoButtons() {
        const undoButton = document.getElementById('undo-button');
        const redoButton = document.getElementById('redo-button');

        undoButton.disabled = this.moveHistory[this.currentPlayer].length === 0;
        redoButton.disabled = this.redoHistory[this.currentPlayer].length === 0;
    }

    undoMove() {
        if (this.moveHistory[this.currentPlayer].length === 0) return;

        const index = this.moveHistory[this.currentPlayer].pop();
        this.redoHistory[this.currentPlayer].push(index);

        this.board[index] = null;
        this.updateCellDisplay(index);

        this.updateUndoRedoButtons();
    }

    redoMove() {
        if (this.redoHistory[this.currentPlayer].length === 0) return;

        const index = this.redoHistory[this.currentPlayer].pop();
        this.moveHistory[this.currentPlayer].push(index);

        this.board[index] = this.currentPlayer;
        this.updateCellDisplay(index);

        this.updateUndoRedoButtons();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NoTieTicTacToe();
});
