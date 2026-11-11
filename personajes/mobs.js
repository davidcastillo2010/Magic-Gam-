
export const mobs = [
  {
    id: "saac",
    nombre: "SAAC",
    categoria: "MOBS",
    nivel: 1,

    imagen: "saac.png",

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
    salud: mob.salud + mejoras * mob.mejoraPorNivel.salud,
    ataque: mob.ataque + mejoras * mob.mejoraPorNivel.ataque,
    velocidad: mob.velocidad + mejoras * mob.mejoraPorNivel.velocidad
  };
}
