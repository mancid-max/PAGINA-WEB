"""
Actualiza CATALOGO_43_MODELOS_DISPONIBLES y CATALOGO_43_SKUS_AGOTADOS
en script-v2.js leyendo el Excel de inventario.

Regla: stock total < 10 → agotado.
"""
import re, sys, zipfile, subprocess
from pathlib import Path
from xml.etree import ElementTree as ET
from collections import defaultdict

NS_M = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

EXCEL_SRC    = Path(r"C:\Users\Lenovo\OneDrive - Mohicano Jeans\INVENTARIO 01-04 COMPLETO.xlsx")
SCRIPT_JS    = Path(__file__).parent.parent / "script-v2.js"
CATALOG_JSON = Path(__file__).parent.parent / "data-catalogo-43.json"
STOCK_JSON   = Path(__file__).parent.parent / "stock-data-catalogo-43.json"
THRESHOLD    = 10   # stock < THRESHOLD → agotado
SHEET_NAME   = "COLE 43"
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


def read_cole43_stock():
    if not EXCEL_SRC.exists():
        print(f"ERROR: No se encontró {EXCEL_SRC}", file=sys.stderr)
        return {}

    with zipfile.ZipFile(EXCEL_SRC) as z:
        strings   = load_strings(z)
        path      = find_sheet_path(z, SHEET_NAME)
        if not path:
            print(f"ERROR: No se encontró hoja '{SHEET_NAME}'", file=sys.stderr)
            return {}
        ws = ET.fromstring(z.read(path))

    # {sku: {"total": int, "sizes": {size: int}}}
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
            stock[sku] = {"total": 0, "sizes": {s: 0 for s in SIZE_COLS.values()}}
        stock[sku]["total"] += total
        for s, v in sizes.items():
            stock[sku]["sizes"][s] = stock[sku]["sizes"].get(s, 0) + v

    return stock


def load_catalog_models():
    """Devuelve el set de modelos (4 dígitos) que están en el catálogo web."""
    import json
    if not CATALOG_JSON.exists():
        return set()
    data = json.loads(CATALOG_JSON.read_text(encoding="utf-8"))
    return {item["family"][:4] for item in data if item.get("family")}


def compute_sets(stock):
    catalog_models = load_catalog_models()

    by_model = defaultdict(dict)
    for sku, data in stock.items():
        model = sku[:4]
        if model not in catalog_models:
            continue
        by_model[model][sku] = data["total"]

    # Modelos del catálogo sin ninguna entrada en Excel → stock 0
    for model in catalog_models:
        if model not in by_model:
            by_model[model] = {}

    disponibles = set()
    agotados    = set()

    for model, skus in by_model.items():
        max_stock = max(skus.values()) if skus else 0
        if max_stock >= THRESHOLD:
            disponibles.add(model)
            for sku, total in skus.items():
                if total < THRESHOLD:
                    agotados.add(sku)

    return sorted(disponibles), sorted(agotados)


def build_js_set(name, items, comment=""):
    lines = [f"const {name} = new Set(["]
    if items:
        quoted = [f'  "{s}"' for s in sorted(items)]
        lines.append(",\n".join(quoted) + ",")
    lines.append("]);")
    if comment:
        lines[0] = f"// {comment}\n" + lines[0]
    return "\n".join(lines)


def update_script(disponibles, agotados):
    src = SCRIPT_JS.read_text(encoding="utf-8")

    # Replace CATALOGO_43_MODELOS_DISPONIBLES
    disp_pat = re.compile(
        r"const CATALOGO_43_MODELOS_DISPONIBLES\s*=\s*new Set\(\[.*?\]\);",
        re.DOTALL
    )
    disp_new = "const CATALOGO_43_MODELOS_DISPONIBLES = new Set([\n" + \
               ",\n".join(f'  "{m}"' for m in disponibles) + \
               (",\n" if disponibles else "") + "]);"

    # Replace CATALOGO_43_SKUS_AGOTADOS
    agot_pat = re.compile(
        r"const CATALOGO_43_SKUS_AGOTADOS\s*=\s*new Set\(\[.*?\]\);",
        re.DOTALL
    )
    agot_new = "const CATALOGO_43_SKUS_AGOTADOS = new Set([\n" + \
               ",\n".join(f'  "{s}"' for s in agotados) + \
               (",\n" if agotados else "") + "]);"

    new_src = disp_pat.sub(disp_new, src)
    new_src = agot_pat.sub(agot_new, new_src)

    if new_src == src:
        return False  # sin cambios

    SCRIPT_JS.write_text(new_src, encoding="utf-8")
    return True


def write_stock_json(stock):
    import json
    items = {}
    for sku, data in stock.items():
        items[sku] = {
            "article": sku,
            "sku": sku,
            "description": "",
            "sizes": data["sizes"],
            "total": data["total"],
        }
    payload = {
        "source_file": str(EXCEL_SRC),
        "sheet_name": SHEET_NAME,
        "items": items,
    }
    STOCK_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def git_commit_push(disponibles, agotados):
    root = SCRIPT_JS.parent
    subprocess.run(["git", "add", "script-v2.js", "stock-data-catalogo-43.json"], cwd=root, check=True)
    msg = (f"chore: actualizar stock Cole 43 — "
           f"{len(disponibles)} modelos disponibles, "
           f"{len(agotados)} SKUs agotados\n\n"
           f"Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>")
    subprocess.run(["git", "commit", "-m", msg], cwd=root, check=True)
    subprocess.run(["git", "push", "origin", "main"], cwd=root, check=True)
    result = subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                            cwd=root, capture_output=True, text=True)
    print(f"Pushed main@{result.stdout.strip()}")


def main():
    print(f"Leyendo stock de '{SHEET_NAME}'...")
    stock = read_cole43_stock()
    if not stock:
        return

    disponibles, agotados = compute_sets(stock)

    print(f"Modelos disponibles ({len(disponibles)}): {', '.join(disponibles)}")
    print(f"SKUs agotados ({len(agotados)}):  {', '.join(agotados)}")

    write_stock_json(stock)
    changed = update_script(disponibles, agotados)

    # Always commit stock JSON (totals may change even without agotado changes)
    import json
    old_stock = {}
    if STOCK_JSON.exists():
        try:
            old_stock = json.loads(STOCK_JSON.read_text(encoding="utf-8")).get("items", {})
        except Exception:
            pass
    stock_changed = {k: v["total"] for k, v in old_stock.items()} != {k: v["total"] for k, v in stock.items()}

    if changed or stock_changed:
        print("Cambios detectados, subiendo a produccion...")
        git_commit_push(disponibles, agotados)
    else:
        print("Sin cambios en stock — nada que subir.")


if __name__ == "__main__":
    main()
