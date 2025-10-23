@echo off
echo Verificando estructura de archivos...
echo.

echo === SERVICIOS ===
if exist "src\services\firebase.js" (echo [OK] firebase.js) else (echo [FALTA] firebase.js)
if exist "src\services\auth.service.js" (echo [OK] auth.service.js) else (echo [FALTA] auth.service.js)
if exist "src\services\transacciones.service.js" (echo [OK] transacciones.service.js) else (echo [FALTA] transacciones.service.js)
if exist "src\services\configuracion.service.js" (echo [OK] configuracion.service.js) else (echo [FALTA] configuracion.service.js)

echo.
echo === HOOKS ===
if exist "src\hooks\useAuth.js" (echo [OK] useAuth.js) else (echo [FALTA] useAuth.js)
if exist "src\hooks\useTransacciones.js" (echo [OK] useTransacciones.js) else (echo [FALTA] useTransacciones.js)
if exist "src\hooks\useTasas.js" (echo [OK] useTasas.js) else (echo [FALTA] useTasas.js)
if exist "src\hooks\useFiltros.js" (echo [OK] useFiltros.js) else (echo [FALTA] useFiltros.js)

echo.
echo === UTILS ===
if exist "src\utils\calculos.js" (echo [OK] calculos.js) else (echo [FALTA] calculos.js)
if exist "src\utils\exportar.js" (echo [OK] exportar.js) else (echo [FALTA] exportar.js)

echo.
echo === CONFIG ===
if exist "src\config\temas.js" (echo [OK] temas.js) else (echo [FALTA] temas.js)
if exist "src\config\constants.js" (echo [OK] constants.js) else (echo [FALTA] constants.js)

echo.
echo === COMPONENTES ===
if exist "src\components\Auth\Login.jsx" (echo [OK] Login.jsx) else (echo [FALTA] Login.jsx)
if exist "src\components\Layout\Loading.jsx" (echo [OK] Loading.jsx) else (echo [FALTA] Loading.jsx)
if exist "src\components\Layout\Header.jsx" (echo [OK] Header.jsx) else (echo [FALTA] Header.jsx)
if exist "src\components\Layout\Navigation.jsx" (echo [OK] Navigation.jsx) else (echo [FALTA] Navigation.jsx)
if exist "src\components\Dashboard\Dashboard.jsx" (echo [OK] Dashboard.jsx) else (echo [FALTA] Dashboard.jsx)
if exist "src\components\Transacciones\ListaTransacciones.jsx" (echo [OK] ListaTransacciones.jsx) else (echo [FALTA] ListaTransacciones.jsx)
if exist "src\components\Forms\FormTransaccion.jsx" (echo [OK] FormTransaccion.jsx) else (echo [FALTA] FormTransaccion.jsx)
if exist "src\components\Forms\FormCompra.jsx" (echo [OK] FormCompra.jsx) else (echo [FALTA] FormCompra.jsx)
if exist "src\components\Forms\FormGasto.jsx" (echo [OK] FormGasto.jsx) else (echo [FALTA] FormGasto.jsx)
if exist "src\components\Forms\FormGeneral.jsx" (echo [OK] FormGeneral.jsx) else (echo [FALTA] FormGeneral.jsx)
if exist "src\components\PorCobrar\PorCobrar.jsx" (echo [OK] PorCobrar.jsx) else (echo [FALTA] PorCobrar.jsx)
if exist "src\components\Graficos\Graficos.jsx" (echo [OK] Graficos.jsx) else (echo [FALTA] Graficos.jsx)
if exist "src\components\Calendario\Calendario.jsx" (echo [OK] Calendario.jsx) else (echo [FALTA] Calendario.jsx)
if exist "src\components\Tasas\Tasas.jsx" (echo [OK] Tasas.jsx) else (echo [FALTA] Tasas.jsx)
if exist "src\components\Temas\Temas.jsx" (echo [OK] Temas.jsx) else (echo [FALTA] Temas.jsx)

echo.
echo === ARCHIVOS PRINCIPALES ===
if exist "src\App.jsx" (echo [OK] App.jsx) else (echo [FALTA] App.jsx)
if exist "src\index.js" (echo [OK] index.js) else (echo [FALTA] index.js)
if exist ".env" (echo [OK] .env) else (echo [FALTA] .env - IMPORTANTE!)

pause