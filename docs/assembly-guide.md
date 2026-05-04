# Assembly Guide

Each variant has its own specific build steps in its own `README.md`. This file covers the parts that are common to every variant.

> This is a stub — fill in as you build the first reference machine and take photos.

## Before you start

- Pick a variant from the [main README](../README.md).
- Salvage as much as you can — see [sourcing-salvage-parts.md](sourcing-salvage-parts.md).
- Check the variant's BOM (`variants/<name>/bom/BOM-*.xlsx`) for what you still need to buy.
- Print everything in `variants/<name>/stl/`. Recommended settings: 0.2 mm layer height, 4 walls, 30%+ infill for structural parts.

## Common steps (apply to every variant)

1. Wire the steppers to the driver board.
2. Mount the motors per variant instructions.
3. Home each axis manually before powering, to confirm nothing binds.
4. Set driver Vref before sending any motion command.

## Variant-specific guides

- [v1-shaft-bearing build guide](../variants/v1-shaft-bearing/README.md)
- [mg15-hiwin-rail build guide](../variants/mg15-hiwin-rail/README.md)
