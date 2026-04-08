import time
from pathlib import Path

from parse_stock_excel import DEFAULT_SOURCE, main as export_stock


def wait_for_changes(source_path: Path, interval_seconds: int = 10) -> None:
    if not source_path.exists():
        raise SystemExit(f"No se encontro el archivo: {source_path}")

    last_mtime = source_path.stat().st_mtime
    print(f"Observando cambios en: {source_path}")
    export_stock()

    while True:
        try:
            current_mtime = source_path.stat().st_mtime
            if current_mtime != last_mtime:
                last_mtime = current_mtime
                print("Cambio detectado en Excel, regenerando stock-data.json...")
                export_stock()
            time.sleep(interval_seconds)
        except KeyboardInterrupt:
            print("Vigilancia detenida.")
            break
        except FileNotFoundError:
            print("No se encontro temporalmente el Excel; reintentando...")
            time.sleep(interval_seconds)
        except Exception as exc:
            print(f"Error observando Excel: {exc}")
            time.sleep(interval_seconds)


if __name__ == "__main__":
    wait_for_changes(DEFAULT_SOURCE)
