import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


SOURCE_XLSX = (
    Path(sys.argv[1])
    if len(sys.argv) > 1
    else Path(r"C:\Users\Lenovo\OneDrive - Mohicano Jeans\INVENTARIO 01-04 COMPLETO.xlsx")
)
OUTPUT_CATALOGO_1 = Path("stock-data.json")
OUTPUT_CATALOGO_2 = Path("stock-data-catalogo-2.json")
OUTPUT_CATALOGO_43 = Path("stock-data-catalogo-43.json")
OUTPUT_CATALOGO_44 = Path("stock-data-catalogo-44.json")

SIZE_COLUMNS_BY_LAYOUT = {
    "default": {
        "36": 5,
        "38": 6,
        "40": 7,
        "42": 8,
        "44": 9,
        "46": 10,
    },
    "catalogo-43-44": {
        "36": 7,
        "38": 8,
        "40": 9,
        "42": 10,
        "44": 11,
        "46": 12,
    },
}

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
    "office_rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


def column_index(cell_ref: str) -> int:
    match = re.match(r"([A-Z]+)", cell_ref or "")
    if not match:
        return -1
    value = 0
    for char in match.group(1):
        value = value * 26 + ord(char) - ord("A") + 1
    return value - 1


def load_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    return [
        "".join(text.text or "" for text in node.findall(".//main:t", NS))
        for node in root.findall("main:si", NS)
    ]


def read_cell_value(cell: ET.Element, shared_strings: list[str]):
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        return "".join(text.text or "" for text in cell.findall(".//main:t", NS))
    value_node = cell.find("main:v", NS)
    if value_node is None:
        return None
    raw = value_node.text or ""
    if cell_type == "s":
        try:
            return shared_strings[int(raw)]
        except (IndexError, ValueError):
            return raw
    return raw


def workbook_sheets(archive: zipfile.ZipFile) -> dict[str, str]:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    rels_root = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    rel_targets = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels_root.findall("rel:Relationship", NS)
    }
    sheets = {}
    for sheet in workbook.findall("main:sheets/main:sheet", NS):
        rel_id = sheet.attrib.get(f"{{{NS['office_rel']}}}id")
        target = rel_targets.get(rel_id)
        if target:
            sheets[sheet.attrib["name"]] = "xl/" + target.lstrip("/")
    return sheets


def read_sheet_rows(archive: zipfile.ZipFile, sheet_path: str, shared_strings: list[str]) -> list[list[object]]:
    root = ET.fromstring(archive.read(sheet_path))
    rows = []
    for row in root.findall("main:sheetData/main:row", NS):
        values = []
        for cell in row.findall("main:c", NS):
            index = column_index(cell.attrib.get("r", ""))
            if index < 0:
                continue
            while len(values) <= index:
                values.append(None)
            values[index] = read_cell_value(cell, shared_strings)
        rows.append(values)
    return rows


def normalize_article_code(value) -> str:
    raw = str(value or "").strip().upper()
    if not raw:
        return ""
    if "-" in raw:
        left, _, right = raw.partition("-")
        left_digits = "".join(char for char in left if char.isdigit())
        right_digits = "".join(char for char in right if char.isdigit())
        if len(left_digits) >= 4:
            return f"{left_digits[-4:]}-{(right_digits[-2:] if right_digits else '00').zfill(2)}"

    digits = "".join(char for char in raw if char.isdigit())
    if not digits:
        return ""
    if len(digits) == 7 and digits.endswith("0"):
        digits = digits[:-1]
    if len(digits) in (4, 5):
        return digits
    if len(digits) == 6:
        return f"{digits[:4]}-{digits[4:6]}"
    if len(digits) >= 8:
        return f"{digits[-6:-2]}-{digits[-2:]}"
    return digits if len(digits) >= 4 else ""


def parse_int(value) -> int:
    if value in (None, ""):
        return 0
    try:
        return max(0, int(float(str(value).strip())))
    except ValueError:
        return 0


def build_description(row) -> str:
    parts = [
        str(row[index] or "").strip()
        for index in (2, 3, 4)
        if len(row) > index and str(row[index] or "").strip()
    ]
    return " / ".join(parts)


def parse_sheet_items(rows: list[list[object]], *, code_index: int = 1, text_indexes: tuple[int, ...] = (2, 3, 4), size_columns: dict[str, int] | None = None) -> dict:
    active_size_columns = size_columns or SIZE_COLUMNS_BY_LAYOUT["default"]
    parsed = {}
    for row in rows:
        raw_code = row[code_index] if len(row) > code_index else None
        sku = normalize_article_code(raw_code)
        if not sku:
            continue
        sizes = {
            size: parse_int(row[index]) if len(row) > index else 0
            for size, index in active_size_columns.items()
        }
        total = sum(sizes.values())
        if total <= 0:
            continue

        if sku not in parsed:
            parsed[sku] = {
                "article": str(raw_code or "").strip(),
                "sku": sku,
                "description": " / ".join(
                    str(row[index] or "").strip()
                    for index in text_indexes
                    if len(row) > index and str(row[index] or "").strip()
                ),
                "sizes": {size: 0 for size in active_size_columns},
                "total": 0,
            }
        item = parsed[sku]
        for size in active_size_columns:
            item["sizes"][size] += sizes[size]
        item["total"] = sum(item["sizes"].values())
        if not item["description"]:
            item["description"] = " / ".join(
                str(row[index] or "").strip()
                for index in text_indexes
                if len(row) > index and str(row[index] or "").strip()
            )
    return parsed


def find_sheet(sheets: dict[str, str], desired_name: str) -> str:
    desired = desired_name.strip().lower()
    for name in sheets:
        if name.strip().lower() == desired:
            return name
    return ""


def main() -> None:
    if not SOURCE_XLSX.exists():
        raise SystemExit(f"No se encontro el Excel: {SOURCE_XLSX}")

    with zipfile.ZipFile(SOURCE_XLSX) as archive:
        shared_strings = load_shared_strings(archive)
        sheets = workbook_sheets(archive)

        sheet_42 = find_sheet(sheets, "principal 42") or find_sheet(sheets, "COLE 42")
        if not sheet_42:
            raise SystemExit("No se encontro la hoja principal 42 en el Excel.")
        rows_42 = read_sheet_rows(archive, sheets[sheet_42], shared_strings)
        payload_42 = {
            "source_file": str(SOURCE_XLSX),
            "sheet_name": sheet_42,
            "items": parse_sheet_items(rows_42),
        }

        catalogo_2_sheet_names = []
        catalogo_2_items = {}
        for desired in ("COLE 40", "cole 40", "COLE 41", "cole 41"):
            sheet_name = find_sheet(sheets, desired)
            if not sheet_name or sheet_name in catalogo_2_sheet_names:
                continue
            catalogo_2_sheet_names.append(sheet_name)
            rows = read_sheet_rows(archive, sheets[sheet_name], shared_strings)
            for sku, payload in parse_sheet_items(rows).items():
                if sku not in catalogo_2_items:
                    catalogo_2_items[sku] = payload
                    continue
                target = catalogo_2_items[sku]
                for size in SIZE_COLUMNS_BY_LAYOUT["default"]:
                    target["sizes"][size] += payload["sizes"].get(size, 0)
                target["total"] = sum(target["sizes"].values())

        payload_catalogo_2 = {
            "source_file": str(SOURCE_XLSX),
            "sheet_names": catalogo_2_sheet_names,
            "items": catalogo_2_items,
        }

        sheet_43 = find_sheet(sheets, "COLE 43")
        rows_43 = read_sheet_rows(archive, sheets[sheet_43], shared_strings) if sheet_43 else []
        payload_catalogo_43 = {
            "source_file": str(SOURCE_XLSX),
            "sheet_name": sheet_43,
            "items": parse_sheet_items(
                rows_43,
                code_index=2,
                text_indexes=(3, 4, 5, 6),
                size_columns=SIZE_COLUMNS_BY_LAYOUT["catalogo-43-44"],
            ) if rows_43 else {},
        }

        sheet_44 = find_sheet(sheets, "COLE 44")
        rows_44 = read_sheet_rows(archive, sheets[sheet_44], shared_strings) if sheet_44 else []
        payload_catalogo_44 = {
            "source_file": str(SOURCE_XLSX),
            "sheet_name": sheet_44,
            "items": parse_sheet_items(
                rows_44,
                code_index=2,
                text_indexes=(3, 4, 5, 6),
                size_columns=SIZE_COLUMNS_BY_LAYOUT["catalogo-43-44"],
            ) if rows_44 else {},
        }

    OUTPUT_CATALOGO_1.write_text(json.dumps(payload_42, ensure_ascii=False, indent=2), encoding="utf-8")
    OUTPUT_CATALOGO_2.write_text(json.dumps(payload_catalogo_2, ensure_ascii=False, indent=2), encoding="utf-8")
    OUTPUT_CATALOGO_43.write_text(json.dumps(payload_catalogo_43, ensure_ascii=False, indent=2), encoding="utf-8")
    OUTPUT_CATALOGO_44.write_text(json.dumps(payload_catalogo_44, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Stock catalogo-1: {len(payload_42['items'])} SKUs / {sum(i['total'] for i in payload_42['items'].values())} unidades")
    print(f"Stock catalogo-2: {len(payload_catalogo_2['items'])} SKUs / {sum(i['total'] for i in payload_catalogo_2['items'].values())} unidades")
    print(f"Stock catalogo-43: {len(payload_catalogo_43['items'])} SKUs / {sum(i['total'] for i in payload_catalogo_43['items'].values())} unidades")
    print(f"Stock catalogo-44: {len(payload_catalogo_44['items'])} SKUs / {sum(i['total'] for i in payload_catalogo_44['items'].values())} unidades")
    print(f"Fuente: {SOURCE_XLSX}")


if __name__ == "__main__":
    main()
