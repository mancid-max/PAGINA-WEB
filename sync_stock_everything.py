import getpass
import json
import os
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DEFAULT_EXCEL = Path.home() / "OneDrive - Mohicano Jeans" / "INVENTARIO 01-04 COMPLETO.xlsx"
SUPABASE_URL = "https://kdtydxihrflhziclgiof.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_37ce4uK_RG8o9pP-Jdf2Xw_3eWgqJQy"
LANDING_STOCK_FILES = ["stock-data.json", "stock-data-catalogo-2.json"]
CATALOGO_2_STOCK_FILE = ROOT / "stock-data-catalogo-2.json"
ALL_SHEETS_JSON = ROOT / "stock-data-all-sheets.json"
SCRIPT_GENERATE_LANDING = ROOT / "generate_catalog_stock_json_from_excel.py"
SCRIPT_GENERATE_SUPABASE = ROOT / "generate_supabase_stock_sql_from_excel.py"


def parse_target_seasons() -> set[str]:
    raw = os.environ.get("MOHICANO_STOCK_SEASONS", "")
    return {part.strip() for part in raw.split(",") if part.strip()}


TARGET_SEASONS = parse_target_seasons()


def run_command(args: list[str]) -> None:
    print(">", " ".join(str(arg) for arg in args))
    subprocess.run(args, cwd=ROOT, check=True)


def request_json(method: str, url: str, headers: dict[str, str], payload=None):
    data = None
    request_headers = dict(headers)
    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        request_headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, headers=request_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else None
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"{method} {url} fallo: {exc.code} {body}") from exc


def login_supabase(email: str, password: str) -> str:
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    payload = {"email": email, "password": password}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"No se pudo iniciar sesion en Supabase: {exc.code} {body}") from exc

    token = body.get("access_token") or ""
    if not token:
        raise RuntimeError("Supabase no devolvio access_token")
    return token


def load_consolidated_items() -> list[dict]:
    payload = json.loads(ALL_SHEETS_JSON.read_text(encoding="utf-8"))
    items: list[dict] = []
    sheets = payload.get("sheets") or {}
    for sheet_payload in sheets.values():
        for item in sheet_payload.get("items") or []:
            season = str(item.get("season") or "").strip()
            if TARGET_SEASONS and season not in TARGET_SEASONS:
                continue
            items.append(item)
    if not items:
        raise RuntimeError("No se encontraron items consolidados en stock-data-all-sheets.json")
    return items


def build_auth_headers(token: str) -> dict[str, str]:
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {token}",
        "Prefer": "return=representation",
    }


def fetch_existing_stock(token: str) -> list[dict]:
    params = urllib.parse.urlencode({
        "select": "id,season,article_code,sku,tiro,bota,color,active,source,stock_item_sizes(id,size_label,quantity,sort_order)",
        "order": "season.asc,sku.asc",
        "limit": "5000",
    })
    url = f"{SUPABASE_URL}/rest/v1/stock_items?{params}"
    data = request_json("GET", url, build_auth_headers(token))
    return data if isinstance(data, list) else []


def normalize_text(value) -> str | None:
    text = str(value or "").strip().upper()
    return text or None


def sync_sizes(token: str, stock_item_id: int, sizes: dict[str, int]) -> None:
    delete_url = f"{SUPABASE_URL}/rest/v1/stock_item_sizes?stock_item_id=eq.{stock_item_id}"
    request_json("DELETE", delete_url, {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {token}",
        "Prefer": "return=minimal",
    })

    size_rows = []
    for index, size_label in enumerate(["36", "38", "40", "42", "44", "46"], start=1):
        quantity = max(0, int(sizes.get(size_label) or 0))
        if quantity <= 0:
            continue
        size_rows.append({
            "stock_item_id": stock_item_id,
            "size_label": size_label,
            "quantity": quantity,
            "sort_order": index * 10,
        })

    if size_rows:
        request_json("POST", f"{SUPABASE_URL}/rest/v1/stock_item_sizes", build_auth_headers(token), size_rows)


def upsert_stock_item(token: str, existing_by_key: dict[tuple[str, str], dict], item: dict) -> int:
    season = str(item.get("season") or "").strip()
    sku = str(item.get("sku") or "").strip().upper()
    key = (season, sku)
    payload = {
        "season": season,
        "article_code": str(item.get("article_code") or "").strip(),
        "sku": sku,
        "tiro": normalize_text(item.get("tiro")),
        "bota": normalize_text(item.get("bota")),
        "color": normalize_text(item.get("color")),
        "active": bool(item.get("active")),
        "source": "excel-full",
    }
    existing = existing_by_key.get(key)
    if existing:
        item_id = int(existing["id"])
        request_json("PATCH", f"{SUPABASE_URL}/rest/v1/stock_items?id=eq.{item_id}", build_auth_headers(token), payload)
    else:
        created = request_json("POST", f"{SUPABASE_URL}/rest/v1/stock_items", build_auth_headers(token), [payload])
        first = created[0] if isinstance(created, list) and created else None
        item_id = int((first or {}).get("id") or 0)
        if not item_id:
            raise RuntimeError(f"No se pudo crear {season}/{sku} en stock_items")
        existing_by_key[key] = {"id": item_id, **payload}

    sync_sizes(token, item_id, item.get("sizes") or {})
    return item_id


def deactivate_missing_excel_items(token: str, existing_rows: list[dict], current_keys: set[tuple[str, str]]) -> int:
    affected = 0
    for row in existing_rows:
        season = str(row.get("season") or "").strip()
        sku = str(row.get("sku") or "").strip().upper()
        source = str(row.get("source") or "").strip().lower()
        if (season, sku) in current_keys:
            continue
        if source not in {"excel-full", "excel-seed"}:
            continue
        item_id = int(row.get("id") or 0)
        if not item_id:
            continue
        payload = {
            "active": False,
            "source": "excel-full",
        }
        request_json("PATCH", f"{SUPABASE_URL}/rest/v1/stock_items?id=eq.{item_id}", build_auth_headers(token), payload)
        sync_sizes(token, item_id, {})
        affected += 1
    return affected


def push_landing_stock() -> None:
    landing_files = ["stock-data.json"] if TARGET_SEASONS == {"42"} else LANDING_STOCK_FILES
    run_command(["git", "add", "--", *landing_files])
    diff = subprocess.run(
        ["git", "diff", "--cached", "--quiet", "--", *landing_files],
        cwd=ROOT,
        check=False,
    )
    if diff.returncode == 0:
        print("Sin cambios para publicar en la landing.")
        return
    run_command(["git", "commit", "-m", "Auto-sync stock desde Excel", "--", *landing_files])
    run_command(["git", "push", "origin", "HEAD:main"])


def main() -> None:
    excel_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_EXCEL
    if not excel_path.exists():
        raise SystemExit(f"No se encontro el Excel: {excel_path}")

    backup_catalogo_2 = None
    if TARGET_SEASONS == {"42"} and CATALOGO_2_STOCK_FILE.exists():
        backup_catalogo_2 = CATALOGO_2_STOCK_FILE.read_text(encoding="utf-8")

    print("Regenerando stock de la landing...")
    run_command([sys.executable, str(SCRIPT_GENERATE_LANDING), str(excel_path)])

    if backup_catalogo_2 is not None:
        CATALOGO_2_STOCK_FILE.write_text(backup_catalogo_2, encoding="utf-8")

    print("Generando dataset completo para Supabase...")
    run_command([sys.executable, str(SCRIPT_GENERATE_SUPABASE), str(excel_path)])

    email = os.environ.get("MOHICANO_SUPABASE_EMAIL") or input("Correo admin Supabase: ").strip()
    password = os.environ.get("MOHICANO_SUPABASE_PASSWORD") or getpass.getpass("Contrasena admin Supabase: ")
    if not email or not password:
        raise SystemExit("Debes ingresar correo y contrasena para sincronizar Supabase.")

    print("Iniciando sesion en Supabase...")
    token = login_supabase(email, password)
    existing_rows = fetch_existing_stock(token)
    existing_by_key = {
        (str(row.get("season") or "").strip(), str(row.get("sku") or "").strip().upper()): row
        for row in existing_rows
        if row.get("season") and row.get("sku")
    }

    items = load_consolidated_items()
    current_keys = set()
    synced = 0
    for item in items:
        season = str(item.get("season") or "").strip()
        sku = str(item.get("sku") or "").strip().upper()
        if not season or not sku:
            continue
        current_keys.add((season, sku))
        upsert_stock_item(token, existing_by_key, item)
        synced += 1

    deactivated = deactivate_missing_excel_items(token, existing_rows, current_keys)
    print(f"Supabase sincronizado: {synced} items procesados, {deactivated} items desactivados.")

    print("Publicando stock de la landing a main...")
    push_landing_stock()
    print("Proceso completo.")


if __name__ == "__main__":
    main()
