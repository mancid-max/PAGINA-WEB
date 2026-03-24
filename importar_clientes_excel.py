import csv
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from argparse import ArgumentParser
from pathlib import Path


NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


def normalizar_rut(valor: str) -> str:
    return re.sub(r"[^0-9K-]", "", (valor or "").strip().upper())


def normalizar_razon_social(valor: str) -> str:
    texto = (valor or "").strip().upper()
    texto = re.sub(r"\([^)]*\)", "", texto)
    texto = re.sub(r"\s+", " ", texto)
    texto = texto.replace("&", "Y")
    return texto.strip(" .,-")


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


def cargar_clientes_desde_csv(path: Path):
    clientes = {}
    if not path.exists():
        return clientes

    with path.open("r", newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            rut = str(row.get("rut", "")).strip()
            razon = str(row.get("razon_social", "")).strip()
            rut_norm = normalizar_rut(row.get("rut_normalized") or rut)
            if not rut_norm:
                continue
            clientes[rut_norm] = {
                "rut": rut,
                "rut_normalized": rut_norm,
                "razon_social": razon,
            }
    return clientes


def escribir_csv(path: Path, filas):
    with path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["rut", "rut_normalized", "razon_social", "active"])
        writer.writeheader()
        for fila in filas:
            writer.writerow(fila)


def parse_args():
    parser = ArgumentParser(
        description="Convierte Clientes.xlsx a CSV y opcionalmente prevalida contra clientes ya existentes."
    )
    parser.add_argument("xlsx", nargs="?", default="Clientes.xlsx")
    parser.add_argument("out", nargs="?", default="clients_import.csv")
    parser.add_argument(
        "--existing",
        dest="existing",
        default="",
        help="CSV base con clientes ya cargados para excluir duplicados por RUT.",
    )
    parser.add_argument(
        "--report-prefix",
        dest="report_prefix",
        default="clients_precheck",
        help="Prefijo para archivos de reporte cuando se usa --existing.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    xlsx_path = Path(args.xlsx)
    out_path = Path(args.out)
    existing_path = Path(args.existing) if args.existing else None

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

    vistos = set()
    repetidos_excel = []
    registros = []
    for row_num, row in enumerate(rows[1:], start=2):
        rut = str(row[rut_idx]).strip() if rut_idx < len(row) and row[rut_idx] is not None else ""
        razon = str(row[rz_idx]).strip() if rz_idx < len(row) and row[rz_idx] is not None else ""
        rut_norm = normalizar_rut(rut)
        if not rut_norm or not razon:
            continue
        if rut_norm in vistos:
            repetidos_excel.append(
                {
                    "row_number": row_num,
                    "rut": rut,
                    "rut_normalized": rut_norm,
                    "razon_social": razon,
                }
            )
            continue
        vistos.add(rut_norm)
        registros.append(
            {
                "rut": rut,
                "rut_normalized": rut_norm,
                "razon_social": razon,
                "active": "true",
            }
        )

    existentes = {}
    nuevos = registros
    ya_cargados = []
    diferencias_nombre = []
    if existing_path:
        existentes = cargar_clientes_desde_csv(existing_path)
        nuevos = []
        for registro in registros:
            actual = existentes.get(registro["rut_normalized"])
            if not actual:
                nuevos.append(registro)
                continue
            ya_cargados.append(registro)
            if normalizar_razon_social(actual["razon_social"]) != normalizar_razon_social(registro["razon_social"]):
                diferencias_nombre.append(
                    {
                        "rut": registro["rut"],
                        "rut_normalized": registro["rut_normalized"],
                        "razon_social_excel": registro["razon_social"],
                        "razon_social_existente": actual["razon_social"],
                    }
                )

    escribir_csv(out_path, nuevos)

    print(f"Hoja leida: {sheet_name}")
    print(f"Registros unicos en Excel: {len(registros)}")
    print(f"RUT repetidos dentro de Excel: {len(repetidos_excel)}")
    if existing_path:
        print(f"Clientes ya existentes en base comparada: {len(ya_cargados)}")
        print(f"Clientes nuevos para importar: {len(nuevos)}")
        print(f"Diferencias de nombre detectadas: {len(diferencias_nombre)}")
        prefix = Path(args.report_prefix)
        repetidos_path = prefix.with_name(prefix.name + "_duplicados_excel.csv")
        existentes_path = prefix.with_name(prefix.name + "_ya_existentes.csv")
        nombres_path = prefix.with_name(prefix.name + "_diferencias_nombre.csv")
        with repetidos_path.open("w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=["row_number", "rut", "rut_normalized", "razon_social"])
            writer.writeheader()
            writer.writerows(repetidos_excel)
        escribir_csv(existentes_path, ya_cargados)
        with nombres_path.open("w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=["rut", "rut_normalized", "razon_social_excel", "razon_social_existente"],
            )
            writer.writeheader()
            writer.writerows(diferencias_nombre)
        print(f"Reporte duplicados Excel: {repetidos_path}")
        print(f"Reporte ya existentes: {existentes_path}")
        print(f"Reporte diferencias nombre: {nombres_path}")
    print(f"CSV generado: {out_path}")


if __name__ == "__main__":
    main()
