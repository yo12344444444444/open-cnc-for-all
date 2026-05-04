# How to add to this project

**The short version:** make a folder for your build inside `variants/`, drop your files in, write a short README, open a pull request. That's it. No rigid structure required.

---

## Adding a new build

1. **Make a folder.** Inside `variants/`, create one named after your build — for example `variants/my-vslot-cnc/` or `variants/belt-drive-mini/`.
2. **Drop your files in it.** SolidWorks parts, STL exports, photos, BOM, anything. Use subfolders if it helps you, or don't — your call.
3. **Add a `README.md`** with: a photo or render, what motion system it uses, what hardware you salvaged, what hardware to buy. Look at [`variants/v1-shaft-bearing/README.md`](variants/v1-shaft-bearing/README.md) for a template you can copy.
4. **Open a pull request** on GitHub. We'll merge it.

That's the whole process.

---

## Editing an existing build

Open the SolidWorks files, change them, save, push (`upload.bat` or `git push`). Everything in `variants/<name>/` belongs to that build's maintainer-list — fix typos and small bugs freely; for bigger changes (different motion system, different bed size), open a discussion first.

## Editing files in `shared/`

Files in `shared/` are referenced by multiple builds. **Changing one of them affects every build that uses it.** Open every assembly that touches the file after your edit, confirm it still rebuilds, and mention the change in your PR.

---

## A few rules to keep things tidy

- **Don't commit SolidWorks lock files** (`~$*.SLDASM`, `~$*.SLDPRT`). The `.gitignore` should catch them, but double-check after closing SolidWorks.
- **Don't move SolidWorks files in Windows Explorer.** Drag-and-drop breaks assembly references. Use SolidWorks **File → Save As** (with references) or **Pack and Go** instead.
- **Photos help a lot.** A README with a photo of the real machine is worth ten paragraphs of text.
- **English isn't required.** Comments and READMEs in any language are fine.

---

## Don't have SolidWorks?

You can still contribute:

- **Print and build** — STL files (when uploaded) work in any slicer.
- **Documentation** — add tips to [`docs/sourcing-salvage-parts.md`](docs/sourcing-salvage-parts.md), upload build photos, write tutorials.
- **Open issues** — report bugs you hit, ask questions, suggest variants.
- **Use FreeCAD or Onshape** — re-create a part there, export STEP, submit it. Multi-CAD is welcome.
