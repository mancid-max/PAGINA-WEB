import csv
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


def normalizar_rut(valor: str) -> str:
    return re.sub(r"[^0-9K-]", "", (valor or "").strip().upper())


def cargar_xlsx_simple(path: Path):
    with zipfile.ZipFile(path) as zf:
        wb = ET.fromstring(zf.read("xl/workbook.xml"))
        first_sheet = wb.find("a:sheets", NS)[0]
        sheet_name = first_sheet.attrib.get("name", "Sheet1")
        rid = first_sheet.attrib.get(f"{{{NS['r']}}}id")

        rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
        target = None
        for rel in rels:
            if rel.attrib.get("Id") == rid:
                target = "xl/" + rel.attrib["Target"]
                break
        if not target:
            raise RuntimeError("No se pudo resolver la hoja del Excel")

        shared = []
        if "xl/sharedStrings.xml" in zf.namelist():
            sst = ET.fromstring(zf.read("xl/sharedStrings.xml"))
            for si in sst.findall("a:si", NS):
                txt = "".join(t.text or "" for t in si.iterfind(".//a:t", NS))
                shared.append(txt)

        sheet = ET.fromstring(zf.read(target))
        rows = []
        for row in sheet.findall(".//a:sheetData/a:row", NS):
            values = []
            for c in row.findall("a:c", NS):
                cell_type = c.attrib.get("t")
                v = c.find("a:v", NS)
                if v is None:
                    values.append("")
                    continue
                raw = v.text or ""
                if cell_type == "s":
                    values.append(shared[int(raw)] if raw else "")
                else:
                    values.append(raw)
            rows.append(values)
        return sheet_name, rows


def main():
    xlsx_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("Clientes.xlsx")
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("clients_import.csv")

    if not xlsx_path.exists():
        raise SystemExit(f"No existe archivo: {xlsx_path}")

    sheet_name, rows = cargar_xlsx_simple(xlsx_path)
    if not rows:
        raise SystemExit("Excel sin filas")

    header = [str(h).strip().upper() for h in rows[0]]
    try:
        rut_idx = header.index("RUT")
        rz_idx = header.index("RAZON SOCIAL")
    except ValueError as exc:
        raise SystemExit(f"No se encontraron columnas requeridas (RUT, RAZON SOCIAL). Header: {header}") from exc

    escritos = 0
    vistos = set()
    with out_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["rut", "rut_normalized", "razon_social", "active"])
        writer.writeheader()
        for row in rows[1:]:
            rut = str(row[rut_idx]).strip() if rut_idx < len(row) and row[rut_idx] is not None else ""
            razon = str(row[rz_idx]).strip() if rz_idx < len(row) and row[rz_idx] is not None else ""
            rut_norm = normalizar_rut(rut)
            if not rut_norm or not razon:
                continue
            if rut_norm in vistos:
                continue
            vistos.add(rut_norm)
            writer.writerow(
                {
                    "rut": rut,
                    "rut_normalized": rut_norm,
                    "razon_social": razon,
                    "active": "true",
                }
            )
            escritos += 1

    print(f"Hoja leida: {sheet_name}")
    print(f"Registros exportados: {escritos}")
    print(f"CSV generado: {out_path}")


if __name__ == "__main__":
    main()
