"""
Actualiza CATALOGO_44_MODELOS_DISPONIBLES en script-v2.js
leyendo la hoja COLE 44 del Excel de inventario.

Regla: stock total > 0 → disponible, stock == 0 → no disponible (en produccion).
"""
import re, sys, zipfile, subprocess, json
from pathlib import Path
from xml.etree import ElementTree as ET

NS_M = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

EXCEL_SRC    = Path(r"C:\Users\Lenovo\OneDrive - Mohicano Jeans\INVENTARIO 01-04 COMPLETO.xlsx")
SCRIPT_JS    = Path(__file__).parent.parent / "script-v2.js"
CATALOG_JSON = Path(__file__).parent.parent / "data-catalogo-44.json"
SHEET_NAME   = "COLE 44"
SIZE_COLS    = {"H":"36","I":"38","J":"40","K":"42","L":"44","M":"46"}
CODE_COL     = "C"


def load_strings(z):
    if "xl/sharedStrings.xml" not in z.namelist():
        return []
    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    return ["".join(t.text or "" for t in si.iter("{"+NS_M+"}t"))
            for si in root.iter("{"+NS_M+"}si")]


def find_sheet_path(z, name):
    wb   = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    rmap = {r.get("Id"): r.get("Target") for r in rels}
    for sh in wb.iter("{"+NS_M+"}sheet"):
        if sh.get("name","").strip().upper() == name.upper():
            rid = sh.get("{"+NS_R+"}id")
            return "xl/" + rmap[rid]
    return None


def cell_val(cell, strings):
    t = cell.get("t","")
    v = cell.find("{"+NS_M+"}v")
    if v is None or not v.text: return None
    if t == "s":
        idx = int(v.text)
        return strings[idx] if idx < len(strings) else None
    return v.text


def normalize_sku(raw):
    digits = "".join(c for c in str(raw or "") if c.isdigit())
    if len(digits) == 6:
        return f"{digits[:4]}-{digits[4:6]}"
    return ""


def read_cole44_stock():
    if not EXCEL_SRC.exists():
        print(f"ERROR: No se encontró {EXCEL_SRC}", file=sys.stderr)
        return {}

    with zipfile.ZipFile(EXCEL_SRC) as z:
        strings = load_strings(z)
        path    = find_sheet_path(z, SHEET_NAME)
        if not path:
            print(f"ERROR: No se encontró hoja '{SHEET_NAME}'", file=sys.stderr)
            return {}
        ws = ET.fromstring(z.read(path))

    stock = {}
    for row in ws.iter("{"+NS_M+"}row"):
        cells = {}
        for c in row:
            col = re.sub(r"[0-9]", "", c.get("r",""))
            cells[col] = cell_val(c, strings)

        sku = normalize_sku(cells.get(CODE_COL))
        if not sku:
            continue
        sizes = {}
        for col, size_name in SIZE_COLS.items():
            val = cells.get(col)
            try:
                sizes[size_name] = max(0, int(float(str(val).strip()))) if val else 0
            except (ValueError, TypeError):
                sizes[size_name] = 0
        total = sum(sizes.values())
        if sku not in stock:
            stock[sku] = 0
        stock[sku] += total

    return stock


def load_catalog_models():
    if not CATALOG_JSON.exists():
        return set()
    data = json.loads(CATALOG_JSON.read_text(encoding="utf-8"))
    return {item["family"][:4] for item in data if item.get("family")}


def compute_disponibles(stock):
    catalog_models = load_catalog_models()

    by_model = {}
    for sku, total in stock.items():
        model = sku[:4]
        if model not in catalog_models:
            continue
        by_model[model] = by_model.get(model, 0) + total

    # Modelos del catálogo sin entrada en Excel → stock 0
    for model in catalog_models:
        if model not in by_model:
            by_model[model] = 0

    disponibles = sorted(m for m, total in by_model.items() if total > 0)
    sin_stock   = sorted(m for m, total in by_model.items() if total == 0)

    return disponibles, sin_stock


def update_script(disponibles):
    src = SCRIPT_JS.read_text(encoding="utf-8")

    disp_pat = re.compile(
        r"const CATALOGO_44_MODELOS_DISPONIBLES\s*=\s*new Set\(\[.*?\]\);",
        re.DOTALL
    )
    inner = ", ".join(f'"{m}"' for m in disponibles)
    disp_new = f"const CATALOGO_44_MODELOS_DISPONIBLES = new Set([{inner}]);"

    new_src = disp_pat.sub(disp_new, src)
    if new_src == src:
        return False

    SCRIPT_JS.write_text(new_src, encoding="utf-8")
    return True


def git_commit_push(disponibles, sin_stock):
    root = SCRIPT_JS.parent
    subprocess.run(["git", "add", "script-v2.js"], cwd=root, check=True)
    msg = (f"chore: actualizar stock Cole 44 — "
           f"{len(disponibles)} modelos disponibles, "
           f"{len(sin_stock)} sin stock\n\n"
           f"Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>")
    subprocess.run(["git", "commit", "-m", msg], cwd=root, check=True)
    subprocess.run(["git", "push", "origin", "main"], cwd=root, check=True)
    result = subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                            cwd=root, capture_output=True, text=True)
    print(f"Pushed main@{result.stdout.strip()}")


def main():
    print(f"Leyendo stock de '{SHEET_NAME}'...")
    stock = read_cole44_stock()
    if not stock:
        return

    disponibles, sin_stock = compute_disponibles(stock)

    print(f"Disponibles ({len(disponibles)}): {', '.join(disponibles)}")
    print(f"Sin stock   ({len(sin_stock)}):   {', '.join(sin_stock)}")

    changed = update_script(disponibles)
    if changed:
        print("Cambios detectados, subiendo a produccion...")
        git_commit_push(disponibles, sin_stock)
    else:
        print("Sin cambios en Cole 44 — nada que subir.")


if __name__ == "__main__":
    main()
