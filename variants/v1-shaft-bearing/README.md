# Variant: v1-shaft-bearing

The most salvage-friendly variant. Uses 8 mm smooth rods and LMK8UU linear bearings on every axis, driven by 8 mm × 2 mm-pitch lead screws.

## Why pick this variant

- Almost every part can come from a dead i3-style 3D printer.
- Cheapest to build if you have nothing — 8 mm rods are abundant on the second-hand market.
- Easiest first build.

## Trade-offs

- Lower stiffness than rail-based variants — best for wood, foam, soft plastics, light aluminum.
- Smooth rods deflect under load over long spans; keep the X gantry short.

## What you'll need

See `bom/BOM-v1-shaft-bearing.xlsx` (generated from the SolidWorks assembly).

Key salvaged parts:
- 8 mm smooth rods (×6, lengths per BOM)
- LMK8UU bearings (×8)
- T8 × 2 mm lead screws + brass nuts (×3)
- NEMA 17 steppers (×3)
- 5×8 flexible couplers (×3)

## Files

- `assembly/Assem1.SLDASM` — top-level assembly
- `assembly/z/Z_cartige.SLDASM` — Z-axis sub-assembly
- `printed-parts/` — SolidWorks part files for everything you 3D-print
- `stl/` — exported STLs ready to slice
- `step/` — neutral-format export of the full assembly
- `bom/` — Bill of Materials in Excel

## Build difficulty

⭐⭐ (Beginner-friendly — if you've assembled an i3 printer, you can build this.)
