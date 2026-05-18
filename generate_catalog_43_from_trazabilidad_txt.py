from __future__ import annotations

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parent
TXT_PATH = ROOT / "DATA Trazabilidad" / "SALDOS-SECCI 43.TXT"
EXCEL_CANDIDATES = [
    Path(r"C:\Users\Lenovo\Downloads\COLE 43  (1).xlsx"),
    ROOT / "COLE 43  (1).xlsx",
]
IMAGE_ROOTS = [ROOT / "43" / "43", ROOT / "43"]
CATALOG_OUTPUT = ROOT / "data-catalogo-43.json"
PRICE_OUTPUT = ROOT / "price-data-catalogo-43.json"
STOCK_OUTPUT = ROOT / "stock-data-catalogo-43.json"
PLACEHOLDER_IMAGE = "Imagenes/Logo/app-icon.png"
VALID_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
SIZE_KEYS = ["36", "38", "40", "42", "44", "46"]
XML_NS = {
    "m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


def resolve_excel_path() -> Path:
    for candidate in EXCEL_CANDIDATES:
        if candidate.exists():
            return candidate
    raise FileNotFoundError("No se encontró el Excel de la colección 43")


def natural_key(path: Path) -> list[object]:
    parts = re.split(r"(\d+)", path.name.lower())
    key: list[object] = []
    for part in parts:
        key.append(int(part) if part.isdigit() else part)
    return key


def digits_only(value: str) -> str:
    return re.sub(r"\D", "", value or "")


def folder_candidates(model_code: str) -> list[Path]:
    raw = str(model_code or "").strip()
    if not raw:
        return []
    normalized_digits = digits_only(raw)
    parts = raw.split("-", 1)
    base = parts[0].strip()
    variant = (parts[1].strip() if len(parts) > 1 else "00") or "00"
    base_digits = digits_only(base)

    dirs: list[Path] = []
    for root in IMAGE_ROOTS:
        if not root.exists():
            continue
        exact_dir = root / raw
        if exact_dir.is_dir() and exact_dir not in dirs:
            dirs.append(exact_dir)
        for path in root.iterdir():
            if not path.is_dir() or path in dirs:
                continue
            folder_digits = digits_only(path.name)
            if not folder_digits:
                continue
            if folder_digits == normalized_digits:
                dirs.append(path)
                continue
            if variant == "00" and folder_digits == base_digits:
                dirs.append(path)
    return dirs


def normalize_excel_sku(value: str) -> str:
    raw = str(value or "").strip().upper()
    if not raw:
        return ""
    match = re.match(r"^(\d{4})(?:[- ]?(\d{1,2}))?$", raw)
    if not match:
        digits = digits_only(raw)
        if len(digits) < 4:
            return ""
        model = digits[:4]
        variant = digits[4:6] if len(digits) >= 6 else "00"
        return f"{model}-{variant.zfill(2)}"
    model = match.group(1)
    variant = (match.group(2) or "00").zfill(2)
    return f"{model}-{variant}"


def parse_int(value: str) -> int:
    raw = str(value or "").strip()
    if not raw:
        return 0
    try:
        return int(float(raw))
    except ValueError:
        return 0


def available_total(columns: list[str]) -> int:
    saldo = parse_int(columns[6]) if len(columns) > 6 else 0
    if saldo > 0:
        return saldo
    numeric_values = [parse_int(value) for value in columns[3:15]]
    positives = [value for value in numeric_values if value > 0]
    return max(positives) if positives else 0


def list_model_images(model_code: str) -> list[str]:
    model_dirs = folder_candidates(model_code)
    if not model_dirs:
        return []

    top_level_files: list[Path] = []
    editar_files: list[Path] = []
    seen_relative = set()

    for model_dir in model_dirs:
        for path in model_dir.iterdir():
            if not path.is_file() or path.suffix.lower() not in VALID_IMAGE_EXTENSIONS:
                continue
            key = path.relative_to(model_dir).as_posix().lower()
            if key in seen_relative:
                continue
            seen_relative.add(key)
            top_level_files.append(path)

        editar_dir = model_dir / "editar"
        if editar_dir.exists():
            for path in editar_dir.iterdir():
                if not path.is_file() or path.suffix.lower() not in VALID_IMAGE_EXTENSIONS:
                    continue
                key = path.relative_to(model_dir).as_posix().lower()
                if key in seen_relative:
                    continue
                seen_relative.add(key)
                editar_files.append(path)

    top_level_files.sort(key=natural_key)
    editar_files.sort(key=natural_key)
    prioritized = editar_files + top_level_files
    return [path.relative_to(ROOT).as_posix() for path in prioritized]


def read_first_sheet_rows(excel_path: Path) -> list[list[str]]:
    with zipfile.ZipFile(excel_path) as zf:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in zf.namelist():
            shared_root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
            for si in shared_root.findall("m:si", XML_NS):
                text = "".join(node.text or "" for node in si.iterfind(".//m:t", XML_NS))
                shared.append(text)

        workbook_root = ET.fromstring(zf.read("xl/workbook.xml"))
        first_sheet = workbook_root.find("m:sheets/m:sheet", XML_NS)
        if first_sheet is None:
            return []
        rel_id = first_sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
        rels_root = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
        target = ""
        for rel in rels_root:
            if rel.attrib.get("Id") == rel_id:
                target = rel.attrib.get("Target", "")
                break
        if not target:
            return []
        if not target.startswith("xl/"):
            target = f"xl/{target}"

        sheet_root = ET.fromstring(zf.read(target))

        def cell_value(cell) -> str:
            cell_type = cell.attrib.get("t")
            if cell_type == "s":
                v = cell.find("m:v", XML_NS)
                if v is None or v.text is None:
                    return ""
                idx = int(v.text)
                return shared[idx] if 0 <= idx < len(shared) else ""
            if cell_type == "inlineStr":
                return "".join(node.text or "" for node in cell.iterfind(".//m:t", XML_NS))
            v = cell.find("m:v", XML_NS)
            return v.text if v is not None and v.text is not None else ""

        rows: list[list[str]] = []
        for row in sheet_root.findall(".//m:sheetData/m:row", XML_NS):
            rows.append([cell_value(cell).strip() for cell in row.findall("m:c", XML_NS)])
        return rows


def parse_excel_models(excel_path: Path) -> dict[str, dict[str, object]]:
    rows = read_first_sheet_rows(excel_path)
    items: dict[str, dict[str, object]] = {}

    for row in rows[2:]:
        article = row[1] if len(row) > 1 else ""
        sku = normalize_excel_sku(article)
        if not re.match(r"^43\d{2}-\d{2}$", sku):
            continue

        item_type = (row[2] if len(row) > 2 else "").strip()
        tiro = (row[3] if len(row) > 3 else "").strip()
        bota = (row[4] if len(row) > 4 else "").strip()
        tela = (row[5] if len(row) > 5 else "").strip()
        price = parse_int(row[6] if len(row) > 6 else "")
        hantan = (row[7] if len(row) > 7 else "").strip()

        items[sku] = {
            "article": article,
            "sku": sku,
            "type": item_type,
            "tiro": tiro,
            "bota": bota,
            "tela": tela,
            "price": price,
            "hantan": hantan,
        }

    return items


def parse_txt_totals() -> dict[str, dict[str, object]]:
    if not TXT_PATH.exists():
        return {}

    items: dict[str, dict[str, object]] = {}
    lines = TXT_PATH.read_text(encoding="utf-8", errors="ignore").splitlines()
    for raw_line in lines[1:]:
        if not raw_line.strip():
            continue
        parts = raw_line.split(";")
        if len(parts) < 2:
            continue
        article = (parts[0] or "").strip()
        cut = digits_only((parts[1] or "").strip()).lstrip("0")
        sku = normalize_excel_sku(article[-6:] if digits_only(article).startswith("01") else article)
        if not sku or not sku.startswith("43"):
            continue

        total = available_total(parts)
        current = items.get(sku)
        if current is None or total > int(current["total"]):
            items[sku] = {
                "article": article,
                "sku": sku,
                "cut": cut,
                "total": total,
            }
    return items


def build_description(item: dict[str, object]) -> str:
    parts = [str(item.get("type") or "").strip(), str(item.get("tiro") or "").strip(), str(item.get("bota") or "").strip()]
    parts = [part for part in parts if part]
    return " · ".join(parts)


def build_catalog_and_stock() -> tuple[list[dict[str, object]], dict[str, object], dict[str, object]]:
    excel_path = resolve_excel_path()
    excel_items = parse_excel_models(excel_path)
    txt_totals = parse_txt_totals()

    catalog: list[dict[str, object]] = []
    price_items: dict[str, int] = {}
    stock_items: dict[str, object] = {}

    for sku in sorted(excel_items.keys()):
        item = excel_items[sku]
        model_code = sku.split("-")[0]
        images = list_model_images(sku)
        has_images = bool(images)
        if not has_images:
            continue

        total = int((txt_totals.get(sku) or {}).get("total") or 0)
        cut = str((txt_totals.get(sku) or {}).get("cut") or "").strip()
        description = build_description(item)
        characteristics = []
        if item.get("tela"):
            characteristics.append(f"Tela: {item['tela']}")
        if item.get("hantan"):
            characteristics.append(f"Tecnología: {item['hantan']}")
        if total > 0:
            characteristics.append(f"Disponible: {total} unidades")
        if cut:
            characteristics.append(f"Cortes: {cut}")

        catalog.append({
            "family": sku,
            "main_image": images[0] if images else PLACEHOLDER_IMAGE,
            "gallery": images if images else [PLACEHOLDER_IMAGE],
            "description": description,
            "characteristics": characteristics,
            "variants": [],
        })

        if int(item.get("price") or 0) > 0:
            price_items[sku] = int(item["price"])

        stock_items[sku] = {
            "article": str(item.get("article") or ""),
            "sku": sku,
            "description": description,
            "sizes": {size: 0 for size in SIZE_KEYS},
            "total": total,
        }

    price_payload = {
        "source": f"{excel_path.name}::COLE 43",
        "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "items": price_items,
    }
    stock_payload = {
        "source_file": "DATA Trazabilidad/SALDOS-SECCI 43.TXT",
        "sheet_name": "SALDOS-SECCI 43",
        "items": stock_items,
    }
    return catalog, price_payload, stock_payload


def main() -> None:
    catalog, price_payload, stock_payload = build_catalog_and_stock()
    CATALOG_OUTPUT.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    PRICE_OUTPUT.write_text(json.dumps(price_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    STOCK_OUTPUT.write_text(json.dumps(stock_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Catalogo 43: {len(catalog)} modelos con foto")
    print(f"Precios 43: {len(price_payload['items'])} modelos")
    print(f"Stock 43: {len(stock_payload['items'])} modelos")


if __name__ == "__main__":
    main()
