import json
from pathlib import Path

from openpyxl import load_workbook


DEFAULT_SOURCE = Path("Cortes 4200 .xlsx")
DEFAULT_SHEET = "Ranking 42"
DEFAULT_OUTPUT = Path("trazabilidad-data.json")
SIZES = ["34", "36", "38", "40", "42", "44", "46", "48"]


def parse_int(value) -> int:
    try:
        return int(float(value or 0))
    except (TypeError, ValueError):
        return 0


def parse_ranking42(source_path: Path, sheet_name: str) -> dict:
    wb = load_workbook(source_path, data_only=True)
    if sheet_name not in wb.sheetnames:
        raise ValueError(f"No existe la hoja '{sheet_name}' en {source_path.name}")

    ws = wb[sheet_name]
    items = []

    for r in range(1, ws.max_row + 1):
        sku = ws.cell(r, 1).value
        total_cell = ws.cell(r, 15).value  # columna O
        color = ws.cell(r, 6).value        # columna F

        if not isinstance(sku, str) or not sku.strip():
            continue
        total_raw = parse_int(total_cell)
        # Regla de negocio: los negativos son disponibles
        if total_raw >= 0:
            continue

        size_values = [parse_int(ws.cell(r, c).value) for c in range(7, 15)]  # G..N
        sizes_available = {}
        for size_label, value in zip(SIZES, size_values):
            qty = abs(value) if value < 0 else 0
            sizes_available[size_label] = qty

        available_total = sum(sizes_available.values())
        if available_total <= 0:
            continue

        items.append({
            "sku": sku.strip(),
            "color": str(color or "").strip(),
            "available_total": available_total,
            "sizes_available": sizes_available,
            "source_row": r,
        })

    items.sort(key=lambda x: x["available_total"], reverse=True)

    return {
        "source_file": str(source_path),
        "sheet": sheet_name,
        "rule": "Valores negativos en Ranking 42 se consideran disponibles",
        "items_total": len(items),
        "units_total": sum(i["available_total"] for i in items),
        "items": items,
    }


def main() -> None:
    source_path = DEFAULT_SOURCE
    if not source_path.exists():
        raise SystemExit(f"No se encontro el archivo: {source_path}")

    payload = parse_ranking42(source_path, DEFAULT_SHEET)
    DEFAULT_OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Trazabilidad exportada a {DEFAULT_OUTPUT.resolve()}")
    print(f"SKUs disponibles: {payload['items_total']}")
    print(f"Unidades disponibles: {payload['units_total']}")


if __name__ == "__main__":
    main()
