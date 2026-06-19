document.addEventListener("DOMContentLoaded", () => {
    
    // Captura de Elementos da Interface
    const bossScene = document.getElementById("boss-fight-scene");
    const gameOverScene = document.getElementById("game-over-scene");
    const loginScene = document.getElementById("login-scene");
    const tavernDashboard = document.getElementById("tavern-dashboard");
    const gateContainer = document.getElementById("tavern-gate-container");
    const cinematicBanner = document.getElementById("cinematic-banner");
    const damageOverlay = document.getElementById("player-damage-overlay");
    
    const playerCannon = document.getElementById("player-cannon");
    const crosshair = document.getElementById("crosshair");
    const timerDisplay = document.getElementById("timer");
    const playerHpText = document.getElementById("player-hp-text");
    const hpPlayerBar = document.getElementById("hp-player");
    
    const targetMainShip = document.getElementById("enemy-ship");
    const targetEscortShip = document.getElementById("escort-ship");
    const targetKraken = document.getElementById("kraken-boss");

    // Configurações Globais de Atributos e Estados
    let hp = { main: 100, escort: 50, kraken: 80 };
    let playerHp = 100; // ATRIBUTO DE VIDA DO JOGADOR
    let timeLeft = 30;
    let gameInterval = null;
    let enemyAttackInterval = null;
    let gameActive = false;

    /* ==========================================================================
       1. ENGENHARIA DE MIRA E DEFESA DO JOGADOR
       ========================================================================== */
    window.addEventListener("mousemove", (e) => {
        if (!gameActive) return;
        crosshair.style.left = `${e.clientX}px`;
        crosshair.style.top = `${e.clientY}px`;
        
        const cannonRect = playerCannon.getBoundingClientRect();
        const cX = cannonRect.left + cannonRect.width / 2;
        const cY = cannonRect.top + cannonRect.height;
        
        let angle = Math.atan2(e.clientX - cX, -(e.clientY - cY)) * (180 / Math.PI);
        angle = Math.max(-45, Math.min(45, angle));
        
        playerCannon.style.transform = `rotate(${angle}deg)`;
    });

    window.addEventListener("click", (e) => {
        if (!gameActive || e.clientY < 120) return;
        firePlayerCannon(e.clientX, e.clientY);
    });

    function firePlayerCannon(tx, ty) {
        playerCannon.classList.remove("cannon-recoil");
        void playerCannon.offsetWidth; 
        playerCannon.classList.add("cannon-recoil");

        const ball = document.createElement("div");
        ball.className = "cannon-ball";
        const cRect = playerCannon.getBoundingClientRect();
        ball.style.left = `${cRect.left + cRect.width / 2}px`;
        ball.style.top = `${cRect.top}px`;
        document.body.appendChild(ball);

        setTimeout(() => {
            ball.style.transition = "all 0.22s cubic-bezier(0.25, 1, 0.5, 1)";
            ball.style.left = `${tx}px`;
            ball.style.top = `${ty}px`;
        }, 10);

        setTimeout(() => {
            ball.remove();
            generateExplosion(tx, ty, "#d97706", 12, 0.3);
            generateExplosion(tx, ty, "#ef4444", 6, 0.2);
            verifyImpact(tx, ty);
        }, 230);
    }

    /* ==========================================================================
       2. INTELIGÊNCIA INIMIGA: ATAQUES CONTRA A VIDA DO JOGADOR
       ========================================================================== */
    function launchEnemyArtillery() {
        enemyAttackInterval = setInterval(() => {
            if (!gameActive) return;

            let activeAttackers = [];
            if (hp.main > 0) activeAttackers.push({ type: "galleon", element: targetMainShip });
            if (hp.escort > 0) activeAttackers.push({ type: "sloop", element: targetEscortShip });
            if (hp.kraken > 0) activeAttackers.push({ type: "kraken", element: targetKraken });

            if (activeAttackers.length === 0) return;
            const attacker = activeAttackers[Math.floor(Math.random() * activeAttackers.length)];
            
            let originX, originY;

            if (attacker.type === "galleon") {
                const randomPortId = `galleon-port-${Math.floor(Math.random() * 3) + 1}`;
                const portElement = document.getElementById(randomPortId);
                const portRect = portElement.getBoundingClientRect();
                originX = portRect.left + portRect.width / 2;
                originY = portRect.top + portRect.height / 2;
                
                portElement.classList.add("muzzle-flash");
                setTimeout(() => portElement.classList.remove("muzzle-flash"), 250);
            } 
            else if (attacker.type === "sloop") {
                const portElement = document.getElementById("sloop-port-1");
                const portRect = portElement.getBoundingClientRect();
                originX = portRect.left + portRect.width / 2;
                originY = portRect.top + portRect.height / 2;
                
                portElement.classList.add("muzzle-flash");
                setTimeout(() => portElement.classList.remove("muzzle-flash"), 250);
            } 
            else {
                const kRect = attacker.element.getBoundingClientRect();
                originX = kRect.left + kRect.width / 2;
                originY = kRect.top + kRect.height / 3;
            }

            const pRect = playerCannon.getBoundingClientRect();
            const targetX = pRect.left + pRect.width / 2 + (Math.random() - 0.5) * 80;
            const targetY = window.innerHeight - 30;

            const enemyBall = document.createElement("div");
            enemyBall.className = "cannon-ball";
            enemyBall.style.background = attacker.type === "kraken" ? "#c084fc" : "#f97316";
            enemyBall.style.left = `${originX}px`;
            enemyBall.style.top = `${originY}px`;
            document.body.appendChild(enemyBall);

            setTimeout(() => {
                enemyBall.style.transition = "all 0.38s cubic-bezier(0.25, 0, 0.75, 1)";
                enemyBall.style.left = `${targetX}px`;
                enemyBall.style.top = `${targetY}px`;
            }, 15);

            setTimeout(() => {
                enemyBall.remove();
                generateExplosion(targetX, targetY, "#dc2626", 16, 0.45);
                
                // Reduz e processa o dano causado à integridade do jogador
                processPlayerDamage(15); 
            }, 395);

        }, 1000); 
    }

    function processPlayerDamage(amount) {
        if (!gameActive) return;
        playerHp = Math.max(0, playerHp - amount);
        playerHpText.textContent = playerHp;
        hpPlayerBar.style.width = `${playerHp}%`;

        damageOverlay.classList.add("take-damage-flash");
        bossScene.classList.add("shake");
        
        setTimeout(() => {
            damageOverlay.classList.remove("take-damage-flash");
            bossScene.classList.remove("shake");
        }, 220);

        if (playerHp <= 0) {
            endSession(false); // Game Over se a vida zerar
        }
    }

    /* ==========================================================================
       3. CONTROLE DE SESSÃO E PROCESSAMENTO DE ACERTOS
       ========================================================================== */
    function verifyImpact(x, y) {
        if (hp.main > 0 && checkBounds(x, y, targetMainShip)) {
            hp.main -= 10;
            updateUIBar("hp-ship-main", hp.main);
            if (hp.main <= 0) destroyTarget(targetMainShip, "ship-sinking");
            return;
        }
        if (hp.escort > 0 && checkBounds(x, y, targetEscortShip)) {
            hp.escort -= 10;
            updateUIBar("hp-ship-escort", hp.escort);
            if (hp.escort <= 0) destroyTarget(targetEscortShip, "ship-sinking");
            return;
        }
        if (hp.kraken > 0 && checkBounds(x, y, targetKraken)) {
            hp.kraken -= 10;
            updateUIBar("hp-kraken", hp.kraken);
            if (hp.kraken <= 0) destroyTarget(targetKraken, "kraken-dead");
            return;
        }
    }

    function checkBounds(x, y, element) {
        const box = element.getBoundingClientRect();
        return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
    }

    function updateUIBar(id, value) {
        document.getElementById(id).style.width = `${Math.max(0, value)}%`;
    }

    function destroyTarget(target, className) {
        target.classList.add(className);
        const rect = target.getBoundingClientRect();
        generateExplosion(rect.left + rect.width/2, rect.top + rect.height/2, "#ea580c", 30, 0.6);
        
        if (hp.main <= 0 && hp.escort <= 0 && hp.kraken <= 0) {
            routeToVictory();
        }
    }

    function generateExplosion(x, y, color, qty, time) {
        for (let i = 0; i < qty; i++) {
            const p = document.createElement("div");
            p.className = "particle";
            p.style.setProperty("--mx", `${(Math.random() - 0.5) * 180}px`);
            p.style.setProperty("--my", `${(Math.random() - 0.5) * 180}px`);
            p.style.setProperty("--duration", `${time}s`);
            p.style.width = p.style.height = `${Math.random() * 6 + 5}px`;
            p.style.background = color;
            p.style.left = `${x}px`;
            p.style.top = `${y}px`;
            document.body.appendChild(p);
            setTimeout(() => p.remove(), time * 1000);
        }
    }

    function initGameSession() {
        hp = { main: 100, escort: 50, kraken: 80 };
        playerHp = 100;
        timeLeft = 30;
        gameActive = true;

        playerHpText.textContent = playerHp;
        hpPlayerBar.style.width = "100%";
        updateUIBar("hp-ship-main", 100);
        updateUIBar("hp-ship-escort", 100);
        updateUIBar("hp-kraken", 100);
        timerDisplay.textContent = timeLeft;

        targetMainShip.className = "ship-spawn-anim";
        targetEscortShip.className = "ship-spawn-anim";
        targetKraken.className = "kraken-container";
        crosshair.style.display = "block";

        gameInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            if (timeLeft <= 0) {
                // Sobreviveu ao tempo limite = Vitória por defesa armada
                routeToVictory();
            }
        }, 1000);

        launchEnemyArtillery();
    }

    function endSession(isVictory) {
        gameActive = false;
        clearInterval(gameInterval);
        clearInterval(enemyAttackInterval);
        crosshair.style.display = "none";

        if (!isVictory) {
            bossScene.classList.add("hidden");
            gameOverScene.classList.remove("hidden");
        }
    }

    function routeToVictory() {
        gameActive = false;
        clearInterval(gameInterval);
        clearInterval(enemyAttackInterval);
        crosshair.style.display = "none";

        setTimeout(() => {
            bossScene.classList.add("hidden");
            gateContainer.classList.remove("hidden");
            setTimeout(() => {
                gateContainer.classList.add("gate-open");
                loginScene.classList.remove("hidden");
            }, 500);
        }, 1200);
    }

    // Interações de Interface Reversas e Menu de Abas do Códex
    document.getElementById("retry-btn").addEventListener("click", () => {
        gameOverScene.classList.add("hidden");
        bossScene.classList.remove("hidden");
        initGameSession();
    });

    document.getElementById("login-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const userNick = document.getElementById("pirate-name").value;
        loginScene.classList.add("hidden");
        gateContainer.classList.remove("gate-open");

        setTimeout(() => {
            gateContainer.classList.add("hidden");
            document.getElementById("welcome-captain-text").textContent = `Contrato Assinado, Capitão ${userNick}!`;
            cinematicBanner.classList.remove("hidden");
        }, 600);

        setTimeout(() => {
            cinematicBanner.classList.add("hidden");
            tavernDashboard.classList.remove("hidden");
        }, 3200);
    });

    const menuTabs = document.querySelectorAll(".wood-menu .menu-btn:not(#logout-btn)");
    const contentPanels = document.querySelectorAll(".tab-content");

    menuTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            menuTabs.forEach(t => t.classList.remove("active"));
            contentPanels.forEach(p => p.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(`content-${tab.getAttribute("data-target")}`).classList.add("active");
        });
    });

    document.getElementById("logout-btn").addEventListener("click", () => {
        tavernDashboard.classList.add("hidden");
        bossScene.classList.remove("hidden");
        initGameSession();
    });

    // Inicialização forçada automática
    initGameSession();
});