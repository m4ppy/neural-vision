<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- The experience lives in `src/neural/`: pure TS modules (`timeline.ts`, `layouts.ts`, `data.ts`) hold choreography, layouts and copy; `scene/` draws them with React Three Fiber; `ui/` holds the DOM layers. Why: rules stay testable and the 3D can change without touching copy.
- `timeline.ts` section heights drive both the DOM section heights and the camera keyframes (scroll measured in viewport heights). Why: one shared scroll system keeps DOM and 3D in sync.
- Per-frame state lives in the mutable `live` object; React state (`ui` store) is only for discrete choices. `scene/Director.tsx` is the single stepper and writes DOM styles directly via registered elements. Why: avoids 60fps React re-renders.
- The 3D canvas is lazy-loaded after mount behind an error boundary while the text SSRs. Why: SEO-friendly copy and no WebGL on the server.
- All detection visuals must stay labeled as conceptual simulation. Why: the brief forbids implying real AI inference.
