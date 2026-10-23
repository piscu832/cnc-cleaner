# 🛠️ CAM Cleaner - G-Code CNC Optimizer

**CAM Cleaner** es una aplicación web moderna, rápida y 100% ejecutada en el navegador para optimizar y limpiar programas G-Code de mecanizado CNC. Su objetivo principal es remover los nombres y números de fila (`N10`, `N0020`, etc.), preservando intacto el código de maquinado.

![CAM Cleaner Interface](https://img.shields.io/badge/status-active-success.svg)
![Compatible](https://img.shields.io/badge/CNC-Fanuc%20%7C%20Haas%20%7C%20Siemens%20%7C%20GRBL-blue.svg)

---

## ✨ Características

- ⚡ **Eliminación de N-Codes / Nombres de Fila:** Remueve automáticamente `N10`, `N0020`, `N1234:`, etc., al inicio de cada instrucción.
- 💬 **Eliminación Opcional de Comentarios:** Limpia comentarios entre paréntesis `( ... )` o con punto y coma `; ...`.
- 🧹 **Optimización de Espacios:** Suprime líneas vacías y reduce dobles espacios para ahorrar memoria en el control CNC.
- 🎯 **Prefijos Personalizados:** Soporte para expresiones regulares o etiquetas como `LBL_`, `BLOCK_`, etc.
- 📊 **Métricas en Tiempo Real:** Contador de líneas, nombres removidos y bytes/porcentaje de memoria ahorrado.
- 💾 **Exportación Inmediata:** Descarga el archivo limpio con extensión original (`.nc`, `.gcode`, `.txt`, `.tap`, `.mpf`) o copia al portapapeles.
- 🔒 **100% Local y Privado:** No sube ningún dato a servidores externos. Todo se procesa en el navegador.

---

## 🚀 Despliegue en GitHub Pages

Para tener esta aplicación disponible online de forma gratuita con **GitHub Pages**:

1. Sube este repositorio a tu cuenta de GitHub.
2. En GitHub, ve a **Settings** > **Pages** (en el menú lateral izquierdo).
3. En la sección **Build and deployment** > **Source**, selecciona `Deploy from a branch`.
4. Elige la rama `main` y la carpeta `/ (root)`. Haz clic en **Save**.
5. En un par de minutos, GitHub te dará un enlace público como:
   `https://tu-usuario.github.io/tu-repositorio/`

---

## 💻 Uso Local

Basta con clonar el repositorio y abrir `index.html` en cualquier navegador:

```bash
git clone https://github.com/TU-USUARIO/CAM-CLEANER.git
cd CAM-CLEANER
```
Abre `index.html` en Chrome, Firefox, Edge o Safari.
