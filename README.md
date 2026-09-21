# Apex Hardware Studio

<div align="center">

![Versión](https://img.shields.io/badge/Versi%C3%B3n-2.0.0-00D4FF?style=for-the-badge&logo=electron&logoColor=white)
![Plataforma](https://img.shields.io/badge/Plataforma-Windows_10_%2F_11_(64--bit)-0078D4?style=for-the-badge&logo=windows&logoColor=white)
![Arquitectura](https://img.shields.io/badge/Arquitectura-x64_Portable-10B981?style=for-the-badge&logo=powershell&logoColor=white)
![Licencia](https://img.shields.io/badge/Licencia-MIT-f59e0b?style=for-the-badge)

<p align="center">
  <b>Suite profesional de diagnóstico profundo de hardware, telemetría en tiempo real, auditoría de controladores, benchmarks seguros y herramientas de mantenimiento para estaciones de trabajo y portátiles con Windows.</b>
</p>

</div>

---

## 📥 Descarga y Ejecución (Versión Oficial)

Apex Hardware Studio se distribuye como una aplicación **100% portable y autónoma**. No requiere asistentes de instalación, no modifica el registro del sistema de forma persistente ni requiere instalar Node.js, Python o librerías externas.

| Canal | Versión Actual | Archivo Binario | Requisitos |
| :--- | :--- | :--- | :--- |
| **Oficial (Releases)** | **v2.0.0** | `ApexHardwareStudio-Portable-2.0.0.exe` | Windows 10 / 11 (64-bit) |

### 🚀 Puesta en Marcha Inmediata:
1. Descarga la versión oficial más reciente desde [**GitHub Releases**](https://github.com/anthra123x/apex-hardware-studio/releases/latest).
2. Guarda el archivo en tu disco local o directamente en una unidad **USB de diagnóstico**.
3. Haz clic derecho sobre el ejecutable y selecciona **"Ejecutar como administrador"** *(necesario para permitir acceso completo a las consultas WMI/CIM, contadores SMART de almacenamiento y herramientas de reparación SFC/DISM)*.
4. La aplicación iniciará instantáneamente con todos sus módulos listos para auditar el equipo.

> [!TIP]
> **Portabilidad Total**: Puedes llevar el ejecutable en una memoria USB técnica y correrlo en cualquier laptop de taller o cliente sin dejar rastros en el equipo.

---

## ⚡ Optimización para Laptops de Bajos Recursos (Low-Spec Mode)

Apex Hardware Studio v2.0.0 integra un motor adaptativo diseñado para funcionar de manera estable y fluida en equipos de recursos limitados (procesadores Intel Celeron / Pentium / Core i3 antiguos, 4 GB de RAM, unidades eMMC o discos mecánicos HDD de 5400 RPM):

- **Detección Automática de Hardware**: Si el sistema detecta $\le$ 4 núcleos o $\le$ 4 GB de memoria RAM, el modo de bajo consumo se activa automáticamente.
- **Diagnóstico Secuencial (1 por 1)**: Ejecuta las fases de auditoría de forma secuencial con pausas de respiro de 200 ms, evitando la saturación de CPU (*CPU Starvation*) y el congelamiento de la interfaz.
- **Caché de Telemetría e I/O**: Almacena en caché los datos estáticos de CPU y particiones de disco, reduciendo el sondeo a 8 segundos para no ahogar discos mecánicos HDD.
- **Benchmarks con Safe Allocation**: Limita la reserva de memoria al 35% de la RAM disponible (tope estricto de 512 MB), evitando que el sistema operativo colapse paginando en disco (`pagefile.sys`).
- **Renderizado GPU Liviano**: Desactiva automáticamente desenfoques CSS pesados (`backdrop-filter`) y animaciones SVG continuas en gráficos para no sobrecargar gráficas integradas Intel HD / UHD Graphics.

---

## 🛠️ Características Principales

### 1. Diagnóstico Automático (8 Fases Integradas)
- **Sistema**: Versión y build de Windows, estado de activación de licencia, presencia de TPM 2.0, Secure Boot, virtualización de CPU (VT-x/AMD-V), plan de energía activo y tiempo de actividad (*uptime*).
- **CPU**: Arquitectura, recuento de núcleos físicos/lógicos, frecuencia base y boost, estados de throttling térmico, temperaturas en tiempo real y voltajes.
- **Memoria RAM**: Memoria física total, en uso y libre, sockets/slots ocupados, tecnología (DDR3/DDR4/DDR5), velocidad de operación en MHz, formato SO-DIMM/DIMM y paginación.
- **GPU**: Fabricante, modelo exacto, memoria VRAM dedicada, versión de controlador instalada, relojes de núcleo/memoria y temperatura térmica.
- **Almacenamiento**: Salud S.M.A.R.T. profunda, tipo de interfaz (NVMe PCIe x4 / SATA SSD / HDD), porcentaje de desgaste en SSDs, horas de uso acumuladas y temperatura de unidad.
- **Batería y Energía**: Química de celdas, nivel de desgaste (*Wear Level*), salud porcentual, ciclos de carga acumulados, capacidad de diseño vs. capacidad real y estado del cargador.
- **Sensores Térmicos**: Monitor multipunto en vivo para CPU, tarjeta gráfica, discos duros y velocidad de ventiladores (RPM).
- **Red y Conectividad**: Adaptadores de red físicos y virtuales, gateway, servidores DNS, latencia de ping y enlace Wi-Fi.

### 2. Pruebas Manuales Interactivas (9 Módulos)
- **Pantalla**: 8 patrones de prueba a pantalla completa (colores sólidos RGB, blanco, negro, escala de grises y rejilla para pixeles muertos).
- **Teclado**: Mapeo visual interactivo que detecta pulsaciones en tiempo real para verificar teclas defectuosas.
- **Touchpad & Gestos**: Verificación de botones izquierdo/derecho, scroll vertical y zona de dibujo táctil.
- **Cámara Web**: Vista previa en vivo con selector de cámaras conectadas y captura de comprobación.
- **Micrófono**: Medidor de nivel sonoro en tiempo real (VU-meter) con grabación temporal y reproducción de prueba.
- **Audio Estéreo**: Comprobación independiente de canal izquierdo y derecho (L/R) con tonos sinusoidales a 440 Hz y 1 kHz.
- **Puertos USB**: Detección dinámica y registro de inserción/extracción de dispositivos USB.
- **Bluetooth**: Comprobación de adaptador de radio y escaneo de dispositivos emparejados.
- **Red Wi-Fi**: Detección del chip inalámbrico y escaneo de redes circundantes con nivel de señal (dBm / %).

### 3. Rendimiento y Benchmarks Seguros
- **Monitor de Rendimiento en Vivo**: Gráficos de telemetría continua para CPU, RAM, Disco y Temperatura con historial de métricas y promedios calculados.
- **Pruebas de Estrés Calibradas**: Benchmarks controlados de CPU multihilo y prueba de ancho de banda de memoria RAM que garantizan no congelar el equipo del usuario.

### 4. Mantenimiento y Reparación de Windows
- **Auditoría de Controladores**: Inspección del árbol de drivers de Windows, identificación de dispositivos con problemas (código de error) y búsqueda de actualizaciones en Windows Update.
- **Reparación del Sistema**: Lanzador automatizado para comprobación de archivos de sistema (`SFC /scannow`), restauración de imagen (`DISM /Online /Cleanup-Image /RestoreHealth`) y optimización de WinRE.
- **Activación de Windows / Office**: Integración de scripts oficiales de Microsoft Activation Scripts (MAS) para activación legítima por HWID / KMS38.

### 5. Informes Profesionales para Servicio Técnico
- **Exportación de Reportes**: Generación de reportes técnicos detallados en formato HTML listos para imprimir o exportar como documento PDF.
- **Firma del Técnico**: Personalización con el nombre del especialista o taller responsable en la cabecera del documento.
- **Tema Claro / Oscuro**: Sistema de diseño Apex con soporte nativo de modo oscuro de alto contraste y modo claro para impresión.

---

## 💻 Stack Tecnológico

- **Runtime de Escritorio**: [Electron](https://www.electronjs.org/) (Procesos optimizados y control de heap de memoria)
- **Frontend**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilos & UI**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/)
- **Gestión de Estado**: [Zustand](https://github.com/pmndrs/zustand) con sincronización en `localStorage`
- **Sondeo de Hardware**: [systeminformation](https://systeminformation.io/) + scripts nativos de PowerShell 5.1/7
- **Visualización de Datos**: [Recharts](https://recharts.org/) con aceleración adaptativa
- **Testing**: [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)

---

## 🛠️ Compilación para Desarrolladores

Si deseas compilar la aplicación desde el código fuente:

### Requisitos de Desarrollo:
- Node.js 18+ o 22+
- npm o pnpm

### Pasos de Compilación:

```bash
# 1. Clonar el repositorio
git clone https://github.com/anthra123x/apex-hardware-studio.git
cd apex-hardware-studio

# 2. Instalar dependencias
npm install

# 3. Ejecutar en entorno de desarrollo con Hot-Reload
npm run dev

# 4. Ejecutar suite de pruebas unitarias automatizadas
npm test

# 5. Compilar assets y código TypeScript
npm run build

# 6. Generar el ejecutable portable de Windows (.exe)
npx electron-builder --win portable
```

El ejecutable portable autónomo se creará en la carpeta `dist/`:
```text
dist/ApexHardwareStudio-Portable-2.0.0.exe
```

---

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).
