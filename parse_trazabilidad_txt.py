import csv
import json
from collections import defaultdict
from pathlib import Path


DEFAULT_SOURCE = Path(r"DATA Trazabilidad/SALDOS-SECCI.TXT")
DEFAULT_OUTPUT = Path("trazabilidad-data.json")


def parse_int(value: str) -> int:
    raw = (value or "").strip().replace(".", "").replace(",", ".")
    if not raw:
        return 0
    try:
        return int(float(raw))
    except ValueError:
        return 0


def normalize_sku(article: str) -> str:
    article = (article or "").strip()
    if len(article) < 8 or not article.isdigit():
        return article
    model = article[2:6]
    variant = article[6:8]
    return model if variant == "00" else f"{model}-{variant}"


def parse_trazabilidad_file(source_path: Path) -> dict:
    with source_path.open("r", encoding="cp1252", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        rows = list(reader)

    grouped = defaultdict(
        lambda: {
            "article": "",
            "sku": "",
            "bodega_total": 0,
            "saldo_total": 0,
            "rows": 0,
            "last_date": "",
        }
    )

    for row in rows:
        article_raw = (row.get("ARTICULO") or "").strip()
        article = "".join(ch for ch in article_raw if ch.isdigit())
        if len(article) < 8:
            continue

        sku = normalize_sku(article)
        bodega = max(0, parse_int(row.get("BODEGA")))
        saldo = max(0, parse_int(row.get("SALDO")))
        fecha = (row.get("FECHA") or "").strip()

        item = grouped[sku]
        item["article"] = article
        item["sku"] = sku
        item["bodega_total"] += bodega
        item["saldo_total"] += saldo
        item["rows"] += 1
        if fecha and fecha > item["last_date"]:
            item["last_date"] = fecha

    items = sorted(
        grouped.values(),
        key=lambda x: (x["bodega_total"], x["saldo_total"]),
        reverse=True,
    )

    return {
        "source_file": str(source_path),
        "items_total": len(items),
        "items_with_bodega": sum(1 for i in items if i["bodega_total"] > 0),
        "items": items,
    }


def main() -> None:
    source_path = DEFAULT_SOURCE
    if not source_path.exists():
        raise SystemExit(f"No se encontro el archivo: {source_path}")

    payload = parse_trazabilidad_file(source_path)
    DEFAULT_OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Trazabilidad exportada a {DEFAULT_OUTPUT.resolve()}")
    print(f"SKUs encontrados: {payload['items_total']}")
    print(f"SKUs con bodega > 0: {payload['items_with_bodega']}")


if __name__ == "__main__":
    main()
