// src/components/Forms/LectorCapture.jsx
import { useState } from 'react';

/**
 * Componente para cargar captures bancarios y extraer datos manualmente
 * NOTA: La extracción automática requiere un backend con API de Claude
 */
const LectorCapture = ({ onDatosExtraidos }) => {
  const [previewImagen, setPreviewImagen] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [datosCapture, setDatosCapture] = useState({
    cliente: '',
    monto: '',
    referencia: '',
    tasa: ''
  });

  /**
   * Maneja la selección de archivo
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Crear preview de la imagen
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImagen(e.target.result);
      setMostrarFormulario(true);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Confirmar y enviar datos
   */
  const handleConfirmar = () => {
    // Validar que los campos estén completos
    if (!datosCapture.cliente || !datosCapture.monto || !datosCapture.referencia || !datosCapture.tasa) {
      alert('Por favor completa todos los campos');
      return;
    }

    // Validar que monto y tasa sean números
    const monto = parseFloat(datosCapture.monto);
    const tasa = parseFloat(datosCapture.tasa);

    if (isNaN(monto) || isNaN(tasa)) {
      alert('El monto y la tasa deben ser números válidos');
      return;
    }

    // Enviar datos al componente padre
    onDatosExtraidos({
      cliente: datosCapture.cliente,
      monto: monto,
      referencia: datosCapture.referencia,
      tasa: tasa
    });

    // Limpiar todo
    handleLimpiar();
  };

  /**
   * Limpia todos los estados
   */
  const handleLimpiar = () => {
    setPreviewImagen(null);
    setMostrarFormulario(false);
    setDatosCapture({
      cliente: '',
      monto: '',
      referencia: '',
      tasa: ''
    });
    // Limpiar el input file
    const input = document.getElementById('capture-input');
    if (input) input.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Botón para cargar imagen */}
      <div>
        <label
          htmlFor="capture-input"
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold cursor-pointer transition-all hover:scale-105"
        >
          📸
          <span>Cargar Capture Bancario</span>
        </label>
        <input
          id="capture-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-xs opacity-75 mt-2 text-center">
          Sube una captura de tu transferencia bancaria
        </p>
      </div>

      {/* Preview de la imagen */}
      {previewImagen && (
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold">Vista previa:</p>
            <button
              onClick={handleLimpiar}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              ✕ Cancelar
            </button>
          </div>
          <img
            src={previewImagen}
            alt="Preview"
            className="w-full max-h-64 object-contain rounded-lg mb-4"
          />

          {/* Formulario para ingresar datos manualmente */}
          {mostrarFormulario && (
            <div className="space-y-3 mt-4">
              <p className="text-sm text-blue-300 font-semibold mb-3">
                📝 Ingresa los datos que ves en el capture:
              </p>
              
              <div>
                <label className="block text-xs mb-1 text-gray-300">Cliente (del concepto):</label>
                <input
                  type="text"
                  value={datosCapture.cliente}
                  onChange={(e) => setDatosCapture({...datosCapture, cliente: e.target.value})}
                  className="w-full bg-slate-600 text-white rounded px-3 py-2 text-sm"
                  placeholder="Nombre del cliente"
                />
              </div>

              <div>
                <label className="block text-xs mb-1 text-gray-300">Monto en Bs:</label>
                <input
                  type="number"
                  step="0.01"
                  value={datosCapture.monto}
                  onChange={(e) => setDatosCapture({...datosCapture, monto: e.target.value})}
                  className="w-full bg-slate-600 text-white rounded px-3 py-2 text-sm"
                  placeholder="27000.00"
                />
              </div>

              <div>
                <label className="block text-xs mb-1 text-gray-300">Referencia:</label>
                <input
                  type="text"
                  value={datosCapture.referencia}
                  onChange={(e) => setDatosCapture({...datosCapture, referencia: e.target.value})}
                  className="w-full bg-slate-600 text-white rounded px-3 py-2 text-sm"
                  placeholder="000006144"
                />
              </div>

              <div>
                <label className="block text-xs mb-1 text-gray-300">Tasa de Compra:</label>
                <input
                  type="number"
                  step="0.01"
                  value={datosCapture.tasa}
                  onChange={(e) => setDatosCapture({...datosCapture, tasa: e.target.value})}
                  className="w-full bg-slate-600 text-white rounded px-3 py-2 text-sm"
                  placeholder="36.50"
                />
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleConfirmar}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold text-sm"
                >
                  ✓ Confirmar y Completar Formulario
                </button>
                <button
                  onClick={handleLimpiar}
                  className="px-4 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3">
        <p className="text-xs text-yellow-300">
          💡 <strong>Nota:</strong> Por ahora debes ingresar los datos manualmente mientras miras el capture. La extracción automática estará disponible próximamente.
        </p>
      </div>
    </div>
  );
};

export default LectorCapture;