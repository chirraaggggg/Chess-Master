const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let playerRole = null;
let sourceSquare = null;
let boardOrientation = "white"; // "white" on bottom by default

// --- Render Board ---
const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";

    // Determine row and column order based on orientation
    const rows = boardOrientation === "white" ? board : [...board].reverse();

    rows.forEach((row, rowIndexRaw) => {
        const rowIndex = boardOrientation === "white" ? rowIndexRaw : 7 - rowIndexRaw;

        const cols = boardOrientation === "white" ? row : [...row].reverse();

        cols.forEach((square, colIndexRaw) => {
            const colIndex = boardOrientation === "white" ? colIndexRaw : 7 - colIndexRaw;

            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowIndex + colIndex) % 2 === 0 ? "light" : "dark"
            );
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = colIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (!pieceElement.draggable) return;
                    draggedPiece = pieceElement;
                    sourceSquare = { row: rowIndex, col: colIndex };
                    e.dataTransfer.setData("text/plain", "");
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => e.preventDefault());

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (!draggedPiece || !sourceSquare) return;

                const targetSquare = {
                    row: parseInt(squareElement.dataset.row),
                    col: parseInt(squareElement.dataset.col)
                };

                handleMove(sourceSquare, targetSquare);
            });

            boardElement.appendChild(squareElement);
        });
    });
};

// --- Handle Move ---
const handleMove = (source, target) => {
    if (!source || !target) return;

    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q"
    };

    const result = chess.move(move);
    if (result) {
        socket.emit("move", move);
        renderBoard();
    } else {
        console.log("Invalid move");
    }
};

// --- Get Unicode for Pieces ---
const getPieceUnicode = (piece) => {
    const unicodePieces = {
        wp: "♙", wn: "♘", wb: "♗", wr: "♖", wq: "♕", wk: "♔",
        bp: "♟", bn: "♞", bb: "♝", br: "♜", bq: "♛", bk: "♚"
    };
    return unicodePieces[piece.color + piece.type] || "";
};

// --- Socket Events ---
socket.on("playerRole", (role) => {
    playerRole = role;
    boardOrientation = role; // flip board automatically
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    boardOrientation = "white"; // default orientation
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

// --- Initial Render ---
renderBoard();