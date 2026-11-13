
export function iniciarBatalla(contenedor, opciones = {}) {
  contenedor.innerHTML = "";

  const juego = document.createElement("div");
  juego.style.cssText = "width:100%;color:white;font-family:Arial,sans-serif;text-align:center";

  juego.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:5px;font-size:12px;margin-bottom:8px">
      <span>⭐ RONDA <b id="round">1</b></span>
      <span>🔵 MOBS <b id="mobCount">0</b></span>
      <span>🏰 ENEMIGO <b id="enemyHealth">100</b></span>
    </div>

    <div style="height:9px;background:#451d38;border-radius:10px;overflow:hidden;margin-bottom:9px">
      <div id="enemyBar" style="height:100%;width:100%;background:#ff526d"></div>
    </div>

    <canvas id="battleCanvas"
      style="width:100%;display:block;border:2px solid #60dfff;border-radius:16px;touch-action:none;background:#8bd7f5">
    </canvas>

    <p id="battleMessage" style="font-size:12px;color:#9deaff">
      Arrastra el cañón de izquierda a derecha.
    </p>

    <button id="fireButton"
      style="width:100%;padding:13px;border:2px solid #d7ffad;border-radius:14px;background:linear-gradient(#8bea50,#269c3d);color:#103b20;font-weight:900;font-size:16px">
      INICIAR BATALLA
    </button>
  `;

  contenedor.appendChild(juego);

  const canvas = juego.querySelector("#battleCanvas");
  const ctx = canvas.getContext("2d");
  const mobCount = juego.querySelector("#mobCount");
  const enemyHealthLabel = juego.querySelector("#enemyHealth");
  const enemyBar = juego.querySelector("#enemyBar");
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
  let destroyed = false;
  let mobs = [];
  let bullets = [];
  let enemies = [];
  let gates = [];
  let enemyHealth = 100;
  let playerHealth = 100;
  let produced = 0;
  let lastShot = 0;
  let round = 1;
  let lastTime = 0;
  let elapsed = 0;
  let animationId = 0;

  const productionRate = Math.max(1, Number(opciones.mobsPorSegundo) || 3);

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createGates() {
    const choices = [
      [{x:180,y:445,value:2},{x:520,y:445,value:3}],
      [{x:230,y:430,value:3},{x:470,y:430,value:2}],
      [{x:150,y:440,value:2},{x:350,y:365,value:4},{x:550,y:440,value:2}],
      [{x:250,y:430,value:5},{x:500,y:350,value:2}]
    ];

    gates = choices[Math.floor(Math.random() * choices.length)]
      .map(g => ({...g, hit:new Set()}));
  }

  function drawCloud(x,y) {
    ctx.beginPath();
    ctx.arc(x,y,24,0,Math.PI*2);
    ctx.arc(x+25,y-10,30,0,Math.PI*2);
    ctx.arc(x+52,y,23,0,Math.PI*2);
    ctx.fill();
  }

  function drawIsland() {
    ctx.clearRect(0,0,W,H);

    const sky = ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,"#58b6f5");
    sky.addColorStop(1,"#d4f1ff");
    ctx.fillStyle = sky;
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = "#ffffffaa";
    drawCloud(65,75);
    drawCloud(480,105);

    // Montañas del fondo
    ctx.fillStyle = "#6274a9";
    ctx.beginPath();
    ctx.moveTo(0,250);
    ctx.lineTo(130,95);
    ctx.lineTo(270,250);
    ctx.fill();

    ctx.fillStyle = "#7885b7";
    ctx.beginPath();
    ctx.moveTo(420,245);
    ctx.lineTo(570,80);
    ctx.lineTo(700,245);
    ctx.fill();

    // Isla flotante
    ctx.beginPath();
    ctx.moveTo(80,180);
    ctx.lineTo(620,180);
    ctx.lineTo(675,660);
    ctx.lineTo(350,850);
    ctx.lineTo(25,660);
    ctx.closePath();
    ctx.fillStyle = "#398e50";
    ctx.fill();

    ctx.strokeStyle = "#a5ef77";
    ctx.lineWidth = 15;
    ctx.stroke();

    // Camino
    ctx.beginPath();
    ctx.moveTo(350,270);
    ctx.lineTo(350,730);
    ctx.strokeStyle = "#a27b53";
    ctx.lineWidth = 120;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(350,270);
    ctx.lineTo(350,730);
    ctx.strokeStyle = "#e7ce96";
    ctx.lineWidth = 94;
    ctx.stroke();

    // Fortaleza enemiga
    ctx.fillStyle = "#873d55";
    ctx.fillRect(275,195,150,75);
    ctx.fillStyle = "#c46c79";
    ctx.fillRect(260,175,35,65);
    ctx.fillRect(405,175,35,65);
    ctx.fillStyle = "#ffe28a";
    ctx.fillRect(325,220,50,50);

    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("FORTALEZA ENEMIGA",350,155);

    // Base del jugador
    ctx.fillStyle = "#3157a5";
    ctx.fillRect(275,700,150,75);
    ctx.fillStyle = "#5f8fe0";
    ctx.fillRect(260,680,35,65);
    ctx.fillRect(405,680,35,65);
    ctx.fillStyle = "#ffe28a";
    ctx.fillRect(325,725,50,50);

    ctx.fillStyle = "white";
    ctx.font = "bold 19px Arial";
    ctx.fillText("TU BASE",350,810);

    // Multiplicadores
    gates.forEach(gate => {
      ctx.fillStyle = "#172e68";
      ctx.fillRect(gate.x-48,gate.y-25,96,50);

      ctx.strokeStyle = "#ffe37b";
      ctx.lineWidth = 5;
      ctx.strokeRect(gate.x-48,gate.y-25,96,50);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 25px Arial";
      ctx.fillText("×"+gate.value,gate.x,gate.y+8);
    });

    // Cañón móvil
    ctx.save();
    ctx.translate(cannonX,625);

    ctx.fillStyle = "#273f75";
    ctx.beginPath();
    ctx.ellipse(0,25,57,27,0,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle = "#c7d4e8";
    ctx.fillRect(-19,-48,38,70);

    ctx.fillStyle = "#2878d9";
    ctx.fillRect(-25,-95,50,65);

    ctx.fillStyle = "#ffd76a";
    ctx.fillRect(-29,-103,58,15);

    ctx.restore();

    // MOBS
    mobs.forEach(mob => {
      ctx.beginPath();
      ctx.arc(mob.x,mob.y,12,0,Math.PI*2);
      ctx.fillStyle = "#36c8ff";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();
    });

    // Disparos
    bullets.forEach(bullet => {
      ctx.beginPath();
      ctx.arc(bullet.x,bullet.y,8,0,Math.PI*2);
      ctx.fillStyle = "#ffe36b";
      ctx.fill();
    });

    // Enemigos
    enemies.forEach(enemy => {
      ctx.beginPath();
      ctx.arc(enemy.x,enemy.y,15,0,Math.PI*2);
      ctx.fillStyle = "#e94c65";
      ctx.fill();
      ctx.strokeStyle = "#ffd2d9";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.font = "bold 16px Arial";
    ctx.fillText("MUEVE EL CAÑÓN",350,590);
    ctx.textAlign = "left";
  }

  function updateHealth() {
    enemyHealthLabel.textContent = Math.max(0,Math.ceil(enemyHealth));
    enemyBar.style.width = Math.max(0,enemyHealth)+"%";
  }

  function pointerX(event) {
    const rect = canvas.getBoundingClientRect();
    return (event.clientX-rect.left)*W/rect.width;
  }

  canvas.addEventListener("pointerdown",event => {
    if (!running) return;
    dragging = true;
    cannonX = Math.max(85,Math.min(615,pointerX(event)));
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove",event => {
    if (!dragging || !running) return;
    cannonX = Math.max(85,Math.min(615,pointerX(event)));
  });

  canvas.addEventListener("pointerup",() => dragging = false);
  canvas.addEventListener("pointercancel",() => dragging = false);

  function startBattle() {
    if (running || destroyed) return;

    running = true;
    enemyHealth = 100;
    playerHealth = 100;
    produced = 0;
    elapsed = 0;
    lastShot = 0;
    mobs = [];
    bullets = [];
    enemies = [];

    createGates();
    updateHealth();

    fireButton.textContent = "BATALLA EN CURSO";
    fireButton.disabled = true;
    message.textContent = "¡Mueve el cañón y atraviesa los multiplicadores!";

    lastTime = performance.now();
    animationId = requestAnimationFrame(loop);
  }

  function loop(time) {
    if (!running || destroyed) return;

    const delta = Math.min((time-lastTime)/1000,0.05);
    lastTime = time;
    elapsed += delta;

    // Producción automática
    if (time-lastShot >= 1000/productionRate) {
      lastShot = time;
      bullets.push({x:cannonX,y:590});
      produced++;
    }

    // Los disparos se convierten en MOBS
    bullets.forEach(bullet => bullet.y -= 480*delta);

    const remainingBullets = [];
    bullets.forEach(bullet => {
      if (bullet.y < 590) {
        mobs.push({
          id:produced+"-"+Math.random(),
          x:bullet.x,
          y:bullet.y,
          speed:115
        });
      } else {
        remainingBullets.push(bullet);
      }
    });
    bullets = remainingBullets;

    // Movimiento y multiplicadores
    const newMobs = [];

    mobs.forEach(mob => {
      mob.y -= mob.speed*delta;

      gates.forEach(gate => {
        if (
          mob.y <= gate.y+25 &&
          mob.y >= gate.y-25 &&
          mob.x >= gate.x-48 &&
          mob.x <= gate.x+48
        ) {
          const count = gate.hit.has(mob.id);
          if (!count) {
            gate.hit.add(mob.id);

            for (let i=1;i<gate.value;i++) {
              newMobs.push({
                id:mob.id+"-"+i,
                x:mob.x+random(-22,22),
                y:mob.y+random(-8,8),
                speed:mob.speed
              });
            }
          }
        }
      });

      if (mob.y < 285) {
        enemyHealth -= 1;
      } else {
        newMobs.push(mob);
      }
    });

    mobs = newMobs;

    // Enemigos que avanzan hacia tu base
    if (elapsed > 3 && Math.random() < delta*0.65) {
      enemies.push({
        x:350+random(-75,75),
        y:280,
        speed:random(30,48)
      });
    }

    enemies.forEach(enemy => {
      enemy.y += enemy.speed*delta;
      if (enemy.y > 665) {
        playerHealth -= 5;
        enemy.y = 1000;
      }
    });

    enemies = enemies.filter(enemy => enemy.y < 900);

    mobCount.textContent = mobs.length;
    updateHealth();

    if (enemyHealth <= 0) {
      finish(true);
      return;
    }

    if (playerHealth <= 0) {
      finish(false);
      return;
    }

    drawIsland();
    animationId = requestAnimationFrame(loop);
  }

  function finish(won) {
    running = false;
    dragging = false;
    cancelAnimationFrame(animationId);

    fireButton.disabled = false;
    fireButton.textContent = won ? "SIGUIENTE RONDA" : "REINTENTAR";

    if (won) {
      message.textContent = "¡VICTORIA! Has conquistado la fortaleza. Ganaste 1 estrella.";
      if (typeof opciones.onVictory === "function") {
        opciones.onVictory();
      }
    } else {
      message.textContent = "¡Tu base ha caído! Puedes intentarlo de nuevo.";
    }

    drawIsland();
  }

  fireButton.addEventListener("click",() => {
    if (destroyed) return;

    if (!running && enemyHealth <= 0) {
      round++;
      roundLabel.textContent = round;
      enemyHealth = 100+((round-1)*15);
      playerHealth = 100+((round-1)*5);
      enemyHealth = Math.min(enemyHealth,100+round*20);
      enemyBar.style.width = "100%";
      enemyHealthLabel.textContent = enemyHealth;
    }

    startBattle();
  });

  createGates();
  drawIsland();

  return {
    destruir() {
      destroyed = true;
      running = false;
      cancelAnimationFrame(animationId);
      contenedor.innerHTML = "";
    }
  };
}
