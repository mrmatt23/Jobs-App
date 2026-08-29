# CSS class contract

UI components MUST use these classes. Art direction fills the CSS.

## Shell
- `os` — full viewport root
- `os__grid` — hex/aurora background layer (pointer-events none)
- `os__scan` — scanline overlay
- `os__vignette` — edge vignette
- `shell` — 3-region app grid
- `topbar` `topbar__brand` `topbar__mark` `topbar__meta` `topbar__chip` `topbar__clock` `topbar__presence`
- `rail` `rail__section` `rail__label` `rail__btn` `rail__btn--active` `rail__code`
- `main` — hero + mosaic column
- `inspector`
- `command`

## Cards / mosaic
- `mosaic`
- `card` `card--on` `card--off` `card--selected` `card--light` `card--climate` `card--media` `card--sensor` `card--scene`
- `card__head` `card__name` `card__id` `card__state` `card__icon`
- `slider` (range)
- `stepper` `stepper__btn`
- `chip` `chip--cyan` `chip--violet` `chip--warn` `chip--crit`

## Hero / inspector / command
- `hero` `hero__climate` `hero__weather` `hero__map`
- `node` `node--here` (presence)
- `spark` (energy svg)
- `feed` (camera)
- `orb` `orb--pulse`
- `ticker` `ticker__item`
- `cmd` `cmd__input`

## Type
- `kicker` — 11px uppercase tracked
- `readout` — Share Tech Mono numbers
- `display` — Orbitron
