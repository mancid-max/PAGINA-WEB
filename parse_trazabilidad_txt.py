import json
from pathlib import Path

from openpyxl import load_workbook


DEFAULT_SOURCE = Path("1_PROGRAMAS DE PRODUCCION MHC .xlsx")
DEFAULT_SHEET = "Informe Gantt"
DEFAULT_OUTPUT = Path("trazabilidad-data.json")


def parse_int(value) -> int:
    try:
        return int(float(value or 0))
    except (TypeError, ValueError):
        return 0


def has_value(value) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    return True


def infer_location(row) -> str:
    estado = str(row.get("estado") or "").strip()
    if estado and estado.lower() != "anulado":
        return estado

    stage_order = [
        ("Term", row.get("term")),
        ("Lavanderia", row.get("lavand")),
        ("Limpiado", row.get("limp")),
        ("Sur", row.get("sur")),
        ("Urrutia", row.get("urrutia")),
        ("Corte", row.get("corte")),
        ("Pendiente", row.get("pend")),
    ]
    for name, value in stage_order:
        if has_value(value):
            return name
    return "Sin movimiento"


def parse_gantt(source_path: Path, sheet_name: str) -> dict:
    wb = load_workbook(source_path, data_only=True)
    if sheet_name not in wb.sheetnames:
        raise ValueError(f"No existe la hoja '{sheet_name}' en {source_path.name}")

    ws = wb[sheet_name]
    items = []

    for r in range(5, ws.max_row + 1):
        article_raw = ws.cell(r, 1).value    # A
        tela = ws.cell(r, 4).value           # D
        taller = ws.cell(r, 5).value         # E
        programa = ws.cell(r, 6).value       # F
        pend = ws.cell(r, 7).value           # G
        corte = ws.cell(r, 8).value          # H
        urrutia = ws.cell(r, 10).value       # J
        sur = ws.cell(r, 12).value           # L
        estado = ws.cell(r, 13).value        # M
        limp = ws.cell(r, 14).value          # N
        lavand = ws.cell(r, 16).value        # P
        term = ws.cell(r, 18).value          # R
        bdg = ws.cell(r, 19).value           # S

        article = str(article_raw or "").strip()
        if not article or not article.isdigit():
            continue

        pend_units = max(0, parse_int(pend))
        available_units = max(0, parse_int(bdg))
        unavailable_units = max(0, pend_units - available_units)

        # Excluir filas anuladas sin unidades.
        estado_txt = str(estado or "").strip().lower()
        if pend_units <= 0 and available_units <= 0 and estado_txt == "anulado":
            continue

        location = "Bodega" if available_units > 0 else infer_location({
            "estado": estado,
            "term": term,
            "lavand": lavand,
            "limp": limp,
            "sur": sur,
            "urrutia": urrutia,
            "corte": corte,
            "pend": pend,
        })

        items.append({
            "sku": article,
            "article": article,
            "fabric": str(tela or "").strip(),
            "workshop": str(taller or "").strip(),
            "program_units": max(0, parse_int(programa)),
            "pending_units": pend_units,
            "available_units": available_units,
            "unavailable_units": unavailable_units,
            "location": location,
            "status": str(estado or "").strip(),
            "source_row": r,
        })

    items.sort(key=lambda x: (x["available_units"], x["pending_units"]), reverse=True)

    return {
        "source_file": str(source_path),
        "sheet": sheet_name,
        "rule": "Disponibles segun BDG; no disponibles = Pendiente - BDG",
        "items_total": len(items),
        "available_units_total": sum(i["available_units"] for i in items),
        "unavailable_units_total": sum(i["unavailable_units"] for i in items),
        "items": items,
    }


def main() -> None:
    source_path = DEFAULT_SOURCE
    if not source_path.exists():
        raise SystemExit(f"No se encontro el archivo: {source_path}")

    payload = parse_gantt(source_path, DEFAULT_SHEET)
    DEFAULT_OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Trazabilidad exportada a {DEFAULT_OUTPUT.resolve()}")
    print(f"Articulos: {payload['items_total']}")
    print(f"Disponibles: {payload['available_units_total']}")
    print(f"No disponibles: {payload['unavailable_units_total']}")


if __name__ == "__main__":
    main()
