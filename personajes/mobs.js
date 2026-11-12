export const mobs = [
  {
    id: "saac",
    nombre: "SAAC",
    categoria: "MOBS",
    nivel: 1,
    imagen: "./personajes/saac.png",
    salud: 180,
    ataque: 150,
    velocidad: 110,
    mejoraPorNivel: {
      salud: 15,
      ataque: 15,
      velocidad: 15
    },
    color: "azul",
    tema: "tigre"
  }
];

export function obtenerEstadisticas(mob, nivel) {
  const mejoras = Math.max(0, nivel - 1);

  return {
    salud: mob.salud + mejoras * 15,
    ataque: mob.ataque + mejoras * 15,
    velocidad: mob.velocidad + mejoras * 15
  };
}

