
export const canones = [
  {
    id: "propulsion-cannon",
    nombre: "PROPULSION CANNON",
    categoria: "CAÑONES",
    nivel: 1,
    imagen: "./personajes/propulsion-cannon.png",

    mobsPorSegundo: 3,
    mejoraPorNivel: 3,

    color: "azul",
    tema: "propulsion"
  }
];

export function obtenerEstadisticasCanon(canon, nivel) {
  const mejoras = Math.max(0, nivel - 1);

  return {
    mobsPorSegundo: Number(
      (canon.mobsPorSegundo * Math.pow(1.03, mejoras)).toFixed(2)
    )
  };
}
