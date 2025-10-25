// backend/server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

// Debug: Verificar que la API key se carga correctamente
console.log('🔑 API Key cargada:', process.env.ANTHROPIC_API_KEY ? 'Sí (primeros 20 caracteres: ' + process.env.ANTHROPIC_API_KEY.substring(0, 20) + '...)' : '❌ NO SE CARGÓ');
console.log('📁 Variables de entorno disponibles:', Object.keys(process.env).filter(key => key.includes('ANTHROPIC')));

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Permitir imágenes grandes en base64

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend funcionando correctamente' });
});

// Ruta para analizar captures bancarios
app.post('/api/analizar-capture', async (req, res) => {
  try {
    const { imageData, mediaType } = req.body;

    // Validar que se envió la imagen
    if (!imageData || !mediaType) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Faltan datos: imageData y mediaType son requeridos'
      });
    }

    // Llamar a la API de Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: imageData
                }
              },
              {
                type: 'text',
                text: `Analiza este capture de transferencia bancaria de BBVA Provincial o Banco de Venezuela y extrae ÚNICAMENTE la siguiente información:

1. CLIENTE: El nombre que aparece en el campo "Concepto" o "Descripción" (generalmente es el nombre de la persona a quien se le hizo el pago)
2. MONTO: El monto total de la transferencia en Bolívares (Bs). Busca el número más grande que tenga "Bs" al lado.
3. REFERENCIA: El número de referencia de la transacción

IMPORTANTE: 
- Responde ÚNICAMENTE con un objeto JSON válido
- NO incluyas explicaciones ni texto adicional
- NO uses bloques de código con backticks
- El formato debe ser exactamente:

{
  "cliente": "nombre del cliente extraído del concepto",
  "monto": 27000.00,
  "referencia": "000006144"
}

Si no puedes identificar algún campo, usa null como valor.

RESPONDE SOLO CON EL JSON, NADA MÁS.`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error de API de Claude:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      return res.status(response.status).json({
        exito: false,
        mensaje: `Error en la API de Claude: ${response.status} - ${errorText}`
      });
    }

    const data = await response.json();
    
    // Extraer el texto de la respuesta
    let responseText = data.content[0].text;
    
    // Limpiar la respuesta
    responseText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Parsear el JSON
    const resultado = JSON.parse(responseText);

    // Validar estructura
    if (!resultado || typeof resultado !== 'object') {
      throw new Error('Respuesta inválida de la API');
    }

    // Enviar respuesta exitosa
    res.json({
      exito: true,
      datos: {
        cliente: resultado.cliente || '',
        monto: parseFloat(resultado.monto) || 0,
        referencia: resultado.referencia || ''
      },
      mensaje: 'Información extraída exitosamente'
    });

  } catch (error) {
    console.error('Error al analizar capture:', error);
    res.status(500).json({
      exito: false,
      mensaje: error.message || 'Error al analizar la imagen'
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
  console.log(`📸 Endpoint OCR: http://localhost:${PORT}/api/analizar-capture`);
});