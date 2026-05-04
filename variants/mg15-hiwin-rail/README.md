# Variant: mg15-hiwin-rail

> Status: **parts only** — assembly not yet built. Help wanted.

Uses HIWIN HG15 (or compatible) profile linear rails for high stiffness. Aimed at users who want to cut harder materials than the shaft-bearing variant can handle.

## Why pick this variant

- Much higher stiffness than smooth-rod designs.
- Lower deflection over long axes.
- Suitable for aluminum and harder woods.

## Trade-offs

- Rails must be bought new — not salvage-friendly.
- Costs more than `v1-shaft-bearing`.

## Files

- `parts/HG15 Rail, Top Mounting, HIWIN.SLDPRT` — the rail
- `parts/HGH15CA Hiwin Linear block by proma.SLDPRT` — the carriage block
- `assembly/`, `printed-parts/`, `stl/`, `step/`, `bom/` — to be filled in as the design progresses

## How to help

Pick this variant up — design the gantry, bed mounts, and motor mounts around the HG15 hardware, reusing motors / lead screws / couplers from `common/`. Open a PR.
