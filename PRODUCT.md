# Product

## Register

product

## Users

Tattoo artists who need to mix custom ink colors to match a target shade. Two distinct usage moments:
- **Pre-session, at a table**: calmly configuring a recipe, comparing options, tuning thresholds — can tolerate a denser, more detailed UI.
- **Chair-side, mid-session**: glancing at the app between pigment applications, often with gloved or pigment-stained hands — needs large touch targets, minimal precision gestures, and an instant "what do I mix" answer.

The job to be done: go from a target color (typed in, or pulled from a reference photo) to a trustworthy ink-mixing recipe (exact proportions from their own palette), with clear warnings when a result will look muddy or otherwise fail in skin.

## Product Purpose

ColorTattoo removes guesswork from custom color matching for tattoo artists. Input a target color — by hand or from a photo — and get back a precise recipe (which inks, what proportions) plus an honest read on whether the result will actually look good healed in skin. Success is an artist trusting the recipe enough to mix and use it without re-checking, in just a few taps, even mid-session.

## Brand Personality

Professional artist's instrument — closer to a colorimetry/Pantone tool than a consumer app. Precise, sober, trustworthy. Minimal decoration; the numbers and the color itself carry the interface. Some warmth from the tattoo craft world is welcome, but never playful or gimmicky.

## Anti-references

Not a candy-colored consumer color-picker (no gradients, no glassmorphism, no SaaS hero-metric/eyebrow clichés). Not a dense industrial settings panel either — every control has to earn its place, because real usage happens one-handed, with split attention, sometimes with dirty or gloved hands.

## Design Principles

- **Phone-first, thumb-reachable.** Every primary action must work one-handed, chair-side, without precision taps.
- **Two speeds of use.** A fast "glance and confirm" mode (large swatch, plain-language proportions) for mid-session checks, and a deeper "configure" mode for calm pre-session tuning. Never force the heavy mode on someone who just needs a glance.
- **Numbers are the product.** Color swatches, hex/percentage values, and DeltaE-driven confidence signals are the actual content — chrome (nav, cards, decoration) recedes behind them.
- **Warnings are load-bearing, not cosmetic.** "This will look muddy" or "don't use black here" prevents a ruined tattoo — it must be unmissable, not a dismissible toast.
- **The photo-analysis flow is the front door.** Assume most users start from a reference photo, not a manual hex/RGB entry. Upload → extract colors → pick one → get recipe must be the smoothest path in the app.

## Accessibility & Inclusion

WCAG AA text contrast as the baseline across the app. No additional redundant color-blind-specific affordances requested beyond that.
