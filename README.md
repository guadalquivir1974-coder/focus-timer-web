# FocusFlow — Timer de concentración por actividad (sin herramientas externas)

Una web app estática (HTML/CSS/JS) para contar tiempo por **actividad**:
- 🧠 Trabajo
- 🏃 Deporte
- 📺 Televisión
- 💻 Ordenador

Incluye:
- Timer configurable (1–180 min)
- Start/Pause + Reset
- Modo Focus (F) y salir con Esc
- Tema claro/oscuro (T)
- Estadísticas por actividad (localStorage): sesiones hoy, total, minutos acumulados

## Ejecutar en local

Opción rápida:

```bash
python3 -m http.server 8000
```

Luego abre: http://localhost:8000

## Ejecutar en GitHub Codespaces

1. Abre el repo en Codespaces
2. Terminal → ejecuta:
   ```bash
   python3 -m http.server 8000
   ```
3. Pestaña PORTS → abre el puerto 8000

## Atajos
- Espacio: Iniciar/Pausar
- R: Reset
- F: Modo Focus
- Esc: salir del Focus
- T: Tema
- Enter: aplicar minutos (si el input está seleccionado)

## Notas
- No usa librerías ni APIs externas.
- Las estadísticas se guardan en tu navegador (localStorage).
