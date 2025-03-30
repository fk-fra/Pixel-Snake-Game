// --- Riferimenti Elementi DOM ---
const gameBoard = document.getElementById('game-board'); // Spostato su per verifica anticipata
// Verifica immediata se il gameBoard esiste
if (!gameBoard) {
    console.error("ERRORE CRITICO: Elemento #game-board non trovato! I controlli touch non funzioneranno.");
}
const ctx = gameBoard ? gameBoard.getContext('2d') : null; // Ottieni contesto solo se gameBoard esiste
const scoreElement = document.getElementById('punteggio'), inGameScoreElement = document.getElementById('in-game-punteggio');
// ... (resto dei riferimenti DOM come prima) ...
const scoreFinaleElement = document.getElementById('punteggio-finale'), gameOverOverlay = document.getElementById('game-over');
const restartButton = document.getElementById('restart-button'), nicknameDisplay = document.getElementById('nickname-display');
const accountButton = document.getElementById('account-button'), homeButton = document.getElementById('home-button');
const loginModal = document.getElementById('login-modal'), loginForm = document.getElementById('login-form');
const loginNicknameInput = document.getElementById('login-nickname'), loginPasswordInput = document.getElementById('login-password');
const closeLoginModalButton = document.getElementById('close-login-modal-button'), showRegistrationButton = document.getElementById('show-registration-button');
const registrationModal = document.getElementById('registration-modal'), registrationForm = document.getElementById('registration-form');
const regFirstNameInput = document.getElementById('reg-first-name'), regLastNameInput = document.getElementById('reg-last-name');
const regNicknameInput = document.getElementById('reg-nickname'), regPasswordInput = document.getElementById('reg-password');
const closeRegistrationModalButton = document.getElementById('close-registration-modal-button'), showLoginButton = document.getElementById('show-login-button');
const accountManagementModal = document.getElementById('account-management-modal'), accountManagementForm = document.getElementById('account-management-form');
const mgmtNicknameInput = document.getElementById('mgmt-nickname'), mgmtCurrentPasswordInput = document.getElementById('mgmt-current-password');
const mgmtNewPasswordInput = document.getElementById('mgmt-new-password'), closeMgmtModalButton = document.getElementById('close-mgmt-modal-button');
const logoutButton = document.getElementById('logout-button'), togglePasswordChangeButton = document.getElementById('toggle-password-change-button');
const newPasswordSection = document.getElementById('new-password-section');
const leaderboardButton = document.getElementById('leaderboard-button'), leaderboardModal = document.getElementById('leaderboard-modal');
const leaderboardList = document.getElementById('leaderboard-list'), userRankInfo = document.getElementById('user-rank-info');
const closeLeaderboardButton = document.getElementById('close-leaderboard-button');


// --- Impostazioni e Costanti Gioco ---
// ... (invariate) ...
const gridSize = 20, boardSize = gameBoard ? gameBoard.width / gridSize : 20, cornerRadius = 3; // Usa fallback per boardSize
const DEFAULT_SNAKE_SPEED = 150;
let snakeSpeed = DEFAULT_SNAKE_SPEED;
const PARTICLE_COUNT = 15, PARTICLE_LIFE = 20, SHAKE_DURATION = 15, SHAKE_INTENSITY = 4, FLASH_DURATION = 10;
const GOLDEN_FOOD_CHANCE = 0.1, GOLDEN_FOOD_SCORE = 50, NORMAL_FOOD_SCORE = 10;
const LEFT_KEY = 37, RIGHT_KEY = 39, UP_KEY = 38, DOWN_KEY = 40, SPACE_KEY = 32, ESC_KEY = 27;
const COLOR_BACKGROUND = '#000000', COLOR_SNAKE_BODY = '#00ff00', COLOR_SNAKE_BORDER = '#008800';
const COLOR_FOOD_BODY = '#ff0000', COLOR_FOOD_BORDER = '#880000', COLOR_FOOD_GOLD_BODY = '#ffd700', COLOR_FOOD_GOLD_BORDER = '#b8860b';
const COLOR_TEXT_PRIMARY = '#f0f0f0', COLOR_TEXT_SECONDARY = '#aaaaaa', COLOR_COUNTDOWN = '#ffff00';
const COLOR_PAUSE_BG = 'rgba(0, 0, 0, 0.7)', COLOR_PAUSE_TEXT = '#f0f0f0';
const USER_DB_STORAGE_KEY = 'snakeUserDatabase';
const CHECKPOINTS = [100, 250, 500, 750, 1000, 1500, 2000, 3000, 5000, 7000, 10000, 15000, 20000, 25000, 35000, 50000, 70000, 100000, 150000, 200000, 300000, 500000, 1000000].sort((a, b) => a - b);
const OBSTACLE_START_CHECKPOINT_INDEX = 2;
const MAX_OBSTACLES = 15;
const COLOR_OBSTACLE = '#333333';
const BLUE_APPLE_START_CHECKPOINT_INDEX = 3;
const BLUE_APPLE_CHANCE = 0.18;
const BLUE_APPLE_SCORE = 25;
const BLUE_APPLE_LIFETIME_MS = 10000;
const COLOR_FOOD_BLUE_BODY = '#00aaff';
const COLOR_FOOD_BLUE_BORDER = '#0055cc';
const BLUE_APPLE_SPEED_BOOST_MS = 100;
const BLUE_APPLE_SPEED_BOOST_DURATION_MS = 5000;
const CLUSTER_APPLE_CHECKPOINT = 1000;
const CLUSTER_APPLE_CHANCE = 0.08;
const CLUSTER_APPLE_CHILD_COUNT = 5;
const CLUSTER_APPLE_TYPE = 'cluster';
const CLUSTER_APPLE_SIZE_SCALE = 1.3;
const CLUSTER_CHILD_SCORE = NORMAL_FOOD_SCORE;
const MIN_SWIPE_DISTANCE = 30;
const MAX_OFF_AXIS_DISTANCE = 50;

// --- Stato Gioco Globale ---
let snake = [], food = {}, dx = 1, dy = 0, score = 0, highScore = 0;
let changingDirection = false, gameLoopTimeout, isGameOver = false, gameStarted = false;
let isPaused = false, isCountingDown = false, wasGameRunningBeforeModal = false;
let currentNickname = null, currentUserCheckpoint = 0;
let particles = [], shakeFrames = 0, flashFrames = 0, flashColor = null;
let obstacles = [];
let blueAppleTimeoutId = null, blueAppleExpiryTime = null;
let isSpeedBoostActive = false, speedBoostTimeoutId = null, speedBoostExpiryTime = null;
let isClusterModeActive = false, clusterChildApples = [];
let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;

// --- Effetti Sonori ---
function loadSound(src) { try { const sound = new Audio(src); sound.onerror = (e) => console.error(`Errore caricamento suono: ${src}`, e); return sound; } catch (e) { console.error(`Errore creazione Audio ${src}:`, e); return { play: () => {}, cloneNode: () => ({ play: () => {} }) }; } }
const eatSound = loadSound('sounds/eat.wav'), gameOverSound = loadSound('sounds/gameover.wav'); //... (resto suoni)
const checkpointSound = loadSound('sounds/checkpoint.wav'), clickSound = loadSound('sounds/click.wav');
const countdownBlipSound = loadSound('sounds/countdown_blip.wav'), startGameSound = loadSound('sounds/start_game.wav');
const goldenFoodSound = loadSound('sounds/golden_eat.wav');
const blueAppleSound = loadSound('sounds/blue_eat.wav');
const blueAppleTimeoutSound = loadSound('sounds/timeout.wav');
function playSound(sound) { try { if(sound && typeof sound.play === 'function') sound.cloneNode().play().catch(e => {}); } catch(e) { console.error("Errore riproduzione suono:", e); } }

// --- Funzioni Hashing Password ---
async function hashPassword(password) { if (!password) { console.error("Password vuota per hash."); alert("Password vuota."); return null; } try { const enc = new TextEncoder(); const data = enc.encode(password); const buf = await crypto.subtle.digest('SHA-256', data); const arr = Array.from(new Uint8Array(buf)); return arr.map(b => b.toString(16).padStart(2, '0')).join(''); } catch (e) { console.error("Hashing err:", e); alert("Errore tecnico password."); return null; } }

// --- Funzioni Database Utenti (localStorage) ---
function loadUserDatabase() { try { const db = localStorage.getItem(USER_DB_STORAGE_KEY); return db ? JSON.parse(db) : {}; } catch (e) { console.error("Errore load DB:", e); localStorage.removeItem(USER_DB_STORAGE_KEY); return {}; } }
function saveUserDatabase(db) { try { localStorage.setItem(USER_DB_STORAGE_KEY, JSON.stringify(db)); } catch (e) { console.error("Errore save DB:", e); alert("Errore salvataggio dati."); } }

// --- Funzioni Account e UI Modals ---
// ... (invariate, ma assicurati che gli alert vengano sostituiti da UI non bloccante in futuro) ...
function displayNickname(nickname) { nicknameDisplay.textContent = (nickname && nickname.trim()) ? `Utente: ${nickname.trim()}` : ''; }
function pauseGameForModal() { wasGameRunningBeforeModal = gameStarted && !isPaused && !isGameOver && !isCountingDown; if (wasGameRunningBeforeModal) { isPaused = true; clearTimeout(gameLoopTimeout); clearTimeout(blueAppleTimeoutId); blueAppleTimeoutId = null; clearTimeout(speedBoostTimeoutId); speedBoostTimeoutId = null; console.log("Gioco pausato per modal."); } }
function resumeGameAfterModal() { if (wasGameRunningBeforeModal) { isPaused = false; wasGameRunningBeforeModal = false; if (!isGameOver && gameStarted) { console.log("Gioco ripreso dopo modale."); if (food?.type === 'blue' && blueAppleExpiryTime !== null) { const rT = blueAppleExpiryTime - Date.now(); if (rT > 0) blueAppleTimeoutId = setTimeout(handleBlueAppleTimeout, rT); else handleBlueAppleTimeout(); } if (isSpeedBoostActive && speedBoostExpiryTime !== null) { const rBT = speedBoostExpiryTime - Date.now(); if (rBT > 0) speedBoostTimeoutId = setTimeout(resetSnakeSpeed, rBT); else resetSnakeSpeed(); } mainLoop(); } } else { wasGameRunningBeforeModal = false; } }
function openModal(modalElement, focusElement = null) { pauseGameForModal(); [...document.querySelectorAll('.modal-overlay')].forEach(m => m.classList.remove('active')); modalElement.classList.add('active'); if (focusElement) focusElement.focus(); playSound(clickSound); }
function closeModal(modalElement) { if(modalElement) modalElement.classList.remove('active'); playSound(clickSound); resumeGameAfterModal(); } // Aggiunto check modalElement
const openLoginModal = () => { loginNicknameInput.value = ''; loginPasswordInput.value = ''; openModal(loginModal, loginNicknameInput); };
const closeLoginModal = () => closeModal(loginModal);
const openRegistrationModal = () => { regFirstNameInput.value = ''; regLastNameInput.value = ''; regNicknameInput.value = ''; regPasswordInput.value = ''; openModal(registrationModal, regFirstNameInput); };
const closeRegistrationModal = () => closeModal(registrationModal);
const openAccountManagementModal = () => { if (!currentNickname) { openLoginModal(); return; } mgmtNicknameInput.value = currentNickname; mgmtCurrentPasswordInput.value = ''; mgmtNewPasswordInput.value = ''; newPasswordSection.classList.add('hidden'); togglePasswordChangeButton.textContent = 'Cambia Password'; openModal(accountManagementModal, mgmtCurrentPasswordInput); };
const closeAccountManagementModal = () => closeModal(accountManagementModal);
const openLeaderboardModal = () => { populateLeaderboard(); openModal(leaderboardModal); };
const closeLeaderboardModal = () => closeModal(leaderboardModal);
const switchToRegistration = () => { loginModal.classList.remove('active'); openRegistrationModal(); };
const switchToLogin = () => { registrationModal.classList.remove('active'); openLoginModal(); };
const handleAccountButtonClick = () => { if (currentNickname) openAccountManagementModal(); else openLoginModal(); };
async function handleLoginFormSubmit(event) { /* ... (invariato) ... */ event.preventDefault(); const nickname = loginNicknameInput.value.trim(); const enteredPassword = loginPasswordInput.value; if (!nickname || !enteredPassword) return alert("Inserisci nickname e password."); const userDB = loadUserDatabase(); if (userDB.hasOwnProperty(nickname)) { const userData = userDB[nickname]; const storedHash = userData.passwordHash; if (!storedHash) { console.error(`Hash non trovato per ${nickname}.`); return alert("Errore account."); } try { const enteredPasswordHash = await hashPassword(enteredPassword); if (!enteredPasswordHash) return; if (enteredPasswordHash === storedHash) { currentNickname = nickname; displayNickname(currentNickname); loadUserProfile(currentNickname); alert(`Bentornato, ${nickname}!`); closeLoginModal(); } else { alert("Nickname o password errati."); loginPasswordInput.value = ''; loginPasswordInput.focus(); } } catch (error) { console.error("Errore login:", error); alert("Errore durante il login."); } } else { alert("Nickname o password errati."); loginPasswordInput.value = ''; loginPasswordInput.focus(); } }
async function handleRegistrationFormSubmit(event) { /* ... (invariato) ... */ event.preventDefault(); const firstName = regFirstNameInput.value.trim(); const lastName = regLastNameInput.value.trim(); const nickname = regNicknameInput.value.trim(); const password = regPasswordInput.value; if (!firstName || !lastName || !nickname || !password) return alert("Compila tutti i campi."); if (password.length < 4) return alert("Password troppo corta (min 4)."), regPasswordInput.focus(); const userDB = loadUserDatabase(); if (userDB.hasOwnProperty(nickname)) return alert("Nickname già esistente."), regNicknameInput.focus(); try { const hashedPassword = await hashPassword(password); if (!hashedPassword) return; userDB[nickname] = { firstName, lastName, passwordHash: hashedPassword, highScore: 0, lastCheckpoint: 0 }; saveUserDatabase(userDB); currentNickname = nickname; displayNickname(currentNickname); loadUserProfile(currentNickname); alert(`Account per ${nickname} creato!`); closeRegistrationModal(); } catch (error) { console.error("Errore registrazione:", error); alert("Errore durante la registrazione."); } }
async function handleAccountManagementFormSubmit(event) { /* ... (invariato) ... */ event.preventDefault(); if (!currentNickname) return; const newNickname = mgmtNicknameInput.value.trim(); const currentPasswordEntered = mgmtCurrentPasswordInput.value; const newPassword = mgmtNewPasswordInput.value; const isPasswordChangeVisible = !newPasswordSection.classList.contains('hidden'); if (!newNickname) return alert("Il nickname non può essere vuoto."), mgmtNicknameInput.focus(); if (!currentPasswordEntered) return alert("Inserisci la password attuale."), mgmtCurrentPasswordInput.focus(); const userDB = loadUserDatabase(); const originalNickname = currentNickname; if (!userDB.hasOwnProperty(originalNickname)) return alert("Errore: utente non trovato."), handleLogout(); const storedHash = userDB[originalNickname].passwordHash; if (!storedHash) return console.error(`Hash non trovato per ${originalNickname}.`), alert("Errore interno account."); try { const currentPasswordHash = await hashPassword(currentPasswordEntered); if (!currentPasswordHash) return; if (currentPasswordHash !== storedHash) return alert("Password attuale errata."), mgmtCurrentPasswordInput.value = '', mgmtCurrentPasswordInput.focus(); let dbUpdated = false; let finalNickname = originalNickname; let dataToUpdate = { ...userDB[originalNickname] }; if (newNickname !== originalNickname) { if (userDB.hasOwnProperty(newNickname)) return alert("Nuovo nickname già in uso."), mgmtNicknameInput.focus(); finalNickname = newNickname; dbUpdated = true; } if (isPasswordChangeVisible && newPassword) { if (newPassword.length < 4) return alert("Nuova password troppo corta."), mgmtNewPasswordInput.focus(); const newHashedPassword = await hashPassword(newPassword); if (!newHashedPassword) return; dataToUpdate.passwordHash = newHashedPassword; dbUpdated = true; } if (dbUpdated) { if (finalNickname !== originalNickname) delete userDB[originalNickname]; userDB[finalNickname] = dataToUpdate; saveUserDatabase(userDB); currentNickname = finalNickname; displayNickname(currentNickname); alert("Modifiche salvate!"); closeAccountManagementModal(); } else closeAccountManagementModal(); } catch (error) { console.error("Errore gestione account:", error); alert("Errore durante il salvataggio."); } }
const handleLogout = () => { /* ... (invariato) ... */ if (!currentNickname) return; const nicknameLoggedOut = currentNickname; currentNickname = null; currentUserCheckpoint = 0; highScore = 0; displayNickname(null); loadUserProfile(null); alert(`Logout effettuato per ${nicknameLoggedOut}.`); closeAccountManagementModal(); if (gameStarted || isGameOver || isCountingDown) handleHomeButtonClick(); };
const handleTogglePasswordChange = () => { /* ... (invariato) ... */ const isHidden = newPasswordSection.classList.toggle('hidden'); togglePasswordChangeButton.textContent = isHidden ? 'Cambia Password' : 'Annulla Cambio Password'; mgmtNewPasswordInput.value = ''; if (!isHidden) mgmtNewPasswordInput.focus(); playSound(clickSound); };

// --- Funzioni High Score, Checkpoint, Classifica ---
function populateLeaderboard() { /* ... (invariato) ... */ const userDB = loadUserDatabase(); const players = Object.entries(userDB).map(([nk, data]) => ({ nk, score: parseInt(data.highScore, 10) || 0 })).filter(p => p.score >= 0).sort((a, b) => b.score - a.score); leaderboardList.innerHTML = ''; if (players.length === 0) leaderboardList.innerHTML = '<li>Nessun punteggio.</li>'; else players.slice(0, 10).forEach((p, i) => { const li = document.createElement('li'); li.innerHTML = `<span class="rank-number">${i + 1}.</span> <span class="rank-name">${p.nk}</span> <span class="rank-score">${p.score}</span>`; leaderboardList.appendChild(li); }); if (currentNickname) { const rIdx = players.findIndex(p => p.nk === currentNickname); userRankInfo.textContent = (rIdx !== -1) ? `Tua Posizione: ${rIdx + 1}° (${players[rIdx].score}pt)` : 'Non in classifica.'; } else userRankInfo.textContent = 'Accedi per vedere la tua posizione.'; }
function loadUserProfile(nickname) { /* ... (invariato) ... */ const userDB = loadUserDatabase(); if (nickname && userDB.hasOwnProperty(nickname)) { highScore = parseInt(userDB[nickname].highScore, 10) || 0; currentUserCheckpoint = parseInt(userDB[nickname].lastCheckpoint, 10) || 0; } else { highScore = 0; currentUserCheckpoint = 0; } console.log(`Profilo (${nickname||'N/A'}): HS=${highScore}, CP=${currentUserCheckpoint}`); }
function saveUserHighScore() { /* ... (invariato) ... */ if (!currentNickname) return; const userDB = loadUserDatabase(); if (userDB.hasOwnProperty(currentNickname)) { const currentDbHighScore = parseInt(userDB[currentNickname].highScore, 10) || 0; if (score > currentDbHighScore) { userDB[currentNickname].highScore = score; saveUserDatabase(userDB); console.log(`Nuovo HS salvato (${score}) per ${currentNickname}.`); highScore = score; } else console.log(`Punteggio (${score}) non è nuovo HS per ${currentNickname} (${currentDbHighScore}).`); } else console.warn(`Utente ${currentNickname} non trovato per salvataggio HS.`); }
function updateCheckpointIfNecessary(currentScore) { /* ... (invariato) ... */ if (!currentNickname) return; let highestCpReached = CHECKPOINTS.reduce((maxCp, cp) => (currentScore >= cp ? cp : maxCp), 0); if (highestCpReached > currentUserCheckpoint) { console.log(`Nuovo CP: ${highestCpReached} (prec: ${currentUserCheckpoint})`); currentUserCheckpoint = highestCpReached; const userDB = loadUserDatabase(); if (userDB.hasOwnProperty(currentNickname)) { userDB[currentNickname].lastCheckpoint = currentUserCheckpoint; saveUserDatabase(userDB); console.log(`CP ${currentUserCheckpoint} salvato per ${currentNickname}.`); playSound(checkpointSound); flashFrames = FLASH_DURATION; flashColor = COLOR_COUNTDOWN; } } }

// --- Helper: Controlla se Posizione Occupata ---
function isPositionOccupied(position, ignoreHead = false) { /* ... (invariato) ... */ if (!position) return false; if (isPositionOnSnake(position, ignoreHead)) return true; if (isPositionOnObstacles(position)) return true; if (food && food.x === position.x && food.y === position.y) return true; if (clusterChildApples.some(child => child.x === position.x && child.y === position.y)) return true; return false; }

// --- Funzioni Disegno Canvas ---
function createParticles(x, y, color) { /* ... (invariato) ... */ for (let i = 0; i < PARTICLE_COUNT; i++) particles.push({ x: x + gridSize / 2, y: y + gridSize / 2, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: PARTICLE_LIFE + Math.random() * 10, color: color, size: Math.random() * 3 + 1 }); }
function updateAndDrawParticles() { /* ... (invariato) ... */ ctx.globalAlpha = 1.0; for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx; p.y += p.vy; p.life--; if (p.life <= 0) particles.splice(i, 1); else { ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.life / PARTICLE_LIFE); ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); } } ctx.globalAlpha = 1.0; }
function fillRoundedRect(ctx, x, y, w, h, r) { /* ... (invariato) ... */ r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill(); }
function strokeRoundedRect(ctx, x, y, w, h, r) { /* ... (invariato) ... */ r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.stroke(); }
function clearCanvas() { /* ... (invariato) ... */ let shX = 0, shY = 0; if (shakeFrames > 0) { shX = (Math.random() - 0.5) * SHAKE_INTENSITY * 2; shY = (Math.random() - 0.5) * SHAKE_INTENSITY * 2; shakeFrames--; } ctx.save(); ctx.translate(shX, shY); ctx.fillStyle = COLOR_BACKGROUND; ctx.fillRect(-shX, -shY, gameBoard.width, gameBoard.height); }
function drawSnakeSegment(seg) { /* ... (invariato) ... */ const x = seg.x * gridSize, y = seg.y * gridSize; ctx.fillStyle = COLOR_SNAKE_BODY; fillRoundedRect(ctx, x + 1, y + 1, gridSize - 2, gridSize - 2, cornerRadius); ctx.strokeStyle = COLOR_SNAKE_BORDER; ctx.lineWidth = 1; strokeRoundedRect(ctx, x + 1, y + 1, gridSize - 2, gridSize - 2, cornerRadius); }
function drawSnake() { if(snake) snake.forEach(drawSnakeSegment); } // Aggiunto check snake
function drawFood() { /* ... (invariato) ... */ if (food && typeof food.x !== 'undefined') { const x = food.x * gridSize, y = food.y * gridSize; let bodyC, borderC, pulseD, sizeScale = 1.0; switch (food.type) { case 'golden': bodyC = COLOR_FOOD_GOLD_BODY; borderC = COLOR_FOOD_GOLD_BORDER; pulseD = 200; break; case 'blue': bodyC = COLOR_FOOD_BLUE_BODY; borderC = COLOR_FOOD_BLUE_BORDER; pulseD = 80; break; case CLUSTER_APPLE_TYPE: bodyC = COLOR_FOOD_BODY; borderC = COLOR_FOOD_BORDER; pulseD = 200; sizeScale = CLUSTER_APPLE_SIZE_SCALE; break; default: bodyC = COLOR_FOOD_BODY; borderC = COLOR_FOOD_BORDER; pulseD = 200; break; } const pulseV = 1 + Math.sin(Date.now() / pulseD) * 0.1; const baseSize = gridSize - 2; const size = baseSize * sizeScale * pulseV; const offset = (gridSize - size) / 2; ctx.fillStyle = bodyC; fillRoundedRect(ctx, x + offset, y + offset, size, size, cornerRadius); ctx.strokeStyle = borderC; ctx.lineWidth = 1; strokeRoundedRect(ctx, x + offset, y + offset, size, size, cornerRadius); } if (clusterChildApples.length > 0) { const childBC = COLOR_FOOD_BODY; const childBrC = COLOR_FOOD_BORDER; const childPD = 250; clusterChildApples.forEach(child => { const x = child.x * gridSize, y = child.y * gridSize; const pulseV = 1 + Math.sin(Date.now() / childPD) * 0.1; const size = (gridSize - 2) * pulseV; const offset = (gridSize - size) / 2; ctx.fillStyle = childBC; fillRoundedRect(ctx, x + offset, y + offset, size, size, cornerRadius); ctx.strokeStyle = childBrC; ctx.lineWidth = 1; strokeRoundedRect(ctx, x + offset, y + offset, size, size, cornerRadius); }); } }
function drawTextScreen(text, color, size) { /* ... (invariato) ... */ if (!ctx) return; ctx.fillStyle = color; ctx.font = `${size}px "Press Start 2P"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, gameBoard.width / 2, gameBoard.height / 2); }
function drawPauseScreen() { /* ... (invariato) ... */ if (!ctx) return; ctx.fillStyle = COLOR_PAUSE_BG; ctx.fillRect(0, 0, gameBoard.width, gameBoard.height); drawTextScreen('PAUSA', COLOR_PAUSE_TEXT, 28); ctx.font = '12px "Press Start 2P"'; ctx.fillText('Premi SPAZIO per riprendere', gameBoard.width / 2, gameBoard.height / 2 + 30); }

// --- Funzioni Gestione Ostacoli ---
function drawObstacles() { /* ... (invariato) ... */ if (!ctx) return; ctx.fillStyle = COLOR_OBSTACLE; obstacles.forEach(obs => ctx.fillRect(obs.x * gridSize + 2, obs.y * gridSize + 2, gridSize - 4, gridSize - 4)); }
function isPositionOnObstacles(pos) { /* ... (invariato) ... */ if (!pos) return false; return obstacles.some(obs => obs.x === pos.x && obs.y === pos.y); }
function addObstacle() { /* ... (invariato) ... */ if (obstacles.length >= MAX_OBSTACLES || score < CHECKPOINTS[OBSTACLE_START_CHECKPOINT_INDEX]) return; let newObsPos; let validPos = false; let attempts = 0; const maxAtt = boardSize * boardSize; do { newObsPos = { x: getRandomGridPosition(), y: getRandomGridPosition() }; validPos = !isPositionOccupied(newObsPos); attempts++; } while (!validPos && attempts < maxAtt); if (validPos) { obstacles.push(newObsPos); console.log("Ostacolo aggiunto:", newObsPos); } else { console.warn("No pos for obstacle"); } }

// --- Funzioni Mele Speciali ---
function handleBlueAppleTimeout() { /* ... (invariato) ... */ console.log("Timeout Mela Blu!"); if (food?.type === 'blue') { console.log("Mela Blu scaduta, sostituita."); playSound(blueAppleTimeoutSound); food = getRandomFoodPosition('normal'); } else { console.log("Timeout ignorato (cibo non più blu)."); } blueAppleTimeoutId = null; blueAppleExpiryTime = null; }
function resetSnakeSpeed() { /* ... (invariato) ... */ console.log("Speed boost terminato."); snakeSpeed = DEFAULT_SNAKE_SPEED; isSpeedBoostActive = false; speedBoostTimeoutId = null; speedBoostExpiryTime = null; }

// --- Logica Principale del Gioco ---
function resetGameTimersAndState() { /* ... (invariato, resetta tutto) ... */ clearTimeout(gameLoopTimeout); clearTimeout(blueAppleTimeoutId); clearTimeout(speedBoostTimeoutId); gameLoopTimeout = null; blueAppleTimeoutId = null; speedBoostTimeoutId = null; blueAppleExpiryTime = null; speedBoostExpiryTime = null; isGameOver = false; isPaused = false; gameStarted = false; isCountingDown = false; wasGameRunningBeforeModal = false; obstacles = []; particles = []; shakeFrames = 0; flashFrames = 0; flashColor = null; changingDirection = false; dx = 1; dy = 0; snakeSpeed = DEFAULT_SNAKE_SPEED; isSpeedBoostActive = false; isClusterModeActive = false; clusterChildApples = []; food = {}; console.log("Game timers and state reset."); }
function showStartScreen() { /* ... (invariato) ... */ console.log("Showing Start Screen"); document.body.classList.remove('game-active'); resetGameTimersAndState(); loadUserProfile(currentNickname); displayNickname(currentNickname); if (!ctx) { console.error("Cannot draw start screen: Canvas context not available."); return; } clearCanvas(); ctx.restore(); drawTextScreen('Premi un tasto', COLOR_TEXT_PRIMARY, 16); ctx.font = '12px "Press Start 2P"'; ctx.fillText('o SWIPE per iniziare!', gameBoard.width / 2, gameBoard.height / 2 + 40); ctx.fillStyle = COLOR_TEXT_SECONDARY; ctx.font = '10px "Press Start 2P"'; ctx.fillText('Frecce/Swipe = Muovi', gameBoard.width / 2, gameBoard.height / 2 + 90); ctx.fillText('Spazio = Pausa', gameBoard.width / 2, gameBoard.height / 2 + 115); score = 0; if(scoreElement) scoreElement.textContent = score; if(inGameScoreElement) inGameScoreElement.textContent = score; }
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function startGame() {
    console.log("Attempting startGame()...");
    if (!ctx) { console.error("Cannot start game: Canvas context not available."); return; } // Verifica contesto
    const isModal = [...document.querySelectorAll('.modal-overlay.active')].length > 0;
    if (isCountingDown || gameStarted || isModal) { console.warn("Start blocked:", {isCountingDown, gameStarted, isModal}); return; }

    // LOG STATO PRIMA DI INIZIARE
    console.log("startGame - Current State:", { gameStarted, isPaused, isGameOver, isCountingDown });

    isCountingDown = true; // Imposta subito
    loadUserProfile(currentNickname);
    resetGameTimersAndState(); // Resetta TUTTO tranne isCountingDown
    isCountingDown = true; // Ri-assicura dopo reset
    score = currentUserCheckpoint;
    dx = 1; dy = 0;

    console.log(`Starting game with score: ${score}`);
    if(gameOverOverlay) gameOverOverlay.classList.remove('active');
    if(scoreElement) scoreElement.textContent = score;
    if(inGameScoreElement) inGameScoreElement.textContent = score;
    document.body.classList.add('game-active');
    const startX = Math.floor(boardSize / 4), startY = Math.floor(boardSize / 2); // Posizione iniziale più centrale
    snake = [{x: startX, y: startY}, {x: startX-1, y: startY}, {x: startX-2, y: startY}];
    food = getRandomFoodPosition();
    obstacles = [];
    const startObsCount = CHECKPOINTS.findIndex(cp => cp > score); if (startObsCount > OBSTACLE_START_CHECKPOINT_INDEX) { const numObs = Math.min(MAX_OBSTACLES, startObsCount - OBSTACLE_START_CHECKPOINT_INDEX); console.log(`Starting with ${numObs} obstacles.`); for (let i = 0; i < numObs; i++) addObstacle(); }

    try {
        console.log("Starting countdown...");
        for (let i = 3; i > 0; i--) {
            // LOG STATO DURANTE COUNTDOWN
            console.log("Countdown - Current State:", { gameStarted, isPaused, isGameOver, isCountingDown });
            if (isGameOver || !isCountingDown) { // Controllo più robusto
                 console.log("Countdown interrupted.");
                 resetGameTimersAndState(); // Reset completo
                 showStartScreen(); return;
            }
            clearCanvas(); playSound(countdownBlipSound); drawTextScreen(i.toString(), COLOR_COUNTDOWN, 48); ctx.restore();
            await delay(1000);
        }
        console.log("Countdown finished.");
    } catch (e) { console.error("Countdown error:", e); isCountingDown = false; showStartScreen(); return; }

    // Ricontrolla stato dopo il delay finale
     if (isGameOver || !isCountingDown) { // Aggiunto !isCountingDown check
         console.log("State changed during final countdown delay.");
         resetGameTimersAndState();
         showStartScreen(); return;
     }

    isCountingDown = false; gameStarted = true; // Ora il gioco è ufficialmente iniziato
    console.log("Starting main loop - Final State:", { gameStarted, isPaused, isGameOver, isCountingDown });
    playSound(startGameSound);
    mainLoop();
}
function mainLoop() {
    // Log stato all'inizio di mainLoop
    // console.log("mainLoop Tick - State:", { gameStarted, isPaused, isGameOver, isCountingDown });
    if (isGameOver || isPaused || isCountingDown) {
        console.log("mainLoop aborted at start:", { isGameOver, isPaused, isCountingDown });
        return; // Esce se lo stato non è corretto
    }

    // Cancella il timeout precedente se esiste (sicurezza aggiuntiva)
    if (gameLoopTimeout) clearTimeout(gameLoopTimeout);

    gameLoopTimeout = setTimeout(() => {
        // Ricontrolla lo stato all'interno del setTimeout callback
        if (isGameOver || isPaused || isCountingDown) {
            console.log("mainLoop timeout callback aborted:", { isGameOver, isPaused, isCountingDown });
            return;
        }
        try {
            changingDirection = false; clearCanvas(); drawObstacles(); moveSnake();
            // Controlla se moveSnake ha causato Game Over
            if (isGameOver) { ctx.restore(); showGameOver(); return; }
            // Ricontrolla pausa/countdown dopo moveSnake
            if (isPaused || isCountingDown) { ctx.restore(); return; }
            drawFood(); drawSnake(); updateAndDrawParticles();
            if (flashFrames > 0) { ctx.fillStyle = flashColor || COLOR_COUNTDOWN; ctx.globalAlpha = 0.3 * (flashFrames / FLASH_DURATION); ctx.fillRect(0, 0, gameBoard.width, gameBoard.height); ctx.globalAlpha = 1.0; flashFrames--; }
            ctx.restore(); // Corrisponde a save() in clearCanvas
            mainLoop(); // Pianifica il prossimo ciclo
        } catch (error) {
            console.error("ERRORE nel ciclo principale (mainLoop):", error);
            // Potrebbe essere utile fermare il gioco qui per evitare loop di errori
            isGameOver = true; // Forza game over
            resetGameTimersAndState();
            showGameOver(); // Mostra schermata di game over (o un messaggio di errore)
        }
    }, snakeSpeed);
}
function moveSnake() { /* ... (invariato) ... */ if (isGameOver || isPaused || isCountingDown) return; const head = snake[0]; const newHead = { x: head.x + dx, y: head.y + dy }; const wall = newHead.x < 0 || newHead.x >= boardSize || newHead.y < 0 || newHead.y >= boardSize; const self = isPositionOnSnake(newHead, true); const obs = isPositionOnObstacles(newHead); if (wall || self || obs) { triggerGameOverEffects(); isGameOver = true; console.log(`Collision: ${wall?'Wall':self?'Self':'Obstacle'}`); return; } snake.unshift(newHead); let ate = false; if (food && newHead.x === food.x && newHead.y === food.y) { ate = true; const type = food.type; let pts = 0, pColor = COLOR_FOOD_BODY, sfx = eatSound; if (type === 'blue') { clearTimeout(blueAppleTimeoutId); blueAppleTimeoutId = null; blueAppleExpiryTime = null; } switch (type) { case 'golden': pts = GOLDEN_FOOD_SCORE; pColor = COLOR_FOOD_GOLD_BODY; sfx = goldenFoodSound; console.log("Ate Golden"); food = getRandomFoodPosition(); break; case 'blue': pts = BLUE_APPLE_SCORE; pColor = COLOR_FOOD_BLUE_BODY; sfx = blueAppleSound; console.log("Ate Blue"); snakeSpeed = BLUE_APPLE_SPEED_BOOST_MS; isSpeedBoostActive = true; speedBoostExpiryTime = Date.now() + BLUE_APPLE_SPEED_BOOST_DURATION_MS; clearTimeout(speedBoostTimeoutId); speedBoostTimeoutId = setTimeout(resetSnakeSpeed, BLUE_APPLE_SPEED_BOOST_DURATION_MS); food = getRandomFoodPosition(); break; case CLUSTER_APPLE_TYPE: pts = NORMAL_FOOD_SCORE; pColor = COLOR_FOOD_BODY; sfx = eatSound; console.log("Ate Cluster"); isClusterModeActive = true; clusterChildApples = []; food = {}; let placed = 0, att = 0; const maxAtt = boardSize * boardSize * 2; while (placed < CLUSTER_APPLE_CHILD_COUNT && att < maxAtt) { const cPos = {x: getRandomGridPosition(), y:getRandomGridPosition()}; if (!isPositionOccupied(cPos)) { clusterChildApples.push(cPos); placed++; console.log(`Placed child ${placed}/${CLUSTER_APPLE_CHILD_COUNT}`); } att++; } if (placed < CLUSTER_APPLE_CHILD_COUNT) console.warn(`Only placed ${placed} children.`); break; default: pts = NORMAL_FOOD_SCORE; pColor = COLOR_FOOD_BODY; sfx = eatSound; food = getRandomFoodPosition(); break; } if (pts > 0) { score += pts; if(scoreElement) scoreElement.textContent = score; if(inGameScoreElement) inGameScoreElement.textContent = score; updateCheckpointIfNecessary(score); if (sfx) playSound(sfx); createParticles(newHead.x * gridSize, newHead.y * gridSize, pColor); if (type !== CLUSTER_APPLE_TYPE) addObstacle(); } } else if (isClusterModeActive) { const childIdx = clusterChildApples.findIndex(c => c.x === newHead.x && c.y === newHead.y); if (childIdx !== -1) { ate = true; const eatenChild = clusterChildApples[childIdx]; console.log("Ate Child"); clusterChildApples.splice(childIdx, 1); score += CLUSTER_CHILD_SCORE; if(scoreElement) scoreElement.textContent = score; if(inGameScoreElement) inGameScoreElement.textContent = score; updateCheckpointIfNecessary(score); playSound(eatSound); createParticles(newHead.x * gridSize, newHead.y * gridSize, COLOR_FOOD_BODY); console.log(`${clusterChildApples.length} children left.`); if (clusterChildApples.length === 0) { console.log("Cluster complete."); isClusterModeActive = false; food = getRandomFoodPosition(); addObstacle(); } } } if (!ate) snake.pop(); }
function triggerGameOverEffects() { /* ... (invariato) ... */ if (!isGameOver) { playSound(gameOverSound); shakeFrames = SHAKE_DURATION; } }
function showGameOver() { /* ... (invariato) ... */ const finalScore = score; const wasCluster = isClusterModeActive; resetGameTimersAndState(); isGameOver = true; gameStarted = false; if (currentNickname) saveUserHighScore(); if(scoreFinaleElement) scoreFinaleElement.textContent = finalScore; if (gameOverOverlay && !gameOverOverlay.classList.contains('active')) gameOverOverlay.classList.add('active'); if (wasCluster) console.log("Game over in cluster mode."); }
function getRandomGridPosition() { /* ... (invariato) ... */ return Math.floor(Math.random() * boardSize); }
function getRandomFoodPosition(forceType = null) { /* ... (invariato) ... */ if (isClusterModeActive) return {}; let newFoodPos, type; if (forceType === 'normal') type = 'normal'; else { const canBlue = score >= CHECKPOINTS[BLUE_APPLE_START_CHECKPOINT_INDEX]; const canCluster = score >= CLUSTER_APPLE_CHECKPOINT; const rand = Math.random(); let prob = 0; if (canBlue && rand < (prob += BLUE_APPLE_CHANCE)) type = 'blue'; else if (rand < (prob += GOLDEN_FOOD_CHANCE)) type = 'golden'; else if (canCluster && rand < (prob += CLUSTER_APPLE_CHANCE)) type = CLUSTER_APPLE_TYPE; else type = 'normal'; } let att = 0; const maxAtt = boardSize * boardSize; do { newFoodPos = {x: getRandomGridPosition(), y: getRandomGridPosition()}; att++; } while (isPositionOccupied(newFoodPos) && att < maxAtt); if (att >= maxAtt) { console.warn("No free pos for food."); newFoodPos = {x: getRandomGridPosition(), y: getRandomGridPosition()}; } clearTimeout(blueAppleTimeoutId); blueAppleTimeoutId = null; blueAppleExpiryTime = null; const newFood = { ...newFoodPos, type: type }; if (newFood.type === 'blue') { console.log(`Blue generated at [${newFood.x},${newFood.y}].`); blueAppleExpiryTime = Date.now() + BLUE_APPLE_LIFETIME_MS; blueAppleTimeoutId = setTimeout(handleBlueAppleTimeout, BLUE_APPLE_LIFETIME_MS); } else if (newFood.type === CLUSTER_APPLE_TYPE) { console.log(`Cluster generated at [${newFood.x},${newFood.y}].`); } return newFood; }
function isPositionOnSnake(pos, ignoreHead = false) { /* ... (invariato) ... */ if (!pos || !snake) return false; const start = ignoreHead ? 1 : 0; for (let i = start; i < snake.length; i++) { if (snake[i].x === pos.x && snake[i].y === pos.y) return true; } return false; }

// --- Gestione Input (Tastiera + Touch) ---
function handleKeyDown(event) {
    console.log(`Key Down: ${event.keyCode}`); // LOG evento
    const isModal = [...document.querySelectorAll('.modal-overlay.active')].length > 0;
    if (isModal && event.keyCode === ESC_KEY) { const active = document.querySelector('.modal-overlay.active'); if (active) closeModal(active); return; }
    if (isModal) { console.log("Key blocked by modal"); return; }
    const key = event.keyCode; const isDir = [LEFT_KEY, RIGHT_KEY, UP_KEY, DOWN_KEY].includes(key);
    // LOG stato PRIMA di decidere
    console.log("Key Handler State:", { gameStarted, isPaused, isGameOver, isCountingDown });
    if (isDir && !gameStarted && !isPaused && !isGameOver && !isCountingDown) { console.log(">>> Starting Game via Key <<<"); playSound(clickSound); startGame(); return; }
    if (isDir && gameStarted && !isPaused && !isGameOver && !isCountingDown) { changeDirection(key); return; }
    if (key === SPACE_KEY && gameStarted && !isGameOver && !isCountingDown) { event.preventDefault(); console.log(">>> Toggling Pause <<<"); togglePause(); return; }
    console.log("Key ignored or blocked.");
}
function handleTouchStart(event) { /* ... (invariato) ... */ const touch = event.touches[0]; touchStartX = touch.clientX; touchStartY = touch.clientY; }
function handleTouchEnd(event) {
    if (touchStartX === 0 && touchStartY === 0) return;
    const touch = event.changedTouches[0]; touchEndX = touch.clientX; touchEndY = touch.clientY;
    const dX = touchEndX - touchStartX, dY = touchEndY - touchStartY, absX = Math.abs(dX), absY = Math.abs(dY);
    touchStartX = 0; touchStartY = 0; // Reset
    const isSwipe = absX > MIN_SWIPE_DISTANCE || absY > MIN_SWIPE_DISTANCE;
    // LOG stato PRIMA di decidere
    console.log("Touch Handler State:", { gameStarted, isPaused, isGameOver, isCountingDown });
    if (!gameStarted && !isPaused && !isGameOver && !isCountingDown) {
        if (isSwipe || (absX < MIN_SWIPE_DISTANCE && absY < MIN_SWIPE_DISTANCE && absX + absY > 5)) { console.log(">>> Starting Game via Touch <<<"); playSound(clickSound); startGame(); return; }
    }
    if (isSwipe && gameStarted && !isPaused && !isGameOver && !isCountingDown) {
        let dir = null;
        if (absX > absY) { if (absY < MAX_OFF_AXIS_DISTANCE) dir = dX > 0 ? RIGHT_KEY : LEFT_KEY; }
        else { if (absX < MAX_OFF_AXIS_DISTANCE) dir = dY > 0 ? DOWN_KEY : UP_KEY; }
        if (dir !== null) { console.log(`Swipe: ${dir===LEFT_KEY?'L':dir===RIGHT_KEY?'R':dir===UP_KEY?'U':'D'}`); changeDirection(dir); }
        else console.log("Swipe unclear.");
    }
}
function handleTouchMove(event) { /* ... (invariato) ... */ if (gameStarted && !isPaused && !isGameOver) event.preventDefault(); }
function togglePause() { /* ... (invariato) ... */ if (!gameStarted || isGameOver || isCountingDown) return; isPaused = !isPaused; playSound(clickSound); if (isPaused) { clearTimeout(gameLoopTimeout); gameLoopTimeout = null; clearTimeout(blueAppleTimeoutId); blueAppleTimeoutId = null; clearTimeout(speedBoostTimeoutId); speedBoostTimeoutId = null; clearCanvas(); ctx.restore(); drawPauseScreen(); console.log("Paused."); } else { console.log("Resuming..."); if (food?.type === 'blue' && blueAppleExpiryTime !== null) { const rT = blueAppleExpiryTime - Date.now(); if (rT > 0) blueAppleTimeoutId = setTimeout(handleBlueAppleTimeout, rT); else handleBlueAppleTimeout(); } if (isSpeedBoostActive && speedBoostExpiryTime !== null) { const rBT = speedBoostExpiryTime - Date.now(); if (rBT > 0) speedBoostTimeoutId = setTimeout(resetSnakeSpeed, rBT); else resetSnakeSpeed(); } mainLoop(); } }
function changeDirection(key) { /* ... (invariato) ... */ if (changingDirection || isPaused || isGameOver || !gameStarted || isCountingDown) return; const up = dy === -1, down = dy === 1, left = dx === -1, right = dx === 1; let changed = false; if (key === LEFT_KEY && !right) { dx = -1; dy = 0; changed = true; } else if (key === UP_KEY && !down) { dx = 0; dy = -1; changed = true; } else if (key === RIGHT_KEY && !left) { dx = 1; dy = 0; changed = true; } else if (key === DOWN_KEY && !up) { dx = 0; dy = 1; changed = true; } if (changed) { console.log(`Dir changed: dx=${dx}, dy=${dy}`); changingDirection = true; } }
const handleHomeButtonClick = () => { /* ... (invariato) ... */ console.log("Home clicked."); playSound(clickSound); isGameOver = true; gameStarted = false; isCountingDown = false; isPaused = false; resetGameTimersAndState(); document.body.classList.remove('game-active'); if(gameOverOverlay) gameOverOverlay.classList.remove('active'); showStartScreen(); };
const handleModalOverlayClick = (event) => { /* ... (invariato) ... */ if (event.target.classList.contains('modal-overlay')) closeModal(event.target); };
const handleRestartClick = () => { /* ... (invariato) ... */ console.log("Restart clicked."); playSound(clickSound); if(gameOverOverlay) gameOverOverlay.classList.remove('active'); startGame(); };
const handleLeaderboardClick = () => { /* ... (invariato) ... */ openLeaderboardModal(); };

// --- Setup Event Listeners ---
function setupEventListeners() {
    console.log("Setting up event listeners..."); // LOG setup
    document.removeEventListener('keydown', handleKeyDown); document.addEventListener('keydown', handleKeyDown);
    // Verifica se gameBoard esiste prima di aggiungere listener touch
    if (gameBoard) {
        console.log("gameBoard found, adding touch listeners.");
        gameBoard.removeEventListener('touchstart', handleTouchStart); gameBoard.addEventListener('touchstart', handleTouchStart, { passive: true });
        gameBoard.removeEventListener('touchend', handleTouchEnd); gameBoard.addEventListener('touchend', handleTouchEnd, { passive: true });
        gameBoard.removeEventListener('touchmove', handleTouchMove); gameBoard.addEventListener('touchmove', handleTouchMove, { passive: false });
    } else {
        console.warn("gameBoard NOT found, touch listeners skipped.");
    }
    [loginModal, registrationModal, accountManagementModal, leaderboardModal].forEach(m => { m?.removeEventListener('click', handleModalOverlayClick); m?.addEventListener('click', handleModalOverlayClick); });
    restartButton?.removeEventListener('click', handleRestartClick); restartButton?.addEventListener('click', handleRestartClick);
    accountButton?.removeEventListener('click', handleAccountButtonClick); accountButton?.addEventListener('click', handleAccountButtonClick);
    homeButton?.removeEventListener('click', handleHomeButtonClick); homeButton?.addEventListener('click', handleHomeButtonClick);
    leaderboardButton?.removeEventListener('click', handleLeaderboardClick); leaderboardButton?.addEventListener('click', handleLeaderboardClick);
    closeLoginModalButton?.removeEventListener('click', closeLoginModal); closeLoginModalButton?.addEventListener('click', closeLoginModal);
    loginForm?.removeEventListener('submit', handleLoginFormSubmit); loginForm?.addEventListener('submit', handleLoginFormSubmit);
    showRegistrationButton?.removeEventListener('click', switchToRegistration); showRegistrationButton?.addEventListener('click', switchToRegistration);
    closeRegistrationModalButton?.removeEventListener('click', closeRegistrationModal); closeRegistrationModalButton?.addEventListener('click', closeRegistrationModal);
    registrationForm?.removeEventListener('submit', handleRegistrationFormSubmit); registrationForm?.addEventListener('submit', handleRegistrationFormSubmit);
    showLoginButton?.removeEventListener('click', switchToLogin); showLoginButton?.addEventListener('click', switchToLogin);
    closeMgmtModalButton?.removeEventListener('click', closeAccountManagementModal); closeMgmtModalButton?.addEventListener('click', closeAccountManagementModal);
    accountManagementForm?.removeEventListener('submit', handleAccountManagementFormSubmit); accountManagementForm?.addEventListener('submit', handleAccountManagementFormSubmit);
    logoutButton?.removeEventListener('click', handleLogout); logoutButton?.addEventListener('click', handleLogout);
    togglePasswordChangeButton?.removeEventListener('click', handleTogglePasswordChange); togglePasswordChangeButton?.addEventListener('click', handleTogglePasswordChange);
    closeLeaderboardButton?.removeEventListener('click', closeLeaderboardModal); closeLeaderboardButton?.addEventListener('click', closeLeaderboardModal);
    console.log("Event listeners setup complete.");
}

// --- Inizializzazione Globale ---
function initializeGame() {
    console.log("Initializing Game...");
    // Controlli robusti per elementi essenziali
    if (!gameBoard || !ctx) {
         console.error("ERRORE CRITICO: Impossibile inizializzare il gioco senza gameBoard o context.");
         // Potresti mostrare un messaggio all'utente nell'HTML qui
         document.body.innerHTML = '<h1 style="color:red; text-align:center; padding-top: 50px;">Errore critico: Impossibile caricare l\'area di gioco.</h1>';
         return; // Blocca ulteriore inizializzazione
    }
    currentNickname = null; score = 0; highScore = 0; currentUserCheckpoint = 0; food = {}; snake = [];
    resetGameTimersAndState(); // Assicurati che lo stato sia pulito
    console.log("Initial State after reset:", { gameStarted, isPaused, isGameOver, isCountingDown }); // LOG stato iniziale
    loadUserProfile(null); displayNickname(null); setupEventListeners(); showStartScreen();
    console.warn("SICUREZZA: Hashing password LATO CLIENT SENZA SALT in localStorage. NON sicuro per dati sensibili.");
    console.log("Initialization Complete. Ready to play.");
}

// --- Avvio ---
// Usa try-catch attorno all'inizializzazione per catturare errori imprevisti
try {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGame);
    } else {
        initializeGame();
    }
} catch (error) {
    console.error("ERRORE CRITICO durante l'inizializzazione o l'aggancio dell'evento DOMContentLoaded:", error);
     document.body.innerHTML = '<h1 style="color:red; text-align:center; padding-top: 50px;">Errore critico durante l\'avvio del gioco.</h1>';
}

console.log("--- Snake Game Script Parsed (with Debug Logs) ---");