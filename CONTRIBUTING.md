# Contributing

Thanks for wanting to make this project better! Anything is welcome — a new variant, a fix to an existing model, better docs, photos of your build, sourcing tips for cheap parts.

## Adding a new variant

1. Copy `variants/_template/` to `variants/<your-name>-<motion-system>/` (e.g. `v2-vslot-wheels`, `mini-belt-drive`).
2. Build your assembly inside `assembly/`. **Reference shared parts from `common/` instead of copying them.**
3. Put your printable parts (your own SLDPRT files) in `printed-parts/`.
4. Export STLs of every printable part to `stl/`.
5. Export the full assembly as STEP to `step/`.
6. Generate a BOM from your assembly in SolidWorks (Insert → Tables → Bill of Materials → save as `.xlsx`) into `bom/BOM-<your-variant>.xlsx`.
7. Write a `README.md` for your variant: photo, build difficulty, what's special about it, what salvaged parts it needs.
8. Open a pull request.

## Editing shared parts

If you change anything under `common/`, **every variant that uses it is affected**. Open all variant assemblies after your edit and confirm they still build cleanly. Mention any breaking change in your PR description.

## Naming rules

- Lowercase, hyphen-separated: `v2-vslot-wheels`, not `V2 VSlot Wheels`.
- Variant names should hint at the motion system so people can pick at a glance.

## PR checklist

- [ ] No `~$*` SolidWorks lock files committed (the `.gitignore` should catch them).
- [ ] Every printable part has a matching STL in `stl/`.
- [ ] BOM `.xlsx` is present and reflects the current assembly.
- [ ] Variant `README.md` has at least one photo or render.
- [ ] If you edited `common/`, you opened every variant assembly to confirm it still rebuilds.

## Reusable parts go in `common/`

If your new variant introduces a part that other variants might want (a new motor mount style, a generic bracket), put it in the matching `common/` subfolder instead of inside your variant.
