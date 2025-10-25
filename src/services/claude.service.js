// src/services/claude.service.js

/**
 * Servicio para analizar captures bancarios usando la API de Claude a través del backend
 */

// URL del backend (ajusta según tu configuración)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

/**
 * Convierte un archivo de imagen a base64
 * @param {File} file - Archivo de imagen
 * @returns {Promise<string>} - Imagen en formato base64
 */
export const convertirImagenABase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      // Remover el prefijo "data:image/xxx;base64,"
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    
    reader.onerror = () => {
      reject(new Error("Error al leer el archivo"));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Analiza un capture bancario y extrae la información relevante
 * Ahora conecta con el backend para mayor seguridad
 * @param {File} imageFile - Archivo de imagen del capture bancario
 * @returns {Promise<Object>} - Objeto con cliente, monto y referencia extraídos
 */
export const analizarCaptureBancario = async (imageFile) => {
  try {
    // Validar que sea una imagen
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }

    // Convertir imagen a base64
    const base64Data = await convertirImagenABase64(imageFile);
    
    // Determinar el tipo de imagen
    const mediaType = imageFile.type;

    // Llamar al backend
    const response = await fetch(`${BACKEND_URL}/api/analizar-capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageData: base64Data,
        mediaType: mediaType
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.mensaje || `Error del servidor: ${response.status}`);
    }

    const resultado = await response.json();

    if (!resultado.exito) {
      throw new Error(resultado.mensaje || 'Error al procesar la imagen');
    }

    return {
      exito: true,
      datos: {
        cliente: resultado.datos.cliente || '',
        monto: parseFloat(resultado.datos.monto) || 0,
        referencia: resultado.datos.referencia || '',
      },
      mensaje: resultado.mensaje || 'Información extraída exitosamente'
    };

  } catch (error) {
    console.error("Error al analizar capture:", error);
    
    // Si el error es de red o conexión con el backend
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return {
        exito: false,
        datos: null,
        mensaje: 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:5000'
      };
    }
    
    return {
      exito: false,
      datos: null,
      mensaje: error.message || 'Error al analizar la imagen'
    };
  }
};

/**
 * Valida que los datos extraídos sean correctos
 * @param {Object} datos - Datos extraídos del capture
 * @returns {Object} - Resultado de la validación
 */
export const validarDatosExtraidos = (datos) => {
  const errores = [];

  if (!datos.cliente || datos.cliente.trim() === '') {
    errores.push('No se pudo identificar el cliente');
  }

  if (!datos.monto || datos.monto <= 0) {
    errores.push('No se pudo identificar el monto');
  }

  if (!datos.referencia || datos.referencia.trim() === '') {
    errores.push('No se pudo identificar la referencia');
  }

  return {
    valido: errores.length === 0,
    errores
  };
};

/**
 * Verifica la conexión con el backend
 * @returns {Promise<boolean>}
 */
export const verificarConexionBackend = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
};