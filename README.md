# NEURAL VISION

An interactive exhibition about computer vision and wearable AI. It combines a procedural 3D smart-glasses model, a simulated street detection feed, and three neural-field visualizations for YOLO, SpikeYOLO, and vision-language models.

## Run locally

Requires Node.js 20.19 or later.

```sh
npm install
npm run dev
```

`npm run build` type-checks the application and exports it to `dist/`. Run `npm run preview` to serve that build locally.

## Deploy to Vercel

Run this from the project root and follow the Vercel CLI prompts.

```sh
npx vercel --prod
```

For a Git deployment, import the repository using the Vite preset and `dist` as the output directory. The application uses local assets, including its fonts, and needs no environment variables.

## Explore

- **Awaken** — Move the cursor to rotate the glasses. Scrolling moves the camera toward the next scene.
- **Perception** — Hover, focus, or tap the car, pedestrian, or cyclist. Tap again or press Escape to clear a selection. Confidence values are illustrative.
- **Intelligence** — Select a model to change the shape and colors of the network. When a tab has focus, use arrow keys, Home, or End to switch models.

Reduced-motion and WebGL fallbacks preserve the optical view, the detection controls, and model-specific network diagrams.

## Generated imagery

The built-in ImageGen tool created both image assets.

- `public/media/optical-feed.jpg` — Photoreal cinematic location plate, landscape 3:2. Eye-level view down a rainy Tokyo-inspired street at night, with a silver car to the left, a lone pedestrian near the center, and a cyclist to the right. Cool petrol-blue light, cyan and amber practical lighting, wet asphalt, and no graphic overlays.
- `public/media/optical-module.png` — Transparent product cutout of one floating pair of futuristic smart glasses. Elevated three-quarter view, machined obsidian titanium, two polygonal smoke-glass lenses with cyan and violet reflections, and visible corner cameras. No text, surface, or background.
