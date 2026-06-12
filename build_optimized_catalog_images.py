from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageOps

SOURCE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}
DEFAULT_JSON_FILES = [
    "data.json",
    "data-catalogo-2.json",
    "data-catalogo-3.json",
    "data-catalogo-42.json",
    "data-catalogo-43.json",
    "data-stock-overrides.json",
]
SOURCE_ROOTS = ("Imagenes", "Imagenes2", "Imagenes3", "42", "43")


def collect_image_paths(repo_root: Path, json_files: list[str]) -> list[Path]:
    unique_paths: dict[str, Path] = {}

    for json_name in json_files:
        json_path = repo_root / json_name
        if not json_path.exists():
            continue

        data = json.loads(json_path.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            continue

        for item in data:
            if not isinstance(item, dict):
                continue
            push_image_paths(repo_root, unique_paths, item)
            for variant in item.get("variants", []) or []:
                if isinstance(variant, dict):
                    push_image_paths(repo_root, unique_paths, variant)

    return sorted(unique_paths.values(), key=lambda path: path.as_posix())


def push_image_paths(repo_root: Path, bucket: dict[str, Path], obj: dict) -> None:
    for raw_path in [obj.get("main_image"), *(obj.get("gallery", []) or [])]:
        normalized = normalize_asset_path(raw_path)
        if not normalized:
            continue
        if not normalized.startswith(SOURCE_ROOTS):
            continue
        source_path = repo_root / normalized
        if not source_path.exists() or source_path.suffix.lower() not in SOURCE_EXTS:
            continue
        bucket[normalized] = source_path


def normalize_asset_path(value: str | None) -> str:
    return str(value or "").strip().replace("\\", "/").lstrip("./")


def convert_one(src: Path, repo_root: Path, output_root: Path, quality: int, max_px: int, force: bool) -> tuple[bool, str]:
    rel = src.relative_to(repo_root)
    dst = (output_root / rel).with_suffix(".webp")
    dst.parent.mkdir(parents=True, exist_ok=True)

    if not force and dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        return True, f"skip {dst}"

    try:
        with Image.open(src) as img:
            img = ImageOps.exif_transpose(img)
            img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
            if max_px > 0:
                img.thumbnail((max_px, max_px), Image.Resampling.LANCZOS)
            img.save(dst, "WEBP", quality=quality, method=6, optimize=True)
        return True, str(dst)
    except Exception as exc:
        return False, f"{src} -> {exc}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Genera versiones WebP optimizadas para las imagenes usadas por el catalogo.")
    parser.add_argument("--repo-root", default=".", help="Raiz del proyecto.")
    parser.add_argument("--output-root", default="Imagenes-web", help="Carpeta de salida para assets optimizados.")
    parser.add_argument("--quality", type=int, default=86, help="Calidad WebP (0-100).")
    parser.add_argument("--max-px", type=int, default=2200, help="Lado maximo de cada imagen en px.")
    parser.add_argument("--force", action="store_true", help="Regenera todas las imagenes aunque ya existan.")
    parser.add_argument("--json", action="append", dest="json_files", help="Archivo JSON adicional a revisar.")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    output_root = (repo_root / args.output_root).resolve()
    json_files = args.json_files or DEFAULT_JSON_FILES

    source_files = collect_image_paths(repo_root, json_files)
    ok = 0
    errors: list[str] = []

    for source in source_files:
        done, message = convert_one(source, repo_root, output_root, args.quality, args.max_px, args.force)
        if done:
            ok += 1
        else:
            errors.append(message)

    print(f"Catalog image refs: {len(source_files)}")
    print(f"Optimized images: {ok}")
    print(f"Output root: {output_root}")
    if errors:
        print("Errors:")
        for err in errors[:30]:
            print(f"- {err}")
        if len(errors) > 30:
            print(f"- ... {len(errors) - 30} more")


if __name__ == "__main__":
    main()
