# 💰 Sistema de Contabilidad Premium

Sistema completo de gestión contable multi-usuario con React, Firebase y arquitectura modular.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)
![Firebase](https://img.shields.io/badge/firebase-10.7.1-orange.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Características

- 🔐 **Autenticación Segura** - Sistema de login/registro con Firebase
- 💵 **Gestión de Transacciones** - Ingresos, Gastos, Compras y Ventas
- 📊 **Dashboard Completo** - Métricas y estadísticas en tiempo real
- 💳 **Cuentas por Cobrar** - Control detallado con filtros avanzados
- 📈 **Gráficos Interactivos** - Visualización de datos con Chart.js
- 📅 **Vista de Calendario** - Organización temporal de transacciones
- 🎨 **6 Temas Visuales** - Personalización de la interfaz
- 📄 **Exportación** - Excel y PDF de reportes
- 👥 **Multi-usuario** - Datos separados por usuario
- 🔄 **Tiempo Real** - Sincronización automática con Firebase

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 14 o superior
- npm o yarn
- Cuenta de Firebase

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/contabilidad-app.git
cd contabilidad-app

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Firebase

# 4. Iniciar en modo desarrollo
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
contabilidad-app/
├── public/
│   └── index.html
│
├── src/
│   ├── components/          # Componentes React
│   │   ├── Auth/           # Login y registro
│   │   ├── Dashboard/      # Panel principal
│   │   ├── Transacciones/  # Lista de transacciones
│   │   ├── PorCobrar/      # Cuentas por cobrar
│   │   ├── Forms/          # Formularios
│   │   ├── Graficos/       # Visualizaciones
│   │   ├── Calendario/     # Vista de calendario
│   │   ├── Tasas/          # Configuración de tasas
│   │   ├── Temas/          # Selector de temas
│   │   └── Layout/         # Header, Navigation, Loading
│   │
│   ├── services/           # Servicios de Firebase
│   │   ├── firebase.js
│   │   ├── auth.service.js
│   │   ├── transacciones.service.js
│   │   └── configuracion.service.js
│   │
│   ├── hooks/              # Custom Hooks
│   │   ├── useAuth.js
│   │   ├── useTransacciones.js
│   │   ├── useTasas.js
│   │   ├── useFiltros.js
│   │   └── useExportar.js
│   │
│   ├── utils/              # Funciones auxiliares
│   │   ├── calculos.js
│   │   ├── exportar.js
│   │   ├── formatters.js
│   │   └── validations.js
│   │
│   ├── config/             # Configuración
│   │   ├── temas.js
│   │   ├── constants.js
│   │   └── categorias.js
│   │
│   ├── styles/             # Estilos globales
│   │   └── global.css
│   │
│   ├── App.jsx             # Componente principal
│   ├── App.css
│   └── index.js            # Punto de entrada
│
├── .env.example            # Variables de entorno ejemplo
├── .gitignore
├── package.json
└── README.md
```

## 🔧 Configuración de Firebase

### 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita **Authentication** con Email/Password
4. Crea una base de datos **Firestore**

### 2. Obtener Credenciales

En la configuración del proyecto, copia las credenciales y pégalas en tu archivo `.env`

### 3. Configurar Reglas de Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Transacciones
    match /transacciones/{transaccion} {
      allow read, write: if request.auth != null && 
                         resource.data.usuarioId == request.auth.uid;
      allow create: if request.auth != null &&
                    request.resource.data.usuarioId == request.auth.uid;
    }
    
    // Configuración de usuarios
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && 
                         request.auth.uid == userId;
      
      match /configuracion/{doc} {
        allow read, write: if request.auth != null && 
                           request.auth.uid == userId;
      }
    }
  }
}
```

### 4. Crear Índices en Firestore

Ve a la consola de Firestore y crea estos índices:

**Colección: `transacciones`**
- Campos: `usuarioId` (Ascending), `fecha` (Descending)
- Alcance: Colección

## 📚 Uso de la Aplicación

### Autenticación

1. **Registro**: Crea una cuenta con email y contraseña
2. **Login**: Inicia sesión con tus credenciales
3. Cada usuario tiene su propia base de datos aislada

### Transacciones

- **Nueva Transacción**: Click en botón "+ Nueva"
- **Tipos disponibles**: Ingreso, Gasto, Compra, Venta
- **Campos automáticos**: Cálculos de ganancias y conversiones

### Cuentas por Cobrar

- **Filtros**: Por cliente, status, operador, fechas
- **Resumen**: Total por cliente y status
- **Cambio de status**: Un click para marcar como pagado

### Exportación

- **Excel**: Exporta todas las transacciones
- **PDF**: Genera reportes imprimibles
- Los archivos incluyen el email del usuario

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm start           # Inicia servidor de desarrollo

# Producción
npm run build       # Crea build optimizado

# Testing
npm test            # Ejecuta tests

# Análisis
npm run eject       # Expone configuración de CRA
```

## 📦 Dependencias Principales

- **React 18** - Framework UI
- **Firebase 10** - Backend y autenticación
- **Chart.js** - Gráficos
- **jsPDF** - Generación de PDFs
- **XLSX** - Exportación a Excel

## 🎨 Temas Disponibles

1. **Oscuro** - Tema profesional con morado
2. **Claro** - Tema limpio con azul
3. **Verde** - Tema naturaleza
4. **Naranja** - Tema cálido
5. **Azul Marino** - Tema corporativo
6. **Morado** - Tema vibrante

## 🔐 Seguridad

- Autenticación con Firebase Auth
- Reglas de seguridad en Firestore
- Variables de entorno para credenciales
- Validación de datos en cliente y servidor
- Sesiones seguras con tokens

## 🤝 Contribuir

Las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Convenciones de Código

- **Componentes**: PascalCase (ej: `Login.jsx`)
- **Archivos**: camelCase (ej: `useAuth.js`)
- **CSS**: BEM notation
- **Commits**: Conventional Commits

## 🐛 Reportar Bugs

Reporta bugs en [GitHub Issues](https://github.com/tu-usuario/contabilidad-app/issues)

Incluye:
- Descripción del problema
- Pasos para reproducir
- Comportamiento esperado
- Screenshots si aplica

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Tu Nombre**
- Email: tu@email.com
- GitHub: [@tu-usuario](https://github.com/tu-usuario)
- LinkedIn: [Tu Perfil](https://linkedin.com/in/tu-perfil)

## 🙏 Agradecimientos

- React Team por el framework
- Firebase por el backend
- Chart.js por los gráficos
- Comunidad open source

---

⭐ Si te gusta este proyecto, dale una estrella en GitHub!

📧 ¿Preguntas? Abre un issue o contáctame directamente.