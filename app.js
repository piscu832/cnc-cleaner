/**
 * CAM CLEANER - Lógica de Depuración y Limpieza de G-Code
 * Desarrollado para procesamiento de alta velocidad 100% en el cliente.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos DOM
  const origTextarea = document.getElementById('orig-textarea');
  const cleanTextarea = document.getElementById('clean-textarea');
  const origLineNumbers = document.getElementById('orig-line-numbers');
  const cleanLineNumbers = document.getElementById('clean-line-numbers');
  
  // Opciones
  const optRemoveRowNames = document.getElementById('opt-remove-row-names');
  const optRemoveComments = document.getElementById('opt-remove-comments');
  const optRemoveBlankLines = document.getElementById('opt-remove-blank-lines');
  const optTrimSpaces = document.getElementById('opt-trim-spaces');
  const optCustomPrefix = document.getElementById('opt-custom-prefix');
  const customPrefixContainer = document.getElementById('custom-prefix-container');
  const customPrefixInput = document.getElementById('custom-prefix-input');

  // Estadísticas
  const statFilename = document.getElementById('stat-filename');
  const statOrigLines = document.getElementById('stat-orig-lines');
  const statCleanLines = document.getElementById('stat-clean-lines');
  const statRemovedCount = document.getElementById('stat-removed-count');
  const statSavedBytes = document.getElementById('stat-saved-bytes');
  const origSizeBadge = document.getElementById('orig-size-badge');
  const cleanSizeBadge = document.getElementById('clean-size-badge');

  // Botones & Dropzone
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const btnLoadSample = document.getElementById('btn-load-sample');
  const btnClearAll = document.getElementById('btn-clear-all');
  const btnProcessNow = document.getElementById('btn-process-now');
  const btnCopyClean = document.getElementById('btn-copy-clean');
  const btnDownload = document.getElementById('btn-download');
  const btnPaste = document.getElementById('btn-paste');
  const toast = document.getElementById('toast');

  // Elementos Móviles
  const tabBtnClean = document.getElementById('tab-btn-clean');
  const tabBtnOrig = document.getElementById('tab-btn-orig');
  const colOriginal = document.getElementById('col-original');
  const colClean = document.getElementById('col-clean');
  const btnMobileCopy = document.getElementById('btn-mobile-copy');
  const btnMobileDownload = document.getElementById('btn-mobile-download');

  let currentFileName = 'programa.nc';

  // Ejemplo realista de Mecanizado CNC (Fresa / Torno con N-codes y comentarios)
  const SAMPLE_GCODE = `%
(PROGRAMA: MECANIZADO_PLACA_BASE)
(FECHA: 2026-10-23)
(HERRAMIENTA T01 - FRESA D10MM)
N0010 G21 G90 G94 G40 G49 G80
N0020 G28 G91 Z0.0
N0030 G90
N0040 T01 M06 (CAMBIO A FRESA D10)
N0050 S3500 M03
N0060 G54
N0070 G00 X0.0 Y0.0
N0080 G43 H01 Z15.0 M08
N0090 (INICIO DE CONTORNEADO)
N0100 G00 Z2.0
N0110 G01 Z-2.5 F300.0
N0120 G01 X45.0 F1200.0
N0130 G02 X60.0 Y15.0 R15.0
N0140 G01 Y70.0
N0150 G03 X45.0 Y85.0 R15.0
N0160 G01 X15.0
N0170 G02 X0.0 Y70.0 R15.0
N0180 G01 Y15.0
N0190 G02 X15.0 Y0.0 R15.0
N0200 (SALIDA DE HERRAMIENTA)
N0210 G00 Z20.0
N0220 M09
N0230 G28 G91 Z0.0
N0240 G28 Y0.0
N0250 M30
%`;

  /**
   * Procesa el código G-code según las opciones marcadas.
   */
  function processGCode() {
    const rawText = origTextarea.value;
    if (!rawText.trim()) {
      cleanTextarea.value = '';
      updateLineNumbers(origTextarea, origLineNumbers);
      updateLineNumbers(cleanTextarea, cleanLineNumbers);
      updateStats('', '');
      return;
    }

    const removeRowNames = optRemoveRowNames.checked;
    const removeComments = optRemoveComments.checked;
    const removeBlank = optRemoveBlankLines.checked;
    const trimSpaces = optTrimSpaces.checked;
    const useCustomPrefix = optCustomPrefix.checked;
    const customPatternVal = customPrefixInput.value.trim();

    // Regex para prefijo personalizado si está activo
    let customRegex = null;
    if (useCustomPrefix && customPatternVal) {
      try {
        customRegex = new RegExp(`^\\s*(${customPatternVal})\\s*`, 'i');
      } catch (e) {
        console.warn('Regex personalizado inválido:', e);
      }
    }

    // Regex estándar para nombres/números de fila: N10, N0010, N1234:, N 10, etc.
    // Detecta al principio de línea: opcional espacio, N seguido de números, opcional : o guión, y espacio.
    const rowNameRegex = /^\s*N\s*[0-9]+:?\s*/i;

    const lines = rawText.split(/\r?\n/);
    const cleanedLines = [];
    let removedRowCount = 0;

    for (let line of lines) {
      let processed = line;

      // 1. Eliminar nombres/números de fila estándar (N-Codes)
      if (removeRowNames) {
        if (rowNameRegex.test(processed)) {
          processed = processed.replace(rowNameRegex, '');
          removedRowCount++;
        }
      }

      // 2. Eliminar prefijo personalizado
      if (customRegex && customRegex.test(processed)) {
        processed = processed.replace(customRegex, '');
        removedRowCount++;
      }

      // 3. Eliminar comentarios si la opción está activa
      if (removeComments) {
        // Remueve (comentarios entre paréntesis)
        processed = processed.replace(/\(.*?\)/g, '');
        // Remueve comentarios con punto y coma ; hasta fin de línea
        processed = processed.replace(/;.*$/g, '');
      }

      // 4. Limpieza de espacios
      if (trimSpaces) {
        // Reducir espacios múltiples consecutivos a un único espacio
        processed = processed.replace(/[ \t]+/g, ' ').trim();
      }

      // 5. Filtrar líneas vacías si está activo
      if (removeBlank && processed === '') {
        continue;
      }

      cleanedLines.push(processed);
    }

    const finalCleanText = cleanedLines.join('\n');
    cleanTextarea.value = finalCleanText;

    // Actualizar numeración de líneas
    updateLineNumbers(origTextarea, origLineNumbers);
    updateLineNumbers(cleanTextarea, cleanLineNumbers);

    // Actualizar estadísticas
    updateStats(rawText, finalCleanText, removedRowCount);
  }

  /**
   * Actualiza el listado visual de números de línea
   */
  function updateLineNumbers(textarea, lineNumbersEl) {
    const text = textarea.value;
    const lines = text ? text.split('\n').length : 1;
    let numbersHtml = '';
    for (let i = 1; i <= lines; i++) {
      numbersHtml += i + '\n';
    }
    lineNumbersEl.textContent = numbersHtml;
  }

  /**
   * Sincroniza el scroll del panel de números con el textarea
   */
  function syncScroll(textarea, lineNumbersEl) {
    lineNumbersEl.scrollTop = textarea.scrollTop;
  }

  origTextarea.addEventListener('scroll', () => syncScroll(origTextarea, origLineNumbers));
  cleanTextarea.addEventListener('scroll', () => syncScroll(cleanTextarea, cleanLineNumbers));

  /**
   * Actualiza las estadísticas de compresión y métricas
   */
  function updateStats(origText, cleanText, removedCount = 0) {
    const origBytes = new Blob([origText]).size;
    const cleanBytes = new Blob([cleanText]).size;
    const saved = Math.max(0, origBytes - cleanBytes);
    const percent = origBytes > 0 ? ((saved / origBytes) * 100).toFixed(1) : 0;

    const origLinesCount = origText ? origText.split('\n').length : 0;
    const cleanLinesCount = cleanText ? cleanText.split('\n').length : 0;

    statFilename.textContent = currentFileName;
    statOrigLines.textContent = origLinesCount.toLocaleString();
    statCleanLines.textContent = cleanLinesCount.toLocaleString();
    statRemovedCount.textContent = removedCount.toLocaleString();
    statSavedBytes.textContent = `${formatBytes(saved)} (${percent}%)`;

    origSizeBadge.textContent = formatBytes(origBytes);
    cleanSizeBadge.textContent = formatBytes(cleanBytes);
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Carga y procesa un archivo
   */
  function handleFile(file) {
    if (!file) return;
    currentFileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      origTextarea.value = e.target.result;
      processGCode();
      showToast(`Archivo "${file.name}" cargado con éxito`);
    };
    reader.onerror = () => {
      showToast('Error al leer el archivo', true);
    };
    reader.readAsText(file);
  }

  // Eventos de opciones
  [optRemoveRowNames, optRemoveComments, optRemoveBlankLines, optTrimSpaces, optCustomPrefix].forEach(opt => {
    opt.addEventListener('change', () => {
      if (opt === optCustomPrefix) {
        customPrefixContainer.style.display = optCustomPrefix.checked ? 'flex' : 'none';
      }
      processGCode();
    });
  });

  customPrefixInput.addEventListener('input', () => {
    if (optCustomPrefix.checked) {
      processGCode();
    }
  });

  origTextarea.addEventListener('input', () => {
    processGCode();
  });

  btnProcessNow.addEventListener('click', () => {
    processGCode();
    showToast('Código reprocesado con éxito');
  });

  // Cargar ejemplo
  btnLoadSample.addEventListener('click', () => {
    currentFileName = 'ejemplo_placa_base.nc';
    origTextarea.value = SAMPLE_GCODE;
    processGCode();
    showToast('Ejemplo de mecanizado CNC cargado');
  });

  // Limpiar todo
  btnClearAll.addEventListener('click', () => {
    origTextarea.value = '';
    cleanTextarea.value = '';
    currentFileName = 'programa.nc';
    processGCode();
    showToast('Espacio de trabajo reiniciado');
  });

  // Pegar portapapeles
  btnPaste.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        origTextarea.value = text;
        currentFileName = 'portapapeles.nc';
        processGCode();
        showToast('Código pegado desde el portapapeles');
      } else {
        showToast('El portapapeles está vacío');
      }
    } catch (err) {
      // Fallback
      origTextarea.focus();
      showToast('Usa Ctrl+V para pegar en el panel');
    }
  });

  // Copiar código limpio
  btnCopyClean.addEventListener('click', async () => {
    const text = cleanTextarea.value;
    if (!text) {
      showToast('No hay código para copiar', true);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast('¡Código limpio copiado al portapapeles!');
    } catch (err) {
      cleanTextarea.select();
      document.execCommand('copy');
      showToast('¡Código limpio copiado!');
    }
  });

  // Descargar archivo limpio
  btnDownload.addEventListener('click', () => {
    const text = cleanTextarea.value;
    if (!text) {
      showToast('No hay código para descargar', true);
      return;
    }

    // Generar nombre de descarga: nombre_original_clean.extension
    const lastDotIndex = currentFileName.lastIndexOf('.');
    let downloadName = 'programa_clean.nc';
    if (lastDotIndex !== -1) {
      const base = currentFileName.substring(0, lastDotIndex);
      const ext = currentFileName.substring(lastDotIndex);
      downloadName = `${base}_clean${ext}`;
    } else {
      downloadName = `${currentFileName}_clean.nc`;
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Archivo descargado como "${downloadName}"`);
  });

  // Drag & Drop
  dropZone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-active');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-active');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files[0]) {
      handleFile(dt.files[0]);
    }
  }, false);

  // Gestión de pestañas en versión móvil (< 860px)
  function switchMobileTab(target) {
    if (window.innerWidth > 860) return;
    
    if (target === 'clean') {
      tabBtnClean.classList.add('active');
      tabBtnOrig.classList.remove('active');
      colClean.classList.remove('mobile-hidden');
      colOriginal.classList.add('mobile-hidden');
    } else {
      tabBtnOrig.classList.add('active');
      tabBtnClean.classList.remove('active');
      colOriginal.classList.remove('mobile-hidden');
      colClean.classList.add('mobile-hidden');
    }
  }

  if (tabBtnClean && tabBtnOrig) {
    tabBtnClean.addEventListener('click', () => switchMobileTab('clean'));
    tabBtnOrig.addEventListener('click', () => switchMobileTab('orig'));
  }

  // Redimensionamiento de pantalla: asegurar visibilidad correcta
  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) {
      colOriginal.classList.remove('mobile-hidden');
      colClean.classList.remove('mobile-hidden');
    } else {
      const activeTarget = tabBtnClean.classList.contains('active') ? 'clean' : 'orig';
      switchMobileTab(activeTarget);
    }
  });

  // Botones de acción flotantes para móviles
  if (btnMobileCopy) {
    btnMobileCopy.addEventListener('click', () => btnCopyClean.click());
  }
  if (btnMobileDownload) {
    btnMobileDownload.addEventListener('click', () => btnDownload.click());
  }

  // Notificación Toast
  let toastTimer = null;
  function showToast(message, isError = false) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = message;
    toast.style.borderColor = isError ? 'var(--accent-rose)' : 'var(--accent-emerald)';
    toast.classList.add('show');
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // Inicialización con ejemplo para que el usuario experimente inmediatamente
  btnLoadSample.click();
  // Inicializar estado móvil
  if (window.innerWidth <= 860) {
    switchMobileTab('clean');
  }
});
