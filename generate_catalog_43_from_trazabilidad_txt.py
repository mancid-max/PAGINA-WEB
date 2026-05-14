from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent
TXT_PATH = ROOT / "DATA Trazabilidad" / "SALDOS-SECCI 43.TXT"
IMAGE_ROOTS = [ROOT / "43" / "43", ROOT / "43"]
CATALOG_OUTPUT = ROOT / "data-catalogo-43.json"
STOCK_OUTPUT = ROOT / "stock-data-catalogo-43.json"
PLACEHOLDER_IMAGE = "Imagenes/Logo/app-icon.png"
VALID_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
SIZE_KEYS = ["36", "38", "40", "42", "44", "46"]


def natural_key(path: Path) -> list[object]:
    parts = re.split(r"(\d+)", path.name.lower())
    key: list[object] = []
    for part in parts:
        key.append(int(part) if part.isdigit() else part)
    return key


def folder_candidates(model_code: str) -> list[Path]:
    raw = str(model_code or "").strip()
    if not raw:
        return []
    normalized_digits = re.sub(r"\D", "", raw)
    base = raw.split("-")[0]
    base_digits = re.sub(r"\D", "", base)
    target_codes = [code for code in [normalized_digits, base_digits] if code]

    dirs: list[Path] = []
    for root in IMAGE_ROOTS:
        if not root.exists():
            continue
        for path in root.iterdir():
            if not path.is_dir():
                continue
            folder_digits = re.sub(r"\D", "", path.name)
            if not folder_digits:
                continue
            if any(folder_digits == code for code in target_codes):
                if path not in dirs:
                    dirs.append(path)
    return dirs


def normalize_sku(article: str) -> str:
    digits = re.sub(r"\D", "", article or "")
    if len(digits) < 8:
        return ""
    model = digits[2:6]
    variant = digits[6:8]
    return f"{model}-{variant}"


def parse_int(value: str) -> int:
    raw = (value or "").strip()
    if not raw:
      return 0
    try:
        return int(raw)
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
    seen = set()

    for model_dir in model_dirs:
        for path in model_dir.iterdir():
            if not path.is_file() or path.suffix.lower() not in VALID_IMAGE_EXTENSIONS:
                continue
            key = path.resolve().as_posix().lower()
            if key in seen:
                continue
            seen.add(key)
            top_level_files.append(path)

        editar_dir = model_dir / "editar"
        if editar_dir.exists():
            for path in editar_dir.iterdir():
                if not path.is_file() or path.suffix.lower() not in VALID_IMAGE_EXTENSIONS:
                    continue
                key = path.resolve().as_posix().lower()
                if key in seen:
                    continue
                seen.add(key)
                editar_files.append(path)

    top_level_files.sort(key=natural_key)
    editar_files.sort(key=natural_key)
    prioritized = editar_files + top_level_files
    return [path.relative_to(ROOT).as_posix() for path in prioritized]


def parse_source_rows() -> dict[str, dict[str, object]]:
    items: dict[str, dict[str, object]] = {}
    lines = TXT_PATH.read_text(encoding="utf-8", errors="ignore").splitlines()
    for raw_line in lines[1:]:
        if not raw_line.strip():
            continue
        parts = raw_line.split(";")
        if len(parts) < 2:
            continue
        article = (parts[0] or "").strip()
        cut = re.sub(r"\D", "", (parts[1] or "").strip())
        cut_trimmed = cut.lstrip("0")
        sku = normalize_sku(article)
        if not sku or len(cut_trimmed) < 5:
            continue
        if not cut_trimmed.startswith("115"):
            continue

        total = available_total(parts)
        if total < 100:
            continue

        current = items.get(sku)
        if current is None or total > int(current["total"]):
            items[sku] = {
                "article": article,
                "sku": sku,
                "cut": cut_trimmed,
                "total": total,
            }
    return items


def build_catalog_and_stock() -> tuple[list[dict[str, object]], dict[str, object]]:
    parsed = parse_source_rows()
    ordered_skus = sorted(parsed.keys(), key=lambda sku: (-int(parsed[sku]["total"]), sku))

    catalog: list[dict[str, object]] = []
    stock_items: dict[str, object] = {}

    for sku in ordered_skus:
        item = parsed[sku]
        model_code = sku.split("-")[0]
        images = list_model_images(model_code)
        has_images = bool(images)
        gallery = images if has_images else [PLACEHOLDER_IMAGE]
        main_image = gallery[0]
        total = int(item["total"])

        catalog.append({
            "family": sku,
            "main_image": main_image,
            "gallery": gallery,
            "description": f"Modelo {sku}",
            "characteristics": [
                "Coleccion 43",
                f"Cortes: {item['cut']}",
                f"Disponible: {total} unidades",
                "Imagenes cargadas" if has_images else "Foto pendiente",
            ],
            "variants": [],
        })

        stock_items[sku] = {
            "article": item["article"],
            "sku": sku,
            "description": f"Coleccion 43 / Cortes {item['cut']}",
            "sizes": {size: 0 for size in SIZE_KEYS},
            "total": total,
        }

    stock_payload = {
        "source_file": "DATA Trazabilidad/SALDOS-SECCI 43.TXT",
        "sheet_name": "SALDOS-SECCI 43",
        "items": stock_items,
    }
    return catalog, stock_payload


def main() -> None:
    catalog, stock_payload = build_catalog_and_stock()
    CATALOG_OUTPUT.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    STOCK_OUTPUT.write_text(
        json.dumps(stock_payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    total_units = sum(int(item["total"]) for item in stock_payload["items"].values())
    print(f"Catalogo 43: {len(catalog)} modelos")
    print(f"Stock 43: {total_units} unidades")


if __name__ == "__main__":
    main()
