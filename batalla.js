export function iniciarBatalla(contenedor, opciones = {}) {
  contenedor.innerHTML = "";

  const juego = document.createElement("div");
  juego.style.cssText = "width:100%;height:100%;color:white;font-family:Arial;text-align:center";

  juego.innerHTML = `
    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px">
      <span>⭐ RONDA <b id="round">1</b></span>
      <span>🔵 MOBS <b id="mobCount">0</b></span>
      <span>👾 ENEMIGOS <b id="enemyCount">0</b></span>
    </div>

    <div style="display:flex;justify-content:space-between;font-size:11px">
      <span>🏰 ENEMIGO: <b id="enemyHealth">100</b></span>
      <span>🛡️ TU BASE: <b id="playerHealth">100</b></span>
    </div>

    <div style="height:9px;background:#451d38;border-radius:10px;overflow:hidden;margin:5px 0">
      <div id="enemyBar" style="height:100%;width:100%;background:#ff526d"></div>
    </div>

    <div style="height:7px;background:#333;border-radius:10px;overflow:hidden;margin-bottom:9px">
      <div id="playerBar" style="height:100%;width:100%;background:#48d78b"></div>
    </div>

    <div id="mapName" style="font-size:12px;color:#ffe47c;margin:5px">MAPA</div>

    <canvas id="battleCanvas"
      style="width:100%;height:auto;display:block;border:2px solid #60dfff;border-radius:16px;touch-action:none">
    </canvas>

    <p id="battleMessage" style="font-size:12px;color:#9deaff">
      Arrastra el cañón para moverlo.
    </p>

    <button id="fireButton"
      style="width:100%;padding:13px;border:2px solid #d7ffad;border-radius:14px;background:linear-gradient(#8bea50,#269c3d);color:#103b20;font-weight:900;font-size:16px">
      BATALLA EN CURSO
    </button>
  `;

  contenedor.appendChild(juego);

  const canvas = juego.querySelector("#battleCanvas");
  const ctx = canvas.getContext("2d");

  const $ = id => juego.querySelector("#" + id);

  const W = 700;
  const H = 900;

  canvas.width = W;
  canvas.height = H;

  let cannonX = 350;
  let dragging = false;
  let running = false;
  let destroyed = false;

  let mobs = [];
  let enemies = [];
  let gates = [];

  let enemyHealth = 100;
  let playerHealth = 100;
  let round = 1;

  let lastTime = 0;
  let spawnTimer = 0;
  let enemyTimer = 0;
  let animationId = 0;

  let currentMap = "bosque";

  const productionRate = Math.max(
    1,
    Number(opciones.mobsPorSegundo) || 3
  );

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function chooseMap() {
    currentMap = Math.random() < 0.5 ? "bosque" : "torre";
    $("mapName").textContent =
      currentMap === "bosque" ? "🌲 MAPA BOSQUE" : "🏰 MAPA TORRE";
  }

  function createGates() {
    const positions = [
      [{x:190,y:450,value:2},{x:510,y:450,value:3}],
      [{x:240,y:420,value:3},{x:460,y:420,value:2}],
      [{x:160,y:450,value:2},{x:350,y:360,value:4},{x:540,y:450,value:2}],
      [{x:250,y:440,value:5},{x:500,y:350,value:2}],
      [{x:180,y:370,value:3},{x:520,y:470,value:4}]
    ];

    gates = positions[
      Math.floor(Math.random() * positions.length)
    ].map(g => ({...g}));
  }

  function drawTree(x, y, scale = 1) {
    ctx.fillStyle = "#70452c";
    ctx.fillRect(x-9*scale,y,18*scale,45*scale);

    ctx.fillStyle = "#155b36";
    ctx.beginPath();
    ctx.arc(x,y-10*scale,32*scale,0,Math.PI*2);
    ctx.arc(x-19*scale,y+4*scale,23*scale,0,Math.PI*2);
    ctx.arc(x+19*scale,y+4*scale,23*scale,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle = "#29834b";
    ctx.beginPath();
    ctx.arc(x-8*scale,y-17*scale,14*scale,0,Math.PI*2);
    ctx.fill();
  }

  function drawForest() {
    const sky = ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,"#8bd9f5");
    sky.addColorStop(1,"#d2f3c2");

    ctx.fillStyle = sky;
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = "#398c49";
    ctx.fillRect(0,150,W,700);

    for(let i=0;i<9;i++){
      const y=160+i*78;
      drawTree(35+(i%2)*28,y,1.1);
      drawTree(635-(i%2)*28,y,1.1);
    }

    ctx.fillStyle="#92704a";
    ctx.beginPath();
    ctx.moveTo(260,170);
    ctx.lineTo(440,170);
    ctx.lineTo(475,820);
    ctx.lineTo(225,820);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle="#c9a46d";
    ctx.beginPath();
    ctx.moveTo(280,170);
    ctx.lineTo(420,170);
    ctx.lineTo(450,820);
    ctx.lineTo(250,820);
    ctx.closePath();
    ctx.fill();

    for(let i=0;i<10;i++){
      ctx.fillStyle="#216b3c";
      ctx.beginPath();
      ctx.arc(220+(i%2)*260,230+i*55,17,0,Math.PI*2);
      ctx.fill();
    }
  }

  function drawTower() {
    const sky=ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,"#6d9bdc");
    sky.addColorStop(1,"#d6c5ee");

    ctx.fillStyle=sky;
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle="#6d719d";

    ctx.beginPath();
    ctx.moveTo(0,270);
    ctx.lineTo(140,100);
    ctx.lineTo(300,270);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(400,260);
    ctx.lineTo(570,90);
    ctx.lineTo(700,260);
    ctx.fill();

    ctx.fillStyle="#77758b";
    ctx.fillRect(55,150,590,700);

    ctx.fillStyle="#b6a9a0";
    ctx.fillRect(270,150,160,700);

    ctx.strokeStyle="#e3d5c6";
    ctx.lineWidth=8;
    ctx.strokeRect(270,150,160,700);

    for(const x of [85,520]){
      ctx.fillStyle="#6c536e";
      ctx.fillRect(x,235,90,390);

      ctx.fillStyle="#a18a9b";
      ctx.fillRect(x-12,215,114,35);
      ctx.fillRect(x+12,195,18,40);
      ctx.fillRect(x+60,195,18,40);

      ctx.fillStyle="#d5c3ad";
      ctx.fillRect(x+30,300,28,70);
    }

    ctx.strokeStyle="#8e8290";
    ctx.lineWidth=5;

    for(let y=300;y<800;y+=65){
      ctx.beginPath();
      ctx.moveTo(275,y);
      ctx.lineTo(425,y);
      ctx.stroke();
    }
  }

  function drawFortress(x,y,color) {
    ctx.fillStyle=color;
    ctx.fillRect(x-75,y-30,150,75);

    ctx.fillStyle="#d0b5a0";
    ctx.fillRect(x-90,y-55,35,65);
    ctx.fillRect(x+55,y-55,35,65);

    ctx.fillStyle="#f5d78a";
    ctx.fillRect(x-22,y+5,44,40);

    ctx.fillStyle="#f1c86b";
    ctx.fillRect(x-90,y-65,35,12);
    ctx.fillRect(x+55,y-65,35,12);
  }

  function drawGates() {
    gates.forEach(g=>{
      ctx.fillStyle="#152c67";
      ctx.fillRect(g.x-49,g.y-27,98,54);

      ctx.strokeStyle="#ffe37b";
      ctx.lineWidth=5;
      ctx.strokeRect(g.x-49,g.y-27,98,54);

      ctx.fillStyle="white";
      ctx.font="bold 26px Arial";
      ctx.textAlign="center";
      ctx.fillText("×"+g.value,g.x,g.y+9);
    });
  }

  function drawCannon() {
    ctx.save();
    ctx.translate(cannonX,680);

    ctx.fillStyle="#182e64";
    ctx.beginPath();
    ctx.ellipse(0,28,58,28,0,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle="#b9cce2";
    ctx.fillRect(-19,-55,38,75);

    ctx.fillStyle="#2878d9";
    ctx.fillRect(-25,-105,50,65);

    ctx.fillStyle="#ffd76a";
    ctx.fillRect(-30,-113,60,15);

    ctx.restore();
  }

  function drawUnits() {
    mobs.forEach(m=>{
      ctx.beginPath();
      ctx.arc(m.x,m.y,12,0,Math.PI*2);
      ctx.fillStyle="#36c8ff";
      ctx.fill();

      ctx.strokeStyle="white";
      ctx.lineWidth=3;
      ctx.stroke();
    });

    enemies.forEach(e=>{
      ctx.beginPath();
      ctx.arc(e.x,e.y,14,0,Math.PI*2);
      ctx.fillStyle="#ed4c65";
      ctx.fill();

      ctx.strokeStyle="#ffd2d9";
      ctx.lineWidth=2;
      ctx.stroke();
    });
  }

  function drawMap() {
    ctx.clearRect(0,0,W,H);

    if(currentMap==="bosque") drawForest();
    else drawTower();

    drawFortress(350,205,"#873d55");

    ctx.fillStyle="white";
    ctx.font="bold 19px Arial";
    ctx.textAlign="center";
    ctx.fillText("FORTALEZA ENEMIGA",350,125);

    drawFortress(350,785,"#3157a5");

    ctx.font="bold 18px Arial";
    ctx.fillText("TU BASE",350,865);

    drawGates();
    drawUnits();
    drawCannon();

    ctx.fillStyle="white";
    ctx.font="bold 15px Arial";
    ctx.fillText("ARRASTRA EL CAÑÓN",350,565);

    ctx.textAlign="left";
  }

  function updateUI() {
    $("enemyHealth").textContent=Math.max(0,Math.ceil(enemyHealth));
    $("playerHealth").textContent=Math.max(0,Math.ceil(playerHealth));

    $("enemyBar").style.width=Math.max(0,enemyHealth)+"%";
    $("playerBar").style.width=Math.max(0,playerHealth)+"%";

    $("mobCount").textContent=mobs.length;
    $("enemyCount").textContent=enemies.length;
  }

  function getPointerX(event) {
    const rect=canvas.getBoundingClientRect();
    return (event.clientX-rect.left)*W/rect.width;
  }

  canvas.addEventListener("pointerdown",event=>{
    if(destroyed || !running) return;

    dragging=true;
    cannonX=Math.max(85,Math.min(615,getPointerX(event)));

    if(canvas.setPointerCapture){
      canvas.setPointerCapture(event.pointerId);
    }

    event.preventDefault();
  });

  canvas.addEventListener("pointermove",event=>{
    if(!dragging || !running) return;

    cannonX=Math.max(85,Math.min(615,getPointerX(event)));
    event.preventDefault();
  });

  canvas.addEventListener("pointerup",()=>{
    dragging=false;
  });

  canvas.addEventListener("pointercancel",()=>{
    dragging=false;
  });

  function startBattle() {
    if(running || destroyed) return;

    running=true;
    enemyHealth=100+(round-1)*25;
    playerHealth=100;

    mobs=[];
    enemies=[];
    spawnTimer=0;
    enemyTimer=0;

    chooseMap();
    createGates();
    updateUI();

    $("round").textContent=round;

    $("fireButton").textContent="BATALLA EN CURSO";
    $("fireButton").disabled=true;

    $("battleMessage").textContent=
      "¡Defiende tu base y conquista la fortaleza enemiga!";

    lastTime=performance.now();
    animationId=requestAnimationFrame(loop);
  }

  function loop(time) {
    if(!running || destroyed) return;

    const delta=Math.min((time-lastTime)/1000,0.05);
    lastTime=time;

    spawnTimer+=delta;
    enemyTimer+=delta;

    // PRODUCCIÓN DE MOBS
    while(spawnTimer>=1/productionRate){
      spawnTimer-=1/productionRate;

      mobs.push({
        x:cannonX,
        y:575,
        speed:125,
        multiplied:new Set()
      });
    }

    // MOVIMIENTO DE MOBS
    const extra=[];

    mobs.forEach(m=>{
      m.y-=m.speed*delta;

      // MULTIPLICADORES
      gates.forEach(g=>{
        if(
          m.y<=g.y+25 &&
          m.y>=g.y-25 &&
          m.x>=g.x-49 &&
          m.x<=g.x+49 &&
          !m.multiplied.has(g)
        ){
          m.multiplied.add(g);

          for(let i=1;i<g.value;i++){
            extra.push({
              x:Math.max(80,Math.min(620,m.x+random(-25,25))),
              y:m.y+random(-8,8),
              speed:m.speed,
              multiplied:new Set(m.multiplied)
            });
          }
        }
      });
    });

    mobs.push(...extra);

    // APARICIÓN DE ENEMIGOS
    const enemySpawnTime=Math.max(1.3,3.5-round*0.12);

    while(enemyTimer>=enemySpawnTime){
      enemyTimer-=enemySpawnTime;

      enemies.push({
        x:random(285,415),
        y:265,
        speed:random(35,50)
      });
    }

    // MOVIMIENTO DE ENEMIGOS
    enemies.forEach(e=>{
      e.y+=e.speed*delta;
    });

    // COLISIONES ENTRE MOBS Y ENEMIGOS
    const removedMobs=new Set();
    const removedEnemies=new Set();

    mobs.forEach((m,mi)=>{
      enemies.forEach((e,ei)=>{
        if(removedEnemies.has(ei)) return;

        const dx=m.x-e.x;
        const dy=m.y-e.y;
        const distance=Math.sqrt(dx*dx+dy*dy);

        if(distance<26){
          removedMobs.add(mi);
          removedEnemies.add(ei);
        }
      });
    });

    mobs=mobs.filter((m,i)=>!removedMobs.has(i));
    enemies=enemies.filter((e,i)=>!removedEnemies.has(i));

    // DAÑO A LA FORTALEZA ENEMIGA
    const survivors=[];

    mobs.forEach(m=>{
      if(m.y<=255){
        enemyHealth-=2;
      }else{
        survivors.push(m);
      }
    });

    mobs=survivors;

    // DAÑO A TU BASE
    const remainingEnemies=[];

    enemies.forEach(e=>{
      if(e.y>=755){
        playerHealth-=10;
      }else{
        remainingEnemies.push(e);
      }
    });

    enemies=remainingEnemies;

    updateUI();

    // FIN DE LA PARTIDA
    if(enemyHealth<=0){
      finish(true);
      return;
    }

    if(playerHealth<=0){
      finish(false);
      return;
    }

    drawMap();

    animationId=requestAnimationFrame(loop);
  }

  function finish(won) {
    running=false;
    dragging=false;

    cancelAnimationFrame(animationId);

    $("fireButton").disabled=false;

    if(won){
      $("battleMessage").textContent=
        "🏆 ¡VICTORIA! ¡Has conquistado la fortaleza!";

      $("fireButton").textContent="SIGUIENTE RONDA";

      if(typeof opciones.onVictory==="function"){
        opciones.onVictory();
      }
    }else{
      $("battleMessage").textContent=
        "💥 ¡Tu base ha caído! Inténtalo nuevamente.";

      $("fireButton").textContent="REINTENTAR";
    }

    drawMap();
    updateUI();
  }

  $("fireButton").addEventListener("click",()=>{
    if(destroyed || running) return;

    if(enemyHealth<=0){
      round++;
    }

    startBattle();
  });

  // INICIO AUTOMÁTICO
  chooseMap();
  createGates();
  drawMap();
  startBattle();

  return {
    destruir(){
      destroyed=true;
      running=false;
      dragging=false;

      cancelAnimationFrame(animationId);
      contenedor.innerHTML="";
    }
  };
}
