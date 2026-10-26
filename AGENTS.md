<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- FrameFlow is frontend-only for now: auth/onboarding state lives in `src/lib/flow.ts` (localStorage) so forms work without a backend; swap for Lovable Cloud when real accounts are needed.
- Shared marketing chrome lives in `src/components/site.tsx`; auth/onboarding pages use `AuthShell` from `src/components/auth-shell.tsx`.
