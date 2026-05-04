# Sourcing Salvaged Parts from Old 3D Printers

The whole point of this project: **most of what a CNC needs is hiding inside a dead 3D printer.** This guide maps common 3D-printer parts to which CNC variant uses them.

## What every variant needs

| Salvage part | Where it usually comes from | Used by |
|---|---|---|
| NEMA 17 stepper motors (×3 minimum) | Any FDM printer (X, Y, Z, E motors) | All variants |
| Stepper drivers (A4988, DRV8825, TMC2208) | Old printer mainboard | All variants |
| 12 V or 24 V power supply | Heated-bed PSU | All variants |
| Limit / endstop switches | Printer's homing switches | All variants |
| Wiring + connectors | Printer harness | All variants |

## Variant-specific salvage

### v1-shaft-bearing
- **8 mm smooth rods** — Z-axis rods from older Prusas, Anet A8, Ender 2/3 Pro, Wanhao i3.
- **LMK8UU / LM8UU linear bearings** — Same printers as above. LMK8UU is the flanged version.
- **8 mm lead screw + brass nut (T8 × 2 mm pitch)** — Z-axis on most i3-style printers.
- **5×8 flexible coupler** — On the Z-stepper.

### mg15-hiwin-rail
- HIWIN HG15 rails are **not** salvage-friendly — usually have to be bought. Consider this variant only if you got rails cheap.

## What you usually can't reuse

- Hotends, heat blocks, thermistors — no use on a CNC.
- Heated bed glass — can be repurposed as a sacrificial workpiece backer.
- Bowden tubes — useful for cable management.
- Frame extrusion (2020 / 2040) — save it for a future V-slot variant.

## Where to find dead printers cheap

- School / FRC / robotics-club junk piles
- Local makerspace "free pile"
- Marketplace listings tagged "for parts" / "not working"
- Friends who upgraded and never threw the old machine out

## Adding to this guide

If you sourced a part from somewhere clever, open a PR and add a row.
