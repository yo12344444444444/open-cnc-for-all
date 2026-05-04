# Budget CNC — Built from 3D-Printed Parts and Old 3D-Printer Hardware

A fully open-source CNC machine you can build with **3D-printed parts and salvaged components from old or broken 3D printers**. Made so that hobbyists, students, and FRC-style teams with no budget can get a real CNC working.

> If you have a dead Ender, Anet, CR-10, or any old 3D printer in a drawer — you already have most of the parts.

## Pick a variant

| Variant | Motion system | Salvage friendliness | Status |
|---|---|---|---|
| [v1-shaft-bearing](variants/v1-shaft-bearing/) | 8 mm smooth rods + LMK8UU bearings + lead screws | ⭐⭐⭐⭐⭐ (almost everything from a dead printer) | In development |
| [mg15-hiwin-rail](variants/mg15-hiwin-rail/) | HIWIN HG15 linear rails | ⭐⭐ (rails must be bought) | Parts only |
| _your variant here_ | — | — | Add one! See [CONTRIBUTING.md](CONTRIBUTING.md) |

## Salvage-first design

The point of this project is **don't buy what you can find**. See [docs/sourcing-salvage-parts.md](docs/sourcing-salvage-parts.md) for which parts of a dead 3D printer fit which CNC variant.

## Repository layout

- `common/` — shared models (motors, lead screws, couplers, bearings) used by every variant. **Edit once, every variant updates.**
- `variants/` — one folder per build. Each has its own assembly, printed parts, STLs, STEP exports, and BOM.
- `docs/` — assembly guide, salvage-part sourcing guide, photos.

## Contributing

We want every kind of variant — rails, bearings + tubes, V-slot, belt-driven, whatever you can dream up. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add one.

## License

[CERN-OHL-S v2](LICENSE) — strong copyleft for open hardware. Anyone can build, modify, and sell, but improvements must stay open.
