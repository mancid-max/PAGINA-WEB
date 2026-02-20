# =========================
# generar_json.py (COMPLETO)
# - Lee Imagenes/
# - Crea data.json con familias y variantes (subcarpetas)
# - Ignora "videos"
# =========================

import os
import json

IMAGES_DIR = "Imagenes"
OUTPUT_JSON = "data.json"

IGNORE_DIRS = {"videos", "_DEBUG_NO_SKU", "_DUPLICADOS", "__pycache__"}

def is_image(fn: str) -> bool:
    fn = fn.lower()
    return fn.endswith(".jpg") or fn.endswith(".jpeg") or fn.endswith(".png") or fn.endswith(".webp")

def list_images(folder_path: str, rel_prefix: str):
    imgs = []
    for fn in sorted(os.listdir(folder_path)):
        if is_image(fn):
            imgs.append(f"{rel_prefix}/{fn}".replace("\\", "/"))
    return imgs

def pick_main_image(images: list[str]):
    """
    Prioridad:
    1) Portada tipo catalogo/portada/cover
    2) Luego imágenes que NO tengan _p
    3) Si no, la primera
    """
    if not images:
        return None

    # 1) Priorizar portadas
    portada_keywords = ("catalogo", "portada", "cover", "caratula", "ficha")
    for img in images:
        base = os.path.basename(img).lower()
        if base.startswith(portada_keywords) or any(k in base for k in portada_keywords):
            return img

    # 2) tu lógica actual: preferir sin _p
    for img in images:
        base = os.path.basename(img)
        if "_p" not in base:
            return img

    # 3) fallback
    return images[0]

def main():
    if not os.path.isdir(IMAGES_DIR):
        raise SystemExit(f"No existe carpeta {IMAGES_DIR}. Copia tu carpeta Imagenes dentro de la web.")

    catalog = []

    for family in sorted(os.listdir(IMAGES_DIR)):
        family_path = os.path.join(IMAGES_DIR, family)
        if not os.path.isdir(family_path):
            continue
        if family in IGNORE_DIRS:
            continue

        family_images = list_images(family_path, f"{IMAGES_DIR}/{family}")

        variants = []
        for sub in sorted(os.listdir(family_path)):
            sub_path = os.path.join(family_path, sub)
            if os.path.isdir(sub_path) and sub not in IGNORE_DIRS:
                sub_imgs = list_images(sub_path, f"{IMAGES_DIR}/{family}/{sub}")
                if sub_imgs:
                    variants.append({
                        "sku": sub,
                        "main_image": pick_main_image(sub_imgs),
                        "gallery": sub_imgs
                    })

        if not family_images and not variants:
            continue

        main_img = pick_main_image(family_images) or (variants[0]["main_image"] if variants else None)

        catalog.append({
            "family": family,
            "main_image": main_img,
            "gallery": family_images,
            "variants": variants
        })

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    print(f"✅ Generado {OUTPUT_JSON} con {len(catalog)} familias")

if __name__ == "__main__":
    main()
