# Deployment Guide — Integrating the LFT Simulator into the Dash Tool-kit

This guide explains how to make the LFT Simulator available at a URL inside your
Plotly Dash / Flask Tool-kit application.

---

## How it works

The LFT Simulator is a static React app (HTML + JS + CSS). After running
`npm run build`, the `dist/` folder is completely self-contained. Since Dash
runs on Flask, Flask can serve that folder at any URL path — no Python port
needed.

---

## Step 1 — Build for the Tool-kit URL

Open `vite.config.ts` and **uncomment** the `base` line:

```ts
// vite.config.ts
export default defineConfig({
  base: '/lft-simulator/',   // ← uncomment this line
  plugins: [react(), tailwindcss()],
})
```

> **Important:** The `base` value must match the exact URL path where Flask will
> serve the app (including the trailing slash). If your Tool-kit uses a different
> path (e.g. `/tools/lft/`), change the value to match.

Then build:

```bash
npm run build
```

This produces a `dist/` folder where all internal asset paths start with
`/lft-simulator/`, so the app loads correctly from that sub-path.

---

## Step 2 — Copy the build output to your Dash project

Copy the entire `dist/` folder into your Dash/Flask project. A recommended
location:

```
your-toolkit/
  app.py              ← your Dash entry point
  static/
    lft-simulator/    ← paste dist/ contents here
      index.html
      assets/
        ...
```

---

## Step 3 — Add a Flask route to serve the files

In the file where your Dash `server` (the underlying Flask app) is defined,
add this route:

```python
import os
from flask import send_from_directory

# Path to the dist/ folder you copied in Step 2
LFT_DIST = os.path.join(os.path.dirname(__file__), 'static', 'lft-simulator')

@server.route('/lft-simulator/')
@server.route('/lft-simulator/<path:path>')
def serve_lft_simulator(path='index.html'):
    return send_from_directory(LFT_DIST, path)
```

After restarting the Flask/Dash server, the simulator is live at:

```
https://your-toolkit.com/lft-simulator/
```

---

## Step 4 (optional) — Add it as a page in your Dash multi-page app

If your Tool-kit uses `dash.register_page` (Dash Pages), you can add the
simulator as a native Dash page that loads inside an iframe:

```python
# pages/lft_simulator.py
import dash
from dash import html

dash.register_page(
    __name__,
    path='/tools/lft-simulator',
    name='Simulador LFT',
    title='Simulador de Jornada Laboral — Catch Consulting',
)

layout = html.Div(
    html.Iframe(
        src='/lft-simulator/',
        style={
            'width': '100%',
            'height': '100vh',
            'border': 'none',
            'display': 'block',
        },
    ),
    style={'height': '100vh', 'overflow': 'hidden'},
)
```

This gives the simulator a URL within your Dash routing (e.g.
`/tools/lft-simulator`) while the actual app is served from the static folder.

---

## Step 5 — Going back to local development

When developing locally with `npm run dev`, the `base` path must be **commented
out** again (or the dev server won't work correctly):

```ts
// vite.config.ts
export default defineConfig({
  // base: '/lft-simulator/',   // ← commented out for local dev
  plugins: [react(), tailwindcss()],
})
```

A clean workflow:

| Task | `base` setting |
|------|---------------|
| `npm run dev` (local) | commented out |
| `npm run build` (for Tool-kit) | uncommented |

---

## Authentication note

If your Tool-kit requires login, add the same auth guard to the Flask static
route:

```python
from functools import wraps
from flask import redirect, session

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('authenticated'):
            return redirect('/login')
        return f(*args, **kwargs)
    return decorated

@server.route('/lft-simulator/')
@server.route('/lft-simulator/<path:path>')
@login_required
def serve_lft_simulator(path='index.html'):
    return send_from_directory(LFT_DIST, path)
```

---

## Checklist

- [ ] `base: '/lft-simulator/'` uncommented in `vite.config.ts`
- [ ] `npm run build` run successfully
- [ ] `dist/` contents copied to `static/lft-simulator/` in the Dash project
- [ ] Flask route added and server restarted
- [ ] App loads at `https://your-toolkit.com/lft-simulator/`
- [ ] (Optional) Dash page wrapper created for nav integration
- [ ] Auth guard added if the Tool-kit requires login
- [ ] `base` commented back out in `vite.config.ts` for future local development

---

*Catch Consulting, S.C. — www.catchconsulting.com.mx*
