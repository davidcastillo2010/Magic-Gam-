export function iniciarBatalla(contenedor, opciones = {}) {
  contenedor.innerHTML = "";

  const juego = document.createElement("div");
  juego.style.cssText = `
    width:100%;
    color:white;
    font-family:Arial,sans-serif;
    text-align:center;
  `;

  juego.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:8px">
      <div>⭐ RONDA <b id="round">1</b></div>
      <div>🔵 MOBS <b id="mobCount">0</b></div>
      <div>🏰 BASE <b id="baseHealth">100</b></div>
    </div>

    <canvas id="battleCanvas"
      style="width:100%;display:block;border:2px solid #60dfff;border-radius:16px;touch-action:none;background:#8bd7f5">
    </canvas>

    <p id="battleMessage" style="font-size:12px;color:#9deaff">
      Arrastra el cañón de izquierda a derecha.
    </p>

    <button id="fireButton"
      style="width:100%;padding:13px;border:2px solid #d7ffad;border-radius:14px;background:linear-gradient(#8bea50,#269c3d);color:#103b20;font-weight:900;font-size:17px">
      INICIAR BATALLA
    </button>
  `;

  contenedor.appendChild(juego);

  const canvas = juego.querySelector("#battleCanvas");
  const ctx = canvas.getContext("2d");
  const mobCount = juego.querySelector("#mobCount");
  const baseHealth = juego.querySelector("#baseHealth");
  const message = juego.querySelector("#battleMessage");
  const fireButton = juego.querySelector("#fireButton");
  const roundLabel = juego.querySelector("#round");

  const W = 700;
  const H = 900;
  canvas.width = W;
  canvas.height = H;

  let cannonX = W / 2;
  let dragging = false;
  let running = false;
  let finished = false;
  let mobs = [];
  let bullets = [];
  let enemies = [];
  let gates = [];
  let enemyHealth = 100;
  let playerHealth = 100;
  let produced = 0;
  let lastShot = 0;
  let animation = 0;
  let round = 1;
  let lastTime = 0;

  const productionRate = Math.max(
    1,
    Number(opciones.mobsPorSegundo) || 3
  );

  function drawIsland() {
    ctx.clearRect(0, 0, W, H);

    // Cielo
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#65b9f2");
    sky.addColorStop(1, "#c2edff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Nubes
    ctx.fillStyle = "#ffffffaa";
    for (let i = 0; i < 5; i++) {
      const x = (i * 173 + 60) % W;
      const y = 65 + (i % 3) * 35;
      ctx.beginPath();
      ctx.arc(x, y, 25, 0, Math.PI * 2);
      ctx.arc(x + 24, y - 10, 30, 0, Math.PI * 2);
      ctx.arc(x + 48, y, 23, 0, Math.PI * 2);
      ctx.fill();
    }

    // Isla flotante
    ctx.beginPath();
    ctx.moveTo(80, 180);
    ctx.lineTo(620, 180);
    ctx.lineTo(675, 660);
    ctx.lineTo(350, 850);
    ctx.lineTo(25, 660);
    ctx.closePath();
    ctx.fillStyle = "#398e50";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(80, 180);
    ctx.lineTo(620, 180);
    ctx.lineTo(675, 660);
    ctx.lineTo(350, 850);
    ctx.lineTo(25, 660);
    ctx.closePath();
    ctx.strokeStyle = "#a5ef77";
    ctx.lineWidth = 15;
    ctx.stroke();

    // Camino
    ctx.beginPath();
    ctx.moveTo(350, 250);
    ctx.lineTo(350, 730);
    ctx.strokeStyle = "#d9c28c";
    ctx.lineWidth = 115;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(350, 250);
    ctx.lineTo(350, 730);
    ctx.strokeStyle = "#f1d9a2";
    ctx.lineWidth = 90;
    ctx.stroke();

    // Fortaleza enemiga
    ctx.fillStyle = "#873d55";
    ctx.fillRect(275, 195, 150, 75);
    ctx.fillStyle = "#c46c79";
    ctx.fillRect(260, 175, 35, 65);
    ctx.fillRect(405, 175, 35, 65);
    ctx.fillStyle = "#ffe28a";
    ctx.fillRect(325, 220, 50, 50);
    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial";
    ctx.fillText("ENEMIGO", 300, 155);

    // Base del jugador
    ctx.fillStyle = "#3157a5";
    ctx.fillRect(275, 700, 150, 75);
    ctx.fillStyle = "#5f8fe0";
    ctx.fillRect(260, 680, 35, 65);
    ctx.fillRect(405, 680, 35, 65);
    ctx.fillStyle = "#ffe28a";
    ctx.fillRect(325, 725, 50, 50);

    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial";
    ctx.fillText("TU BASE", 305, 810);

    // Puertas multiplicadoras
    gates.forEach(gate => {
      ctx.fillStyle = "#172e68";
      ctx.fillRect(gate.x - 48, gate.y - 24, 96, 48);
      ctx.strokeStyle = "#ffe37b";
      ctx.lineWidth = 5;
      ctx.strokeRect(gate.x - 48, gate.y - 24, 96, 48);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText("×" + gate.value, gate.x, gate.y + 8);
    });

    ctx.textAlign = "left";

    // Cañón
    ctx.save();
    ctx.translate(cannonX, 625);
    ctx.fillStyle = "#273f75";
    ctx.beginPath();
    ctx.ellipse(0, 25, 57, 27, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#c7d4e8";
    ctx.fillRect(-17, -48, 34, 70);

    ctx.fillStyle = "#2878d9";
    ctx.fillRect(-22, -93, 44, 65);

    ctx.fillStyle = "#ffd76a";
    ctx.fillRect(-27, -101, 54, 15);

    ctx.restore();

    // MOBS
    mobs.forEach(mob => {
      ctx.beginPath();
      ctx.arc(mob.x, mob.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#36c8ff";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();
    });

    // Disparos
    bullets.forEach(bullet => {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#ffe36b";
      ctx.fill();
    });

    // Enemigos
    enemies.forEach(enemy => {
      ctx.fillStyle = "#e94c65";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ARRASTRA EL CAÑÓN", 350, 590);
    ctx.textAlign = "left";
  }

  function pointerX(event) {
    const rect = canvas.getBoundingClientRect();
    return (event.clientX - rect.left) * W / rect.width;
  }

  canvas.addEventListener("pointerdown", event => {
    dragging = true;
    cannonX = Math.max(95, Math.min(605, pointerX(event)));
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", event => {
    if (!dragging) return;
    cannonX = Math.max(95, Math.min(605, pointerX(event)));
  });

  canvas.addEventListener("pointerup", () => dragging = false);
  canvas.addEventListener("pointercancel", () => dragging = false);

  function createGates() {
    gates = [
      {x:210, y:430, value:2},
      {x:490, y:430, value:3},
      {x:350, y:330, value:5}
    ];
  }

  function startBattle() {
    if (running) return;

    running = true;
    finished = false;
    produced = 0;
    enemyHealth = 100;
    playerHealth = 100;
    mobs = [];
    bullets = [];
    enemies = [];
    createGates();

    fireButton.textContent = "BATALLA EN CURSO";
    fireButton.disabled = true;
    message.textContent = "¡Mueve el cañón y atraviesa los multiplicadores!";
    lastTime = performance.now();

    requestAnimationFrame(loop);
  }

  function loop(time) {
    if (!running) return;

    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    animation += delta;

    // Producción automática de MOBS
    if (time - lastShot >= 1000 / productionRate) {
      lastShot = time;
      bullets.push({x:cannonX, y:590});
      produced++;
    }

    // Movimiento de disparos
    bullets.forEach(bullet => bullet.y -= 480 * delta);

    bullets = bullets.filter(bullet => {
      if (bullet.y < 600) {
        mobs.push({x:bullet.x, y:bullet.y, speed:115, multiplied:false});
        return false;
      }
      return true;
    });

    // Movimiento de MOBS
    mobs.forEach(mob => {
      mob.y -= mob.speed * delta;

      gates.forEach(gate => {
        if (
          !mob.multiplied &&
          Math.abs(mob.x - gate.x) < 48 &&
          Math.abs(mob.y - gate.y) < 25
        ) {
          mob.multiplied = true;
          for (let i = 1; i < gate.value; i++) {
            mobs.push({
              x:mob.x + (Math.random() * 30 - 15),
              y:mob.y + (Math.random() * 15),
              speed:mob.speed,
              multiplied:true
            });
          }
        }
      });

      if (mob.y < 275) {
        enemyHealth -= 1;
        mob.y = -100;
      }
    });

    mobs = mobs.filter(mob => mob.y > -50);

    // Enemigos
    if (animation > 4 && Math.random() < delta * 0.7) {
      enemies.push({
        x:350 + (Math.random() * 100 - 50),
        y:270,
        speed:35
      });
    }

    enemies.forEach(enemy => {
      enemy.y += enemy.speed * delta;
      if (enemy.y > 650) {
        playerHealth -= 5;
        enemy.y = 1000;
      }
    });

    enemies = enemies.filter(enemy => enemy.y < 900);

    mobCount.textContent = mobs.length + produced;
    baseHealth.textContent = Math.max(0, playerHealth);

    if (enemyHealth <= 0) {
      finish(true);
      return;
    }

    if (playerHealth <= 0) {
      finish(false);
      return;
    }

    drawIsland();
    requestAnimationFrame(loop);
  }

  function finish(won) {
    running = false;
    finished = true;
    fireButton.disabled = false;
    fireButton.textContent = "JUGAR OTRA VEZ";

    if (won) {
      message.textContent = "¡Victoria! Has conquistado la fortaleza.";
      if (typeof opciones.onVictory === "function") {
        opciones.onVictory();
      }
    } else {
      message.textContent = "La base necesita más defensas. ¡Inténtalo otra vez!";
    }

    drawIsland();
  }

  fireButton.addEventListener("click", startBattle);

  createGates();
  drawIsland();

  return {
    destruir() {
      running = false;
      contenedor.innerHTML = "";
    }
  };
}
