let currentPlayer = 1;
let selectedPoints = []; 
let triangles = []; 
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const dotSize = 8;
let spacingX, spacingY, offsetX, offsetY;


function toggleDropdown() {
    const dropdownText = document.getElementById("dropdownText");
    dropdownText.classList.toggle("show");
}

function toggleDropdown2() {
    const dropdownText = document.getElementById("dropdownText2");
    dropdownText.classList.toggle("show");
}

function handleCanvasClick(event) {
    // Get the canvas and its bounding rectangle
    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();

    // Calculate the click position relative to the canvas
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Call any functions or logic to process the click
    console.log(`Canvas clicked at: (${x}, ${y})`);

    // Example: Add logic to select or draw triangles
    handleUserAction(x, y);
}


function startGame(rows, cols) {

    resetGameState();
    selectedPoints = [];
    triangles = [];
    points = [];

    // Prilagođena širina i visina canvas-a (80% širine ekrana, 70% visine ekrana)
    const maxCanvasWidth = window.innerWidth * 0.8;
    const maxCanvasHeight = window.innerHeight * 0.7;

    // Razmak između tačaka izračunava se tako da sve stane
    spacingX = Math.min(maxCanvasWidth / cols, maxCanvasHeight / rows);
    spacingY = spacingX;

    // Podešavanje dimenzija canvas-a
    canvas.width = cols * spacingX;
    canvas.height = rows * spacingY;

    // Prikazivanje canvas-a
    canvas.style.display = 'block'; // Osiguraj da je canvas vidljiv
    canvas.style.margin = '0 auto';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Centriranje tačaka unutar canvas-a
    offsetX = spacingX / 2;
    offsetY = spacingY / 2;

    // Crtanje tačaka na mreži
    drawGrid(rows, cols, spacingX, spacingY, offsetX, offsetY);
    
    // Funkcija koja prati klikove na kanvasu
    canvas.addEventListener('click', (event) => {
        if (selectedPoints.length < 3) {
            const x = event.offsetX;
            const y = event.offsetY;

            // Proveri koja tačka je kliknuta
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    const dotX = j * spacingX + offsetX;
                    const dotY = i * spacingY + offsetY;

                    const distance = Math.sqrt((x - dotX) ** 2 + (y - dotY) ** 2);
                    if (distance <= dotSize) {
                        selectedPoints.push({ x: dotX, y: dotY });
                        ctx.beginPath();
                        ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2); 
                        ctx.fillStyle = 'red'; 
                        ctx.fill();
                        ctx.closePath();
                        if (selectedPoints.length === 3) {
                            drawTriangle(); // Nacrtaj trougao
                        }
                        return;
                    }
                }
            }
        }
    });
}


function doLinesIntersect(line1, line2) {
    const [x1, y1, x2, y2] = line1;
    const [x3, y3, x4, y4] = line2;

    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

    if (denominator === 0) {
        return false; // Linije su paralelne i ne sjeku se
    }

    const t1 = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
    const t2 = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / denominator;

    // Linije se sjeku ako su t1 i t2 u opsegu [0, 1]
    return t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1;
}

function arePointsCollinear(p1, p2, p3) {
    // Use determinant to check collinearity
    const determinant = (p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y);

    // Due to floating-point precision, check near-zero instead of exact zero
    const epsilon = 1e-9; // Tolerance for floating-point errors
    return Math.abs(determinant) < epsilon;
}

// Funkcija za čuvanje postojećih trouglova
function addTriangle(trianglePoints) {
    const lines = [
        [trianglePoints[0].x, trianglePoints[0].y, trianglePoints[1].x, trianglePoints[1].y],
        [trianglePoints[1].x, trianglePoints[1].y, trianglePoints[2].x, trianglePoints[2].y],
        [trianglePoints[2].x, trianglePoints[2].y, trianglePoints[0].x, trianglePoints[0].y]
    ];
    triangles.push(lines);
}

// Funkcija za proveru preseka novog trougla sa postojećim
function checkForIntersection(trianglePoints) {
    const newLines = [
        [trianglePoints[0].x, trianglePoints[0].y, trianglePoints[1].x, trianglePoints[1].y],
        [trianglePoints[1].x, trianglePoints[1].y, trianglePoints[2].x, trianglePoints[2].y],
        [trianglePoints[2].x, trianglePoints[2].y, trianglePoints[0].x, trianglePoints[0].y]
    ];

    // Prolazimo kroz sve postojeće trouglove i proveravamo preseke
    for (let triangle of triangles) {
        for (let line of newLines) {
            for (let existingLine of triangle) {
                if (doLinesIntersect(line, existingLine)) {
                    return true; // Trougao se seče sa postojećim
                }
            }
        }
    }
    return false; 
}

// Provjerava da li tačka leži na liniji
function isPointOnLine(point, line) {
    const [x1, y1, x2, y2] = line;
    const { x, y } = point;

    // Compute the area of the triangle formed by the point and the line's endpoints
    const crossProduct = Math.abs((y - y1) * (x2 - x1) - (x - x1) * (y2 - y1));

    // Calculate the line segment length
    const lineLengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;

    // Use distance to line formula and ensure point projection is within segment bounds
    if (crossProduct > 1e-2) return false; // Adjust threshold for precision
    const dotProduct = (x - x1) * (x2 - x1) + (y - y1) * (y2 - y1);
    if (dotProduct < 0 || dotProduct > lineLengthSquared) return false;

    return true;
}


// Funkcija za bojanje tačaka na linijama trougla
function colorPointsOnTriangle(trianglePoints, rows, cols, spacingX, spacingY, offsetX, offsetY) {
    const triangleLines = [
        [trianglePoints[0].x, trianglePoints[0].y, trianglePoints[1].x, trianglePoints[1].y],
        [trianglePoints[1].x, trianglePoints[1].y, trianglePoints[2].x, trianglePoints[2].y],
        [trianglePoints[2].x, trianglePoints[2].y, trianglePoints[0].x, trianglePoints[0].y]
    ];

    // Iteriramo kroz sve tačke na mreži
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const dotX = j * spacingX + offsetX;
            const dotY = i * spacingY + offsetY;

            // Provjeravamo da li je tačka na nekoj liniji trougla
            for (let line of triangleLines) {
                if (isPointOnLine({ x: dotX, y: dotY }, line)) {
                    ctx.beginPath();
                    ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
                    ctx.fillStyle ='red' ;
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }
    }
}

// Funkcija za crtanje trougla
function drawTriangle() {
    if (selectedPoints.length === 3) {
        
        // Provjera da li su tačke kolinearne
        if (arePointsCollinear(selectedPoints[0], selectedPoints[1], selectedPoints[2])) {
            alert(`The points are collinear! Player ${currentPlayer} lost their turn.`);
            resetSelectedPoints();
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            return;
        }

        // Provjera da li trougao ima presjek sa postojećim
        if (checkForIntersection(selectedPoints)) {
            alert(`This triangle intersects with another one! Player ${currentPlayer} lost their turn.`);
            resetSelectedPoints();
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            return;
        }

        // Nema presjeka, tačke nisu kolinearne, i nisu na dijagonali, pa nacrtaj trougao
        ctx.beginPath();
        ctx.moveTo(selectedPoints[0].x, selectedPoints[0].y);
        ctx.lineTo(selectedPoints[1].x, selectedPoints[1].y);
        ctx.lineTo(selectedPoints[2].x, selectedPoints[2].y);
        ctx.closePath();

        ctx.strokeStyle = currentPlayer === 1 ? 'red' : 'blue';
        ctx.lineWidth = 2;
        ctx.stroke();

        addTriangle(selectedPoints);

        // Boji sve tačke koje linije trougla presijecaju
        const rows = Math.round(canvas.height / spacingY);
        const cols = Math.round(canvas.width / spacingX);
        colorPointsOnTriangle(selectedPoints, rows, cols, spacingX, spacingY, offsetX, offsetY);

        // Boji same vrhove trougla
        for (let point of selectedPoints) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, dotSize, 0, Math.PI * 2);
            ctx.fillStyle = 'red';
            ctx.fill();
            ctx.closePath();
        }

        selectedPoints = [];

        // Provjera mogućih trouglova
        if (isGameOver(rows, cols, spacingX, spacingY, offsetX, offsetY)) {
            canvas.removeEventListener('click', handleCanvasClick); // Ukloni dalje klikanje
            return;
        }

        currentPlayer = currentPlayer === 1 ? 2 : 1;
    }
}


function isPointInTriangle(point) {
    for (let triangle of triangles) {
        for (let line of triangle) {
            if ( (line[0] === point.x && line[1] === point.y) || (line[2] === point.x && line[3] === point.y)) {
                return true; 
            }
        }
    }
    return false; 
}

function isPointOnAnyLine(point) {
    // Prolazimo kroz sve postojeće trouglove i proveravamo da li tačka leži na nekoj od njihovih linija
    for (let triangle of triangles) {
        for (let line of triangle) {
            if (isPointOnLine(point, line)) {
                return true; // Tačka leži na liniji
            }
        }
    }
    return false; // Tačka ne leži na nijednoj liniji postojećeg trougla
}


// Funkcija za resetovanje izabranih tačaka
function resetSelectedPoints() {
    for (let point of selectedPoints) {
        // Provjeravamo da li je tačka dio postojećeg trougla
        if (!isPointInTriangle(point) && !isPointOnAnyLine(point)) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, dotSize, 0, Math.PI * 2);
            ctx.fillStyle = 'black'; // Boji tačku u crno ako nije dio postojećeg trougla
            ctx.fill();
            ctx.closePath();
        }
    }
    // Resetujemo listu tačaka
    selectedPoints = [];
}


function isGameOver(rows, cols, spacingX, spacingY, offsetX, offsetY) {
    const allPoints = [];

    // Generišemo sve moguće tačke na mreži
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            allPoints.push({ x: j * spacingX + offsetX, y: i * spacingY + offsetY });
        }
    }

    // Provjera svih mogućih kombinacija od 3 tačke
    for (let i = 0; i < allPoints.length; i++) {
        for (let j = i + 1; j < allPoints.length; j++) {
            for (let k = j + 1; k < allPoints.length; k++) {
                const p1 = allPoints[i];
                const p2 = allPoints[j];
                const p3 = allPoints[k];

                // Provjera da li su tačke kolinearne
                if (arePointsCollinear(p1, p2, p3)) {
                    continue; // Preskoči ako su kolinearne
                }

                // Provjera da li trougao ima presjek sa postojećim
                if (!checkForIntersection([p1, p2, p3])) {
                    return false; // Ako postoji trougao bez presjeka, igra nije gotova
                }

                if (isPointClaimed(p1) || isPointClaimed(p2) || isPointClaimed(p3)) {
                    continue;
                }

                console.clear();
                console.log(`Triangle ${p1.x}, ${p1.y} - ${p2.x}, ${p2.y} - ${p3.x}, ${p3.y} is valid.`);
                
            }
        }
    } 
    handleGameOver();
    return true; // Ako ne postoji nijedan validan trougao, igra je gotova
}

function handleGameOver() {
    const playAgain = confirm(`Game over! Player ${currentPlayer} wins! \nDo you want to play again?`);

    if (playAgain) {
        restartGame();
    }
}

function restartGame() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;

    resetGameState();

    alert(`Player ${currentPlayer} goes first now!`);
}

function resetGameState() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rows = Math.round(canvas.height / spacingY);
    const cols = Math.round(canvas.width / spacingX);
    drawGrid(rows, cols, spacingX, spacingY, offsetX, offsetY);

    selectedPoints = [];
    triangles = [];
}

function drawGrid(rows, cols, spacingX, spacingY, offsetX, offsetY) {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            ctx.beginPath();
            ctx.arc(j * spacingX + offsetX, i * spacingY + offsetY, dotSize, 0, Math.PI * 2);
            ctx.fillStyle = 'black';
            ctx.fill();
            ctx.closePath();
        }
    }
}

function isPointClaimed(point) {
    return triangles.some(triangle =>
        triangle.some(line => isPointOnLine(point, line))
    );
}



