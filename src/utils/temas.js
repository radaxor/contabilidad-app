// src/config/temas.js

/**
 * Configuración de temas del sistema
 * Cada tema define colores para el gradiente de fondo, tarjetas, texto y botones
 */
export const temas = {
    oscuro: {
      nombre: 'Oscuro',
      primario: 'from-slate-900 via-purple-900 to-slate-900',
      tarjeta: 'bg-white/10',
      texto: 'text-white',
      boton: 'bg-purple-600 hover:bg-purple-700',
      descripcion: 'Tema oscuro profesional con tonos morados'
    },
    claro: {
      nombre: 'Claro',
      primario: 'from-blue-50 via-white to-blue-50',
      tarjeta: 'bg-white shadow-lg',
      texto: 'text-gray-900',
      boton: 'bg-blue-600 hover:bg-blue-700',
      descripcion: 'Tema claro y limpio con azul suave'
    },
    verde: {
      nombre: 'Verde',
      primario: 'from-green-900 via-teal-900 to-green-900',
      tarjeta: 'bg-white/10',
      texto: 'text-white',
      boton: 'bg-green-600 hover:bg-green-700',
      descripcion: 'Tema verde naturaleza con tonos teal'
    },
    naranja: {
      nombre: 'Naranja',
      primario: 'from-orange-900 via-red-900 to-orange-900',
      tarjeta: 'bg-white/10',
      texto: 'text-white',
      boton: 'bg-orange-600 hover:bg-orange-700',
      descripcion: 'Tema cálido con tonos naranjas y rojos'
    },
    azul: {
      nombre: 'Azul Marino',
      primario: 'from-blue-900 via-indigo-900 to-blue-900',
      tarjeta: 'bg-white/10',
      texto: 'text-white',
      boton: 'bg-blue-600 hover:bg-blue-700',
      descripcion: 'Tema azul marino profesional'
    },
    morado: {
      nombre: 'Morado',
      primario: 'from-purple-900 via-pink-900 to-purple-900',
      tarjeta: 'bg-white/10',
      texto: 'text-white',
      boton: 'bg-purple-600 hover:bg-purple-700',
      descripcion: 'Tema morado vibrante con toques rosa'
    }
  };
  
  /**
   * Obtener tema por nombre
   * @param {string} nombreTema 
   * @returns {Object} Tema seleccionado o tema oscuro por defecto
   */
  export const obtenerTema = (nombreTema) => {
    return temas[nombreTema] || temas.oscuro;
  };
  
  /**
   * Obtener lista de nombres de temas
   * @returns {Array} Array de nombres de temas
   */
  export const obtenerNombresTemas = () => {
    return Object.keys(temas);
  };
  
  export default temas;