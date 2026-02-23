# Timer de concentración (Web)

MVP: temporizador configurable (minutos) que funciona 100% en el navegador.

## ✅ Qué incluye
- Configurar minutos (1–180)
- Iniciar / Pausar
- Reset
- Progreso visual (anillo)
- UI mejorada (Pack C): responsive + animaciones suaves + **modo claro/oscuro**
- Atajos:
  - **Espacio** → iniciar/pausar
  - **R** → reset
  - **T** → cambiar tema

## ▶️ Ejecutar en GitHub Codespaces (recomendado, sin instalar nada)
1. Abre tu repositorio en GitHub
2. Click en **Code**
3. Pestaña **Codespaces**
4. Click en **Create codespace on main**
5. Cuando cargue, abre **Terminal**
6. Ejecuta:

```bash
python3 -m http.server 8080
```

7. Ve a la pestaña **PORTS**
8. En el puerto **8080**, click en **Open in Browser**

## ▶️ Ejecutar en tu ordenador (opcional)
Dentro de la carpeta del proyecto:

```bash
python3 -m http.server 8080
```

Abre en el navegador:
- http://localhost:8080

## Estructura
- `index.html`
- `styles.css`
- `app.js`
