import json
from pathlib import Path

from openpyxl import load_workbook


DEFAULT_SOURCE = Path(r"C:\Users\manuh\OneDrive - Mohicano Jeans\INVENTARIO 01-04 COMPLETO.xlsx")
DEFAULT_OUTPUT = Path("stock-data.json")
DEFAULT_SHEET = "COLE 42"
SIZE_COLUMNS = {
    "36": 5,
    "38": 6,
    "40": 7,
    "42": 8,
    "44": 9,
    "46": 10,
}


def normalize_article_code(value) -> str:
    digits = "".join(ch for ch in str(value or "") if ch.isdigit())
    if not digits:
        return ""

    if len(digits) == 6:
        model = digits[:4]
        variant = digits[4:6]
    elif len(digits) >= 8:
        model = digits[-6:-2]
        variant = digits[-2:]
    else:
        return digits

    return f"{model}-{variant}"


def parse_int(value) -> int:
    if value in (None, ""):
        return 0
    try:
        return max(0, int(float(value)))
    except (TypeError, ValueError):
        return 0


def build_description(row) -> str:
    tiro = str(row[2] or "").strip()
    bota = str(row[3] or "").strip()
    color = str(row[4] or "").strip()
    parts = [part for part in [tiro, bota, color] if part]
    return " / ".join(parts)


def parse_stock_excel(source_path: Path, sheet_name: str = DEFAULT_SHEET) -> dict:
    wb = load_workbook(source_path, read_only=True, data_only=True)
    if sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
    elif "COLE 42" in wb.sheetnames:
        ws = wb["COLE 42"]
    elif "Hoja1" in wb.sheetnames:
        ws = wb["Hoja1"]
    else:
        ws = wb[wb.sheetnames[0]]

    items = {}
    for row in ws.iter_rows(min_row=4, values_only=True):
        raw_code = row[1] if len(row) > 1 else None
        sku = normalize_article_code(raw_code)
        if not sku:
            continue

        sizes = {
            size: parse_int(row[col_index]) if len(row) > col_index else 0
            for size, col_index in SIZE_COLUMNS.items()
        }
        total = sum(sizes.values())
        if total <= 0:
            continue

        items[sku] = {
            "article": str(raw_code).strip(),
            "sku": sku,
            "description": build_description(row),
            "sizes": sizes,
            "total": total,
        }

    return {
        "source_file": str(source_path),
        "sheet_name": ws.title,
        "items": items,
    }


def main() -> None:
    if not DEFAULT_SOURCE.exists():
        raise SystemExit(f"No se encontro el archivo: {DEFAULT_SOURCE}")

    payload = parse_stock_excel(DEFAULT_SOURCE)
    DEFAULT_OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Stock exportado a {DEFAULT_OUTPUT.resolve()}")
    print(f"Hoja usada: {payload['sheet_name']}")
    print(f"SKUs con stock: {len(payload['items'])}")


if __name__ == "__main__":
    main()
