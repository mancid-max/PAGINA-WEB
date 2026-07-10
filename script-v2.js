/***********************
 * ESTADO GLOBAL
 ***********************/
let productos = [];
let productosGrid = [];
let productosCatalogoBase = [];
let thumbnailBySku = {};
let pedido = [];
let skuActivo = "";
let draftTallasPorSku = {}; // legacy (borradores desactivados)
const TALLAS_DISPONIBLES = ["36", "38", "40", "42", "44", "46"];
const WEB_DISCOUNT_RATE = 0.05;
const WEB_DISCOUNT_PERCENT = Math.round(WEB_DISCOUNT_RATE * 100);
const IVA_RATE = 0.19;
const IVA_PERCENT = Math.round(IVA_RATE * 100);
let quotesAccessToken = sessionStorage.getItem("quotes_access_token") || "";
let quotesUserEmail = sessionStorage.getItem("quotes_user_email") || "";
let quotesAdminCache = { quotes: [], itemsByQuote: new Map() };
let trazabilidadCache = [];
let trazabilidadMeta = null;
let adminActiveTab = "cotizaciones";
let quotesStatusFilter = "all";
let quotesListStatusFilter = "all";
let quotesListSearchFilter = "";
let quotesMonthFilter = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
})();
let trazabilidadDisponibles = [];
let clienteSeleccionado = null; // { rut, rut_normalized, razon_social }
let clientLookupDebounce = null;
let imagenesModalActual = [];
let imagenModalIndex = 0;
let quotePanelReady = false;
let stockBySku = {};
let stockCatalogRows = [];
let stockRealtimeChannel = null;
let stockCatalogSeasonFilter = "";
let lastRenderedStockSignature = "";
let vendorCoverageRows = [];
let vendorCoverageWorkbookName = "";
let stockEditorState = {
  open: false,
  item: null,
  mode: "edit",
};
let videoBySku = {};
let videoActivoSrc = "";
let catalogCoverBySku = {};
const INVENTORY_ENABLED = true;
const STOCK_REFRESH_INTERVAL_MS = 30000;
const CART_STORAGE_KEY = "mohicano_cart_shared_v3";
const SOLD_OUT_CATALOG_ITEMS = [
  {
    family: "4208-00",
    description: "BIO OSCURO FOCALIZADO TENUE 2 RELOJERO TIPO OJAL 3 PINZA ALTURA",
    characteristics: ["Tiro: Cintura", "Bota: Flare", "Estado: Agotado"],
    main_image: "42/4208/Mohicano0100.jpg",
    gallery: [
      "42/4208/Mohicano0100.jpg",
      "42/4208/Mohicano0096 copie.jpg",
      "42/4208/Mohicano0090.jpg",
      "42/4208/Mohicano0088.jpg",
      "42/4208/Mohicano0060.jpg",
    ],
    variants: [
      {
        sku: "4208-01",
        main_image: "42/4208/Mohicano0096 copie.jpg",
        gallery: [
          "42/4208/Mohicano0096 copie.jpg",
          "42/4208/Mohicano0090.jpg",
          "42/4208/Mohicano0088.jpg",
          "42/4208/Mohicano0060.jpg",
        ],
      },
      {
        sku: "4208-02",
        main_image: "42/4208/Mohicano0090.jpg",
        gallery: [
          "42/4208/Mohicano0090.jpg",
          "42/4208/Mohicano0088.jpg",
          "42/4208/Mohicano0060.jpg",
        ],
      },
    ],
  },
  {
    family: "4217-00",
    description: "NEGRO PARCHE DELANTERO",
    characteristics: ["Tiro: Cintura", "Bota: Flare", "Estado: Agotado"],
    main_image: "42/4217/Mohicano0725.jpg",
    gallery: [
      "42/4217/Mohicano0725.jpg",
      "42/4217/Mohicano0737 copie.jpg",
      "42/4217/Mohicano0734.jpg",
      "42/4217/Mohicano0730.jpg",
      "42/4217/Mohicano0754.jpg",
    ],
    variants: [],
  },
  {
    family: "4224-00",
    description: "BIOMEDIO BOTON DELANTERO 4",
    characteristics: ["Tiro: Medio", "Bota: Oxford", "Estado: Agotado"],
    main_image: "42/4224/Mohicano0500 copie.jpg",
    gallery: [
      "42/4224/Mohicano0500 copie.jpg",
      "42/4224/Mohicano0495 copie.jpg",
      "42/4224/Mohicano0489.jpg",
      "42/4224/Mohicano0485.jpg",
      "42/4224/Mohicano0479 copie.jpg",
    ],
    variants: [
      {
        sku: "4224-01",
        main_image: "42/4224-01 gravillado/Mohicano0549.jpg",
        gallery: [
          "42/4224-01 gravillado/Mohicano0549.jpg",
          "42/4224-01 gravillado/Mohicano0548.jpg",
          "42/4224-01 gravillado/Mohicano0545 copie.jpg",
          "42/4224-01 gravillado/Mohicano0542.jpg",
          "42/4224-01 gravillado/Mohicano0540.jpg",
          "42/4224-01 gravillado/Mohicano0537.jpg",
          "42/4224-01 gravillado/Mohicano0530.jpg",
        ],
      },
    ],
  },
  {
    family: "4238-00",
    description: "MARENGO FOCALIZADO ESTRELLAS BOLSILLO SIN BOLSILLOS TRASEROS",
    characteristics: ["Tiro: Cintura", "Bota: Palazzo", "Estado: Agotado"],
    main_image: "42/4238/CRI_7203.jpg",
    gallery: [
      "42/4238/CRI_7203.jpg",
      "42/4238/Copia de CRI_7215.jpg",
      "42/4238/Copia de CRI_7214.jpg",
      "42/4238/Copia de CRI_7210.jpg",
      "42/4238/Copia de CRI_7209.jpg",
    ],
    variants: [],
  },
  {
    family: "4242-00",
    description: "MARENGO FOCALIZADO ESTRELLAS COSTADO",
    characteristics: ["Tiro: Cintura", "Bota: Palazzo", "Estado: Agotado"],
    main_image: "42/4242/Mohicano0338.jpg",
    gallery: [
      "42/4242/Mohicano0338.jpg",
      "42/4242/Mohicano0329.jpg",
      "42/4242/Mohicano0321.jpg",
      "42/4242/Mohicano0317.jpg",
      "42/4242/Mohicano0310 copie.jpg",
      "42/4242/Mohicano0308.jpg",
    ],
    variants: [],
  },
];

function sanitizarPedidoPersistido(valor) {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((item) => {
      const sku = normalizarSkuCatalogo(item?.sku || "");
      const tallasRaw = item?.tallas && typeof item.tallas === "object" ? item.tallas : {};
      const tallas = {};
      TALLAS_DISPONIBLES.forEach((talla) => {
        const cantidad = parseInt(tallasRaw[talla], 10);
        if (!Number.isNaN(cantidad) && cantidad > 0) tallas[talla] = cantidad;
      });
      if (!sku || !Object.keys(tallas).length) return null;
      return { sku, tallas };
    })
    .filter(Boolean);
}

function construirEstadoCotizacionPersistido() {
  const rutEl = document.getElementById("clientRut");
  const nameEl = document.getElementById("clientName");
  return {
    pedido: sanitizarPedidoPersistido(pedido),
    clientRut: String(rutEl?.value || "").trim(),
    clientName: String(nameEl?.value || "").trim(),
  };
}

function guardarCotizacionPersistida() {
  try {
    const estado = construirEstadoCotizacionPersistido();
    if (!estado.pedido.length && !estado.clientRut && !estado.clientName) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(estado));
  } catch (_) {
    // Ignorar errores de almacenamiento para no bloquear la cotización.
  }
}

function limpiarCotizacionPersistida() {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (_) {
    // Ignorar errores de almacenamiento.
  }
}

function restaurarCotizacionPersistida() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return;
    const estado = JSON.parse(raw);
    pedido = sanitizarPedidoPersistido(estado?.pedido);
    const rutEl = document.getElementById("clientRut");
    const nameEl = document.getElementById("clientName");
    if (rutEl && estado?.clientRut) rutEl.value = String(estado.clientRut).trim();
    if (nameEl && estado?.clientName) nameEl.value = String(estado.clientName).trim();
  } catch (_) {
    pedido = [];
    limpiarCotizacionPersistida();
  }
}
const CATALOG_COVER_OVERRIDES = {
  "4245-00": "Imagenes/4245/CRI_7845.jpg",
};
const HANTAN_BY_SKU = {
  "4249-00": ["power strech.png"],
  "4301-00": ["power strech.png"],
  "4303-00": ["power strech.png"],
  "4309-00": ["power strech.png"],
  "4310-00": ["power strech.png"],
  "4311-00": ["power strech.png"],
  "4313-00": ["power strech.png", "push in push up.png"],
  "4314-00": ["power strech.png"],
  "4318-00": ["power strech.png"],
  "4319-00": ["power strech.png"],
  "4321-00": ["power strech.png", "push in push up.png"],
  "4322-00": ["power strech.png"],
  "4322-01": ["power strech.png"],
  "4322-02": ["power strech.png"],
  "4323-00": ["power strech.png", "push in push up.png"],
  "4325-00": ["power strech.png"],
  "4325-01": ["power strech.png"],
  "4327-00": ["power strech.png", "smart denim.png"],
  "4329-00": ["power strech.png"],
  "4330-00": ["power strech.png"],
  "4333-00": ["power strech.png"],
  "4335-00": ["power strech.png"],
  "4336-00": ["power strech.png"],
  "4337-00": ["power strech.png"],
  "4339-00": ["power strech.png"],
  "4340-00": ["power strech.png", "push in push up.png"],
  "4341-00": ["power strech.png"],
  "4344-01": ["universal.png"],
  "4348-00": ["power strech.png"],
  "4348-60": ["power strech.png"],
  "4347-00": ["power strech.png"],
  "4353-00": ["power strech.png"],
  "4355-00": ["power strech.png"],
  "4356-00": ["power strech.png"],
  "4356-01": ["power strech.png"],
  "4361-04": ["perfect.png"],
  "4361-06": ["perfect.png"],
  "4361-08": ["perfect.png"],
  "4361-16": ["perfect.png"],
  "4361-48": ["perfect.png"],
  "4361-00": ["perfect.png"],
  "4362-08": ["perfect.png"],
  "4362-16": ["perfect.png"],
  "4362-48": ["perfect.png"],
  "4362-00": ["perfect.png"],
  "4363-00": ["power strech.png"],
  "4365-00": ["perfect.png"],
  "4366-04": ["perfect.png"],
  "4366-08": ["perfect.png"],
  "4366-16": ["perfect.png"],
  "4366-48": ["perfect.png"],
  "4366-00": ["perfect.png"],
  "4370-00": ["universal.png"],
  "4371-00": ["universal.png"],
  "4371-01": ["universal.png"],
  "4374-00": ["power strech.png"],
  "4380-00": ["universal.png"],
  "4377-01": ["universal.png"],
  "4378-00": ["power strech.png"],
};
const LOCAL_CLIENT_OVERRIDES = [
  {
    rut: "77.886.495-9",
    rut_normalized: "77886495-9",
    razon_social: "IMPORTADORA HIPOLIS CHRISTOPHER MORALES EIRL",
  },
  {
    rut: "14.905.682-3",
    rut_normalized: "14905682-3",
    razon_social: "CLAUDIO VIGUERAS TORRES",
  },
  {
    rut: "21.423.987-6",
    rut_normalized: "21423987-6",
    razon_social: "THAI TUCKI PAOA",
  },
  {
    rut: "78.082.214-7",
    rut_normalized: "78082214-7",
    razon_social: "CAROLINA PARKAS",
  },
];

function inferirCatalogoDesdeSku(value) {
  const sku = normalizarSkuCatalogo(value || "");
  if (/^43\d{2}(?:-\d{2})?$/i.test(sku)) return "catalogo-43";
  if (/^44\d{2}(?:-\d{2})?$/i.test(sku)) return "catalogo-44";
  return "catalogo-1";
}

function resolverSourceItemPedido(item = {}, fallbackSource = CATALOG_SOURCE) {
  return String(item?.source || inferirCatalogoDesdeSku(item?.sku) || fallbackSource).trim() || fallbackSource;
}

function sanitizarPedidoPersistido(valor) {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((item) => {
      const sku = normalizarSkuCatalogo(item?.sku || "");
      const source = String(item?.source || inferirCatalogoDesdeSku(sku) || CATALOG_SOURCE).trim() || CATALOG_SOURCE;
      const tallasRaw = item?.tallas && typeof item.tallas === "object" ? item.tallas : {};
      const tallas = {};
      TALLAS_DISPONIBLES.forEach((talla) => {
        const cantidad = parseInt(tallasRaw[talla], 10);
        if (!Number.isNaN(cantidad) && cantidad > 0) tallas[talla] = cantidad;
      });
      if (!sku || !Object.keys(tallas).length) return null;
      return { sku, tallas, source };
    })
    .filter(Boolean);
}

function construirEstadoCotizacionPersistido() {
  const rutEl = document.getElementById("clientRut");
  const nameEl = document.getElementById("clientName");
  const phoneEl = document.getElementById("clientPhone");
  return {
    pedido: sanitizarPedidoPersistido(pedido),
    clientRut: String(rutEl?.value || "").trim(),
    clientName: String(nameEl?.value || "").trim(),
    clientPhone: String(phoneEl?.value || "").trim(),
  };
}

function guardarCotizacionPersistida() {
  try {
    const estado = construirEstadoCotizacionPersistido();
    if (!estado.pedido.length && !estado.clientRut && !estado.clientName && !estado.clientPhone) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(estado));
  } catch (_) {
    // Ignorar errores de almacenamiento para no bloquear la cotización.
  }
}

function limpiarCotizacionPersistida() {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (_) {
    // Ignorar errores de almacenamiento.
  }
}

function restaurarCotizacionPersistida() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return;
    const estado = JSON.parse(raw);
    pedido = sanitizarPedidoPersistido(estado?.pedido);
    const rutEl = document.getElementById("clientRut");
    const nameEl = document.getElementById("clientName");
    const phoneEl = document.getElementById("clientPhone");
    if (rutEl && estado?.clientRut) rutEl.value = String(estado.clientRut).trim();
    if (nameEl && estado?.clientName) nameEl.value = String(estado.clientName).trim();
    if (phoneEl && estado?.clientPhone) phoneEl.value = String(estado.clientPhone).trim();
  } catch (_) {
    pedido = [];
    limpiarCotizacionPersistida();
  }
}

const ASSET_VERSION = "20260703";
const OPTIMIZED_IMAGE_ROOT = "Imagenes-web";
const OPTIMIZED_IMAGE_SOURCE_ROOTS = ["Imagenes", "Imagenes2", "Imagenes3", "42", "43"];
const IS_LOCAL_FILE_PROTOCOL = typeof window !== "undefined" && window.location?.protocol === "file:";
const TEXT_NORMALIZATION_REPLACEMENTS = [
  [/Â·/g, "·"],
  [/Dise\?o/gi, "Diseño"],
  [/disen\?o/gi, "diseño"],
  [/recuperaci\?n/gi, "recuperación"],
  [/f\?cil/gi, "fácil"],
  [/c\?modo/gi, "cómodo"],
  [/vers\?til/gi, "versátil"],
  [/seg\?n/gi, "según"],
  [/adaptaci\?n/gi, "adaptación"],
  [/peque\?a/gi, "pequeña"],
  [/m\?s/gi, "más"],
  [/elasti[c]?idad y recuperaci\?n/gi, "elasticidad y recuperación"],
  [/Cotizacion/g, "Pedido"],
  [/cotizacion/g, "pedido"],
];

const CATALOG_43_DESCRIPTION_MAP = {
  "4301-00": "Jean · Medio · Flare",
  "4309-00": "Jean · Cintura · Flare",
  "4310-00": "Jean · Cintura · Tobillero",
  "4313-00": "Jean · Cintura · Flare",
  "4314-00": "Jean · Cintura · Recto",
  "4318-00": "Jean · Cintura · Wide Leg",
  "4319-00": "Jean · Medio · Flare",
  "4323-01": "Jean · Cintura · Wide leg",
  "4325-00": "Jean · Cintura · Wide Leg",
  "4329-00": "Jean · New Glue",
  "4333-00": "Jean · Cintura · Wide Leg",
  "4337-00": "Jean · Cintura · Flare",
  "4341-00": "Jean · Cintura · Flare",
};

function withCacheBust(path) {
  if (!path) return path;
  return path.includes("?") ? `${path}&v=${ASSET_VERSION}` : `${path}?v=${ASSET_VERSION}`;
}

function buildAssetUrl(path) {
  const withVersion = withCacheBust(path);
  if (!withVersion) return withVersion;
  return encodeURI(withVersion);
}

function normalizarTextoVisible(value) {
  if (value === null || value === undefined) return "";
  let text = String(value);
  TEXT_NORMALIZATION_REPLACEMENTS.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });
  return text;
}

function normalizarRutaAsset(path) {
  return String(path || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.?\//, "");
}

function normalizarRutaImagenCatalogo(path) {
  const normalized = normalizarRutaAsset(path);
  if (!normalized) return "";
  if (CATALOG_SOURCE !== "catalogo-1") return normalized;
  let mapped = normalized;

  // 42/####-##/archivo -> Imagenes/####/(####-##/)?archivo
  const from42Variant = mapped.match(/^42\/(\d{4})-(\d{2})\/(.+)$/i);
  if (from42Variant) {
    const [, model, variant, rest] = from42Variant;
    return variant === "00"
      ? `Imagenes/${model}/${rest}`
      : `Imagenes/${model}/${model}-${variant}/${rest}`;
  }

  // 42/####/archivo -> Imagenes/####/archivo
  const from42Family = mapped.match(/^42\/(\d{4})\/(.+)$/i);
  if (from42Family) {
    const [, model, rest] = from42Family;
    return `Imagenes/${model}/${rest}`;
  }

  // Imagenes/####-##/archivo -> Imagenes/####/(####-##/)?archivo
  const fromImgVariant = mapped.match(/^Imagenes\/(\d{4})-(\d{2})\/(.+)$/i);
  if (fromImgVariant) {
    const [, model, variant, rest] = fromImgVariant;
    return variant === "00"
      ? `Imagenes/${model}/${rest}`
      : `Imagenes/${model}/${model}-${variant}/${rest}`;
  }

  return mapped;
}

function obtenerRutasAlternativasCatalogo43(path) {
  const normalized = normalizarRutaAsset(path);
  if (!normalized) return [];
  if (CATALOG_SOURCE !== "catalogo-43") return [normalized];

  const candidates = [normalized];
  const nestedMatch = normalized.match(/^43\/43\/([^/]+)\/(.+)$/i);
  if (nestedMatch) {
    candidates.push(`43/${nestedMatch[1]}/${nestedMatch[2]}`);
  } else {
    const directMatch = normalized.match(/^43\/([^/]+)\/(.+)$/i);
    if (directMatch && directMatch[1].toLowerCase() !== "43") {
      candidates.push(`43/43/${directMatch[1]}/${directMatch[2]}`);
    }
  }

  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = normalizarRutaAsset(candidate).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function obtenerRutaImagenOptimizada(path) {
  const normalized = normalizarRutaAsset(path);
  if (!normalized) return "";
  const sourceRoot = OPTIMIZED_IMAGE_SOURCE_ROOTS.find((root) => normalized.startsWith(`${root}/`));
  if (!sourceRoot) return normalized;
  return `${OPTIMIZED_IMAGE_ROOT}/${normalized}`.replace(/\.[^./?]+$/, ".webp");
}

function obtenerRutaImagenOptimizadaJpg(path) {
  const normalized = normalizarRutaAsset(path);
  if (!normalized) return "";
  const sourceRoot = OPTIMIZED_IMAGE_SOURCE_ROOTS.find((root) => normalized.startsWith(`${root}/`));
  if (!sourceRoot) return normalized;
  return `${OPTIMIZED_IMAGE_ROOT}/${normalized}`;
}

function rutaPrefiereOriginal(path) {
  const normalized = normalizarRutaAsset(path);
  if (!normalized) return false;
  return /^43\/4311\//i.test(normalized);
}

function restaurarImagenOriginal(img) {
  if (!img || img.dataset.fallbackApplied === "1") return;
  const originalSrc = img.dataset.originalSrc || "";
  if (!originalSrc) return;
  img.dataset.fallbackApplied = "1";
  img.src = withCacheBust(originalSrc);
}

window.restaurarImagenOriginal = restaurarImagenOriginal;

let imageLoadRequestId = 0;

function iniciarCargaVisualImagen(img) {
  if (!img) return;
  img.classList.add("catalog-image-loading");
  img.removeAttribute("src");
}

function finalizarCargaVisualImagen(img, src) {
  if (!img) return;
  img.src = src;
  img.classList.remove("catalog-image-loading");
}

function asignarImagenCatalogo(img, path, options = {}) {
  if (!img) return;

  const normalized = normalizarRutaAsset(path);
  if (!normalized) {
    img.removeAttribute("src");
    img.classList.remove("catalog-image-loading");
    return;
  }

  const {
    eager = false,
    fetchPriority = eager ? "high" : "low",
    preferOriginal = false,
  } = options;

  const sourceCandidates = obtenerRutasAlternativasCatalogo43(normalized);
  img.dataset.originalSrc = sourceCandidates[0] || normalized;
  img.dataset.optimizedSrc = obtenerRutaImagenOptimizada(img.dataset.originalSrc || normalized);
  img.dataset.optimizedJpgSrc = obtenerRutaImagenOptimizadaJpg(img.dataset.originalSrc || normalized);
  img.dataset.fallbackApplied = "0";
  img.loading = eager ? "eager" : "lazy";
  img.decoding = "async";
  img.fetchPriority = fetchPriority;
  img.onerror = null;

  const requestId = String(++imageLoadRequestId);
  img.dataset.requestId = requestId;
  iniciarCargaVisualImagen(img);

  const probarCandidato = (candidateIndex) => {
    if (img.dataset.requestId !== requestId) return;
    const candidate = sourceCandidates[candidateIndex] || "";
    if (!candidate) {
      const card = img.closest(".card");
      if (card) {
        card.remove();
      } else {
        img.removeAttribute("src");
        img.classList.remove("catalog-image-loading");
      }
      return;
    }

    img.dataset.originalSrc = candidate;
    img.dataset.optimizedSrc = obtenerRutaImagenOptimizada(candidate);
    img.dataset.optimizedJpgSrc = obtenerRutaImagenOptimizadaJpg(candidate);

    const optimizedSrc = buildAssetUrl(img.dataset.optimizedSrc || candidate);
    const optimizedJpgSrc = buildAssetUrl(img.dataset.optimizedJpgSrc || candidate);
    const originalSrc = buildAssetUrl(candidate);

    const preferOriginalForCandidate = preferOriginal || rutaPrefiereOriginal(candidate);

    if (preferOriginalForCandidate) {
      const originalLoader = new Image();
      originalLoader.onload = () => {
        if (img.dataset.requestId !== requestId) return;
        if (!originalLoader.naturalWidth) { probarCandidato(candidateIndex + 1); return; }
        img.dataset.fallbackApplied = "1";
        finalizarCargaVisualImagen(img, originalSrc);
      };
      originalLoader.onerror = () => {
        if (img.dataset.requestId !== requestId) return;
        probarCandidato(candidateIndex + 1);
      };
      originalLoader.src = originalSrc;
      return;
    }

    const loader = new Image();
    loader.onload = () => {
      if (img.dataset.requestId !== requestId) return;
      if (!loader.naturalWidth) { probarCandidato(candidateIndex + 1); return; }
      finalizarCargaVisualImagen(img, optimizedSrc);
    };

    loader.onerror = () => {
      if (img.dataset.requestId !== requestId) return;
      const jpgLoader = new Image();
      jpgLoader.onload = () => {
        if (img.dataset.requestId !== requestId) return;
        if (!jpgLoader.naturalWidth) { probarCandidato(candidateIndex + 1); return; }
        finalizarCargaVisualImagen(img, optimizedJpgSrc);
      };
      jpgLoader.onerror = () => {
        if (img.dataset.requestId !== requestId) return;
        const originalLoader = new Image();
        originalLoader.onload = () => {
          if (img.dataset.requestId !== requestId) return;
          if (!originalLoader.naturalWidth) { probarCandidato(candidateIndex + 1); return; }
          img.dataset.fallbackApplied = "1";
          finalizarCargaVisualImagen(img, originalSrc);
        };
        originalLoader.onerror = () => {
          if (img.dataset.requestId !== requestId) return;
          probarCandidato(candidateIndex + 1);
        };
        originalLoader.src = originalSrc;
      };
      jpgLoader.src = optimizedJpgSrc;
    };

    loader.src = optimizedSrc;
  };

  probarCandidato(0);
}

const EMAIL_DESTINO = "man.cid@mohicanojeans.cl"; // <-- cambia si quieres
const SUPABASE_URL = "https://kdtydxihrflhziclgiof.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_37ce4uK_RG8o9pP-Jdf2Xw_3eWgqJQy";

function supabaseConfigurado() {
  return (
    typeof SUPABASE_URL === "string" &&
    SUPABASE_URL.startsWith("https://") &&
    typeof SUPABASE_ANON_KEY === "string" &&
    SUPABASE_ANON_KEY.trim().length > 20
  );
}

function clienteSupabaseDisponible() {
  return !!(globalThis.supabase && typeof globalThis.supabase.createClient === "function" && supabaseConfigurado());
}

let supabaseBrowserClient = null;

function obtenerClienteSupabase() {
  if (!clienteSupabaseDisponible()) return null;
  if (!supabaseBrowserClient) {
    supabaseBrowserClient = globalThis.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseBrowserClient;
}

function normalizarRut(valor) {
  const clean = String(valor || "")
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .replace(/[^0-9K]/g, "");
  if (!clean) return "";
  if (clean.length === 1) return clean;
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`;
}

function calcularDigitoVerificadorRut(cuerpoRut) {
  const digits = String(cuerpoRut || "").replace(/\D/g, "");
  if (!digits) return "";
  let suma = 0;
  let multiplicador = 2;
  for (let i = digits.length - 1; i >= 0; i--) {
    suma += Number(digits[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "K";
  return String(resto);
}

function esRutValido(valor) {
  const n = normalizarRut(valor);
  const [bodyRaw, dvRaw] = n.split("-");
  if (!bodyRaw || !dvRaw || !/^\d+$/.test(bodyRaw)) return false;
  return calcularDigitoVerificadorRut(bodyRaw) === dvRaw.toUpperCase();
}

function formatearRutVisual(rut) {
  const n = normalizarRut(rut);
  if (!n) return "";
  const [bodyRaw, dvRaw] = n.split("-");
  if (!bodyRaw || !dvRaw) return n;
  const body = bodyRaw.replace(/^0+/, "") || "0";
  const invert = body.split("").reverse();
  const parts = [];
  for (let i = 0; i < invert.length; i += 3) {
    parts.push(invert.slice(i, i + 3).reverse().join(""));
  }
  return `${parts.reverse().join(".")}-${dvRaw}`;
}

function buscarClienteLocalPorRut(rutInput) {
  const rutNormalizado = normalizarRut(rutInput);
  if (!rutNormalizado) return null;
  const found = LOCAL_CLIENT_OVERRIDES.find((item) => item.rut_normalized === rutNormalizado);
  return found ? { ...found } : null;
}

function esProductoAgotado(item) {
  if (CATALOG_SOURCE === "catalogo-43") {
    return obtenerEstadoVisibilidadCatalogo43(item) === "soldout";
  }
  if (CATALOG_SOURCE === "catalogo-44") {
    return obtenerEstadoVisibilidadCatalogo44(item) === "soldout";
  }
  if (item?.isSoldOut === true) return true;
  if (!INVENTORY_ENABLED || !Object.keys(stockBySku || {}).length) return false;
  const exactSku = normalizarSkuCatalogo(item?._preferredSku || item?.family || "");
  if (/^(40|41|42)\d{2}(?:-\d{2})?$/i.test(exactSku)) {
    const exactStock = obtenerStockExactoParaSkuDesdeItems(exactSku, stockBySku);
    if (exactStock) {
      const exactTotal = Number(exactStock?.total) || 0;
      const exactHasStock = exactTotal > 0
        || TALLAS_DISPONIBLES.some((talla) => Math.max(0, Number(exactStock?.sizes?.[talla]) || 0) > 0);
      return !exactHasStock;
    }
  }
  const skus = [item?.family, ...((Array.isArray(item?.variants) ? item.variants : []).map((variant) => variant?.sku))]
    .filter(Boolean);
  if (!skus.length) return false;

  const hasStockData = skus.some((sku) => Boolean(obtenerStockParaSkuDesdeItems(sku, stockBySku)));
  if (!hasStockData) return false;

  return !itemTieneStockDisponible(item, stockBySku);
}

function crearStockSinteticoAgotados() {
  const zeroSizes = Object.fromEntries(TALLAS_DISPONIBLES.map((size) => [size, 0]));
  const synthetic = {};

  SOLD_OUT_CATALOG_ITEMS.forEach((item) => {
    [item?.family, ...(Array.isArray(item?.variants) ? item.variants.map((variant) => variant?.sku) : [])]
      .filter(Boolean)
      .forEach((sku) => {
        synthetic[sku] = {
          total: 0,
          sizes: { ...zeroSizes },
          description: item?.description || "",
        };
      });
  });

  return synthetic;
}

function construirProductosAgotados() {
  return SOLD_OUT_CATALOG_ITEMS.map((item) => ({
    ...item,
    isSoldOut: true,
    gallery: Array.isArray(item?.gallery) ? [...item.gallery] : [],
    characteristics: Array.isArray(item?.characteristics) ? [...item.characteristics] : [],
    variants: Array.isArray(item?.variants)
      ? item.variants.map((variant) => ({
        ...variant,
        gallery: Array.isArray(variant?.gallery) ? [...variant.gallery] : [],
      }))
      : [],
  }));
}

/***********************
 * CARGAR PRODUCTOS
 ***********************/
const CATALOG_DATA_FILE = (document.body?.dataset?.catalogFile || "data.json").trim() || "data.json";
const CATALOG_SOURCE = (document.body?.dataset?.catalogSource || "catalogo-1").trim() || "catalogo-1";
const STOCK_DATA_FILE_BY_SOURCE = {
  "catalogo-1": "stock-data.json",
  "catalogo-2": "stock-data-catalogo-2.json",
  "catalogo-43": "stock-data-catalogo-43.json",
  "catalogo-44": "stock-data-catalogo-44.json",
};
const STOCK_DATA_FILE = STOCK_DATA_FILE_BY_SOURCE[CATALOG_SOURCE] || "stock-data.json";
const CATALOG_PRICE_CONFIG_BY_SOURCE = {
  "catalogo-1": {
    priceFile: "price-data.json",
  },
  "catalogo-43": {
    priceFile: "price-data-catalogo-43.json",
  },
};
let catalogPriceBySource = {};

function obtenerConfiguracionPrecioCatalogo(source = CATALOG_SOURCE) {
  return CATALOG_PRICE_CONFIG_BY_SOURCE[source] || null;
}

function normalizarMapaPreciosCatalogo(rawItems) {
  const entries = rawItems && typeof rawItems === "object" ? Object.entries(rawItems) : [];
  return entries.reduce((acc, [rawSku, rawPrice]) => {
    const sku = normalizarSkuCatalogo(rawSku);
    const price = Number(rawPrice);
    if (!sku || !Number.isFinite(price) || price <= 0) return acc;
    acc[sku] = price;
    return acc;
  }, {});
}

function leerJsonEmbebido(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const raw = (el.textContent || "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`No se pudo parsear JSON embebido ${id}:`, err);
    return null;
  }
}

function obtenerCatalogoEmbebidoLocal() {
  if (!IS_LOCAL_FILE_PROTOCOL) return null;
  if (CATALOG_SOURCE === "catalogo-43") return leerJsonEmbebido("catalogo43-inline-data");
  if (CATALOG_SOURCE === "catalogo-44") return leerJsonEmbebido("catalogo44-inline-data");
  return null;
}

function obtenerMapaPreciosEmbebidoLocal(source = CATALOG_SOURCE) {
  if (!IS_LOCAL_FILE_PROTOCOL) return null;
  if (source === "catalogo-43") {
    const data = leerJsonEmbebido("catalogo43-inline-prices");
    return normalizarMapaPreciosCatalogo(data?.items || data || {});
  }
  return null;
}

function obtenerCandidatosSkuPrecio(value) {
  const sku = normalizarSkuCatalogo(typeof value === "string" ? value : value?.family || value?.sku);
  if (!sku) return [];
  const candidates = [sku];
  const familyMatch = sku.match(/^(\d{4})$/);
  if (familyMatch) candidates.push(`${familyMatch[1]}-00`);
  const variantMatch = sku.match(/^(\d{4})-(\d{2})$/);
  if (variantMatch) {
    candidates.push(variantMatch[1]);
    if (variantMatch[2] !== "00") candidates.push(`${variantMatch[1]}-00`);
  }
  const zeroVariantMatch = sku.match(/^(\d{4})-00$/);
  if (zeroVariantMatch) candidates.push(zeroVariantMatch[1]);
  return [...new Set(candidates)];
}

async function cargarMapaPreciosCatalogo(source = CATALOG_SOURCE) {
  const config = obtenerConfiguracionPrecioCatalogo(source);
  if (!config) return {};
  if (config.inlinePrices) return normalizarMapaPreciosCatalogo(config.inlinePrices);
  const embeddedPrices = obtenerMapaPreciosEmbebidoLocal(source);
  if (embeddedPrices) return embeddedPrices;
  if (!config.priceFile) return {};
  const res = await fetch(withCacheBust(config.priceFile), { cache: "no-store" });
  if (!res.ok) throw new Error(`status ${res.status}`);
  const data = await res.json();
  return normalizarMapaPreciosCatalogo(data?.items || {});
}

async function cargarTodosLosMapasPreciosCatalogo() {
  const sources = Object.keys(CATALOG_PRICE_CONFIG_BY_SOURCE || {});
  const entries = await Promise.all(
    sources.map(async (source) => {
      try {
        const map = await cargarMapaPreciosCatalogo(source);
        return [source, map];
      } catch (err) {
        console.warn(`No se pudo cargar precios para ${source}:`, err);
        return [source, {}];
      }
    })
  );
  return Object.fromEntries(entries);
}

function obtenerPrecioListaCatalogo(value, source = CATALOG_SOURCE) {
  const priceMap = catalogPriceBySource[source] || {};
  const candidates = obtenerCandidatosSkuPrecio(value);
  for (const sku of candidates) {
    const price = Number(priceMap[sku]);
    if (Number.isFinite(price) && price > 0) return price;
  }
  return null;
}

function calcularPrecioWebConDescuento(precioLista) {
  const value = Number(precioLista);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * (1 - WEB_DISCOUNT_RATE));
}

function obtenerPrecioCatalogo(value, source = CATALOG_SOURCE) {
  const precioLista = obtenerPrecioListaCatalogo(value, source);
  return calcularPrecioWebConDescuento(precioLista);
}

function obtenerDetallePrecioCatalogo(value, source = CATALOG_SOURCE) {
  const precioLista = obtenerPrecioListaCatalogo(value, source);
  if (!precioLista) return null;
  const precioFinal = calcularPrecioWebConDescuento(precioLista);
  const ahorro = Math.max(0, precioLista - (precioFinal || 0));
  return {
    lista: precioLista,
    final: precioFinal,
    descuento: WEB_DISCOUNT_PERCENT,
    ahorro,
  };
}

function obtenerDetallePrecioCatalogoCruzado(value, preferredSource = CATALOG_SOURCE) {
  const preferred = obtenerDetallePrecioCatalogo(value, preferredSource);
  if (preferred) return preferred;

  const sources = Object.keys(catalogPriceBySource || {}).filter(Boolean);
  for (const source of sources) {
    if (source === preferredSource) continue;
    const detail = obtenerDetallePrecioCatalogo(value, source);
    if (detail) return detail;
  }

  return null;
}

function formatearPrecioCLP(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return `$${amount.toLocaleString("es-CL")}`;
}

function stockSupabaseHabilitado() {
  // Solo la coleccion 42 debe leer stock en vivo desde Supabase.
  // Si la lectura falla, el storefront vuelve al JSON regenerado desde Excel.
  return CATALOG_SOURCE === "catalogo-1";
}

async function cargarStockJsonLocal() {
  const res = await fetch(withCacheBust(STOCK_DATA_FILE), { cache: "no-store" });
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.json();
}

async function cargarStockSupabasePublico() {
  const client = obtenerClienteSupabase();
  if (!client) throw new Error("Cliente Supabase no disponible");

  const { data, error } = await client
    .from("stock_items")
    .select("id,season,article_code,sku,tiro,bota,color,active,updated_at,stock_item_sizes(id,size_label,quantity,sort_order),stock_item_reserve_sizes(size_label,reserve_quantity)")
    .order("sku", { ascending: true });

  if (error) throw error;
  return {
    source_file: "supabase:stock_items",
    items: convertirFilasStockItemsAItems(data || []),
  };
}

async function cargarStockDatasetPreferido() {
  if (stockSupabaseHabilitado()) {
    try {
      return await cargarStockSupabasePublico();
    } catch (err) {
      console.warn("No se pudo cargar stock desde Supabase, se usa JSON local:", err);
    }
  }
  return cargarStockJsonLocal();
}

function normalizarSkuCatalogo(value) {
  const raw = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!raw) return "";
  if (/^\d{4}$/.test(raw) || /^\d{4}-\d{2}$/.test(raw)) return raw;

  const digits = raw.replace(/\D/g, "");
  if (digits.length === 4) return digits;
  if (digits.length === 6) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}`;
  if (digits.length === 8) return `${digits.slice(-6, -2)}-${digits.slice(-2)}`;

  return raw;
}

function normalizarMapaStockPorSku(items = {}) {
  const merged = {};
  Object.entries(items || {}).forEach(([rawKey, payload]) => {
    const key = normalizarSkuCatalogo(payload?.sku || rawKey);
    if (!key) return;

    if (!merged[key]) {
      merged[key] = {
        article: String(payload?.article || "").trim(),
        sku: key,
        description: String(payload?.description || "").trim(),
        sizes: {},
        total: 0,
      };
    }

    const entry = merged[key];
    const incomingSizes = Object.keys(payload?.sizes || {});
    const knownSizes = new Set([...TALLAS_DISPONIBLES, ...incomingSizes.map((size) => normalizarStockSizeLabel(size))]);
    [...knownSizes].forEach((size) => {
      const prev = Math.max(0, Number(entry.sizes?.[size]) || 0);
      const next = Math.max(0, Number(payload?.sizes?.[size]) || 0);
      entry.sizes[size] = prev + next;
    });
    entry.total = Object.values(entry.sizes || {}).reduce((acc, qty) => acc + (Math.max(0, Number(qty) || 0)), 0);
    if (!entry.description && payload?.description) entry.description = String(payload.description).trim();
    if (!entry.article && payload?.article) entry.article = String(payload.article).trim();
  });
  return merged;
}

function construirDescripcionStockCatalog(row = {}) {
  return [row?.tiro, row?.bota, row?.color]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" / ");
}

function normalizarStockSizeLabel(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function ordenarEtiquetasTalla(a, b) {
  const aNorm = normalizarStockSizeLabel(a);
  const bNorm = normalizarStockSizeLabel(b);
  const aNum = Number(aNorm);
  const bNum = Number(bNorm);
  const aIsNum = Number.isFinite(aNum) && aNorm !== "";
  const bIsNum = Number.isFinite(bNum) && bNorm !== "";
  if (aIsNum && bIsNum) return aNum - bNum;
  if (aIsNum) return -1;
  if (bIsNum) return 1;
  return aNorm.localeCompare(bNorm, undefined, { numeric: true, sensitivity: "base" });
}

function compararFilasStock(a = {}, b = {}) {
  const totalA = Number(normalizarFilaStockCatalog(a)?.total) || 0;
  const totalB = Number(normalizarFilaStockCatalog(b)?.total) || 0;
  const totalDiff = totalB - totalA;
  if (totalDiff !== 0) return totalDiff;

  const rowA = normalizarFilaStockCatalog(a);
  const rowB = normalizarFilaStockCatalog(b);

  const seasonDiff = String(rowB?.season || "").localeCompare(String(rowA?.season || ""), undefined, { numeric: true });
  if (seasonDiff !== 0) return seasonDiff;

  const articleCodeDiff = String(rowB?.article_code || "").localeCompare(String(rowA?.article_code || ""), undefined, { numeric: true });
  if (articleCodeDiff !== 0) return articleCodeDiff;

  return String(rowB?.sku || "").localeCompare(String(rowA?.sku || ""), undefined, { numeric: true });
}

function normalizarTallasStock(rows = []) {
  const merged = new Map();
  (Array.isArray(rows) ? rows : [])
    .map((sizeRow, index) => ({
      id: sizeRow?.id ?? null,
      size_label: normalizarStockSizeLabel(sizeRow?.size_label ?? sizeRow?.label),
      quantity: Math.max(0, Number(sizeRow?.quantity) || 0),
      sort_order: Number.isFinite(Number(sizeRow?.sort_order))
        ? Number(sizeRow.sort_order)
        : ((index + 1) * 10),
    }))
    .filter((sizeRow) => sizeRow.size_label)
    .forEach((sizeRow) => {
      const existing = merged.get(sizeRow.size_label);
      if (!existing) {
        merged.set(sizeRow.size_label, sizeRow);
        return;
      }
      existing.quantity += sizeRow.quantity;
      existing.sort_order = Math.min(Number(existing.sort_order || 0), Number(sizeRow.sort_order || 0));
    });

  return [...merged.values()].sort((a, b) => {
    const orderDiff = Number(a.sort_order || 0) - Number(b.sort_order || 0);
    if (orderDiff !== 0) return orderDiff;
    return ordenarEtiquetasTalla(a.size_label, b.size_label);
  });
}

function normalizarFilaStockCatalog(row = {}, options = {}) {
  const { preferReserve = false } = options;
  const sku = normalizarSkuCatalogo(row?.sku);
  const sourceSizes =
    Array.isArray(row?.stock_item_sizes) && row.stock_item_sizes.length
      ? row.stock_item_sizes
      : Array.isArray(row?.sizes) && row.sizes.length
        ? row.sizes
        : TALLAS_DISPONIBLES.map((size, index) => ({
          size_label: size,
          quantity: Math.max(0, Number(row?.[`size_${size}`]) || 0),
          sort_order: (index + 1) * 10,
        }));
  const reserveMap = Object.fromEntries(
    (Array.isArray(row?.stock_item_reserve_sizes) ? row.stock_item_reserve_sizes : [])
      .map((sizeRow) => [
        normalizarStockSizeLabel(sizeRow?.size_label),
        Math.max(0, Number(sizeRow?.reserve_quantity) || 0),
      ])
      .filter(([label]) => !!label)
  );
  const sizes = normalizarTallasStock(sourceSizes).map((sizeRow) => ({
    ...sizeRow,
    quantity: preferReserve && Object.prototype.hasOwnProperty.call(reserveMap, sizeRow.size_label)
      ? reserveMap[sizeRow.size_label]
      : sizeRow.quantity,
  }));
  const total = sizes.reduce((acc, sizeRow) => acc + (Number(sizeRow?.quantity) || 0), 0);
  return {
    id: row?.id ?? null,
    season: String(row?.season || "").trim() || "42",
    article_code: String(row?.article_code || "").trim(),
    sku,
    tiro: String(row?.tiro || "").trim(),
    bota: String(row?.bota || "").trim(),
    color: String(row?.color || "").trim(),
    active: row?.active !== false,
    updated_at: row?.updated_at || null,
    description: construirDescripcionStockCatalog(row),
    sizes,
    total,
  };
}

function convertirFilasStockItemsAItems(rows = []) {
  const items = {};
  (Array.isArray(rows) ? rows : [])
    .map((row) => normalizarFilaStockCatalog(row, { preferReserve: true }))
    .filter((row) => row?.sku)
    .forEach((row) => {
      const sizesMap = Object.fromEntries(
        row.sizes.map((sizeRow) => [sizeRow.size_label, Math.max(0, Number(sizeRow.quantity) || 0)])
      );
      items[row.sku] = {
        article: row.article_code,
        sku: row.sku,
        description: row.description,
        sizes: sizesMap,
        total: row.total,
      };
    });
  return items;
}

function skuAArticleCode(sku) {
  const normalized = normalizarSkuCatalogo(sku);
  if (/^\d{4}$/.test(normalized)) return `${normalized}00`;
  if (/^\d{4}-\d{2}$/.test(normalized)) return normalized.replace("-", "");
  return normalized;
}

function normalizarMapaAssetsPorSku(map = {}) {
  const normalized = {};
  Object.entries(map || {}).forEach(([rawKey, value]) => {
    const key = normalizarSkuCatalogo(rawKey);
    if (!key) return;
    if (typeof value !== "string" || !value.trim()) return;
    if (!normalized[key]) normalized[key] = value;
  });
  return normalized;
}

function crearFirmaStock(stockItems = {}) {
  return Object.entries(stockItems || {})
    .sort(([a], [b]) => String(a).localeCompare(String(b), undefined, { numeric: true }))
    .map(([sku, payload]) => {
      const total = Math.max(0, Number(payload?.total) || 0);
      const sizes = TALLAS_DISPONIBLES
        .map((size) => `${size}:${Math.max(0, Number(payload?.sizes?.[size]) || 0)}`)
        .join(",");
      return `${normalizarSkuCatalogo(sku)}|${total}|${sizes}`;
    })
    .join(";");
}

function crearCandidatosSku(value) {
  const raw = normalizarSkuCatalogo(value);
  if (!raw) return [];
  const candidates = new Set([raw]);
  if (/^\d{4}$/.test(raw)) candidates.add(`${raw}-00`);
  if (/^\d{4}-00$/.test(raw)) candidates.add(raw.slice(0, 4));
  const familyMatch = raw.match(/^(\d{4})-(\d{2})$/);
  if (familyMatch) {
    candidates.add(familyMatch[1]);
    candidates.add(`${familyMatch[1]}-00`);
  }
  return [...candidates];
}

function obtenerBaseFamilia(value) {
  const raw = normalizarSkuCatalogo(value);
  const match = raw.match(/^(\d{4})/);
  return match ? match[1] : "";
}

function obtenerImagenPortadaProducto(item) {
  const family = normalizarSkuCatalogo(item?.family);
  const variants = Array.isArray(item?.variants) ? item.variants : [];
  const variantWithStock = variants.find((variant) => skuTieneStockDisponible(variant?.sku, stockBySku)) || null;

  if (variantWithStock) {
    const variantImages = [
      variantWithStock?.main_image,
      ...(Array.isArray(variantWithStock?.gallery) ? variantWithStock.gallery : []),
    ]
      .map((img) => normalizarRutaImagenCatalogo(img))
      .filter(Boolean);
    const variantCatalogImage = variantImages.find((img) => img.toLowerCase().includes("catalogo") && img.startsWith("Imagenes/"))
      || variantImages.find((img) => img.toLowerCase().includes("catalogo"));
    if (variantCatalogImage) return variantCatalogImage;
  }

  const coverCandidates = [
    family,
    ...(variantWithStock ? crearCandidatosSku(variantWithStock?.sku) : []),
    ...crearCandidatosSku(family),
  ].filter(Boolean);

  for (const candidate of coverCandidates) {
    if (CATALOG_COVER_OVERRIDES?.[candidate]) return normalizarRutaImagenCatalogo(CATALOG_COVER_OVERRIDES[candidate]);
    if (catalogCoverBySku?.[candidate]) return normalizarRutaImagenCatalogo(catalogCoverBySku[candidate]);
  }

  const allImages = [
    item?.main_image,
    ...(Array.isArray(item?.gallery) ? item.gallery : []),
    ...((Array.isArray(item?.variants) ? item.variants : []).flatMap((variant) => [
      variant?.main_image,
      ...(Array.isArray(variant?.gallery) ? variant.gallery : []),
    ])),
  ]
    .map((img) => normalizarRutaImagenCatalogo(img))
    .filter(Boolean);

  const catalogImage = allImages.find((img) => img.toLowerCase().includes("catalogo") && img.startsWith("Imagenes/"))
    || allImages.find((img) => img.toLowerCase().includes("catalogo"));
  if (catalogImage) return catalogImage;

  const nonCatalogImage = allImages.find((img) => !img.toLowerCase().includes("catalogo"));
  return nonCatalogImage || normalizarRutaImagenCatalogo(item?.main_image) || allImages[0] || "";
}

function mergeCatalogItems(...groups) {
  const items = groups.flat().filter(Boolean);
  const map = new Map();

  items.forEach((item) => {
    const family = normalizarSkuCatalogo(item?.family);
    if (!family) return;

    const existing = map.get(family);
    const next = existing ? existing : {
      ...item,
      family,
      gallery: Array.isArray(item?.gallery) ? [...item.gallery] : [],
      characteristics: Array.isArray(item?.characteristics) ? [...item.characteristics] : [],
      variants: Array.isArray(item?.variants) ? item.variants.map((variant) => ({ ...variant })) : [],
    };

    if (existing) {
      if (!next.main_image && item?.main_image) next.main_image = item.main_image;
      if (!next.description && item?.description) next.description = item.description;
      if ((!next.characteristics || !next.characteristics.length) && Array.isArray(item?.characteristics)) {
        next.characteristics = [...item.characteristics];
      }

      const gallerySet = new Set(Array.isArray(next.gallery) ? next.gallery : []);
      (item?.gallery || []).forEach((img) => {
        if (img) gallerySet.add(img);
      });
      next.gallery = [...gallerySet];

      const variantsBySku = new Map(
        (Array.isArray(next.variants) ? next.variants : []).map((variant) => [normalizarSkuCatalogo(variant?.sku), { ...variant }])
      );
      (item?.variants || []).forEach((variant) => {
        const sku = normalizarSkuCatalogo(variant?.sku);
        if (!sku) return;
        if (!variantsBySku.has(sku)) {
          variantsBySku.set(sku, { ...variant, sku });
          return;
        }
        const currentVariant = variantsBySku.get(sku);
        if (!currentVariant.main_image && variant?.main_image) currentVariant.main_image = variant.main_image;
        const variantGallery = new Set(Array.isArray(currentVariant.gallery) ? currentVariant.gallery : []);
        (variant?.gallery || []).forEach((img) => {
          if (img) variantGallery.add(img);
        });
        currentVariant.gallery = [...variantGallery];
      });
      next.variants = [...variantsBySku.values()];
    }

    map.set(family, next);
  });

  return [...map.values()].sort((a, b) => {
    const aKey = normalizarSkuCatalogo(a?.family);
    const bKey = normalizarSkuCatalogo(b?.family);
    return aKey.localeCompare(bKey, undefined, { numeric: true });
  });
}

function consolidarFamiliasDuplicadas(items = []) {
  const sourceMap = new Map(
    items
      .filter((item) => normalizarSkuCatalogo(item?.family))
      .map((item) => [normalizarSkuCatalogo(item.family), item])
  );

  const absorbed = new Set();

  items.forEach((item) => {
    const family = normalizarSkuCatalogo(item?.family);
    const match = family.match(/^(\d{4})-(\d{2})$/);
    if (!match || match[2] === "00") return;

    const baseCandidates = [`${match[1]}-00`, match[1]];
    const baseKey = baseCandidates.find((candidate) => sourceMap.has(candidate));
    if (!baseKey || baseKey === family) return;

    const baseItem = sourceMap.get(baseKey);
    if (!baseItem) return;

    const variants = Array.isArray(baseItem.variants) ? [...baseItem.variants] : [];
    const alreadyExists = variants.some((variant) => normalizarSkuCatalogo(variant?.sku) === family);

    if (!alreadyExists) {
      variants.push({
        sku: family,
        main_image: item?.main_image || "",
        gallery: Array.isArray(item?.gallery) ? [...item.gallery] : [],
      });
      baseItem.variants = variants;
    }

    if ((!baseItem.main_image || !baseItem.gallery?.length) && item?.main_image) {
      baseItem.main_image = baseItem.main_image || item.main_image;
      const mergedGallery = new Set([...(baseItem.gallery || []), ...(item.gallery || [])].filter(Boolean));
      baseItem.gallery = [...mergedGallery];
    }

    absorbed.add(family);
  });

  return items.filter((item) => !absorbed.has(normalizarSkuCatalogo(item?.family)));
}

function agruparVariantesPorFamilia(items = []) {
  const grouped = new Map();

  items.forEach((item) => {
    const family = normalizarSkuCatalogo(item?.family);
    const match = family.match(/^(\d{4})-(\d{2})$/);
    const groupKey = match ? `${match[1]}-00` : family;

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        ...item,
        family: groupKey,
        gallery: Array.isArray(item?.gallery) ? [...item.gallery] : [],
        characteristics: Array.isArray(item?.characteristics) ? [...item.characteristics] : [],
        variants: Array.isArray(item?.variants) ? item.variants.map((variant) => ({ ...variant })) : [],
      });
    }

    const target = grouped.get(groupKey);
    if (!target) return;

    if (family !== groupKey) {
      const alreadyExists = (target.variants || []).some((variant) => normalizarSkuCatalogo(variant?.sku) === family);
      if (!alreadyExists) {
        target.variants = [
          ...(target.variants || []),
          {
            sku: family,
            main_image: item?.main_image || "",
            gallery: Array.isArray(item?.gallery) ? [...item.gallery] : [],
          },
        ];
      }

      if ((!target.description || /^Modelo\s/i.test(target.description)) && item?.description) {
        target.description = item.description;
      }
      if ((!target.characteristics || !target.characteristics.length) && Array.isArray(item?.characteristics)) {
        target.characteristics = [...item.characteristics];
      }
    }
  });

  return [...grouped.values()].sort((a, b) => {
    const aKey = normalizarSkuCatalogo(a?.family);
    const bKey = normalizarSkuCatalogo(b?.family);
    return aKey.localeCompare(bKey, undefined, { numeric: true });
  });
}

function obtenerImagenesVisibles(obj, options = {}) {
  const { includeCatalog = false } = options;
  let imgs = [];
  if (obj?.main_image) imgs.push(obj.main_image);
  if (Array.isArray(obj?.gallery)) imgs = imgs.concat(obj.gallery);
  return [...new Set(imgs)]
    .map((img) => normalizarRutaImagenCatalogo(img))
    .filter((img) => {
      if (!img) return false;
      const lower = img.toLowerCase();
      if (lower.endsWith(".heic") || lower.endsWith(".heif")) return false;
      if (includeCatalog) return true;
      return !lower.includes("catalogo");
    });
}

function deduplicarImagenesParaVisor(images = []) {
  const crearHuellaImagen = (path) => {
    const normalized = normalizarRutaAsset(path).toLowerCase();
    const filename = normalized.split("/").pop() || "";
    const noExt = filename.replace(/\.[a-z0-9]+$/i, "");
    const sinPrefijoCopia = noExt.replace(/^copia\s+de\s+/i, "");
    const sinSufijoCopia = sinPrefijoCopia.replace(/\s+(copie|copy)$/i, "");
    return sinSufijoCopia.replace(/[^a-z0-9]/g, "");
  };

  const out = [];
  const seenPath = new Set();
  const seenFingerprint = new Set();

  (Array.isArray(images) ? images : []).forEach((img) => {
    const normalized = normalizarRutaAsset(img);
    if (!normalized) return;
    const lower = normalized.toLowerCase();
    if (lower.includes(".ds_store")) return;
    if (lower.endsWith(".heic") || lower.endsWith(".heif")) return;

    const pathKey = lower;
    if (seenPath.has(pathKey)) return;

    const fingerprint = crearHuellaImagen(normalized);
    if (fingerprint && seenFingerprint.has(fingerprint)) return;

    seenPath.add(pathKey);
    if (fingerprint) seenFingerprint.add(fingerprint);
    out.push(normalized);
  });

  return out;
}

function seleccionarImagenesParaVisor(images = [], maxCount = 4) {
  const unique = deduplicarImagenesParaVisor(images);
  if (unique.length <= maxCount) return unique;

  const selected = [];
  const used = new Set();
  for (let i = 0; i < maxCount; i++) {
    const index = Math.round((i * (unique.length - 1)) / (maxCount - 1));
    const img = unique[index];
    if (img && !used.has(img)) {
      selected.push(img);
      used.add(img);
    }
  }

  if (selected.length < maxCount) {
    unique.forEach((img) => {
      if (selected.length >= maxCount || used.has(img)) return;
      selected.push(img);
      used.add(img);
    });
  }

  return selected;
}

const IMAGENES_CURADAS_VISOR_POR_SKU = {
  "4301-00": [
    "43/43/4301/Mohicano-102.jpg",
    "43/43/4301/Mohicano-103.jpg",
    "43/43/4301/editar/Mohicano-105.jpg",
    "43/43/4301/Mohicano-111.jpg",
  ],
};

function obtenerImagenesCuradasParaVisor(sku, imageList = [], maxCount = 4) {
  const unique = deduplicarImagenesParaVisor(imageList);
  const normalizedSku = normalizarSkuCatalogo(sku);
  const curated = IMAGENES_CURADAS_VISOR_POR_SKU[normalizedSku];

  if (!curated?.length) {
    return seleccionarImagenesParaVisor(unique, maxCount);
  }

  const available = new Set(unique.map((img) => normalizarRutaAsset(img)));
  const selected = [];
  const used = new Set();

  curated.forEach((img) => {
    const normalized = normalizarRutaAsset(img);
    if (!normalized || !available.has(normalized) || used.has(normalized)) return;
    selected.push(normalized);
    used.add(normalized);
  });

  unique.forEach((img) => {
    const normalized = normalizarRutaAsset(img);
    if (selected.length >= maxCount || used.has(normalized)) return;
    selected.push(normalized);
    used.add(normalized);
  });

  return selected.slice(0, maxCount);
}

function tieneImagenesDeFuente(obj, prefix = "42/") {
  const prefixes = Array.isArray(prefix) ? prefix : [prefix];
  return obtenerImagenesVisibles(obj, { includeCatalog: true }).some((img) => prefixes.some((p) => img.startsWith(p)));
}

function priorizarImagenesDeFuenteEnObjeto(obj, prefix = "Imagenes/") {
  if (!obj) return obj;
  const images = obtenerImagenesVisibles(obj, { includeCatalog: true });
  const preferred = images.filter((img) => img.startsWith(prefix));
  if (!preferred.length) return obj;
  const rest = images.filter((img) => !img.startsWith(prefix));
  return {
    ...obj,
    main_image: preferred[0],
    gallery: [...preferred, ...rest],
  };
}

function priorizarImagenesNuevas(items = [], prefix = "Imagenes/") {
  return items.map((item) => ({
    ...priorizarImagenesDeFuenteEnObjeto(item, prefix),
    variants: (item?.variants || []).map((variant) => priorizarImagenesDeFuenteEnObjeto(variant, prefix)),
  }));
}

function filtrarFamiliasConDatosNuevos(items = [], presenceFamilies = [], prefix = "42/") {
  const familySet = new Set((presenceFamilies || []).map((value) => String(value || "").trim()));
  if (!familySet.size) return items;
  const prefixes = Array.isArray(prefix)
    ? prefix
    : (CATALOG_SOURCE === "catalogo-1" ? ["Imagenes/", "42/"] : [prefix]);

  return items.filter((item) => {
    const baseFamily = obtenerBaseFamilia(item?.family);
    if (!familySet.has(baseFamily)) return true;
    if (tieneImagenesDeFuente(item, prefixes)) return true;
    return (item?.variants || []).some((variant) => tieneImagenesDeFuente(variant, prefixes));
  });
}

function tieneImagenesRenderizables(item) {
  if (obtenerImagenesVisibles(item, { includeCatalog: true }).length) return true;
  return (item?.variants || []).some((variant) => obtenerImagenesVisibles(variant, { includeCatalog: true }).length);
}

function crearFirmaImagenes(obj, options = {}) {
  const { includeCatalog = false } = options;
  const images = obtenerImagenesVisibles(obj, { includeCatalog });
  if (!images.length) return "";
  const names = [];
  const seen = new Set();
  images.forEach((img) => {
    const key = img.split("/").pop()?.toLowerCase() || img.toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    names.push(key);
  });
  return names.join("|");
}

function crearSetFirmaImagenes(obj) {
  const signature = crearFirmaImagenes(obj);
  return new Set(signature ? signature.split("|") : []);
}

function firmaEsSubconjunto(aObj, bObj) {
  const aSet = crearSetFirmaImagenes(aObj);
  const bSet = crearSetFirmaImagenes(bObj);
  if (!aSet.size || !bSet.size) return false;
  for (const key of aSet) {
    if (!bSet.has(key)) return false;
  }
  return true;
}

function filtrarProductosConImagenes(items = []) {
  return items.filter((item) => {
    if (obtenerImagenesReales(item).length) return true;
    return (item?.variants || []).some((variant) => obtenerImagenesReales(variant).length);
  });
}

function deduplicarTarjetasPorModelo(items = []) {
  const byCardKey = new Map();

  items.forEach((item) => {
    const cardModel = formatearModeloTarjeta(item?.family);
    const imageSignature =
      crearFirmaImagenes(item) ||
      crearFirmaImagenes(item, { includeCatalog: true }) ||
      crearFirmaImagenes(item?.variants?.[0] || {}) ||
      crearFirmaImagenes(item?.variants?.[0] || {}, { includeCatalog: true });
    if (!cardModel || !imageSignature) return;

    const dedupeKey = `${cardModel}::${imageSignature}`;
    const current = byCardKey.get(dedupeKey);
    if (!current) {
      byCardKey.set(dedupeKey, item);
      return;
    }

    const currentVariants = Array.isArray(current?.variants) ? current.variants.length : 0;
    const nextVariants = Array.isArray(item?.variants) ? item.variants.length : 0;
    const preferCurrent =
      currentVariants > nextVariants ||
      (currentVariants === nextVariants && /-00$/i.test(normalizarSkuCatalogo(current?.family)));

    if (!preferCurrent) byCardKey.set(dedupeKey, item);
  });

  return [...byCardKey.values()].sort((a, b) => {
    const aKey = normalizarSkuCatalogo(a?.family);
    const bKey = normalizarSkuCatalogo(b?.family);
    return aKey.localeCompare(bKey, undefined, { numeric: true });
  });
}

function filtrarProductosPorStock(items = [], stockItems = {}) {
  const availableKeys = new Set();

  Object.entries(stockItems || {}).forEach(([sku, payload]) => {
    const total = Number(payload?.total) || 0;
    if (total <= 0) return;
    crearCandidatosSku(sku).forEach((key) => {
      if (key) availableKeys.add(key);
    });
  });

  if (!availableKeys.size) return items;

  return items.filter((item) => {
    const candidates = new Set(crearCandidatosSku(item?.family));
    (item?.variants || []).forEach((variant) => {
      crearCandidatosSku(variant?.sku).forEach((key) => candidates.add(key));
    });
    for (const key of candidates) {
      if (availableKeys.has(key)) return true;
    }
    return false;
  });
}

function filtrarVariantesPorStock(items = [], stockItems = {}) {
  const availableKeys = new Set();

  Object.entries(stockItems || {}).forEach(([sku, payload]) => {
    const total = Number(payload?.total) || 0;
    if (total <= 0) return;
    crearCandidatosSku(sku).forEach((key) => {
      if (key) availableKeys.add(key);
    });
  });

  if (!availableKeys.size) return items;

  return items.map((item) => ({
    ...item,
    variants: (Array.isArray(item?.variants) ? item.variants : []).filter((variant) => {
      for (const key of crearCandidatosSku(variant?.sku)) {
        if (availableKeys.has(key)) return true;
      }
      return false;
    }),
  }));
}

function obtenerStockParaSkuDesdeItems(sku, stockItems = {}) {
  const key = normalizarSkuCatalogo(sku);
  if (!key) return null;
  if (stockItems[key]) return stockItems[key];
  const elegirVarianteFamiliaConStock = (familyKey) => {
    const familyPattern = new RegExp(`^${familyKey}-\\d{2}$`);
    const candidates = Object.entries(stockItems || {})
      .filter(([candidateSku]) => familyPattern.test(String(candidateSku || "").trim()))
      .map(([, payload]) => payload)
      .filter(Boolean);
    if (!candidates.length) return null;
    candidates.sort((a, b) => (Number(b?.total) || 0) - (Number(a?.total) || 0));
    return candidates[0] || null;
  };
  if (/^\d{4}$/.test(key)) {
    if (stockItems[`${key}-00`]) return stockItems[`${key}-00`];
    const variantFallback = elegirVarianteFamiliaConStock(key);
    if (variantFallback) return variantFallback;
  }
  if (/-00$/i.test(key)) {
    const familyKey = key.slice(0, 4);
    if (stockItems[familyKey]) return stockItems[familyKey];
    const variantFallback = elegirVarianteFamiliaConStock(familyKey);
    if (variantFallback) return variantFallback;
  }
  const familyMatch = key.match(/^(\d{4})-(\d{2})$/);
  if (familyMatch) {
    const familyKey = familyMatch[1];
    if (stockItems[`${familyKey}-00`]) return stockItems[`${familyKey}-00`];
  }
  return null;
}

function obtenerStockExactoParaSkuDesdeItems(sku, stockItems = {}) {
  const key = normalizarSkuCatalogo(sku);
  if (!key) return null;
  if (stockItems[key]) return stockItems[key];
  if (/^\d{4}$/.test(key) && stockItems[`${key}-00`]) return stockItems[`${key}-00`];
  const managedStockSku = /^(40|41|42)\d{2}(?:-\d{2})?$/i.test(key);
  if (!managedStockSku || !Object.keys(stockItems || {}).length) return null;
  return {
    article: skuAArticleCode(key),
    sku: key,
    description: "",
    sizes: Object.fromEntries(TALLAS_DISPONIBLES.map((size) => [size, 0])),
    total: 0,
  };
}

function skuTieneStockDisponible(sku, stockItems = {}) {
  if (!Object.keys(stockItems || {}).length) return false;
  const stock = obtenerStockParaSkuDesdeItems(sku, stockItems);
  if (!stock) return false;
  const total = Number(stock?.total) || 0;
  if (total > 0) return true;
  return TALLAS_DISPONIBLES.some((talla) => Math.max(0, Number(stock?.sizes?.[talla]) || 0) > 0);
}

function itemTieneStockDisponible(item, stockItems = {}) {
  const skus = [item?.family, ...((Array.isArray(item?.variants) ? item.variants : []).map((variant) => variant?.sku))]
    .filter(Boolean);
  if (!skus.length || !Object.keys(stockItems || {}).length) return false;
  return skus.some((sku) => skuTieneStockDisponible(sku, stockItems));
}

function obtenerTotalStockProducto(item, stockItems = {}) {
  if (!Object.keys(stockItems || {}).length) return 0;
  const familyBase = obtenerBaseFamilia(item?.family);
  if (!familyBase) return 0;

  let total = 0;
  Object.entries(stockItems || {}).forEach(([sku, payload]) => {
    if (obtenerBaseFamilia(sku) !== familyBase) return;
    total += Math.max(0, Number(payload?.total) || 0);
  });
  return total;
}

function compararProductosPorStockDesc(a, b, stockItems = stockBySku) {
  const stockA = Math.max(
    0,
    Number(a?._stockTotal) || 0,
    Number(obtenerStockParaSkuDesdeItems(a?.family, stockItems)?.total) || 0
  );
  const stockB = Math.max(
    0,
    Number(b?._stockTotal) || 0,
    Number(obtenerStockParaSkuDesdeItems(b?.family, stockItems)?.total) || 0
  );
  if (stockB !== stockA) return stockB - stockA;
  const modelA = normalizarSkuCatalogo(a?.family);
  const modelB = normalizarSkuCatalogo(b?.family);
  return modelA.localeCompare(modelB, undefined, { numeric: true });
}

function obtenerImagenesPropias(obj) {
  const nonCatalog = deduplicarImagenesParaVisor(obtenerImagenesVisibles(obj));
  if (nonCatalog.length) return nonCatalog;
  return deduplicarImagenesParaVisor(obtenerImagenesVisibles(obj, { includeCatalog: true }));
}

function obtenerImagenesReales(obj) {
  return deduplicarImagenesParaVisor(obtenerImagenesVisibles(obj));
}

function crearFirmaGaleriaTarjeta(images = []) {
  const names = [];
  const seen = new Set();
  deduplicarImagenesParaVisor(images).forEach((img) => {
    const key = normalizarRutaAsset(img).split("/").pop()?.toLowerCase() || "";
    if (!key || seen.has(key)) return;
    seen.add(key);
    names.push(key);
  });
  return names.join("|");
}

function imagenCompatibleConSku(path, sku) {
  const normalizedPath = normalizarRutaAsset(path).toLowerCase();
  const normalizedSku = normalizarSkuCatalogo(sku).toLowerCase();
  const match = normalizedSku.match(/^(\d{4})-(\d{2})$/);
  if (!match) return true;

  const [, model, variant] = match;
  const variantMatches = [...normalizedPath.matchAll(new RegExp(`${model}-(\\d{2})`, "g"))];
  if (!variantMatches.length) return true; // sin variante explícita en ruta -> permitida

  return variantMatches.some((m) => (m?.[1] || "") === variant);
}

function construirProductosGridPorSku(items = [], stockItems = {}) {
  return construirTarjetasCatalogoPorSku(items, stockItems, { includeSoldOut: false });
}

function construirProductosGridAgotadosPorSku(items = [], stockItems = {}) {
  return construirTarjetasCatalogoPorSku(items, stockItems, { includeSoldOut: true })
    .filter((item) => item?.isSoldOut)
    .sort((a, b) => {
      const aKey = normalizarSkuCatalogo(a?.family);
      const bKey = normalizarSkuCatalogo(b?.family);
      return aKey.localeCompare(bKey, undefined, { numeric: true });
    });
}

function construirTarjetasCatalogoPorSku(items = [], stockItems = {}, options = {}) {
  const { includeSoldOut = false } = options;
  const cards = [];
  const seenSku = new Set();
  const seenImageSignatureByFamily = new Map();

  (Array.isArray(items) ? items : []).forEach((item) => {
    const rawFamily = normalizarSkuCatalogo(item?.family);
    const familyRoot = obtenerBaseFamilia(rawFamily);
    const baseFamily = familyRoot ? `${familyRoot}-00` : rawFamily;
    if (!baseFamily) return;

    const candidates = [
      { sku: rawFamily, source: item },
      ...((Array.isArray(item?.variants) ? item.variants : []).map((variant) => ({
        sku: normalizarSkuCatalogo(variant?.sku),
        source: variant,
      }))),
    ].filter((entry) => entry.sku);

    candidates.forEach((entry) => {
      if (seenSku.has(entry.sku)) return;
      const stockExacto = obtenerStockExactoParaSkuDesdeItems(entry.sku, stockItems);
      const stock = stockExacto || obtenerStockParaSkuDesdeItems(entry.sku, stockItems);
      const total = Math.max(0, Number(stock?.total) || 0);
      const agotado = total <= 0;
      if (agotado && !includeSoldOut) return;

      const images = obtenerImagenesReales(entry.source).filter((img) => imagenCompatibleConSku(img, entry.sku));
      const cardImage = images[0] || "";
      if (!cardImage) return;
      const imageSignature = crearFirmaGaleriaTarjeta(images);
      const knownSignatures = seenImageSignatureByFamily.get(baseFamily) || new Set();
      if (imageSignature && knownSignatures.has(imageSignature)) return;

      seenSku.add(entry.sku);
      if (imageSignature) {
        knownSignatures.add(imageSignature);
        seenImageSignatureByFamily.set(baseFamily, knownSignatures);
      }
      cards.push({
        ...item,
        family: entry.sku,
        _baseFamily: baseFamily,
        _preferredSku: entry.sku,
        _cardImage: cardImage,
        _preferredImages: [...images],
        _stockTotal: total,
        isSoldOut: agotado,
      });
    });
  });

  cards.sort((a, b) => {
    const stockDiff = (Number(b?._stockTotal) || 0) - (Number(a?._stockTotal) || 0);
    if (stockDiff !== 0) return stockDiff;
    const aKey = normalizarSkuCatalogo(a?.family);
    const bKey = normalizarSkuCatalogo(b?.family);
    return aKey.localeCompare(bKey, undefined, { numeric: true });
  });

  return cards;
}

function construirProductosGridFallback(items = [], stockItems = {}) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const family = normalizarSkuCatalogo(item?.family);
      const stock = obtenerStockParaSkuDesdeItems(family, stockItems);
      const total = Math.max(0, Number(stock?.total) || 0);
      const images = obtenerImagenesReales(item);
      const cardImage = images[0] || "";
      if (!family || total <= 0 || !cardImage) return null;
      return {
        ...item,
        family,
        _baseFamily: obtenerBaseFamilia(family) ? `${obtenerBaseFamilia(family)}-00` : family,
        _preferredSku: family,
        _cardImage: cardImage,
        _preferredImages: [...images],
        _stockTotal: total,
        isSoldOut: false,
      };
    })
    .filter(Boolean)
    .sort((a, b) => compararProductosPorStockDesc(a, b, stockItems));
}

function obtenerTotalFallbackCatalogo43(item) {
  const characteristics = Array.isArray(item?.characteristics) ? item.characteristics : [];
  for (const value of characteristics) {
    const text = String(value || "");
    const match = text.match(/disponible:\s*(\d+)\s*unidades/i);
    if (match) return Math.max(0, Number(match[1]) || 0);
  }
  return 0;
}

function priorizarImagenesEditarCole43(images = []) {
  const unique = deduplicarImagenesParaVisor(images);
  const edited = unique.filter((img) => /\/editar\//i.test(normalizarRutaAsset(img)));
  if (!edited.length) return unique;
  const rest = unique.filter((img) => !/\/editar\//i.test(normalizarRutaAsset(img)));
  return [...edited, ...rest];
}

function priorizarPortadaConPersonaCole43(images = []) {
  const ordered = priorizarImagenesEditarCole43(images);
  const heroImage = ordered.find((img) => !/\/editar\//i.test(normalizarRutaAsset(img))) || ordered[0] || "";
  if (!heroImage) return ordered;
  return [heroImage, ...ordered.filter((img) => normalizarRutaAsset(img) !== normalizarRutaAsset(heroImage))];
}

function prepararCatalogo43Directo(items = [], stockItems = {}) {
  const directItems = (Array.isArray(items) ? items : [])
    .map((item) => {
      const family = normalizarSkuCatalogo(item?.family);
      const stock = obtenerStockParaSkuDesdeItems(family, stockItems);
      const fallbackTotal = obtenerTotalFallbackCatalogo43(item);
      const total = Math.max(0, Number(stock?.total) || 0, fallbackTotal);
      const images = priorizarPortadaConPersonaCole43(obtenerImagenesReales(item));
      const mainImage = images[0] || "";
      if (!family || !mainImage) return null;
      return {
        ...item,
        family,
        main_image: mainImage,
        gallery: images.length ? images : (Array.isArray(item?.gallery) ? item.gallery : []),
        variants: [],
        _baseFamily: obtenerBaseFamilia(family) ? `${obtenerBaseFamilia(family)}-00` : family,
        _preferredSku: family,
        _cardImage: mainImage,
        _preferredImages: [...images],
        _stockTotal: total,
        isSoldOut: false,
      };
    })
    .filter(Boolean)
    .sort((a, b) => compararProductosPorStockDesc(a, b, stockItems));

  return {
    productos: directItems,
    productosGrid: directItems.map((item) => ({
      ...item,
      _cardImage: item._cardImage || item.main_image,
    })),
  };
}

function prepararCatalogo44Directo(items = []) {
  const directItems = (Array.isArray(items) ? items : [])
    .map((item) => {
      const family = normalizarSkuCatalogo(item?.family);
      const images = obtenerImagenesReales(item);
      const mainImage = images[0] || "";
      if (!family || !mainImage) return null;
      return {
        ...item,
        family,
        main_image: mainImage,
        gallery: images.length ? images : (Array.isArray(item?.gallery) ? item.gallery : []),
        variants: [],
        _baseFamily: obtenerBaseFamilia(family) ? `${obtenerBaseFamilia(family)}-00` : family,
        _preferredSku: family,
        _cardImage: mainImage,
        _preferredImages: [...images],
        _stockTotal: 0,
        isSoldOut: false,
      };
    })
    .filter(Boolean);

  return {
    productos: directItems,
    productosGrid: directItems.map((item) => ({
      ...item,
      _cardImage: item._cardImage || item.main_image,
    })),
  };
}

function marcarProductoAgotado(item) {
  const characteristics = Array.isArray(item?.characteristics) ? [...item.characteristics] : [];
  if (!characteristics.some((value) => String(value || "").toLowerCase().includes("agotado"))) {
    characteristics.push("Estado: Agotado");
  }
  return {
    ...item,
    isSoldOut: true,
    characteristics,
  };
}

function construirProductosAgotadosSegunStock(items = [], stockItems = {}) {
  if (!Object.keys(stockItems || {}).length) return [];
  return items
    .filter((item) => !itemTieneStockDisponible(item, stockItems))
    .map((item) => marcarProductoAgotado(item));
}

function stockTieneModelosCatalogo(stockItems = {}) {
  const pattern = CATALOG_SOURCE === "catalogo-2"
    ? /^(40|41)\d{2}(-\d{2})?$/i
    : (CATALOG_SOURCE === "catalogo-43" ? /^43\d{2}(-\d{2})?$/i : /^42\d{2}(-\d{2})?$/i);
  return Object.entries(stockItems || {}).some(([sku, payload]) => {
    const total = Number(payload?.total) || 0;
    return total > 0 && pattern.test(normalizarSkuCatalogo(sku));
  });
}

function rescatarProductosConStockFaltantes(itemsBase = [], itemsActuales = [], stockItems = {}) {
  if (!Array.isArray(itemsBase) || !itemsBase.length) return itemsActuales;
  if (!Object.keys(stockItems || {}).length) return itemsActuales;

  const mostrados = new Set(
    (itemsActuales || [])
      .map((item) => formatearModeloTarjeta(item?.family))
      .filter(Boolean)
  );

  const modeloConStock = new Set();
  Object.entries(stockItems || {}).forEach(([sku, payload]) => {
    const total = Number(payload?.total) || 0;
    if (total <= 0) return;
    const model = obtenerBaseFamilia(sku);
    if (!/^42\d{2}$/i.test(model)) return;
    modeloConStock.add(model);
  });

  const rescates = [];
  modeloConStock.forEach((model) => {
    if (mostrados.has(model)) return;
    const candidates = (itemsBase || []).filter((item) => {
      if (obtenerBaseFamilia(item?.family) !== model) return false;
      if (obtenerImagenesReales(item).length) return true;
      return (item?.variants || []).some((variant) => obtenerImagenesReales(variant).length);
    });
    if (!candidates.length) return;
    const best =
      candidates.find((item) => itemTieneStockDisponible(item, stockItems)) ||
      candidates.find((item) => !esProductoAgotado(item)) ||
      candidates[0];
    if (best) rescates.push(best);
  });

  return rescates.length ? [...itemsActuales, ...rescates] : itemsActuales;
}

function filtrarProductosDisponiblesCole42(items = [], trazabilidadData = null) {
  if (CATALOG_SOURCE !== "catalogo-1") return items;

  const disponibles = Array.isArray(trazabilidadData?.items) ? trazabilidadData.items : [];
  const availableKeys = new Set();

  disponibles.forEach((it) => {
    const available = Number(it?.available_units ?? it?.available_total ?? it?.bodega_total) || 0;
    if (available <= 0) return;

    [
      it?.article,
      it?.sku_new,
      it?.sku_new_00,
      it?.sku,
    ].forEach((value) => {
      const key = normalizarSkuCatalogo(value);
      if (key) availableKeys.add(key);
    });
  });

  return items.filter((item) => {
    const family = normalizarSkuCatalogo(item?.family);
    if (!family) return false;

    const candidates = new Set([family]);
    const familyMatch = family.match(/^(\d{4})$/);
    if (familyMatch) candidates.add(`${familyMatch[1]}-00`);
    const articleMatch = family.match(/^(\d{4})-(\d{2})$/);
    if (articleMatch) candidates.add(articleMatch[1]);

    for (const key of candidates) {
      if (availableKeys.has(key)) return true;
    }
    return false;
  });
}

async function cargarProductosCatalogo() {
  try {
    const embeddedCatalog = obtenerCatalogoEmbebidoLocal();
    const catalogPromise = embeddedCatalog
      ? Promise.resolve(embeddedCatalog)
      : fetch(withCacheBust(CATALOG_DATA_FILE)).then((res) => res.json());
    const priceDataPromise = cargarTodosLosMapasPreciosCatalogo();
    const stockPromise = INVENTORY_ENABLED && CATALOG_SOURCE !== "catalogo-43" && CATALOG_SOURCE !== "catalogo-44"
      ? cargarStockDatasetPreferido().catch((err) => {
        if (CATALOG_SOURCE === "catalogo-43") {
          console.warn(`No se pudo cargar ${STOCK_DATA_FILE}, se usa fallback de catálogo 43:`, err);
          return null;
        }
        throw err;
      })
      : Promise.resolve(null);
    const extraCatalogPromise = CATALOG_SOURCE === "catalogo-1"
      ? fetch(withCacheBust("data-catalogo-3.json")).then((res) => res.json())
      : Promise.resolve([]);
    const catalog42Promise = CATALOG_SOURCE === "catalogo-1"
      ? fetch(withCacheBust("data-catalogo-42.json")).then((res) => res.json())
      : Promise.resolve([]);
    const catalog42PresencePromise = CATALOG_SOURCE === "catalogo-1"
      ? fetch(withCacheBust("data-catalogo-42-presence.json")).then((res) => res.json())
      : Promise.resolve([]);
    const catalog43ThumbnailPromise = CATALOG_SOURCE === "catalogo-1"
      ? fetch(withCacheBust("data-catalogo-43.json")).then((res) => res.json()).catch(() => [])
      : CATALOG_SOURCE === "catalogo-43"
        ? fetch(withCacheBust("data-catalogo-42.json")).then((res) => res.json()).catch(() => [])
        : Promise.resolve([]);
    const catalogCoverMapPromise = fetch(withCacheBust("catalog-cover-map.json")).then((res) => {
      if (!res.ok) throw new Error(`status ${res.status}`);
      return res.json();
    }).catch(() => ({}));
    const stockOverridesPromise = CATALOG_SOURCE === "catalogo-1"
      ? fetch(withCacheBust("data-stock-overrides.json")).then((res) => res.json())
      : Promise.resolve([]);
    const trazabilidadPromise = CATALOG_SOURCE === "catalogo-1"
      ? fetch(withCacheBust("trazabilidad-data.json"), { cache: "no-store" }).then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.json();
      })
      : Promise.resolve(null);

    const [data, priceData, stockData, extraCatalogData, catalog42Data, catalog42PresenceData, catalogCoverMapData, stockOverridesData, trazabilidadData, catalog43ThumbnailData] = await Promise.all([
      catalogPromise,
      priceDataPromise,
      stockPromise,
      extraCatalogPromise,
      catalog42Promise,
      catalog42PresencePromise,
      catalogCoverMapPromise,
      stockOverridesPromise,
      trazabilidadPromise,
      catalog43ThumbnailPromise,
    ]);

    catalogPriceBySource = {
      ...catalogPriceBySource,
      ...(priceData || {}),
    };

    if (Array.isArray(catalog43ThumbnailData)) {
      catalog43ThumbnailData.forEach((item) => {
        const sku = normalizarSkuCatalogo(item?.family);
        if (!sku) return;
        const img = item?.main_image || (Array.isArray(item?.gallery) ? item.gallery[0] : "") || "";
        if (img) thumbnailBySku[sku] = normalizarRutaAsset(img);
      });
    }

    actualizarCarrito();

    if (INVENTORY_ENABLED && CATALOG_SOURCE !== "catalogo-43" && CATALOG_SOURCE !== "catalogo-44") {
      stockBySku = {
        ...crearStockSinteticoAgotados(),
        ...normalizarMapaStockPorSku(stockData?.items || {}),
      };
      lastRenderedStockSignature = crearFirmaStock(stockBySku);
    } else if (CATALOG_SOURCE === "catalogo-43" || CATALOG_SOURCE === "catalogo-44") {
      stockBySku = {};
      lastRenderedStockSignature = "";
    }
    catalogCoverBySku = normalizarMapaAssetsPorSku(catalogCoverMapData || {});

    let items = Array.isArray(data) ? data : [];
    if (CATALOG_SOURCE === "catalogo-43") {
      productosCatalogoBase = Array.isArray(items) ? [...items] : [];
    }
    if (CATALOG_SOURCE === "catalogo-43") {
      const directCatalog43 = prepararCatalogo43Directo(items, stockBySku);
      productos = directCatalog43.productos;
      productosGrid = directCatalog43.productosGrid;
      renderGrid(productosGrid);
      actualizarCarrito();
      inicializarBuscadorModelos();
      inyectarSubtituloHeroCatalogo43();
      inyectarEstilosPromoBannerMobile();
      return;
    }
    if (CATALOG_SOURCE === "catalogo-44") {
      productosCatalogoBase = Array.isArray(items) ? [...items] : [];
      const directCatalog44 = prepararCatalogo44Directo(items);
      productos = directCatalog44.productos;
      productosGrid = directCatalog44.productosGrid;
      renderGrid(productosGrid);
      actualizarCarrito();
      inicializarBuscadorModelos();
      return;
    }
    if (CATALOG_SOURCE === "catalogo-1") {
      items = mergeCatalogItems(
        items,
        Array.isArray(extraCatalogData) ? extraCatalogData : [],
        Array.isArray(catalog42Data) ? catalog42Data : [],
        Array.isArray(stockOverridesData) ? stockOverridesData : []
      );
      items = consolidarFamiliasDuplicadas(items);
      items = agruparVariantesPorFamilia(items);
      items = priorizarImagenesNuevas(items);
      items = filtrarFamiliasConDatosNuevos(items, Array.isArray(catalog42PresenceData) ? catalog42PresenceData : []);
    }
    const itemsCatalogoBase = filtrarProductosConImagenes(items);
    const stockCatalogoValido = stockTieneModelosCatalogo(stockBySku);
    items = (INVENTORY_ENABLED && stockCatalogoValido)
      ? filtrarProductosPorStock(itemsCatalogoBase, stockBySku)
      : filtrarProductosDisponiblesCole42(itemsCatalogoBase, trazabilidadData);
    if (INVENTORY_ENABLED && stockCatalogoValido) {
      items = filtrarVariantesPorStock(items, stockBySku);
    }
    if (CATALOG_SOURCE === "catalogo-1") {
      items = rescatarProductosConStockFaltantes(itemsCatalogoBase, items, stockBySku);
    }
    items = deduplicarTarjetasPorModelo(items);

    if (CATALOG_SOURCE === "catalogo-1") {
      items = deduplicarTarjetasPorModelo(items);
    }

    productos = [...items].sort((a, b) => compararProductosPorStockDesc(a, b, stockBySku));
    const tarjetasConStock = construirProductosGridPorSku(productos, stockBySku);
    const tarjetasAgotadas = CATALOG_SOURCE === "catalogo-1"
      ? construirProductosGridAgotadosPorSku(itemsCatalogoBase, stockBySku)
      : [];
    productosGrid = [...tarjetasConStock, ...tarjetasAgotadas];
    if (CATALOG_SOURCE === "catalogo-43" && !productosGrid.length) {
      productosGrid = construirProductosGridFallback(productos, stockBySku);
    }
    renderGrid(productosGrid);
    actualizarCarrito();
    inicializarBuscadorModelos();
  } catch (err) {
    console.error(`Error cargando ${CATALOG_DATA_FILE}:`, err);
  }
}

cargarProductosCatalogo();

if (INVENTORY_ENABLED && CATALOG_SOURCE !== "catalogo-43" && CATALOG_SOURCE !== "catalogo-44") {
  configurarRealtimeStock();
  cargarStockData();
  window.setInterval(cargarStockData, STOCK_REFRESH_INTERVAL_MS);
}

fetch(withCacheBust("video-data.json"))
  .then((res) => {
    if (!res.ok) throw new Error(`status ${res.status}`);
    return res.json();
  })
  .then((data) => {
    videoBySku = normalizarMapaAssetsPorSku(data?.items || {});
    if (skuActivo) actualizarVideoModal(skuActivo);
  })
  .catch((err) => console.warn("No se pudo cargar video-data.json:", err));

/***********************
 * UTILIDADES IMÁGENES
 ***********************/
function buildImageList(obj) {
  const ownNonCatalog = deduplicarImagenesParaVisor(obtenerImagenesVisibles(obj));
  if (ownNonCatalog.length) return ownNonCatalog;

  const ownAll = deduplicarImagenesParaVisor(obtenerImagenesVisibles(obj, { includeCatalog: true }));
  if (ownAll.length) return ownAll;

  if (obj && Array.isArray(obj.variants) && obj.variants.length) {
    const variantWithStock = obj.variants.find((variant) => skuTieneStockDisponible(variant?.sku, stockBySku)) || null;
    if (variantWithStock) {
      const variantNonCatalog = deduplicarImagenesParaVisor(obtenerImagenesVisibles(variantWithStock));
      if (variantNonCatalog.length) return variantNonCatalog;
      const variantAll = deduplicarImagenesParaVisor(obtenerImagenesVisibles(variantWithStock, { includeCatalog: true }));
      if (variantAll.length) return variantAll;
    }
  }

  return [];
}

function renderImages(imageList, sku = "") {
  const viewer = document.getElementById("viewerImg");
  const thumbContainer = document.getElementById("thumbContainer");
  const galleryBtn = document.getElementById("openImageGalleryBtn");

  const uniqueImages = obtenerImagenesCuradasParaVisor(sku, imageList, 4);
  thumbContainer.innerHTML = "";
  viewer.removeAttribute("src");
  imagenesModalActual = Array.isArray(uniqueImages) ? [...uniqueImages] : [];
  imagenModalIndex = 0;
  if (galleryBtn) galleryBtn.hidden = !imagenesModalActual.length;

  if (!uniqueImages.length) {
    return;
  }

  asignarImagenCatalogo(viewer, uniqueImages[0], {
    eager: true,
    fetchPriority: "high",
    preferOriginal: false,
  });

  uniqueImages.forEach((imgSrc, index) => {
    const thumb = document.createElement("img");
    asignarImagenCatalogo(thumb, imgSrc, {
      eager: index === 0,
      fetchPriority: "low",
      preferOriginal: false,
    });
    thumb.alt = "";
    thumb.setAttribute("aria-hidden", "true");
    if (index === 0) thumb.classList.add("active-thumb");

    thumb.onclick = () => {
      asignarImagenCatalogo(viewer, imgSrc, {
        eager: true,
        fetchPriority: "high",
        preferOriginal: false,
      });
      imagenModalIndex = index;
      // limpia active
      thumbContainer.querySelectorAll("img").forEach((t) => t.classList.remove("active-thumb"));
      thumb.classList.add("active-thumb");
    };

    thumbContainer.appendChild(thumb);
  });
}

function normalizarSkuVideo(sku) {
  return normalizarSkuCatalogo(sku);
}

function obtenerVideoProducto(sku) {
  const raw = normalizarSkuVideo(sku);
  if (!raw) return "";

  const candidates = new Set([raw]);
  let familyBase = "";

  if (/^\d{4}$/.test(raw)) {
    candidates.add(`${raw}-00`);
    familyBase = raw;
  }

  if (/^\d{4}-00$/.test(raw)) {
    familyBase = raw.slice(0, 4);
    candidates.add(familyBase);
  }

  const familyMatch = raw.match(/^(\d{4})-(\d{2})$/);
  if (familyMatch) {
    familyBase = familyMatch[1];
    candidates.add(familyBase);
    candidates.add(`${familyBase}-00`);
  }

  for (const key of candidates) {
    const videoPath = videoBySku?.[key];
    if (typeof videoPath === "string" && videoPath.trim()) return videoPath;
  }

  if (familyBase) {
    const familyVariantKey = Object.keys(videoBySku || {})
      .filter((key) => key.startsWith(`${familyBase}-`) && typeof videoBySku?.[key] === "string")
      .sort()[0];
    if (familyVariantKey) return videoBySku[familyVariantKey];
  }

  // Fallback defensivo: buscar por nombre de archivo cuando la key del mapa no coincide con el SKU.
  const escapedFamily = familyBase ? familyBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
  if (escapedFamily) {
    const byFilename = Object.values(videoBySku || {})
      .find((value) => typeof value === "string" && new RegExp(`(?:^|/)${escapedFamily}(?:-|\\b)`, "i").test(value));
    if (typeof byFilename === "string" && byFilename.trim()) return byFilename;
  }

  return "";
}

function pausarVideoModal() {
  const videoEl = document.getElementById("videoZoomPlayer");
  if (!videoEl) return;
  videoEl.pause();
}

function pausarVideoPreviewInline() {
  const videoEl = document.getElementById("inlineVideoPreview");
  if (!videoEl) return;
  videoEl.pause();
}

function actualizarVideoPreviewInline(videoSrc = "") {
  const previewWrap = document.getElementById("inlineVideoPreviewWrap");
  const previewEl = document.getElementById("inlineVideoPreview");
  if (!previewWrap || !previewEl) return;

  if (!videoSrc) {
    previewWrap.hidden = true;
    previewEl.pause();
    previewEl.removeAttribute("src");
    previewEl.dataset.src = "";
    previewEl.load();
    return;
  }

  previewWrap.hidden = false;
  if (previewEl.dataset.src !== videoSrc) {
    previewEl.pause();
    previewEl.src = videoSrc;
    previewEl.dataset.src = videoSrc;
    previewEl.load();
  }

  previewEl.muted = true;
  const playPromise = previewEl.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }

  previewWrap.onclick = () => abrirVisorVideo();
}

function actualizarVideoModal(sku) {
  const videoEl = document.getElementById("videoZoomPlayer");
  const videoPath = obtenerVideoProducto(sku);
  if (!videoPath) {
    cerrarVisorVideo();
    videoActivoSrc = "";
    if (videoEl) {
      videoEl.removeAttribute("src");
      videoEl.dataset.src = "";
      videoEl.load();
    }
    actualizarVideoPreviewInline("");
    return;
  }

  videoActivoSrc = withCacheBust(videoPath);
  if (videoEl && videoEl.dataset.src && videoEl.dataset.src !== videoActivoSrc) {
    videoEl.pause();
    videoEl.removeAttribute("src");
    videoEl.dataset.src = "";
    videoEl.load();
  }
  actualizarVideoPreviewInline(videoActivoSrc);
}

function abrirVisorVideo() {
  const zoomModal = document.getElementById("videoZoomModal");
  const videoEl = document.getElementById("videoZoomPlayer");
  if (!zoomModal || !videoEl || !videoActivoSrc) return;
  cerrarVisorImagenes();
  if (videoEl.dataset.src !== videoActivoSrc) {
    videoEl.src = videoActivoSrc;
    videoEl.dataset.src = videoActivoSrc;
    videoEl.load();
  }
  pausarVideoPreviewInline();
  zoomModal.hidden = false;
  document.body.classList.add("image-zoom-open");
  const playPromise = videoEl.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
}

function cerrarVisorVideo() {
  const zoomModal = document.getElementById("videoZoomModal");
  const videoEl = document.getElementById("videoZoomPlayer");
  if (!zoomModal) return;
  if (videoEl) {
    videoEl.pause();
  }
  zoomModal.hidden = true;
  document.body.classList.remove("image-zoom-open");
  if (videoActivoSrc) actualizarVideoPreviewInline(videoActivoSrc);
}

/***********************
 * TALLAS: LEER/ESCRIBIR + DRAFT POR SKU
 ***********************/
function leerTallasUI() {
  const tallas = {};
  TALLAS_DISPONIBLES.forEach((t) => {
    const el = document.getElementById("t" + t);
    const v = parseInt(el?.value || "0", 10);
    if (!el) return;
    if (isNaN(v) || v <= 0) {
      if (String(el.value).trim() !== "" && Number(el.value) < 0) el.value = "0";
      return;
    }
    tallas[t] = v;
  });
  return tallas;
}

function escribirTallasUI(tallas = {}) {
  TALLAS_DISPONIBLES.forEach((t) => {
    const el = document.getElementById("t" + t);
    if (!el) return;
    el.value = tallas[t] ? String(tallas[t]) : "";
  });
}

function obtenerStockParaSku(sku) {
  if (!INVENTORY_ENABLED) return null;
  return obtenerStockParaSkuDesdeItems(sku, stockBySku);
}

function skuEstaAgotado(sku) {
  if (CATALOG_SOURCE === "catalogo-43") return false;
  if (CATALOG_SOURCE === "catalogo-44") return false;
  if (!INVENTORY_ENABLED) return false;
  const stock = obtenerStockParaSku(sku);
  if (!stock || !stock.sizes || typeof stock.sizes !== "object") return true;
  return TALLAS_DISPONIBLES.every((talla) => Math.max(0, Number(stock.sizes?.[talla]) || 0) <= 0);
}

function obtenerMiniaturaCarritoPorSku(sku) {
  const normalized = normalizarSkuCatalogo(sku);
  if (!normalized) return "";
  const base = obtenerBaseFamilia(normalized);
  let producto = (Array.isArray(productos) ? productos : []).find((item) => normalizarSkuCatalogo(item?.family) === normalized);
  if (!producto) {
    producto = (Array.isArray(productos) ? productos : []).find((item) => obtenerBaseFamilia(item?.family) === base);
  }
  if (!producto) {
    return thumbnailBySku[normalized] || thumbnailBySku[`${base}-00`] || "";
  }

  const preferredVariant = Array.isArray(producto?.variants)
    ? producto.variants.find((variant) => normalizarSkuCatalogo(variant?.sku) === normalized)
    : null;

  const imageSource = preferredVariant ? { ...producto, variants: [preferredVariant] } : producto;

  const imageList = buildImageList(imageSource);
  const uniqueImages = obtenerImagenesCuradasParaVisor(normalized, imageList, 4);
  const firstImage = Array.isArray(uniqueImages) ? uniqueImages[0] : "";
  if (firstImage) return normalizarRutaImagenCatalogo(firstImage);

  const fallbackImage = obtenerImagenPortadaProducto(imageSource);
  if (fallbackImage) return normalizarRutaImagenCatalogo(fallbackImage);
  return "";
}

function configurarRealtimeStock() {
  if (!stockSupabaseHabilitado() || stockRealtimeChannel) return;
  const client = obtenerClienteSupabase();
  if (!client) return;

  stockRealtimeChannel = client
    .channel("public-stock-catalog")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "stock_items",
      },
      () => {
        cargarStockData();
        if (quotesAccessToken && adminActiveTab === "stock") {
          cargarStockCatalogAdmin().catch((err) => console.warn("No se pudo refrescar Stock:", err));
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "stock_item_sizes",
      },
      () => {
        cargarStockData();
        if (quotesAccessToken && adminActiveTab === "stock") {
          cargarStockCatalogAdmin().catch((err) => console.warn("No se pudo refrescar Stock:", err));
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "stock_item_reserve_sizes",
      },
      () => {
        cargarStockData();
        if (quotesAccessToken && adminActiveTab === "stock") {
          cargarStockCatalogAdmin().catch((err) => console.warn("No se pudo refrescar Stock:", err));
        }
      }
    )
    .subscribe();
}

function cargarStockData() {
  if (CATALOG_SOURCE === "catalogo-43") {
    stockBySku = {};
    if (skuActivo) aplicarStockATallas(skuActivo);
    const baseItems43 = Array.isArray(productosCatalogoBase) && productosCatalogoBase.length
      ? productosCatalogoBase
      : productos;
    const directCatalog43 = prepararCatalogo43Directo(baseItems43, {});
    productos = directCatalog43.productos;
    productosGrid = directCatalog43.productosGrid;
    renderGrid(productosGrid);
    actualizarCarrito();
    return Promise.resolve();
  }
  if (CATALOG_SOURCE === "catalogo-44") {
    stockBySku = {};
    if (skuActivo) aplicarStockATallas(skuActivo);
    const baseItems44 = Array.isArray(productosCatalogoBase) && productosCatalogoBase.length
      ? productosCatalogoBase
      : productos;
    const directCatalog44 = prepararCatalogo44Directo(baseItems44);
    productos = directCatalog44.productos;
    productosGrid = directCatalog44.productosGrid;
    renderGrid(productosGrid);
    actualizarCarrito();
    return Promise.resolve();
  }
  return cargarStockDatasetPreferido()
    .then((data) => {
      const nextStock = normalizarMapaStockPorSku(data?.items || {});
      const nextSignature = crearFirmaStock(nextStock);
      const stockChanged = nextSignature !== lastRenderedStockSignature;
      stockBySku = nextStock;
      if (skuActivo) aplicarStockATallas(skuActivo);
      if (stockChanged && Array.isArray(productos) && productos.length) {
        const tarjetasConStock = construirProductosGridPorSku(productos, stockBySku);
        const tarjetasAgotadas = CATALOG_SOURCE === "catalogo-1"
          ? construirProductosGridAgotadosPorSku(productosCatalogoBase, stockBySku)
          : [];
        productosGrid = [...tarjetasConStock, ...tarjetasAgotadas];
        renderGrid(productosGrid);
        actualizarCarrito();
        lastRenderedStockSignature = nextSignature;
      }
    })
    .catch((err) => console.warn(`No se pudo cargar ${STOCK_DATA_FILE}:`, err));
}

function asegurarTextoTalla(label, talla) {
  let textEl = label.querySelector(".size-label-text");
  if (!textEl) {
    Array.from(label.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const trimmed = (node.textContent || "").trim();
        if (!trimmed || trimmed === talla) {
          label.removeChild(node);
        }
      }
    });
    textEl = document.createElement("span");
    textEl.className = "size-label-text";
    label.insertBefore(textEl, label.querySelector("input"));
  }
  textEl.innerText = talla;
  return textEl;
}

function asegurarBadgeStock(label) {
  let badgeEl = label.querySelector(".size-stock-badge");
  if (!badgeEl) {
    badgeEl = document.createElement("span");
    badgeEl.className = "size-stock-badge";
    label.appendChild(badgeEl);
  }
  return badgeEl;
}

function aplicarStockATallas(sku) {
  if (CATALOG_SOURCE === "catalogo-43" || CATALOG_SOURCE === "catalogo-44") {
    TALLAS_DISPONIBLES.forEach((talla) => {
      const input = document.getElementById("t" + talla);
      const label = input?.closest("label");
      if (!input || !label) return;
      const textEl = asegurarTextoTalla(label, talla);
      const badgeEl = asegurarBadgeStock(label);
      textEl.innerText = talla;
      label.classList.remove("size-out-of-stock", "size-low-stock", "size-in-stock");
      label.removeAttribute("aria-disabled");
      input.disabled = false;
      input.removeAttribute("max");
      input.removeAttribute("aria-disabled");
      badgeEl.hidden = true;
      badgeEl.innerText = "";
    });
    return;
  }
  if (!INVENTORY_ENABLED) {
    TALLAS_DISPONIBLES.forEach((talla) => {
      const input = document.getElementById("t" + talla);
      const label = input?.closest("label");
      if (!input || !label) return;
      const textEl = asegurarTextoTalla(label, talla);
      const badgeEl = asegurarBadgeStock(label);
      textEl.innerText = talla;
      label.classList.remove("size-out-of-stock", "size-low-stock", "size-in-stock");
      label.removeAttribute("aria-disabled");
      input.disabled = false;
      input.removeAttribute("max");
      input.removeAttribute("aria-disabled");
      badgeEl.hidden = true;
      badgeEl.innerText = "";
    });
    return;
  }

  const stock = obtenerStockExactoParaSkuDesdeItems(sku, stockBySku);
  TALLAS_DISPONIBLES.forEach((talla) => {
    const input = document.getElementById("t" + talla);
    const label = input?.closest("label");
    if (!input || !label) return;

    const textEl = asegurarTextoTalla(label, talla);
    const badgeEl = asegurarBadgeStock(label);
    const qty = stock ? Math.max(0, Number(stock?.sizes?.[talla]) || 0) : null;

    if (CATALOG_SOURCE === "catalogo-43" && (Number(stock?.total) || 0) > 0) {
      label.classList.remove("size-out-of-stock");
      label.classList.add("size-in-stock");
      label.classList.remove("size-low-stock");
      label.removeAttribute("aria-disabled");
      input.disabled = false;
      input.removeAttribute("max");
      input.removeAttribute("aria-disabled");
      textEl.innerText = talla;
      badgeEl.hidden = false;
      badgeEl.innerText = "Consultar";
      return;
    }

    if (qty === null) {
      label.classList.remove("size-out-of-stock");
      label.classList.remove("size-low-stock");
      label.classList.remove("size-in-stock");
      label.removeAttribute("aria-disabled");
      input.disabled = false;
      input.removeAttribute("max");
      input.removeAttribute("aria-disabled");
      textEl.innerText = talla;
      badgeEl.hidden = true;
      badgeEl.innerText = "";
      return;
    }

    textEl.innerText = talla;
    label.classList.toggle("size-out-of-stock", qty <= 0);
    label.classList.toggle("size-low-stock", qty > 0 && qty <= 5);
    label.classList.toggle("size-in-stock", qty > 5);
    label.setAttribute("aria-disabled", qty <= 0 ? "true" : "false");
    input.disabled = qty <= 0;
    input.setAttribute("aria-disabled", qty <= 0 ? "true" : "false");
    input.max = String(qty);
    if (qty <= 0) input.value = "";

    if (qty <= 0) {
      badgeEl.hidden = false;
      badgeEl.innerText = "Sin stock";
    } else if (qty > 0 && qty <= 5) {
      badgeEl.hidden = false;
      badgeEl.innerText = qty === 1 ? "Ultima unidad" : `Ultimas ${qty} unidades`;
    } else {
      badgeEl.hidden = true;
      badgeEl.innerText = "";
    }
  });
}

function bloquearInputsCotizacion(bloqueado) {
  TALLAS_DISPONIBLES.forEach((talla) => {
    const input = document.getElementById("t" + talla);
    const label = input?.closest("label");
    if (!input || !label) return;

    if (bloqueado) {
      input.value = "";
      input.disabled = true;
      input.readOnly = true;
      input.setAttribute("aria-disabled", "true");
      input.setAttribute("tabindex", "-1");
      label.classList.add("size-out-of-stock");
      label.classList.remove("size-low-stock", "size-in-stock");
      label.setAttribute("aria-disabled", "true");
      const badgeEl = asegurarBadgeStock(label);
      badgeEl.hidden = false;
      badgeEl.innerText = "Sin stock";
      return;
    }

    input.readOnly = false;
    input.removeAttribute("tabindex");
  });
}

function actualizarEstadoCotizacionProducto(producto, sku) {
  const addBtn = document.getElementById("addBtn");
  const imageViewerEl = document.querySelector("#modal .image-viewer");
  const soldOutOverlayEl = document.getElementById("imageSoldOutOverlay");
  const agotado = esProductoAgotado(producto) || skuEstaAgotado(sku);
  const skuLabel = normalizarSkuCatalogo(sku || producto?.family);

  bloquearInputsCotizacion(agotado);

  if (addBtn) {
    addBtn.disabled = agotado;
    addBtn.innerText = agotado ? "Agotado" : "Agregar al pedido";
  }

  const titleEl = document.getElementById("modalTitle");
  const quotePanelModelTitle = document.getElementById("quotePanelModelTitle");
  const descriptionEl = document.getElementById("description");
  const detallePrecio = obtenerDetallePrecioCatalogo(sku || producto?.family);
  const tituloPrefix = (CATALOG_SOURCE === "catalogo-43" || CATALOG_SOURCE === "catalogo-44") && producto?.bota
    ? producto.bota.charAt(0).toUpperCase() + producto.bota.slice(1).toLowerCase()
    : "Modelo";
  if (titleEl) {
    titleEl.innerText = agotado ? `${tituloPrefix} ${skuLabel} - Agotado` : `${tituloPrefix} ${skuLabel}`;
  }
  if (quotePanelModelTitle) quotePanelModelTitle.innerText = `${tituloPrefix} ${skuLabel}`;
  if (descriptionEl && detallePrecio && CATALOG_SOURCE !== "catalogo-43") {
    const textoBase = normalizarTextoVisible(producto?.description || "");
    descriptionEl.innerText = `${textoBase}${textoBase ? " · " : ""}Precio mayor s/iva: ${formatearPrecioCLP(detallePrecio.final)}`;
  }
  if (imageViewerEl) {
    imageViewerEl.classList.toggle("is-sold-out", agotado);
  }
  if (soldOutOverlayEl) {
    soldOutOverlayEl.classList.toggle("is-visible", agotado);
    soldOutOverlayEl.hidden = !agotado;
  }

  return agotado;
}

function renderZoomGallery() {
  const zoomMain = document.getElementById("imageZoomMain");
  const zoomThumbs = document.getElementById("imageZoomThumbs");
  if (!zoomMain || !zoomThumbs) return;

  zoomThumbs.innerHTML = "";

  if (!imagenesModalActual.length) {
    zoomMain.removeAttribute("src");
    return;
  }

  if (imagenModalIndex < 0 || imagenModalIndex >= imagenesModalActual.length) {
    imagenModalIndex = 0;
  }

  asignarImagenCatalogo(zoomMain, imagenesModalActual[imagenModalIndex], {
    eager: true,
    fetchPriority: "high",
    preferOriginal: false,
  });

  imagenesModalActual.forEach((imgSrc, index) => {
    const thumb = document.createElement("img");
    asignarImagenCatalogo(thumb, imgSrc, {
      eager: index === imagenModalIndex,
      fetchPriority: "low",
      preferOriginal: false,
    });
    thumb.alt = "";
    thumb.setAttribute("aria-hidden", "true");
    if (index === imagenModalIndex) thumb.classList.add("active-thumb");
    thumb.onclick = () => {
      imagenModalIndex = index;
      asignarImagenCatalogo(zoomMain, imgSrc, {
        eager: true,
        fetchPriority: "high",
        preferOriginal: false,
      });
      zoomThumbs.querySelectorAll("img").forEach((t) => t.classList.remove("active-thumb"));
      thumb.classList.add("active-thumb");
    };
    zoomThumbs.appendChild(thumb);
  });
}

function abrirVisorImagenes() {
  const zoomModal = document.getElementById("imageZoomModal");
  if (!zoomModal || !imagenesModalActual.length) return;
  cerrarVisorVideo();
  renderZoomGallery();
  zoomModal.hidden = false;
  document.body.classList.add("image-zoom-open");
}

function cerrarVisorImagenes() {
  const zoomModal = document.getElementById("imageZoomModal");
  if (!zoomModal) return;
  zoomModal.hidden = true;
  document.body.classList.remove("image-zoom-open");
}

function inicializarPanelCotizacionModal() {
  if (quotePanelReady) return;
  const modalContent = document.querySelector("#modal .modal-content");
  const modalRight = document.querySelector("#modal .modal-right");
  const variantContainer = document.getElementById("variantContainer");
  const sizesPanel = document.querySelector("#modal .sizes-panel");
  const addBtn = document.getElementById("addBtn");
  if (!modalContent || !modalRight || !variantContainer || !sizesPanel || !addBtn) return;

  const trigger = document.createElement("button");
  trigger.id = "openQuotePanelBtn";
  trigger.className = "quote-panel-trigger";
  trigger.type = "button";
  trigger.innerText = "Pedir este modelo";

  const panel = document.createElement("div");
  panel.id = "quotePanel";
  panel.className = "quote-panel";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="quote-panel-backdrop" data-close-quote-panel></div>
    <div class="quote-panel-card">
      <div class="quote-panel-head">
        <div>
          <div class="quote-panel-kicker">Pedido</div>
          <div id="quotePanelModelTitle" class="quote-panel-title">Modelo</div>
        </div>
        <button id="closeQuotePanelBtn" type="button" class="quote-panel-close" aria-label="Cerrar panel de pedido">×</button>
      </div>
    </div>
  `;

  const panelCard = panel.querySelector(".quote-panel-card");
  if (!panelCard) return;
  panelCard.appendChild(sizesPanel);
  panelCard.appendChild(addBtn);

  trigger.addEventListener("click", abrirPanelCotizacionModal);
  panel.addEventListener("click", (e) => {
    if (e.target?.dataset?.closeQuotePanel !== undefined) cerrarPanelCotizacionModal();
  });
  panel.querySelector("#closeQuotePanelBtn")?.addEventListener("click", cerrarPanelCotizacionModal);

  modalRight.insertBefore(trigger, variantContainer.nextSibling);
  modalContent.appendChild(panel);
  quotePanelReady = true;
}

function abrirPanelCotizacionModal() {
  const panel = document.getElementById("quotePanel");
  if (!panel) return;
  panel.hidden = false;
  panel.classList.add("open");
}

function cerrarPanelCotizacionModal() {
  const panel = document.getElementById("quotePanel");
  if (!panel) return;
  panel.classList.remove("open");
  panel.hidden = true;
}

function guardarDraftDelSkuActual() {
  // Borradores desactivados: no persistir cantidades al cambiar de modelo/variante
  return;
}

function cargarDraftDelSku(sku) {
  // Siempre iniciar limpio para evitar autocompletar cantidades previas
  escribirTallasUI({});
}

function resetDraftsModal() {
  draftTallasPorSku = {};
  skuActivo = "";
  escribirTallasUI({});
}

function configurarInputsTallas() {
  TALLAS_DISPONIBLES.forEach((t) => {
    const el = document.getElementById("t" + t);
    if (!el) return;
    el.min = "0";
    el.step = "1";
    el.addEventListener("input", () => {
      if (el.value === "") return;
      let n = parseInt(el.value, 10);
      if (isNaN(n)) {
        el.value = "";
        return;
      }
      if (n < 0) n = 0;
      const max = INVENTORY_ENABLED ? parseInt(el.max || "", 10) : NaN;
      if (INVENTORY_ENABLED && !isNaN(max) && max >= 0 && n > max) {
        n = max;
        mostrarToastError("Stock insuficiente", `Solo quedan ${max} unidades disponibles en talla ${t}.`);
      }
      el.value = String(n);
    });
  });
}

function inicializarBuscadorModelos() {
  const input = document.getElementById("modelSearchInput");
  const panel = document.getElementById("modelSuggestionsPanel");
  const btnBuscar = document.getElementById("modelSearchBtn");
  const btnLimpiar = document.getElementById("modelSearchClear");
  if (!input || !panel || !btnBuscar || !btnLimpiar) return;

  const obtenerFuenteBusqueda = () => (
    filtrarProductosPorVisibilidad(Array.isArray(productosGrid) ? productosGrid : []).filter((p) => !tarjetaSinImagenCatalogo43(p))
  );
  let sugerenciasActuales = [];
  let activeIndex = -1;

  const normalizarBusquedaModelo = (value) => {
    const raw = String(value || "").trim().toUpperCase();
    const sku = normalizarSkuCatalogo(raw);
    const digits = raw.replace(/\D/g, "");
    const base = sku ? obtenerBaseFamilia(sku) : (digits.length >= 4 ? digits.slice(0, 4) : "");
    return { raw, sku, digits, base };
  };

  const esBusquedaSkuExacto = (value) => /^\d{4}-\d{2}$/i.test(normalizarBusquedaModelo(value).sku || "");
  const esBusquedaTipoSku = (value) => String(value || "").includes("-");

  const obtenerClavesBusquedaModelo = (producto = {}) => {
    const values = [
      producto?.family,
      producto?._preferredSku,
      producto?._baseFamily,
    ];
    const keys = new Set();
    values.forEach((value) => {
      const parsed = normalizarBusquedaModelo(value);
      if (parsed.raw) keys.add(parsed.raw);
      if (parsed.sku) keys.add(parsed.sku);
      if (parsed.digits) keys.add(parsed.digits);
      if (parsed.base) keys.add(parsed.base);
    });
    return [...keys].filter(Boolean);
  };

  const coincideBusquedaModelo = (modelValue, termValue) => {
    const model = normalizarBusquedaModelo(modelValue);
    const term = normalizarBusquedaModelo(termValue);
    if (!term.raw) return true;
    if (model.raw.includes(term.raw)) return true;
    if (term.sku && model.sku.includes(term.sku)) return true;
    if (term.digits && model.digits.includes(term.digits)) return true;
    if (esBusquedaTipoSku(termValue)) return false;
    if (term.base && model.base === term.base) return true;
    return false;
  };

  const productoCoincideBusqueda = (producto, termValue) => {
    const term = normalizarBusquedaModelo(termValue);
    if (!term.raw) return true;
    return obtenerClavesBusquedaModelo(producto).some((key) => coincideBusquedaModelo(key, termValue));
  };

  const productoCoincideExactoBusqueda = (producto, termValue) => {
    const term = normalizarBusquedaModelo(termValue);
    if (!term.raw) return false;
    return obtenerClavesBusquedaModelo(producto).some((key) => {
      const model = normalizarBusquedaModelo(key);
      if (esBusquedaTipoSku(termValue)) {
        return (
          model.raw === term.raw ||
          (term.sku && model.sku === term.sku) ||
          (term.digits && model.digits === term.digits)
        );
      }
      return (
        model.raw === term.raw ||
        (term.sku && model.sku === term.sku) ||
        (term.digits && model.digits === term.digits) ||
        (term.base && model.base === term.base)
      );
    });
  };

  const actualizarEstadoBusqueda = (_term, resultados) => {
    return resultados;
  };

  const hideSuggestions = () => {
    panel.hidden = true;
    panel.innerHTML = "";
    sugerenciasActuales = [];
    activeIndex = -1;
  };

  const showSuggestions = (term) => {
    const query = (term || "").trim();
    if (!query) {
      hideSuggestions();
      return;
    }

    const modelos = [...new Set(obtenerFuenteBusqueda().map((p) => String(p.family)).filter(Boolean))].sort();
    sugerenciasActuales = modelos.filter((m) => coincideBusquedaModelo(m, query)).slice(0, 8);
    activeIndex = -1;

    if (!sugerenciasActuales.length) {
      panel.innerHTML = `<div class="model-suggestion-empty">No hay coincidencias</div>`;
      panel.hidden = false;
      return;
    }

    panel.innerHTML = sugerenciasActuales
      .map((m, idx) => `<button type="button" class="model-suggestion-item" data-model="${m}" data-index="${idx}">Modelo ${m}</button>`)
      .join("");
    panel.hidden = false;
  };

  const paintActive = () => {
    panel.querySelectorAll(".model-suggestion-item").forEach((el, idx) => {
      el.classList.toggle("active", idx === activeIndex);
    });
  };

  const filtrarGrid = (term) => {
    if (!term) {
      const fuente = obtenerFuenteBusqueda();
      renderGrid(fuente);
      actualizarEstadoBusqueda("", fuente);
      return;
    }
    const filtrados = obtenerFuenteBusqueda().filter((p) => productoCoincideBusqueda(p, term));
    renderGrid(filtrados);
    actualizarEstadoBusqueda(term, filtrados);
  };

  const buscarModelo = () => {
    const term = input.value.trim();
    if (!term) {
      const fuente = obtenerFuenteBusqueda();
      renderGrid(fuente);
      actualizarEstadoBusqueda("", fuente);
      hideSuggestions();
      return;
    }

    const exacto = obtenerFuenteBusqueda().find((p) => productoCoincideExactoBusqueda(p, term));
    if (exacto) {
      const fuente = obtenerFuenteBusqueda();
      renderGrid(fuente);
      actualizarEstadoBusqueda(term, [exacto]);
      hideSuggestions();
      setTimeout(() => verProducto(exacto._baseFamily || exacto.family, exacto._preferredSku || exacto.family), 0);
      return;
    }

    if (esBusquedaTipoSku(term)) {
      renderGrid([]);
      actualizarEstadoBusqueda(term, []);
      hideSuggestions();
      return;
    }

    filtrarGrid(term);
    hideSuggestions();
  };

  input.addEventListener("input", () => {
    const term = input.value.trim();
    filtrarGrid(term);
    showSuggestions(term);
  });

  input.addEventListener("keydown", (e) => {
    if (!panel.hidden && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      if (!sugerenciasActuales.length) return;
      e.preventDefault();
      if (e.key === "ArrowDown") {
        activeIndex = (activeIndex + 1) % sugerenciasActuales.length;
      } else {
        activeIndex = activeIndex <= 0 ? sugerenciasActuales.length - 1 : activeIndex - 1;
      }
      paintActive();
      return;
    }

    if (e.key === "Enter" && !panel.hidden && activeIndex >= 0 && sugerenciasActuales[activeIndex]) {
      e.preventDefault();
      input.value = sugerenciasActuales[activeIndex];
      buscarModelo();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      buscarModelo();
    }

    if (e.key === "Escape") hideSuggestions();
  });

  btnBuscar.addEventListener("click", buscarModelo);
  btnLimpiar.addEventListener("click", () => {
    input.value = "";
    const fuente = obtenerFuenteBusqueda();
    renderGrid(fuente);
    actualizarEstadoBusqueda("", fuente);
    hideSuggestions();
    input.focus();
  });

  panel.addEventListener("click", (e) => {
    const btn = e.target.closest(".model-suggestion-item");
    if (!btn) return;
    input.value = btn.dataset.model || "";
    buscarModelo();
  });

  document.addEventListener("click", (e) => {
    const box = document.querySelector(".model-search-box");
    if (!box?.contains(e.target)) hideSuggestions();
  });

  actualizarEstadoBusqueda("", obtenerFuenteBusqueda());
}

/***********************
 * GRID
 ***********************/
function obtenerImagenSeguraTarjeta(producto) {
  const preferredImages = Array.isArray(producto?._preferredImages)
    ? producto._preferredImages.map((img) => normalizarRutaImagenCatalogo(img)).filter(Boolean)
    : [];
  const realImages = obtenerImagenesReales(producto).map((img) => normalizarRutaImagenCatalogo(img)).filter(Boolean);
  const candidate = preferredImages[0]
    || normalizarRutaImagenCatalogo(producto?._cardImage)
    || realImages[0]
    || "";
  const normalizedCandidate = normalizarRutaAsset(candidate);
  if (!normalizedCandidate || normalizedCandidate === "Imagenes/Logo/app-icon.png") return "";
  return candidate;
}

function tarjetaSinImagenCatalogo43(producto) {
  const imagePath = normalizarRutaAsset(producto?._safeCardImage || producto?._cardImage || producto?.main_image || "");
  return !imagePath || imagePath === "Imagenes/Logo/app-icon.png";
}

function obtenerMetaCatalogo43(producto = {}) {
  const fromCharacteristics = (prefix) => {
    const row = (Array.isArray(producto?.characteristics) ? producto.characteristics : [])
      .find((value) => String(value || "").toLowerCase().startsWith(`${prefix.toLowerCase()}:`));
    return row ? normalizarTextoVisible(String(row).split(":").slice(1).join(":").trim()) : "";
  };

  const tela = normalizarTextoVisible(producto?.fabric || fromCharacteristics("Tela"));
  const tipo = normalizarTextoVisible(producto?.tipo || producto?.type || fromCharacteristics("Tipo"));
  const fit = normalizarTextoVisible(producto?.fit || fromCharacteristics("Fit"));
  const tiro = normalizarTextoVisible(producto?.tiro || fromCharacteristics("Tiro"));
  const bota = normalizarTextoVisible(producto?.bota || fromCharacteristics("Bota"));

  if (!tela && !tipo && !tiro && !bota && !fit) return null;
  return { tela, tipo, fit, tiro, bota };
}

function crearItemInfoCatalogo43(label, value, className = "") {
  const normalized = normalizarTextoVisible(value || "");
  if (!normalized) return null;
  const li = document.createElement("li");
  if (className) li.className = className;
  li.innerHTML = `<span class="feature-label">${escapeHtmlExcel(label)}</span><strong>${escapeHtmlExcel(normalized)}</strong>`;
  return li;
}

function renderizarInfoProductoCatalogo43(charList, producto, detallePrecio) {
  const meta43 = obtenerMetaCatalogo43(producto);
  charList.innerHTML = "";
  charList.style.display = meta43 || detallePrecio ? "block" : "none";
  if (!meta43 && !detallePrecio) return;

  const ul = document.createElement("ul");
  [
    crearItemInfoCatalogo43("Tipo", meta43?.tipo),
    crearItemInfoCatalogo43("Tiro", meta43?.tiro),
  ].filter(Boolean).forEach((li) => ul.appendChild(li));

  if (detallePrecio) {
    const liPrecio = document.createElement("li");
    liPrecio.className = "feature-price";
    liPrecio.innerHTML = `<span class="feature-label">Precio web</span><strong>${escapeHtmlExcel(formatearPrecioCLP(detallePrecio.final))}</strong><em>Lista ${escapeHtmlExcel(formatearPrecioCLP(detallePrecio.lista))} · -${escapeHtmlExcel(detallePrecio.descuento)}% web</em>`;
    ul.appendChild(liPrecio);
  }

  charList.appendChild(ul);
}

const CATALOGO_43_MODELOS_DISPONIBLES = new Set([
  "4301", "4309", "4310", "4311", "4313", "4314", "4318", "4319",
  "4321", "4322", "4323", "4325", "4329", "4333", "4337", "4339", "4340", "4341",
  "4348", "4362", "4366", "4380",
]);

const CATALOGO_43_SKUS_AGOTADOS = new Set([
  "4322-01", "4322-02", "4322-60",
  "4348-00", "4348-60", "4348-61",
  "4362-08", "4362-16",
]);

function obtenerEstadoVisibilidadCatalogo43(producto = {}) {
  const family = normalizarSkuCatalogo(producto?._preferredSku || producto?.family || producto?._baseFamily || "");
  if (family && CATALOGO_43_SKUS_AGOTADOS.has(family)) return "soldout";
  const model = obtenerBaseFamilia(family);
  if (!model) return "soldout";
  return CATALOGO_43_MODELOS_DISPONIBLES.has(model) ? "available" : "soldout";
}

const CATALOGO_44_MODELOS_DISPONIBLES = new Set([
  "4448", "4453", "4455",
  "3802", "4321",
]);

const CATALOGO_44_SKUS_AGOTADOS = new Set([]);

function obtenerEstadoVisibilidadCatalogo44(producto = {}) {
  const family = normalizarSkuCatalogo(producto?._preferredSku || producto?.family || producto?._baseFamily || "");
  if (family && CATALOGO_44_SKUS_AGOTADOS.has(family)) return "soldout";
  const model = obtenerBaseFamilia(family);
  if (!model) return "soldout";
  return CATALOGO_44_MODELOS_DISPONIBLES.has(model) ? "available" : "soldout";
}

function filtrarProductosPorVisibilidad(lista = []) {
  return Array.isArray(lista) ? lista : [];
}

function renderCatalogCardHtml(p) {
  inyectarEstilosCardCta();
  const detallePrecio = obtenerDetallePrecioCatalogo(p);
  const hantanBadges = CATALOG_SOURCE !== "catalogo-44" ? obtenerHantanesModelo(p) : [];
  const estadoVisibilidad43 = CATALOG_SOURCE === "catalogo-43"
    ? obtenerEstadoVisibilidadCatalogo43(p)
    : CATALOG_SOURCE === "catalogo-44"
      ? obtenerEstadoVisibilidadCatalogo44(p)
      : "";
  return `
      <div class="card ${esProductoAgotado(p) ? "card-sold-out" : ""}" data-family="${p.family}" onclick="verProductoDesdeCard('${p._baseFamily || p.family}','${p._preferredSku || p.family}')">
        <div class="card-title-row">
          <div class="card-title-block">
            <div class="card-title">${(CATALOG_SOURCE === "catalogo-43" || CATALOG_SOURCE === "catalogo-44") && p.bota ? p.bota.charAt(0).toUpperCase() + p.bota.slice(1).toLowerCase() : "Modelo"} ${CATALOG_SOURCE === "catalogo-44" && /^EX-/i.test(String(p.family || "")) ? String(p.family).toUpperCase() : normalizarSkuCatalogo(p.family)}</div>
            ${
              detallePrecio
                ? `<div class="card-price">
                    <span class="card-price-original">${formatearPrecioCLP(detallePrecio.lista)}</span>
                    <span class="card-price-current">${formatearPrecioCLP(detallePrecio.final)}</span>
                    <span class="card-price-badge">-${detallePrecio.descuento}% web</span>
                  </div>`
                : ""
            }
          </div>
          ${esProductoAgotado(p) && CATALOG_SOURCE !== "catalogo-43" ? '<span class="card-stock-badge sold-out">Agotado</span>' : ""}
        </div>
        <div class="card-image-wrap">
          ${
            tarjetaSinImagenCatalogo43(p)
              ? `<div class="card-no-image">
                  <span class="card-no-image-badge">Sin imagen</span>
                  <strong>Modelo ${normalizarSkuCatalogo(p.family)}</strong>
                  <p>Este modelo aún no tiene fotos cargadas.</p>
                </div>`
              : `<img data-image-src="${p._safeCardImage}" alt="Modelo ${p.family}">`
          }
          ${
            (CATALOG_SOURCE === "catalogo-43" || CATALOG_SOURCE === "catalogo-44")
              ? (
                  estadoVisibilidad43 === "soldout"
                    ? ""
                    : `<span class="catalog-visibility-badge ${estadoVisibilidad43 === "available" ? "is-available" : "is-production"}">${estadoVisibilidad43 === "available" ? "Disponible" : "En producción"}</span>`
                )
              : ""
          }
          ${
            hantanBadges.length
              ? `<div class="card-hantan-stack" aria-label="Hantan del modelo">
                  ${hantanBadges
                    .map(
                      (badge) => `<img class="card-hantan-badge" src="${badge.src}" alt="${escapeHtmlExcel(badge.label)}" loading="lazy">`
                    )
                    .join("")}
                </div>`
              : ""
          }
          ${(CATALOG_SOURCE === "catalogo-43" || CATALOG_SOURCE === "catalogo-44") && !esProductoAgotado(p) ? '<span class="card-cta-hint">👆 Curva aquí</span>' : ""}
          ${esProductoAgotado(p) ? '<span class="sold-out-ribbon sold-out-ribbon-card">AGOTADO</span>' : ""}
        </div>
      </div>
    `;
}

function renderCatalog43Section(title, copy, items = [], extraClass = "") {
  if (!Array.isArray(items) || !items.length) return "";
  return `
    <section class="catalog-grid-section ${extraClass}">
      <div class="catalog-grid-section-head">
        <h3>${title}</h3>
        <p>${copy}</p>
      </div>
      <div class="catalog-grid-section-grid">
        ${items.map((p) => renderCatalogCardHtml(p)).join("")}
      </div>
    </section>
  `;
}

function renderGrid(lista) {
  const container = document.getElementById("grid");
  const listaConImagen = filtrarProductosPorVisibilidad(Array.isArray(lista) ? lista : [])
    .map((p) => ({
      ...p,
      _safeCardImage: obtenerImagenSeguraTarjeta(p),
    }))
    .filter((p) => Boolean(p?._safeCardImage) && normalizarRutaAsset(p._safeCardImage) !== "Imagenes/Logo/app-icon.png");
  const listaOrdenada = [...listaConImagen].sort((a, b) => compararProductosPorStockDesc(a, b, stockBySku));
  container.classList.remove("product-grid-sections");
  container.innerHTML = listaOrdenada.map((p) => renderCatalogCardHtml(p)).join("");

  container.querySelectorAll("img[data-image-src]").forEach((img, index) => {
    const removeCardOnBadImage = () => {
      const card = img.closest(".card");
      if (card) card.remove(); else img.remove();
    };
    img.addEventListener("error", removeCardOnBadImage, { once: true });
    img.addEventListener("load", () => {
      if (!img.naturalWidth) removeCardOnBadImage();
    }, { once: true });

    asignarImagenCatalogo(img, img.dataset.imageSrc, obtenerPreferenciasCargaTarjeta(index));
  });

}

function formatearModeloTarjeta(value) {
  const sku = normalizarSkuCatalogo(value);
  const match = sku.match(/^(\d{4})-\d{2}$/);
  return match ? match[1] : sku;
}

function actualizarOffsetHeaderPromo() {
  const header = document.querySelector(".header");
  const urgencyBar = document.querySelector(".top-urgency-bar");
  if (!header) return;
  document.documentElement.style.setProperty("--header-sticky-offset", `${Math.round(header.offsetHeight)}px`);
  if (urgencyBar) {
    document.documentElement.style.setProperty("--promo-bar-height", `${Math.round(urgencyBar.offsetHeight)}px`);
  }
}

function inicializarPromoReemplazoScroll() {
  const marquee = document.querySelector(".top-marquee");
  const urgencyBar = document.querySelector(".top-urgency-bar");
  const header = document.querySelector(".header");
  if (!marquee || !urgencyBar || !header) return;

  const applyState = (isVisible) => {
    document.body.classList.toggle("promo-replaced-active", !isVisible);
  };

  actualizarOffsetHeaderPromo();
  window.addEventListener("resize", actualizarOffsetHeaderPromo, { passive: true });
  window.addEventListener("orientationchange", actualizarOffsetHeaderPromo, { passive: true });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      applyState(!!entry?.isIntersecting);
    }, {
      threshold: 0,
    });
    observer.observe(marquee);
  } else {
    const onScroll = () => {
      const rect = marquee.getBoundingClientRect();
      applyState(rect.bottom > 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
}

function obtenerHantanesModelo(producto = {}) {
  const exactSku = normalizarSkuCatalogo(producto?._preferredSku || producto?.family || "");
  const baseSku = /^\d{4}$/.test(exactSku) ? `${exactSku}-00` : exactSku;
  const badges = HANTAN_BY_SKU[exactSku] || HANTAN_BY_SKU[baseSku] || [];
  return [...new Set((Array.isArray(badges) ? badges : []).filter(Boolean))].map((filename) => ({
    filename,
    src: `Hantan/png/${encodeURIComponent(filename).replace(/%2F/g, "/")}`,
    label: filename.replace(/\.png$/i, ""),
  }));
}

function obtenerPreferenciasCargaTarjeta(index = 0) {
  if (CATALOG_SOURCE === "catalogo-43") {
    return {
      eager: index < 4,
      fetchPriority: index < 2 ? "high" : "low",
      preferOriginal: false,
    };
  }
  return {
    eager: index < 4,
    fetchPriority: index < 2 ? "high" : "low",
    preferOriginal: IS_LOCAL_FILE_PROTOCOL,
  };
}

function renderizarHantanModal(producto = {}) {
  const stack = document.getElementById("modalHantanStack");
  if (!stack) return;
  const badges = CATALOG_SOURCE !== "catalogo-44" ? obtenerHantanesModelo(producto) : [];
  if (!badges.length) {
    stack.innerHTML = "";
    stack.removeAttribute("data-count");
    stack.hidden = true;
    return;
  }
  stack.dataset.count = String(badges.length);
  stack.innerHTML = badges
    .map(
      (badge) => `<img class="modal-hantan-badge" src="${badge.src}" alt="${escapeHtmlExcel(badge.label)}" loading="lazy">`
    )
    .join("");
  stack.hidden = false;
}

function esTextoSensitivoTela(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return false;
  const sensitivePatterns = [
    "tela",
    "stretch",
    "denim",
    "premium",
    "perfect",
    "universal",
    "smart denim",
    "soft denim",
    "power stretch",
    "power strech",
    "mohicano eco",
    "absolut fit",
    "push in push up",
  ];
  return sensitivePatterns.some((pattern) => text.includes(pattern));
}

function filtrarCaracteristicasPublicas(characteristics = []) {
  return Array.isArray(characteristics)
    ? characteristics.filter((char) => !esTextoSensitivoTela(char))
    : [];
}

function limpiarDescripcionPublica(value) {
  const text = normalizarTextoVisible(value || "").trim();
  if (!text) return "";
  return esTextoSensitivoTela(text) ? "" : text;
}

/***********************
 * MODAL: ABRIR
 ***********************/
function verProductoDesdeCard(baseFamily, preferredSku) {
  verProducto(baseFamily, preferredSku);
}

function verProducto(familyId, preferredSku = "") {
  inicializarPanelCotizacionModal();
  const preferredSkuNormalized = normalizarSkuCatalogo(preferredSku);
  let p = productos.find((item) => normalizarSkuCatalogo(item.family) === normalizarSkuCatalogo(familyId));
  if (preferredSkuNormalized) {
    const preferredItem = productos.find((item) => normalizarSkuCatalogo(item.family) === preferredSkuNormalized);
    if (preferredItem) p = preferredItem;
  }
  if (!p) return;

  const preferredVariant = preferredSkuNormalized && Array.isArray(p?.variants)
    ? p.variants.find((variant) => normalizarSkuCatalogo(variant?.sku) === preferredSkuNormalized)
    : null;
  const skuInicial = normalizarSkuCatalogo(preferredVariant?.sku || p.family);
  const selectedGridEntry = (Array.isArray(productosGrid) ? productosGrid : []).find((item) => {
    const itemSku = normalizarSkuCatalogo(item?._preferredSku || item?.family);
    return itemSku === skuInicial;
  }) || null;

  // Reinicia drafts para evitar re-agregar items viejos al volver a abrir el modal
  resetDraftsModal();
  document.getElementById("modalTitle").innerText = "Modelo " + skuInicial;
  const quotePanelModelTitle = document.getElementById("quotePanelModelTitle");
  if (quotePanelModelTitle) quotePanelModelTitle.innerText = "Modelo " + skuInicial;
  cerrarPanelCotizacionModal();
  
  // Mostrar descripción y características
  const descriptionEl = document.getElementById("description");
  const charList = document.getElementById("characteristics");
  const visibleCharacteristics = filtrarCaracteristicasPublicas(p.characteristics);
  const hasCharacteristics = visibleCharacteristics.length > 0;
  const detallePrecio = obtenerDetallePrecioCatalogo(skuInicial);

  if (CATALOG_SOURCE === "catalogo-43") {
    descriptionEl.innerText = "";
    descriptionEl.style.display = "none";
    renderizarInfoProductoCatalogo43(charList, p, detallePrecio);
  } else {
    const publicDescription = limpiarDescripcionPublica(p.description || "");
    descriptionEl.innerText = hasCharacteristics
      ? ""
      : publicDescription + (detallePrecio ? ` · Precio lista: ${formatearPrecioCLP(detallePrecio.lista)} · Web ${detallePrecio.descuento}%: ${formatearPrecioCLP(detallePrecio.final)}` : "");
    descriptionEl.style.display = hasCharacteristics || !publicDescription ? "none" : "block";

    charList.innerHTML = "";
    charList.style.display = hasCharacteristics ? "block" : "none";
    if (hasCharacteristics) {
      const ul = document.createElement("ul");
      visibleCharacteristics.forEach((char) => {
        const li = document.createElement("li");
        li.innerText = normalizarTextoVisible(char);
        ul.appendChild(li);
      });
      if (detallePrecio) {
        const liPrecio = document.createElement("li");
        liPrecio.innerText = `Precio lista: ${formatearPrecioCLP(detallePrecio.lista)} · Web ${detallePrecio.descuento}%: ${formatearPrecioCLP(detallePrecio.final)}`;
        ul.appendChild(liPrecio);
      }
      charList.appendChild(ul);
    }
  }

  const variantContainer = document.getElementById("variantContainer");
  variantContainer.innerHTML = "";
  variantContainer.style.display = "none";

  const ownImages = Array.isArray(selectedGridEntry?._preferredImages) && selectedGridEntry._preferredImages.length
    ? [...selectedGridEntry._preferredImages]
    : (preferredVariant ? buildImageList(preferredVariant) : buildImageList(p));
  const firstVariantWithImages = Array.isArray(p.variants)
    ? p.variants.find((variant) => buildImageList(variant).length)
    : null;
  const initialImages = ownImages.length
    ? ownImages
    : (firstVariantWithImages ? buildImageList(firstVariantWithImages) : []);

  skuActivo = skuInicial;
  renderImages(initialImages, skuInicial);
  renderizarHantanModal(selectedGridEntry || p);
  actualizarVideoModal(skuActivo);
  cargarDraftDelSku(skuActivo);
  aplicarStockATallas(skuActivo);
  actualizarEstadoCotizacionProducto(p, skuActivo);

  const modalRight = document.querySelector("#modal .modal-right");
  if (modalRight) modalRight.scrollTop = 0;

  document.getElementById("modal").classList.add("active");

  if (typeof fbq === "function") {
    fbq("track", "ViewContent", {
      content_ids: [skuActivo],
      content_name: p?.family || skuActivo,
      content_type: "product",
      currency: "CLP",
    });
  }
}

/***********************
 * MODAL: CERRAR
 ***********************/
document.getElementById("closeModal").onclick = () => {
  document.getElementById("modal").classList.remove("active");
  pausarVideoModal();
  pausarVideoPreviewInline();
  cerrarVisorImagenes();
  cerrarVisorVideo();
  cerrarPanelCotizacionModal();
};

document.getElementById("modal").onclick = (e) => {
  if (e.target.id === "modal") {
    document.getElementById("modal").classList.remove("active");
    pausarVideoModal();
    pausarVideoPreviewInline();
    cerrarVisorImagenes();
    cerrarVisorVideo();
    cerrarPanelCotizacionModal();
  }
};

document.getElementById("openImageGalleryBtn")?.addEventListener("click", abrirVisorImagenes);
document.getElementById("closeImageZoomBtn")?.addEventListener("click", cerrarVisorImagenes);
document.getElementById("imageZoomModal")?.addEventListener("click", (e) => {
  if (e.target.dataset.closeImageZoom !== undefined) cerrarVisorImagenes();
});
document.getElementById("closeVideoZoomBtn")?.addEventListener("click", cerrarVisorVideo);
document.getElementById("videoZoomModal")?.addEventListener("click", (e) => {
  if (e.target.dataset.closeVideoZoom !== undefined) cerrarVisorVideo();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarVisorImagenes();
  if (e.key === "Escape") cerrarVisorVideo();
  if (e.key === "Escape") cerrarPanelCotizacionModal();
});

/***********************
 * AGREGAR AL PEDIDO
 ***********************/
document.getElementById("addBtn").onclick = () => {
  if (skuEstaAgotado(skuActivo)) {
    mostrarToastError("Modelo agotado", "Este modelo no tiene stock disponible y no se puede agregar al pedido.");
    return;
  }
  // Tomar solo lo visible en pantalla para el SKU activo (sin borradores)
  const tallas = leerTallasUI();
  const total = Object.values(tallas).reduce((a, b) => a + b, 0);
  let agregoAlgo = false;

  if (skuActivo && total > 0) {
    const existente = pedido.find((item) => item.sku === skuActivo && String(item.source || "") === CATALOG_SOURCE);
    if (existente) {
      Object.entries(tallas).forEach(([talla, cantidad]) => {
        const qty = Number(cantidad) || 0;
        if (qty <= 0) return;
        existente.tallas[talla] = (Number(existente.tallas[talla]) || 0) + qty;
      });
    } else {
      pedido.push({ sku: skuActivo, tallas: { ...tallas }, source: CATALOG_SOURCE });
    }
    agregoAlgo = true;
  }

  if (!agregoAlgo) {
    mostrarToastError("Ingresa una cantidad", "Debes ingresar al menos una cantidad para agregar al pedido.");
    return;
  }

  // 3) limpiar inputs
  resetDraftsModal();

  actualizarCarrito();
  mostrarToastExito("Producto agregado", "Puedes verlo en Tu pedido.");
  cerrarPanelCotizacionModal();
  document.getElementById("modal").classList.remove("active");

  if (typeof fbq === "function") {
    const precio = obtenerPrecioCatalogo(skuActivo) || 0;
    fbq("track", "AddToCart", {
      content_ids: [skuActivo],
      content_name: skuActivo,
      content_type: "product",
      value: precio * total,
      currency: "CLP",
      num_items: total,
    });
  }
};

/***********************
 * CARRITO: ACTUALIZAR / ELIMINAR
 ***********************/
function actualizarCarrito() {
  const cartCountEl = document.getElementById("cartCount");

  const container = document.getElementById("cartItems");
  let totalItems = 0;
  let totalEstimado = 0;
  let totalLista = 0;
  let totalAhorro = 0;
  let totalIva = 0;
  let totalConIva = 0;

  if (!pedido.length) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <div class="cart-empty-title">Aún no agregas modelos</div>
        <div class="cart-empty-text">Selecciona tallas y cantidades para armar tu pedido.</div>
      </div>
    `;
  } else {
    container.innerHTML = pedido
      .map((item, index) => {
        const cantidadModelo = Object.values(item.tallas).reduce((acc, qty) => acc + (Number(qty) || 0), 0);
        const detallePrecio = obtenerDetallePrecioCatalogoCruzado(item.sku);
        const precioListaUnitario = detallePrecio?.lista || null;
        const precioUnitario = detallePrecio?.final || null;
          const thumbnail = obtenerMiniaturaCarritoPorSku(item.sku);
          const subtotalLista = precioListaUnitario ? precioListaUnitario * cantidadModelo : 0;
          const subtotal = precioUnitario ? precioUnitario * cantidadModelo : 0;
          totalItems += cantidadModelo;
          totalLista += subtotalLista;
          totalEstimado += subtotal;
          totalAhorro += Math.max(0, subtotalLista - subtotal);
          const tallasHtml = Object.entries(item.tallas)
            .map(([t, c]) => `<span class="cart-size-pill">T${t} <strong>${c}</strong></span>`)
            .join("");

        return `
        <div class="cart-item">
          <div class="cart-item-thumb-wrap">
            ${thumbnail ? `<img class="cart-item-thumb" data-thumb-src="${escapeHtmlExcel(thumbnail)}" alt="Modelo ${item.sku}" loading="lazy">` : `<div class="cart-item-thumb cart-item-thumb-fallback">M</div>`}
          </div>
          <div class="cart-item-body">
          <div class="cart-item-top">
            <div class="cart-item-main">
              <div class="cart-item-title">Modelo ${item.sku}</div>
              <div class="cart-item-collection">${item.source === "catalogo-43" ? "Cole 43" : "Cole 42"}</div>
            </div>
            <button class="cart-trash" type="button" aria-label="Eliminar modelo ${item.sku}" onclick="eliminarItem(${index})">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h2v9H7V9Zm4 0h2v9h-2V9Zm4 0h2v9h-2V9ZM6 7h12l-1 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7Z"/>
              </svg>
            </button>
          </div>
          <div class="cart-item-sizes">${tallasHtml}</div>
          <div class="cart-item-summary">
            <div class="cart-item-summary-chip"><span>Prendas</span><strong>${cantidadModelo}</strong></div>
            ${
              precioUnitario
                ? `<div class="cart-item-summary-chip is-price"><span>Subtotal</span><strong>${formatearPrecioCLP(subtotal)}</strong></div>`
                : ""
            }
          </div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  container.querySelectorAll(".cart-item-thumb[data-thumb-src]").forEach((img) => {
    const src = img.getAttribute("data-thumb-src");
    if (!src) return;
    asignarImagenCatalogo(img, src, { eager: false, fetchPriority: "high", preferOriginal: true });
  });

  if (cartCountEl) {
    cartCountEl.innerText = String(totalItems);
  }

  let totalsBox = document.getElementById("cartTotals");
  const totalsSlot = document.getElementById("cartTotalsSlot");
  if (!totalsBox) {
    totalsBox = document.createElement("div");
    totalsBox.id = "cartTotals";
    totalsBox.className = "cart-totals";
  }
  if (totalsSlot) {
    totalsSlot.replaceChildren(totalsBox);
  } else if (!totalsBox.parentElement || totalsBox.parentElement !== container.parentElement) {
    container.insertAdjacentElement("afterend", totalsBox);
  }

    totalIva = totalEstimado > 0 ? Math.round(totalEstimado * IVA_RATE) : 0;
    totalConIva = totalEstimado + totalIva;

    totalsBox.innerHTML = `
      <div class="cart-totals-head">
        <span class="cart-totals-title">Total a pagar</span>
        <span class="cart-totals-note">5% web + IVA incluido</span>
      </div>
      <div class="cart-totals-row"><span>Total prendas</span><strong>${totalItems}</strong></div>
      ${totalItems > 0 && totalItems < 24 ? `<div class="cart-totals-row" style="color:#b45309;font-size:12px;background:#fffbeb;padding:4px 8px;border-radius:4px;margin-top:2px;">⚠️ Faltan ${24 - totalItems} unidades para el mínimo (24)</div>` : ""}
      ${totalItems >= 24 ? `<div class="cart-totals-row" style="color:#15803d;font-size:12px;">✓ Mínimo mayorista cumplido</div>` : ""}
      ${totalLista > 0 ? `<div class="cart-totals-row"><span>Total lista</span><strong>${formatearPrecioCLP(totalLista)}</strong></div>` : ""}
      ${totalAhorro > 0 ? `<div class="cart-totals-row cart-totals-row-accent"><span>Descuento web ${WEB_DISCOUNT_PERCENT}%</span><strong>- ${formatearPrecioCLP(totalAhorro)}</strong></div>` : ""}
      ${totalEstimado > 0 ? `<div class="cart-totals-row"><span>Total neto con descuento</span><strong>${formatearPrecioCLP(totalEstimado)}</strong></div>` : ""}
      ${totalIva > 0 ? `<div class="cart-totals-row"><span>IVA ${IVA_PERCENT}%</span><strong>${formatearPrecioCLP(totalIva)}</strong></div>` : ""}
      ${totalConIva > 0 ? `<div class="cart-totals-row cart-totals-row-final"><span>Total final con IVA</span><strong>${formatearPrecioCLP(totalConIva)}</strong></div>` : ""}
      ${totalAhorro > 0 ? `<div class="cart-totals-row cart-totals-row-saving"><span>Ahorro</span><strong>${formatearPrecioCLP(totalAhorro)}</strong></div>` : ""}
    `;
    guardarCotizacionPersistida();
  }

async function eliminarItem(index) {
  const item = pedido[index];
  if (!item) return;
  const confirmar = await mostrarConfirmacionAccion({
    titulo: "Eliminar modelo",
    mensaje: `¿Seguro que quieres quitar el modelo ${item.sku} de Tu Pedido?`,
    confirmarTexto: "Sí, eliminar",
  });
  if (!confirmar) return;
  pedido.splice(index, 1);
  actualizarCarrito();
}

/***********************
 * ABRIR / CERRAR CARRITO
 ***********************/
document.getElementById("cartToggle").onclick = () => {
  document.getElementById("cartSidebar").classList.add("open");
};

document.getElementById("jumpToSendRequest")?.addEventListener("click", () => {
  const sidebar = document.getElementById("cartSidebar");
  const sendBtn = document.getElementById("sendRequest");
  if (!sidebar || !sendBtn) return;

  const sidebarRect = sidebar.getBoundingClientRect();
  const sendRect = sendBtn.getBoundingClientRect();
  const offset = Math.max(16, sendRect.top - sidebarRect.top + sidebar.scrollTop - 80);

  sidebar.scrollTo({
    top: offset,
    behavior: "smooth",
  });

  window.setTimeout(() => {
    sendBtn.classList.add("cart-send-highlight");
    window.setTimeout(() => sendBtn.classList.remove("cart-send-highlight"), 1200);
  }, 220);
});

document.addEventListener("click", (e) => {
  const sidebar = document.getElementById("cartSidebar");
  const toggle = document.getElementById("cartToggle");
  const confirmModal = document.getElementById("confirmActionModal");
  if (!sidebar || !toggle) return;
  if (e.target?.closest(".cart-trash")) return;
  if (e.target?.closest("#closeCart")) return;
  if (confirmModal && !confirmModal.hidden && e.target?.closest("#confirmActionModal")) return;

  if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});

/***********************
 * COTIZACIÓN: CSV + MAILTO + LIMPIEZA
 ***********************/
function generarCSV() {
  const nombreTienda = clienteSeleccionado?.razon_social || String(document.getElementById("clientName")?.value || "").trim();
  const rutCliente = formatearRutVisual(document.getElementById("clientRut")?.value || clienteSeleccionado?.rut || clienteSeleccionado?.rut_normalized || "");
  if (!nombreTienda || !pedido.length) return null;

  const sep = ";";
  let rows = [];

  rows.push(["RUT", rutCliente]);
  rows.push(["Cliente", nombreTienda]);
  rows.push([]);
  rows.push(["SKU", "Talla", "Cantidad"]);

  let totalGeneral = 0;

  pedido.forEach(item => {
    let totalPorSku = 0;

    Object.entries(item.tallas).forEach(([t, c]) => {
      rows.push([item.sku, t, c]);
      totalPorSku += c;
      totalGeneral += c;
    });

    // Línea de total por SKU
    rows.push(["", "Total " + item.sku, totalPorSku]);
    rows.push([]);
  });

  // Total general al final
  rows.push([]);
  rows.push(["TOTAL GENERAL", "", totalGeneral]);

  const BOM = "\uFEFF";

  const csvBody = rows.map(r =>
    r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(sep)
  ).join("\n");

  return BOM + csvBody;
}

function descargarArchivo(nombre, contenido, mime) {
  const blob = new Blob([contenido], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function descargarBlob(nombre, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function sanitizeFileNamePart(value, fallback = "archivo") {
  const cleaned = String(value ?? "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ");
  return cleaned || fallback;
}

function formatNumberCL(value) {
  return Number(value || 0).toLocaleString("es-CL");
}

function generarCodigoCotizacionVisual(q) {
  if (!q) return "COT-";
  const raw = String(q.id || "").replace(/-/g, "");
  let acc = 0;
  for (let i = 0; i < raw.length; i++) {
    acc = (acc * 31 + raw.charCodeAt(i)) % 100000;
  }
  return `COT-${String(acc).padStart(5, "0")}`;
}

function generarCSVQuoteAdmin(quote, items = []) {
  const sep = ";";
  const BOM = "\uFEFF";
  const fecha = quote?.created_at ? new Date(quote.created_at).toLocaleString() : "";
  const codigo = generarCodigoCotizacionVisual(quote);
  const estado = quote?.is_ready ? "Pedido listo" : "En proceso";
  const rows = [];

  rows.push(["RESUMEN COTIZACION"]);
  rows.push(["Codigo", codigo]);
  rows.push(["Tienda", quote?.store_name || ""]);
  rows.push(["Telefono", quote?.client_phone || ""]);
  rows.push(["Estado", estado]);
  rows.push(["Fecha", fecha]);
  rows.push(["Total items", quote?.total_items || 0]);
  rows.push(["ID interno (UUID)", quote?.id || ""]);
  rows.push([]);
  rows.push(["DETALLE SOLICITADO POR CLIENTE"]);
  rows.push(["Modelo", "Talla", "Cantidad"]);

  let total = 0;
  const ordered = [...items].sort((a, b) => {
    if (String(a.sku) !== String(b.sku)) return String(a.sku).localeCompare(String(b.sku));
    return String(a.size).localeCompare(String(b.size), undefined, { numeric: true });
  });

  ordered.forEach((it) => {
    rows.push([it.sku, it.size, it.quantity]);
    total += Number(it.quantity) || 0;
  });

  rows.push([]);
  rows.push(["TOTAL GENERAL", "", total]);

  const csvBody = rows
    .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(sep))
    .join("\n");
  return BOM + csvBody;
}

function escapeHtmlExcel(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const ORDER_TEMPLATE_SHEET = "TOMA DE PEDIDOS";
const ORDER_TEMPLATE_CONFIGS = {
  unified: {
    file: "PLANILLA 43 LISTA PRECIO FINAL.xlsx",
    version: "20260526precio-final",
    sheet: ORDER_TEMPLATE_SHEET,
    firstRow: 15,
    lastRow: 59,
    skuColumn: "B",
    clearSkuColumns: ["A", "B"],
    rutCell: "L5",
    phoneCell: "L7",
    dateCell: "L8",
    idLabelCell: "U1",
    idValueCell: "V1",
    clearUnusedFormulaColumns: ["C", "D", "E", "S", "T"],
    sizeColumns: {
      "36": "F",
      "38": "G",
      "40": "H",
      "42": "I",
      "44": "J",
      "46": "K",
      "48": "L",
      "50": "M",
      "S": "N",
      "M": "O",
      "L": "P",
    },
  },
  default: {
    file: "plantilla-toma-pedidos.xlsx",
    version: "20260319a",
    sheet: ORDER_TEMPLATE_SHEET,
    firstRow: 15,
    lastRow: 61,
    skuColumn: "A",
    clearSkuColumns: ["A"],
    rutCell: "K5",
    phoneCell: "K6",
    dateCell: "K8",
    idLabelCell: "T1",
    idValueCell: "U1",
    sizeColumns: {
      "36": "E",
      "38": "F",
      "40": "G",
      "42": "H",
      "44": "I",
      "46": "J",
      "48": "K",
      "50": "L",
      "S": "M",
      "M": "N",
      "L": "O",
    },
  },
  "catalogo-43": {
    file: "PLANILLA 43 LISTA PRECIO FINAL.xlsx",
    version: "20260520cole43",
    sheet: ORDER_TEMPLATE_SHEET,
    firstRow: 15,
    lastRow: 60,
    skuColumn: "B",
    clearSkuColumns: ["A", "B"],
    rutCell: "L5",
    phoneCell: "L7",
    dateCell: "L8",
    idLabelCell: "U1",
    idValueCell: "V1",
    sizeColumns: {
      "36": "F",
      "38": "G",
      "40": "H",
      "42": "I",
      "44": "J",
      "46": "K",
      "48": "L",
      "50": "M",
      "S": "N",
      "M": "O",
      "L": "P",
    },
    skuFormatter: "numeric43",
  },
};

let xlsxPopulateLoaderPromise = null;
const orderTemplateBufferPromises = {};

function loadXlsxPopulate() {
  if (window.XlsxPopulate) return Promise.resolve(window.XlsxPopulate);
  if (xlsxPopulateLoaderPromise) return xlsxPopulateLoaderPromise;

  xlsxPopulateLoaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/xlsx-populate/browser/xlsx-populate.min.js";
    script.async = true;
    script.onload = () => {
      if (window.XlsxPopulate) resolve(window.XlsxPopulate);
      else reject(new Error("No se pudo inicializar la libreria de Excel"));
    };
    script.onerror = () => reject(new Error("No se pudo cargar la libreria de Excel"));
    document.head.appendChild(script);
  });

  return xlsxPopulateLoaderPromise;
}

function obtenerSourcePlantillaPedido(quote = {}, items = []) {
  const quoteSource = String(quote?.source || "").trim();
  if (quoteSource) return quoteSource;
  const sources = [...new Set((Array.isArray(items) ? items : [])
    .map((item) => String(item?.source || inferirCatalogoDesdeSku(item?.sku) || "").trim())
    .filter(Boolean))];
  if (sources.length === 1) return sources[0];
  if (sources.includes("catalogo-43")) return "catalogo-43";
  return CATALOG_SOURCE;
}

function obtenerConfigPlantillaPedido(quote = {}, items = []) {
  return ORDER_TEMPLATE_CONFIGS.unified;
}

function obtenerGrupoPlantillaItem(item = {}, quote = {}) {
  const source = String(item?.source || inferirCatalogoDesdeSku(item?.sku) || quote?.source || CATALOG_SOURCE).trim() || CATALOG_SOURCE;
  return ORDER_TEMPLATE_CONFIGS[source] ? source : "default";
}

function agruparItemsPorPlantillaPedido(quote = {}, items = []) {
  const groups = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    const groupKey = obtenerGrupoPlantillaItem(item, quote);
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(item);
  });
  return [...groups.entries()].map(([source, groupItems]) => ({ source, items: groupItems }));
}

function obtenerSufijoArchivoPlantilla(source = "default") {
  if (source === "catalogo-43") return "Cole 43";
  return "Cole general";
}

function loadOrderTemplateBuffer(config = ORDER_TEMPLATE_CONFIGS.default) {
  const key = `${config.file}?v=${config.version}`;
  if (orderTemplateBufferPromises[key]) return orderTemplateBufferPromises[key];
  orderTemplateBufferPromises[key] = fetch(key, { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) throw new Error("No se pudo cargar la plantilla de TOMA DE PEDIDOS");
      return response.arrayBuffer();
    });
  return orderTemplateBufferPromises[key];
}

function normalizarSkuParaPlantilla(sku, source, config = ORDER_TEMPLATE_CONFIGS.default) {
  const raw = String(sku || "").trim().toUpperCase();
  if (config === ORDER_TEMPLATE_CONFIGS.unified) {
    const normalized = normalizarSkuCatalogo(raw);
    if (source === "catalogo-43") {
      if (normalized === "4371-01") return "437100";
      if (/^\d{4}$/.test(normalized)) return `${normalized}00`;
      if (/^\d{4}-\d{2}$/.test(normalized)) return normalized.replace("-", "");
      return raw.replace("-", "");
    }
    return normalized;
  }
  if (config.skuFormatter === "numeric43") {
    const normalized = normalizarSkuCatalogo(raw);
    if (/^\d{4}$/.test(normalized)) return `${normalized}00`;
    if (/^\d{4}-\d{2}$/.test(normalized)) return normalized.replace("-", "");
    return raw.replace("-", "");
  }
  if (/^\d{4}$/.test(raw) && source === "catalogo-1") {
    return `${raw}-00`;
  }
  if (source === "catalogo-43" && /^\d{4}-\d{2}$/.test(raw)) {
    return raw.replace("-", "");
  }
  return raw;
}

function agruparItemsParaPlantilla(quote, items = [], config = ORDER_TEMPLATE_CONFIGS.default) {
  const grouped = new Map();
  const ordered = [...items].sort((a, b) => {
    if (String(a.sku) !== String(b.sku)) return String(a.sku).localeCompare(String(b.sku));
    return String(a.size).localeCompare(String(b.size), undefined, { numeric: true });
  });

  ordered.forEach((it) => {
    const itemSource = String(it?.source || inferirCatalogoDesdeSku(it?.sku) || quote?.source || CATALOG_SOURCE).trim() || CATALOG_SOURCE;
    const sku = normalizarSkuParaPlantilla(it.sku, itemSource, config);
    const size = String(it.size || "").trim().toUpperCase();
    if (!config.sizeColumns[size]) return;
    const qty = Number(it.quantity) || 0;
    if (qty <= 0) return;

    if (!grouped.has(sku)) {
      grouped.set(sku, { sku, sizes: {} });
    }

    const entry = grouped.get(sku);
    entry.sizes[size] = (entry.sizes[size] || 0) + qty;
  });

  return [...grouped.values()];
}

function obtenerValorSkuCeldaPlantilla(sku, config = ORDER_TEMPLATE_CONFIGS.default) {
  const raw = String(sku || "").trim();
  if (config === ORDER_TEMPLATE_CONFIGS.unified && /^\d+$/.test(raw)) {
    return Number(raw);
  }
  return raw;
}

async function cargarCotizacionAdminPorId(quoteId) {
  if (!quotesAccessToken) throw new Error("Debes iniciar sesion");
  const cleanId = String(quoteId || "").trim();
  if (!cleanId) throw new Error("No se encontro el ID del pedido");

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${quotesAccessToken}`,
  };

  let quoteRes = await fetch(
    `${SUPABASE_URL}/rest/v1/quotes?select=id,store_name,client_rut,client_rut_normalized,client_phone,total_items,created_at,created_at_client,source,is_ready,ready_at&id=eq.${encodeURIComponent(cleanId)}&limit=1`,
    { headers }
  );

  if (!quoteRes.ok) {
    const errText = await quoteRes.text();
    if ((errText || "").toLowerCase().includes("client_phone")) {
      quoteRes = await fetch(
        `${SUPABASE_URL}/rest/v1/quotes?select=id,store_name,client_rut,client_rut_normalized,total_items,created_at,created_at_client,source,is_ready,ready_at&id=eq.${encodeURIComponent(cleanId)}&limit=1`,
        { headers }
      );
    } else {
      throw new Error(`No se pudo cargar pedido: ${errText || quoteRes.status}`);
    }
  }

  if (!quoteRes.ok) {
    const errText = await quoteRes.text();
    throw new Error(`No se pudo cargar pedido: ${errText || quoteRes.status}`);
  }

  const quoteRows = await quoteRes.json();
  const quote = quoteRows?.[0] || null;
  if (!quote) throw new Error("No se encontro el pedido seleccionado");

  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/quote_items?select=quote_id,sku,size,quantity&quote_id=eq.${encodeURIComponent(cleanId)}&order=id.desc`,
    { headers }
  );
  if (!itemsRes.ok) {
    const errText = await itemsRes.text();
    throw new Error(`No se pudieron cargar items: ${errText || itemsRes.status}`);
  }

  const items = await itemsRes.json();
  return { quote, items: Array.isArray(items) ? items : [] };
}

async function generarExcelPlantillaQuoteAdmin(quote, items = []) {
  const config = obtenerConfigPlantillaPedido(quote, items);
  const XlsxPopulate = await loadXlsxPopulate();
  const workbook = await XlsxPopulate.fromDataAsync(await loadOrderTemplateBuffer(config));
  const sheet = workbook.sheet(config.sheet);
  if (!sheet) throw new Error("No se encontro la hoja TOMA DE PEDIDOS en la plantilla");

  // Mantener todas las hojas de la plantilla, pero dejar visible solo "TOMA DE PEDIDOS".
  workbook.sheets().forEach((ws) => {
    ws.hidden(ws.name() !== config.sheet);
  });
  workbook.activeSheet(sheet);

  const grouped = agruparItemsParaPlantilla(quote, items, config);
  const codigo = generarCodigoCotizacionVisual(quote);
  const capacity = config.lastRow - config.firstRow + 1;
  if (grouped.length > capacity) {
    throw new Error(`El pedido tiene ${grouped.length} modelos y la plantilla soporta ${capacity}`);
  }

  for (let row = config.firstRow; row <= config.lastRow; row++) {
    (config.clearSkuColumns || [config.skuColumn]).forEach((col) => {
      sheet.cell(`${col}${row}`).value("");
    });
    Object.values(config.sizeColumns).forEach((col) => {
      sheet.cell(`${col}${row}`).value("");
    });
  }

  sheet.cell(config.idLabelCell).value("ID");
  sheet.cell(config.idValueCell).value(codigo);
  sheet.cell(config.rutCell).value(quote?.client_rut || "");
  sheet.cell(config.dateCell).value(new Date());
  sheet.cell(config.phoneCell).value(quote?.client_phone || "");

  grouped.forEach((entry, index) => {
    const row = config.firstRow + index;
    sheet.cell(`${config.skuColumn}${row}`).value(obtenerValorSkuCeldaPlantilla(entry.sku, config));
    Object.entries(entry.sizes).forEach(([size, qty]) => {
      const col = config.sizeColumns[size];
      if (!col) return;
      sheet.cell(`${col}${row}`).value(qty);
    });
  });

  const firstUnusedRow = config.firstRow + grouped.length;
  for (let row = firstUnusedRow; row <= config.lastRow; row++) {
    (config.clearUnusedFormulaColumns || []).forEach((col) => {
      sheet.cell(`${col}${row}`).value("");
    });
  }

  return workbook.outputAsync();
}

function generarExcelHtmlQuoteAdmin(quote, items = []) {
  const fecha = quote?.created_at ? new Date(quote.created_at).toLocaleString() : "-";
  const codigo = generarCodigoCotizacionVisual(quote);
  const estado = quote?.is_ready ? "Pedido listo" : "En proceso";
  const rut = quote?.client_rut || "";
  const telefono = quote?.client_phone || "";

  const ordered = [...items].sort((a, b) => {
    if (String(a.sku) !== String(b.sku)) return String(a.sku).localeCompare(String(b.sku));
    return String(a.size).localeCompare(String(b.size), undefined, { numeric: true });
  });

  let total = 0;
  const rows = ordered.map((it) => {
    total += Number(it.quantity) || 0;
    return `
      <tr>
        <td>${escapeHtmlExcel(it.sku)}</td>
        <td>${escapeHtmlExcel(it.size)}</td>
        <td class="num">${escapeHtmlExcel(it.quantity)}</td>
      </tr>
    `;
  }).join("");

  const idRow = new Array(21).fill("<td></td>");
  idRow[19] = `<td class="label">ID</td>`;
  idRow[20] = `<td class="value">${escapeHtmlExcel(codigo)}</td>`;

  return `\uFEFF<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="application/vnd.ms-excel; charset=UTF-8" />
<style>
  body{font-family:Calibri,Segoe UI,Arial,sans-serif;background:#fff;color:#111827}
  table{border-collapse:collapse}
  .sheet{min-width:760px}
  .sheet td,.sheet th{border:1px solid #d1d5db;padding:6px 8px;font-size:11pt}
  .title{background:#111827;color:#fff;font-weight:700;font-size:13pt}
  .section{background:#e5e7eb;color:#111827;font-weight:700}
  .label{background:#f3f4f6;font-weight:700;width:180px}
  .value{background:#fff}
  .header th{background:#d71920;color:#fff;font-weight:700;text-align:left}
  .num{text-align:right}
  .pill{background:#ecfdf5;color:#065f46;font-weight:700}
  .pill.warn{background:#fff7ed;color:#9a3412}
  .total-row td{background:#111827;color:#fff;font-weight:700}
  .spacer td{border:none;height:8px;background:#fff}
</style>
</head>
<body>
  <table class="sheet">
    <tr>${idRow.join("")}</tr>
    <tr><td class="title" colspan="3">RESUMEN COTIZACION</td></tr>
    <tr><td class="label">Codigo</td><td class="value" colspan="2">${escapeHtmlExcel(codigo)}</td></tr>
    <tr><td class="label">Tienda</td><td class="value" colspan="2">${escapeHtmlExcel(quote?.store_name || "")}</td></tr>
    <tr><td class="label">RUT</td><td class="value" colspan="2">${escapeHtmlExcel(rut)}</td></tr>
    <tr><td class="label">Telefono</td><td class="value" colspan="2">${escapeHtmlExcel(telefono)}</td></tr>
    <tr><td class="label">Estado</td><td class="${quote?.is_ready ? "pill" : "pill warn"}" colspan="2">${escapeHtmlExcel(estado)}</td></tr>
    <tr><td class="label">Fecha</td><td class="value" colspan="2">${escapeHtmlExcel(fecha)}</td></tr>
    <tr><td class="label">Total items</td><td class="value num" colspan="2">${escapeHtmlExcel(quote?.total_items || 0)}</td></tr>
    <tr><td class="label">ID interno (UUID)</td><td class="value" colspan="2">${escapeHtmlExcel(quote?.id || "")}</td></tr>
    <tr class="spacer"><td colspan="3"></td></tr>
    <tr><td class="section" colspan="3">DETALLE SOLICITADO POR CLIENTE</td></tr>
    <tr class="header"><th>Modelo</th><th>Talla</th><th>Cantidad</th></tr>
    ${rows || '<tr><td colspan="3">Sin detalle</td></tr>'}
    <tr class="spacer"><td colspan="3"></td></tr>
    <tr class="total-row"><td colspan="2">TOTAL GENERAL</td><td class="num">${escapeHtmlExcel(total)}</td></tr>
  </table>
</body>
</html>`;
}

async function descargarCotizacionAdmin(quoteId) {
  const { quote, items } = await cargarCotizacionAdminPorId(quoteId);
  const clienteNombre = sanitizeFileNamePart(quote.store_name, "cliente");
  const codigo = generarCodigoCotizacionVisual(quote);
  const nombreBase = `Pedido ${codigo} ${clienteNombre}`;
  try {
    const excelBlob = await Promise.race([
      generarExcelPlantillaQuoteAdmin(quote, items),
      new Promise((_, reject) => window.setTimeout(() => reject(new Error("Tiempo de espera agotado al preparar Excel")), 5000)),
    ]);
    descargarBlob(`${nombreBase}.xlsx`, excelBlob);
  } catch (err) {
    console.error("Fallo exportacion xlsx, usando respaldo xls", err);
    const excelHtml = generarExcelHtmlQuoteAdmin(quote, items);
    descargarArchivo(`${nombreBase}.xls`, excelHtml, "application/vnd.ms-excel;charset=utf-8;");
    actualizarEstadoQuotesUI("Se descargo un respaldo rapido porque la plantilla tardó demasiado o no estuvo disponible");
  }
}

function mostrarToastExito(titulo, mensaje) {
  const toast = document.getElementById("successToast");
  if (!toast) return;
  const titleEl = toast.querySelector("strong");
  const msgEl = toast.querySelector("span");
  if (titleEl && titulo) titleEl.innerText = titulo;
  if (msgEl && mensaje) msgEl.innerText = mensaje;
  toast.hidden = false;
  toast.classList.remove("show");
  // Reinicia animacion
  void toast.offsetWidth;
  toast.classList.add("show");
  window.clearTimeout(mostrarToastExito._timer);
  mostrarToastExito._timer = window.setTimeout(() => {
    toast.classList.remove("show");
    toast.hidden = true;
  }, 3300);
}

function mostrarToastError(titulo, mensaje) {
  const toast = document.getElementById("errorToast");
  const titleEl = document.getElementById("errorToastTitle");
  const msgEl = document.getElementById("errorToastMsg");
  if (!toast) return;
  if (titleEl) titleEl.innerText = titulo || "Revisa los datos";
  if (msgEl) msgEl.innerText = mensaje || "Hay un problema con la informacion ingresada.";
  toast.hidden = false;
  toast.classList.remove("show");
  void toast.offsetWidth;
  toast.classList.add("show");
  window.clearTimeout(mostrarToastError._timer);
  mostrarToastError._timer = window.setTimeout(() => {
    toast.classList.remove("show");
    toast.hidden = true;
  }, 3300);
}

function asegurarConfirmModal() {
  let modal = document.getElementById("confirmActionModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "confirmActionModal";
  modal.className = "confirm-action-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="confirm-action-backdrop" data-confirm-cancel></div>
    <div class="confirm-action-card" role="dialog" aria-modal="true" aria-labelledby="confirmActionTitle">
      <div class="confirm-action-icon">!</div>
      <div class="confirm-action-copy">
        <div id="confirmActionTitle" class="confirm-action-title">Confirmar accion</div>
        <div id="confirmActionMsg" class="confirm-action-msg">¿Estás seguro?</div>
      </div>
      <div class="confirm-action-buttons">
        <button type="button" id="confirmActionCancel" class="ghost-btn">Cancelar</button>
        <button type="button" id="confirmActionOk" class="confirm-danger-btn">Eliminar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

function mostrarConfirmacionAccion({ titulo = "Confirmar", mensaje = "¿Estás seguro?", confirmarTexto = "Aceptar" } = {}) {
  const modal = asegurarConfirmModal();
  const titleEl = modal.querySelector("#confirmActionTitle");
  const msgEl = modal.querySelector("#confirmActionMsg");
  const okBtn = modal.querySelector("#confirmActionOk");
  const cancelBtn = modal.querySelector("#confirmActionCancel");
  const backdrop = modal.querySelector(".confirm-action-backdrop");

  if (titleEl) titleEl.innerText = titulo;
  if (msgEl) msgEl.innerText = mensaje;
  if (okBtn) okBtn.innerText = confirmarTexto;

  modal.hidden = false;
  modal.classList.remove("show");
  void modal.offsetWidth;
  modal.classList.add("show");

  return new Promise((resolve) => {
    const cleanup = (result) => {
      modal.classList.remove("show");
      modal.hidden = true;
      okBtn?.removeEventListener("click", onOk);
      cancelBtn?.removeEventListener("click", onCancel);
      backdrop?.removeEventListener("click", onCancel);
      document.removeEventListener("keydown", onKeydown);
      resolve(result);
    };
    const onOk = (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      cleanup(true);
    };
    const onCancel = (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      cleanup(false);
    };
    const onKeydown = (e) => {
      if (e.key === "Escape") cleanup(false);
      if (e.key === "Enter") cleanup(true);
    };
    okBtn?.addEventListener("click", onOk);
    cancelBtn?.addEventListener("click", onCancel);
    backdrop?.addEventListener("click", onCancel);
    document.addEventListener("keydown", onKeydown);
  });
}

function setClientLookupUI({ tipo = "", texto = "", badge = "" } = {}) {
  const msgEl = document.getElementById("clientLookupMsg");
  const badgeEl = document.getElementById("clientLookupBadge");
  const mostrarBadge = Boolean(badge) && tipo !== "new";
  if (msgEl) {
    msgEl.className = "client-lookup-msg" + (tipo ? ` ${tipo}` : "");
    msgEl.innerText = texto || "";
    if (tipo === "error") {
      msgEl.classList.remove("shake");
      void msgEl.offsetWidth;
      msgEl.classList.add("shake");
    }
  }
  if (badgeEl) {
    badgeEl.className = "client-lookup-badge" + (tipo ? ` ${tipo}` : "");
    if (mostrarBadge) {
      badgeEl.hidden = false;
      badgeEl.innerText = badge;
    } else {
      badgeEl.hidden = true;
      badgeEl.innerText = "";
    }
  }
}

function setCartFieldInvalid(inputEl, message = "") {
  if (!inputEl) return;
  inputEl.classList.add("cart-field-invalid");
  if (message) {
    inputEl.setCustomValidity(message);
  }
  const labelEl = inputEl.id ? document.querySelector(`label[for="${inputEl.id}"]`) : null;
  labelEl?.classList.add("is-invalid");
}

function clearCartFieldInvalid(inputEl) {
  if (!inputEl) return;
  inputEl.classList.remove("cart-field-invalid");
  inputEl.setCustomValidity("");
  const labelEl = inputEl.id ? document.querySelector(`label[for="${inputEl.id}"]`) : null;
  labelEl?.classList.remove("is-invalid");
}

function clearCartFieldInvalidState() {
  clearCartFieldInvalid(document.getElementById("clientRut"));
  clearCartFieldInvalid(document.getElementById("clientName"));
  clearCartFieldInvalid(document.getElementById("clientPhone"));
}

function renderClientNewHelper(show, text = "Completa nombre y teléfono para enviar el pedido del cliente nuevo.") {
  const panelEl = document.querySelector(".cart-client-panel");
  if (!panelEl) return;
  let helpEl = document.getElementById("clientNewHelper");
  if (!helpEl) {
    helpEl = document.createElement("div");
    helpEl.id = "clientNewHelper";
    helpEl.className = "cart-client-help";
    panelEl.appendChild(helpEl);
  }
  panelEl.classList.toggle("has-new-client", !!show);
  helpEl.hidden = !show;
  helpEl.innerText = show ? text : "";
}

function toggleClientNameField(show, { value = "", readonly = false } = {}) {
  const wrapEl = document.getElementById("clientNameWrap");
  const inputEl = document.getElementById("clientName");
  const labelEl = document.querySelector('label[for="clientName"]');
  if (!wrapEl || !inputEl) return;
  wrapEl.hidden = !show;
  inputEl.readOnly = !!readonly;
  inputEl.value = value || "";
  inputEl.classList.toggle("is-readonly", !!readonly);
  wrapEl.classList.toggle("is-highlighted", !!show && !readonly);
  if (labelEl) {
    labelEl.innerText = "Nombre o razón social";
  }
}

function toggleClientPhoneField(show, { value = "", readonly = false } = {}) {
  const wrapEl = document.getElementById("clientPhoneWrap");
  const inputEl = document.getElementById("clientPhone");
  const labelEl = document.querySelector('label[for="clientPhone"]');
  if (!wrapEl || !inputEl) return;
  wrapEl.hidden = !show;
  inputEl.readOnly = !!readonly;
  inputEl.value = value || "";
  inputEl.classList.toggle("is-readonly", !!readonly);
  wrapEl.classList.toggle("is-highlighted", !!show && !readonly);
  if (labelEl) {
    labelEl.innerText = "Teléfono del cliente";
  }
}

function normalizarTelefonoCliente(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("+")) {
    return `+${cleaned.slice(1).replace(/\+/g, "")}`;
  }
  return cleaned;
}

function habilitarInputManual(inputEl) {
  if (!inputEl) return;
  if (inputEl.dataset.manualReady === "1") return;
  inputEl.dataset.manualReady = "1";

  const unlock = () => {
    if (inputEl.classList.contains("is-readonly")) return;
    inputEl.readOnly = false;
  };

  inputEl.addEventListener("focus", unlock);
  inputEl.addEventListener("pointerdown", unlock);
  inputEl.addEventListener("mousedown", unlock);
  inputEl.addEventListener("keydown", unlock);
}

function construirClienteNuevoDesdeInput(rutNormalizado) {
  const nameEl = document.getElementById("clientName");
  const phoneEl = document.getElementById("clientPhone");
  const nombre = String(nameEl?.value || "").trim();
  const telefono = normalizarTelefonoCliente(phoneEl?.value || "");
  return {
    rut: formatearRutVisual(rutNormalizado),
    rut_normalized: rutNormalizado,
    razon_social: nombre,
    client_phone: telefono,
    is_new: true,
  };
}

async function buscarClientePorRutSupabase(rutInput) {
  const clienteLocal = buscarClienteLocalPorRut(rutInput);
  if (clienteLocal) return clienteLocal;

  const rutNormalizado = normalizarRut(rutInput);
  if (!rutNormalizado) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/lookup_client_by_rut`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_rut: rutNormalizado }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`No se pudo validar RUT: ${txt || res.status}`);
  }
  const data = await res.json();
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    rut: row.rut || rutInput,
    rut_normalized: row.rut_normalized || rutNormalizado,
    razon_social: row.razon_social || "",
  };
}

async function validarRutClienteEnUI({ silencioso = false } = {}) {
  const input = document.getElementById("clientRut");
  if (!input) return null;
  const raw = input.value.trim();
  const rutNormalizado = normalizarRut(raw);

  clienteSeleccionado = null;

  if (!rutNormalizado) {
    renderClientNewHelper(false);
    setClientLookupUI();
    toggleClientNameField(false);
    toggleClientPhoneField(false);
    return null;
  }

  if (!/^[0-9]+-[0-9K]$/i.test(rutNormalizado) || !esRutValido(rutNormalizado)) {
    renderClientNewHelper(false);
    toggleClientNameField(false);
    toggleClientPhoneField(false);
    if (!silencioso) setClientLookupUI({ tipo: "error", texto: "Formato de RUT inválido" });
    return null;
  }

  input.value = formatearRutVisual(rutNormalizado);
  setClientLookupUI({ tipo: "loading", texto: "Buscando cliente..." });
  try {
    const cliente = await buscarClientePorRutSupabase(rutNormalizado);
    if (!cliente) {
      const clienteNuevo = construirClienteNuevoDesdeInput(rutNormalizado);
      setClientLookupUI({
        tipo: "new",
        texto: "Cliente nuevo detectado.",
      });
    renderClientNewHelper(true, "Completa nombre y teléfono del cliente nuevo para enviar el pedido.");
    toggleClientNameField(true, { value: clienteNuevo.razon_social, readonly: false });
    toggleClientPhoneField(true, { value: clienteNuevo.client_phone, readonly: false });
    guardarCotizacionPersistida();
    return clienteNuevo;
  }
  clienteSeleccionado = cliente;
    input.value = formatearRutVisual(cliente.rut || cliente.rut_normalized);
    setClientLookupUI({
      tipo: "ok",
      texto: "Cliente encontrado",
      badge: cliente.razon_social,
    });
    renderClientNewHelper(false);
    toggleClientNameField(false);
    toggleClientPhoneField(false);
    guardarCotizacionPersistida();
    return cliente;
  } catch (err) {
    renderClientNewHelper(false);
    setClientLookupUI({ tipo: "error", texto: err.message || "No se pudo validar RUT" });
    toggleClientNameField(false);
    toggleClientPhoneField(false);
    return null;
  }
}

function configurarLookupCliente() {
  const input = document.getElementById("clientRut");
  const nameInput = document.getElementById("clientName");
  const phoneInput = document.getElementById("clientPhone");
  if (!input) return;
  habilitarInputManual(input);
  habilitarInputManual(nameInput);
  habilitarInputManual(phoneInput);
  input.addEventListener("input", () => {
    input.value = formatearRutVisual(input.value);
    clienteSeleccionado = null;
    clearCartFieldInvalid(input);
    setClientLookupUI();
    renderClientNewHelper(false);
    toggleClientNameField(false);
    toggleClientPhoneField(false);
    window.clearTimeout(clientLookupDebounce);
    clientLookupDebounce = window.setTimeout(() => {
      validarRutClienteEnUI({ silencioso: true });
    }, 320);
    guardarCotizacionPersistida();
  });
  input.addEventListener("blur", () => {
    window.clearTimeout(clientLookupDebounce);
    validarRutClienteEnUI();
  });
  nameInput?.addEventListener("input", () => {
    if (clienteSeleccionado) return;
    clearCartFieldInvalid(nameInput);
    const rutNormalizado = normalizarRut(input.value);
    if (!rutNormalizado || !esRutValido(rutNormalizado)) return;
    const nombre = String(nameInput.value || "").trim();
    const telefono = normalizarTelefonoCliente(phoneInput?.value || "");
    renderClientNewHelper(true, nombre && telefono
      ? "Cliente nuevo listo. Ya puedes enviar el pedido."
      : "Completa nombre y teléfono del cliente nuevo para enviar el pedido.");
    setClientLookupUI({
      tipo: "new",
      texto: nombre && telefono
        ? "Cliente nuevo listo. Ya puedes enviar el pedido."
        : "Cliente nuevo. Agrega nombre y teléfono para enviar el pedido.",
    });
    guardarCotizacionPersistida();
  });
  phoneInput?.addEventListener("input", () => {
    if (clienteSeleccionado) return;
    phoneInput.value = normalizarTelefonoCliente(phoneInput.value);
    clearCartFieldInvalid(phoneInput);
    const rutNormalizado = normalizarRut(input.value);
    if (!rutNormalizado || !esRutValido(rutNormalizado)) return;
    const nombre = String(nameInput?.value || "").trim();
    const telefono = normalizarTelefonoCliente(phoneInput.value || "");
    renderClientNewHelper(true, nombre && telefono
      ? "Cliente nuevo listo. Ya puedes enviar el pedido."
      : "Completa nombre y teléfono del cliente nuevo para enviar el pedido.");
    setClientLookupUI({
      tipo: "new",
      texto: nombre && telefono
        ? "Cliente nuevo listo. Ya puedes enviar el pedido."
        : "Cliente nuevo. Agrega nombre y teléfono para enviar el pedido.",
    });
    guardarCotizacionPersistida();
  });
}

async function obtenerClienteParaCotizacion() {
  const rutEl = document.getElementById("clientRut");
  const nameEl = document.getElementById("clientName");
  const phoneEl = document.getElementById("clientPhone");
  clearCartFieldInvalidState();
  const clienteValidado = clienteSeleccionado || await validarRutClienteEnUI();
  const rutNormalizado = normalizarRut(rutEl?.value || "");

  if (!rutNormalizado || !esRutValido(rutNormalizado)) {
    setCartFieldInvalid(rutEl, "Ingresa un RUT válido");
    rutEl?.focus();
    throw new Error("Ingresa un RUT válido");
  }

  if (clienteValidado && !clienteValidado.is_new) {
    return clienteValidado;
  }

  const nombre = String(nameEl?.value || "").trim();
  const telefono = normalizarTelefonoCliente(phoneEl?.value || "");
  if (!nombre) {
    toggleClientNameField(true, { value: "", readonly: false });
    toggleClientPhoneField(true, { value: telefono, readonly: false });
    renderClientNewHelper(true, "Completa nombre y teléfono del cliente nuevo para enviar el pedido.");
    setCartFieldInvalid(nameEl, "Completa el nombre o razón social");
    setClientLookupUI({
      tipo: "error",
      texto: "Agrega nombre y teléfono del cliente nuevo para enviar el pedido.",
    });
    nameEl?.focus();
    throw new Error("Agrega el nombre o razón social del cliente nuevo para enviar el pedido");
  }
  if (!telefono) {
    toggleClientNameField(true, { value: nombre, readonly: false });
    toggleClientPhoneField(true, { value: "", readonly: false });
    renderClientNewHelper(true, "Completa nombre y teléfono del cliente nuevo para enviar el pedido.");
    setCartFieldInvalid(phoneEl, "Completa el teléfono del cliente");
    setClientLookupUI({
      tipo: "error",
      texto: "Agrega el teléfono del cliente nuevo para enviar el pedido.",
    });
    phoneEl?.focus();
    throw new Error("Agrega el teléfono del cliente nuevo para enviar el pedido");
  }

  return {
    rut: formatearRutVisual(rutNormalizado),
    rut_normalized: rutNormalizado,
    razon_social: nombre,
    client_phone: telefono,
    is_new: true,
  };
}

function construirPayloadCotizacion(cliente, itemsGroup = [], source = CATALOG_SOURCE) {
  const createdAtIso = new Date().toISOString();
  const quoteId = (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function")
    ? globalThis.crypto.randomUUID()
    : `q-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let totalItems = 0;
  const lineas = [];

  (Array.isArray(itemsGroup) ? itemsGroup : []).forEach((item) => {
    const itemSource = resolverSourceItemPedido(item, source);
    Object.entries(item.tallas).forEach(([talla, cantidad]) => {
      const qty = Number(cantidad) || 0;
      if (qty <= 0) return;
      totalItems += qty;
      lineas.push({ sku: item.sku, talla, cantidad: qty, source: itemSource });
    });
  });

  const distinctSources = [...new Set((Array.isArray(itemsGroup) ? itemsGroup : []).map((item) => resolverSourceItemPedido(item, source)).filter(Boolean))];
  const quoteSource = distinctSources.length > 1 ? "catalogo-mixto" : (distinctSources[0] || source || CATALOG_SOURCE);

  return {
    quote: {
      id: quoteId,
      store_name: cliente?.razon_social || "",
      client_rut: cliente?.rut || cliente?.rut_normalized || null,
      client_rut_normalized: cliente?.rut_normalized || normalizarRut(cliente?.rut || ""),
      client_phone: cliente?.client_phone || null,
      total_items: totalItems,
      created_at_client: createdAtIso,
      source: quoteSource,
    },
    items: lineas,
  };
}

async function enviarPayloadCotizacionSupabase(payload) {
  if (!supabaseConfigurado()) {
    throw new Error("Configura SUPABASE_URL y SUPABASE_ANON_KEY en script-v2.js");
  }
  if (!payload.items.length) throw new Error("No hay items para guardar");

  const rpcPayload = {
    p_quote: payload.quote,
    p_items: payload.items,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_quote_with_stock_reservation`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rpcPayload),
  });

  if (!res.ok) {
    const errText = await res.text();
    const lower = String(errText || "").toLowerCase();
    if (lower.includes("create_quote_with_stock_reservation")) {
      throw new Error("Falta instalar la función de reserva de stock en Supabase antes de enviar pedidos.");
    }
    if (lower.includes("stock insuficiente") || lower.includes("no se encontró stock")) {
      throw new Error(errText || "No hay stock suficiente para completar el pedido.");
    }
    throw new Error(`Error guardando pedido: ${errText || res.status}`);
  }

  const quoteId = await res.json().catch(() => payload.quote.id);
  if (!quoteId) throw new Error("No se generó ID de pedido");
  return quoteId;
}

async function guardarCotizacionSupabase(cliente) {
  const payload = construirPayloadCotizacion(cliente, pedido, CATALOG_SOURCE);
  return enviarPayloadCotizacionSupabase(payload);
}

async function registrarClienteNuevoSupabase(cliente) {
  if (!supabaseConfigurado() || !cliente?.is_new) return cliente;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/register_client_if_missing`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_rut: cliente?.rut || cliente?.rut_normalized || "",
      p_razon_social: cliente?.razon_social || "",
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    const lower = String(txt || "").toLowerCase();
    if (
      lower.includes("\"code\":\"42702\"") ||
      lower.includes("rut_normalized") ||
      lower.includes("register_client_if_missing") ||
      lower.includes("pl/pgsql")
    ) {
      console.warn("No se pudo registrar el cliente nuevo en Supabase; se continúa con el pedido.", txt);
      return cliente;
    }
    throw new Error(`No se pudo registrar el cliente: ${txt || res.status}`);
  }

  const data = await res.json().catch(() => null);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return cliente;

  return {
    rut: row.rut || cliente.rut,
    rut_normalized: row.rut_normalized || cliente.rut_normalized,
    razon_social: row.razon_social || cliente.razon_social,
    is_new: false,
  };
}

async function loginCotizacionesSupabase(email, password) {
  if (!supabaseConfigurado()) {
    throw new Error("Configura SUPABASE_URL y SUPABASE_ANON_KEY en script-v2.js");
  }

  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error("No se pudo iniciar sesion");
  }

  if (!data?.access_token) throw new Error("No se recibio access_token");
  quotesAccessToken = data.access_token;
  quotesUserEmail = data?.user?.email || email;
  sessionStorage.setItem("quotes_access_token", quotesAccessToken);
  sessionStorage.setItem("quotes_user_email", quotesUserEmail);
}

function logoutCotizaciones() {
  quotesAccessToken = "";
  quotesUserEmail = "";
  sessionStorage.removeItem("quotes_access_token");
  sessionStorage.removeItem("quotes_user_email");
  adminActiveTab = "cotizaciones";
  trazabilidadDisponibles = [];
  stockCatalogRows = [];
  cerrarEditorStock();
  actualizarEstadoQuotesUI();
  const list = document.getElementById("quotesList");
  if (list) list.innerHTML = "";
  const stockList = document.getElementById("stockCatalogList");
  if (stockList) stockList.innerHTML = "";
}

function obtenerDescripcionPorSkuArticle(sku, article) {
  const skuKey = normalizarSkuCatalogo(sku);
  if (skuKey) {
    if (stockBySku?.[skuKey]?.description) return stockBySku[skuKey].description;
    const familyMatch = skuKey.match(/^(\d{4})-/);
    if (familyMatch && stockBySku?.[familyMatch[1]]?.description) return stockBySku[familyMatch[1]].description;
    if (/^\d{4}$/.test(skuKey) && stockBySku?.[`${skuKey}-00`]?.description) return stockBySku[`${skuKey}-00`].description;
  }

  const articleDigits = String(article || "").replace(/\D/g, "");
  if (articleDigits.length >= 8) {
    const model = articleDigits.slice(2, 6);
    const variant = articleDigits.slice(6, 8);
    const skuFromArticle = variant === "00" ? model : `${model}-${variant}`;
    if (stockBySku?.[skuFromArticle]?.description) return stockBySku[skuFromArticle].description;
    if (stockBySku?.[model]?.description) return stockBySku[model].description;
  }
  return "";
}

function crearFilaStockCatalogVacia() {
  return {
    id: null,
    season: "42",
    article_code: "",
    sku: "",
    tiro: "",
    bota: "",
    color: "",
    active: true,
    updated_at: null,
    sizes: TALLAS_DISPONIBLES.map((size, index) => ({
      id: null,
      size_label: size,
      quantity: 0,
      sort_order: (index + 1) * 10,
    })),
    total: 0,
    description: "",
  };
}

function formatStockUpdatedAt(value) {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sin fecha";
  return parsed.toLocaleString();
}

function stockCatalogSummaryText(rows = [], filteredRows = rows) {
  const totalUnits = filteredRows.reduce((acc, row) => acc + (Number(row?.total) || 0), 0);
  const seasonFilter = stockCatalogSeasonFilter || "";
  return `Stock${seasonFilter ? ` T${seasonFilter}` : ""} · Modelos: ${formatNumberCL(filteredRows.length)} de ${formatNumberCL(rows.length)} · Unidades: ${formatNumberCL(totalUnits)}`;
}

function obtenerTallasVisiblesStock(rows = []) {
  const labels = new Set();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    (Array.isArray(row?.sizes) ? row.sizes : []).forEach((sizeRow) => {
      const label = normalizarStockSizeLabel(sizeRow?.size_label);
      if (label) labels.add(label);
    });
  });
  if (!labels.size) {
    TALLAS_DISPONIBLES.forEach((size) => labels.add(size));
  }
  return [...labels].sort(ordenarEtiquetasTalla);
}

function obtenerCantidadTalla(row, sizeLabel) {
  return Math.max(
    0,
    Number(
      (Array.isArray(row?.sizes) ? row.sizes : []).find((sizeRow) => normalizarStockSizeLabel(sizeRow?.size_label) === normalizarStockSizeLabel(sizeLabel))
        ?.quantity
    ) || 0
  );
}

function renderStockSummaryRow(row = crearFilaStockCatalogVacia(), sizeLabels = []) {
  const normalized = normalizarFilaStockCatalog(row);
  const totalClass = normalized.total > 0 ? "stock-sheet-total is-positive" : "stock-sheet-total is-zero";

  return `
    <tr data-stock-id="${normalized.id ?? ""}" class="${normalized.total > 0 ? "stock-row-has-stock" : "stock-row-zero-stock"}">
      <td class="col-code">
        <button type="button" class="stock-code-btn" data-stock-open="${normalized.id ?? ""}">
          ${String(normalized.article_code || normalized.sku || "-").replace(/</g, "&lt;")}
        </button>
      </td>
      <td class="col-sku">${String(normalized.sku || "-").replace(/</g, "&lt;")}</td>
      <td class="col-text">${String(normalized.tiro || "-").replace(/</g, "&lt;")}</td>
      <td class="col-text">${String(normalized.bota || "-").replace(/</g, "&lt;")}</td>
      <td class="col-text">${String(normalized.color || "-").replace(/</g, "&lt;")}</td>
      ${sizeLabels.map((sizeLabel) => `<td class="col-size">${formatNumberCL(obtenerCantidadTalla(normalized, sizeLabel))}</td>`).join("")}
      <td class="col-total ${totalClass}">${formatNumberCL(normalized.total)}</td>
      <td class="col-meta">${formatStockUpdatedAt(normalized.updated_at)}</td>
      <td class="col-actions">
        <button type="button" class="ghost-btn stock-row-action" data-stock-open="${normalized.id ?? ""}">Editar</button>
      </td>
    </tr>
  `;
}

function renderStockCatalogAdmin(rows = []) {
  const list = document.getElementById("stockCatalogList");
  if (!list) return;

  const filteredRows = Array.isArray(rows) ? rows : [];
  const summaryEl = document.getElementById("stockCatalogSummary");
  if (summaryEl) summaryEl.innerText = stockCatalogSummaryText(stockCatalogRows, filteredRows);
  const visibleSizes = obtenerTallasVisiblesStock(filteredRows.length ? filteredRows : stockCatalogRows);

  const rowsHtml = filteredRows
    .slice()
    .sort(compararFilasStock)
    .map((row) => renderStockSummaryRow(row, visibleSizes))
    .join("");

  list.innerHTML = `
    <div class="stock-sheet-wrap">
      <table class="stock-sheet">
        <thead>
          <tr>
            <th class="col-code"><span class="stock-head-label">CODIGO</span></th>
            <th class="col-sku"><span class="stock-head-label">SKU</span></th>
            <th class="col-text"><span class="stock-head-label">TIRO</span></th>
            <th class="col-text"><span class="stock-head-label">BOTA</span></th>
            <th class="col-text"><span class="stock-head-label">COLOR</span></th>
            ${visibleSizes.map((size) => `<th class="col-size is-numeric"><span class="stock-head-label">${size}</span></th>`).join("")}
            <th class="col-total is-numeric"><span class="stock-head-label">TOTAL</span></th>
            <th class="col-meta"><span class="stock-head-label">EDITADO</span></th>
            <th class="col-actions"><span class="stock-head-label">ACCION</span></th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="${visibleSizes.length + 8}" class="stock-sheet-empty">No hay modelos para mostrar.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function aplicarFiltroStockCatalogAdmin() {
  const input = document.getElementById("stockCatalogSearchInput");
  const seasonFilter = stockCatalogSeasonFilter;
  const query = normalizarBusquedaModelo(input?.value || "");
  const base = Array.isArray(stockCatalogRows) ? stockCatalogRows : [];
  const seasonRows = seasonFilter ? base.filter((row) => String(row?.season || "") === seasonFilter) : base;
  const filtered = query
    ? seasonRows.filter((row) => {
      const tokens = [
        row?.season,
        row?.sku,
        row?.article_code,
        row?.tiro,
        row?.bota,
        row?.color,
        row?.description,
      ]
        .map((value) => normalizarBusquedaModelo(value))
        .filter(Boolean);
      return tokens.some((token) => token.includes(query));
    })
    : seasonRows;

  renderStockCatalogAdmin(filtered);
}

function abrirEditorStock(row = null) {
  stockEditorState = {
    open: true,
    mode: row?.id ? "edit" : "create",
    item: normalizarFilaStockCatalog(row || crearFilaStockCatalogVacia()),
  };
  renderStockEditorModal();
}

function cerrarEditorStock() {
  stockEditorState = {
    open: false,
    mode: "edit",
    item: null,
  };
  renderStockEditorModal();
}

function renderStockEditorModal() {
  const modal = document.getElementById("stockEditorModal");
  const body = document.getElementById("stockEditorBody");
  const title = document.getElementById("stockEditorTitle");
  const subtitle = document.getElementById("stockEditorSubtitle");
  const deleteBtn = document.getElementById("stockEditorDeleteBtn");
  if (!modal || !body) return;

  if (!stockEditorState.open || !stockEditorState.item) {
    modal.classList.remove("active");
    modal.setAttribute("hidden", "hidden");
    body.innerHTML = "";
    return;
  }

  const item = normalizarFilaStockCatalog(stockEditorState.item);
  const rowsHtml = (Array.isArray(item.sizes) ? item.sizes : [])
    .map((sizeRow, index) => {
      const isExistingSize = Boolean(item.id && sizeRow.size_label);
      return `
      <div class="stock-editor-size-row ${isExistingSize ? "is-readonly" : "is-editable"}" data-size-index="${index}">
        <input class="stock-editor-size-label-input" type="text" name="size_label" value="${String(sizeRow.size_label || "").replace(/"/g, "&quot;")}" placeholder="Talla" ${isExistingSize ? "readonly" : ""}>
        <input class="stock-editor-size-qty-input" type="number" min="0" step="1" name="quantity" value="${Math.max(0, Number(sizeRow.quantity) || 0)}" placeholder="Cantidad">
        ${isExistingSize
          ? '<span class="stock-editor-size-lock">Talla fija</span>'
          : `<button type="button" class="ghost-btn stock-editor-size-remove" data-size-remove="${index}">Quitar</button>`}
      </div>
    `;
    })
    .join("");

  if (title) title.innerText = item.id ? `Editar ${item.article_code || item.sku}` : "Nuevo modelo";
  if (subtitle) subtitle.innerText = item.updated_at ? `Última edición: ${formatStockUpdatedAt(item.updated_at)}` : "Completa los datos del artículo y sus tallas.";
  if (deleteBtn) deleteBtn.style.display = item.id ? "inline-flex" : "none";

  body.innerHTML = `
    <div class="stock-editor-grid">
      <label>
        <span>Temporada</span>
        <input type="text" name="season" value="${String(item.season || "42").replace(/"/g, "&quot;")}" placeholder="42">
      </label>
      <label>
        <span>Código</span>
        <input type="text" name="article_code" value="${String(item.article_code || "").replace(/"/g, "&quot;")}" placeholder="420100">
      </label>
      <label>
        <span>SKU</span>
        <input type="text" name="sku" value="${String(item.sku || "").replace(/"/g, "&quot;")}" placeholder="4201-00">
      </label>
      <label>
        <span>Tiro</span>
        <input type="text" name="tiro" value="${String(item.tiro || "").replace(/"/g, "&quot;")}" placeholder="CINTURA">
      </label>
      <label>
        <span>Bota</span>
        <input type="text" name="bota" value="${String(item.bota || "").replace(/"/g, "&quot;")}" placeholder="PITILLO">
      </label>
      <label>
        <span>Color</span>
        <input type="text" name="color" value="${String(item.color || "").replace(/"/g, "&quot;")}" placeholder="NEGRO">
      </label>
    </div>
    <label class="stock-editor-toggle">
      <input type="checkbox" name="active" ${item.active ? "checked" : ""}>
      <span>Activo</span>
    </label>
    <div class="stock-editor-sizes-head">
      <strong>Tallas</strong>
      <button type="button" class="ghost-btn" id="stockEditorAddSizeBtn">Agregar talla</button>
    </div>
    <div id="stockEditorSizesList" class="stock-editor-sizes-list">
      ${rowsHtml || `<div class="stock-editor-empty">No hay tallas todavía.</div>`}
    </div>
    ${item.id ? '<div class="stock-editor-note">Las tallas actuales quedan bloqueadas. Si necesitas agregar una nueva, usa "Agregar talla".</div>' : ""}
    <div class="stock-editor-total">Total unidades: <strong>${formatNumberCL(item.total)}</strong></div>
  `;

  modal.removeAttribute("hidden");
  modal.classList.add("active");
}

function leerStockEditorActual() {
  const body = document.getElementById("stockEditorBody");
  if (!body) return normalizarFilaStockCatalog(crearFilaStockCatalogVacia());
  const read = (name) => body.querySelector(`[name="${name}"]`);
  const articleCodeInput = String(read("article_code")?.value || "").trim();
  const skuInput = normalizarSkuCatalogo(read("sku")?.value || "");
  const season = String(read("season")?.value || "42").trim() || "42";
  const sizes = [...body.querySelectorAll(".stock-editor-size-row")]
    .map((row, index) => ({
      id: null,
      size_label: normalizarStockSizeLabel(row.querySelector('[name="size_label"]')?.value || ""),
      quantity: Math.max(0, Number(row.querySelector('[name="quantity"]')?.value) || 0),
      sort_order: (index + 1) * 10,
    }))
    .filter((sizeRow) => sizeRow.size_label);

  return normalizarFilaStockCatalog({
    id: stockEditorState.item?.id ?? null,
    season,
    article_code: articleCodeInput || skuAArticleCode(skuInput),
    sku: skuInput || normalizarSkuCatalogo(articleCodeInput),
    tiro: String(read("tiro")?.value || "").trim().toUpperCase(),
    bota: String(read("bota")?.value || "").trim().toUpperCase(),
    color: String(read("color")?.value || "").trim().toUpperCase(),
    active: !!read("active")?.checked,
    updated_at: stockEditorState.item?.updated_at || null,
    sizes,
  });
}

function actualizarEditorStockDesdeDOM() {
  if (!stockEditorState.open) return;
  stockEditorState.item = leerStockEditorActual();
  renderStockEditorModal();
}

function agregarTallaEditorStock() {
  const current = leerStockEditorActual();
  current.sizes.push({
    id: null,
    size_label: "",
    quantity: 0,
    sort_order: ((current.sizes.length + 1) * 10),
  });
  stockEditorState.item = current;
  renderStockEditorModal();
}

function quitarTallaEditorStock(index) {
  const current = leerStockEditorActual();
  current.sizes = current.sizes.filter((_, rowIndex) => rowIndex !== index);
  stockEditorState.item = current;
  renderStockEditorModal();
}

function construirPayloadStockItem(item) {
  const normalized = normalizarFilaStockCatalog(item);
  const payload = {
    season: String(normalized.season || "42").trim() || "42",
    sku: normalizarSkuCatalogo(normalized.sku || normalized.article_code),
    article_code: String(normalized.article_code || skuAArticleCode(normalized.sku)).trim(),
    tiro: String(normalized.tiro || "").trim().toUpperCase(),
    bota: String(normalized.bota || "").trim().toUpperCase(),
    color: String(normalized.color || "").trim().toUpperCase(),
    active: normalized.active !== false,
  };
  const sizes = normalizarTallasStock(normalized.sizes)
    .filter((sizeRow) => sizeRow.size_label)
    .map((sizeRow, index) => ({
      stock_item_id: normalized.id ?? null,
      size_label: sizeRow.size_label,
      quantity: Math.max(0, Number(sizeRow.quantity) || 0),
      sort_order: (index + 1) * 10,
    }));
  return { item: payload, sizes };
}

async function guardarStockCatalogAdmin(payload, options = {}) {
  if (!quotesAccessToken) throw new Error("Debes iniciar sesion");
  const id = options?.id;
  const stockPayload = construirPayloadStockItem(payload);
  if (!stockPayload.item.article_code || !stockPayload.item.sku) {
    throw new Error("Completa código y SKU antes de guardar");
  }

  const itemRes = await fetch(
    id
      ? `${SUPABASE_URL}/rest/v1/stock_items?id=eq.${id}`
      : `${SUPABASE_URL}/rest/v1/stock_items`,
    {
      method: id ? "PATCH" : "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${quotesAccessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(id ? stockPayload.item : [stockPayload.item]),
    }
  );

  if (!itemRes.ok) {
    if (itemRes.status === 401 || itemRes.status === 403) {
      logoutCotizaciones();
      throw new Error("No se pudo iniciar sesion");
    }
    const txt = await itemRes.text();
    throw new Error(`No se pudo guardar stock: ${txt || itemRes.status}`);
  }

  const itemData = await itemRes.json().catch(() => []);
  const savedItem = Array.isArray(itemData) ? itemData[0] : itemData;
  const stockItemId = Number(savedItem?.id || id || 0);
  if (!stockItemId) throw new Error("No se pudo obtener el ID del artículo");

  const deleteSizesRes = await fetch(`${SUPABASE_URL}/rest/v1/stock_item_sizes?stock_item_id=eq.${stockItemId}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${quotesAccessToken}`,
      Prefer: "return=minimal",
    },
  });

  if (!deleteSizesRes.ok) {
    if (deleteSizesRes.status === 401 || deleteSizesRes.status === 403) {
      logoutCotizaciones();
      throw new Error("No se pudo iniciar sesion");
    }
    const txt = await deleteSizesRes.text();
    throw new Error(`No se pudieron actualizar tallas: ${txt || deleteSizesRes.status}`);
  }

  const sizesPayload = stockPayload.sizes
    .filter((sizeRow) => sizeRow.size_label)
    .map((sizeRow) => ({
      stock_item_id: stockItemId,
      size_label: sizeRow.size_label,
      quantity: Math.max(0, Number(sizeRow.quantity) || 0),
      sort_order: sizeRow.sort_order,
    }));

  if (sizesPayload.length) {
    const sizesRes = await fetch(`${SUPABASE_URL}/rest/v1/stock_item_sizes`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${quotesAccessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(sizesPayload),
    });

    if (!sizesRes.ok) {
      if (sizesRes.status === 401 || sizesRes.status === 403) {
        logoutCotizaciones();
        throw new Error("No se pudo iniciar sesion");
      }
      const txt = await sizesRes.text();
      throw new Error(`No se pudieron guardar tallas: ${txt || sizesRes.status}`);
    }
  }

  return stockItemId;
}

async function eliminarStockCatalogAdmin(itemId) {
  if (!quotesAccessToken) throw new Error("Debes iniciar sesion");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/stock_items?id=eq.${itemId}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${quotesAccessToken}`,
      Prefer: "return=minimal",
    },
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      logoutCotizaciones();
      throw new Error("No se pudo iniciar sesion");
    }
    const txt = await res.text();
    throw new Error(`No se pudo eliminar stock: ${txt || res.status}`);
  }
}

async function cargarStockCatalogAdmin() {
  if (!quotesAccessToken) throw new Error("Debes iniciar sesion");

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/stock_items?select=id,season,article_code,sku,tiro,bota,color,active,updated_at,stock_item_sizes(id,size_label,quantity,sort_order),stock_item_reserve_sizes(size_label,reserve_quantity)&order=season.asc,sku.asc`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${quotesAccessToken}`,
      },
    }
  );

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      logoutCotizaciones();
      throw new Error("No se pudo iniciar sesion");
    }
    const txt = await res.text();
    throw new Error(`No se pudo cargar Stock: ${txt || res.status}`);
  }

  const data = await res.json();
  stockCatalogRows = (Array.isArray(data) ? data : []).map((row) => normalizarFilaStockCatalog(row));
  aplicarFiltroStockCatalogAdmin();
  if (stockEditorState.open && stockEditorState.item?.id) {
    const refreshed = stockCatalogRows.find((row) => Number(row.id) === Number(stockEditorState.item.id));
    if (refreshed) {
      stockEditorState.item = refreshed;
      renderStockEditorModal();
    }
  }
}

function normalizarBusquedaModelo(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/-00/g, "");
}

function activarTabAdmin(tab = "cotizaciones", { cargar = true } = {}) {
  adminActiveTab = ["cotizaciones", "reporte", "stock"].includes(tab) ? tab : "cotizaciones";

  const btnCot = document.getElementById("quotesTabCotizaciones");
  const btnRep = document.getElementById("quotesTabReporte");
  const btnStock = document.getElementById("quotesTabStock");
  const panelCot = document.getElementById("quotesCotizacionesPanel");
  const panelRep = document.getElementById("quotesReportePanel");
  const panelStock = document.getElementById("quotesStockPanel");

  const isCot = adminActiveTab === "cotizaciones";
  const isRep = adminActiveTab === "reporte";
  const isStock = adminActiveTab === "stock";
  btnCot?.classList.toggle("active", isCot);
  btnRep?.classList.toggle("active", isRep);
  btnStock?.classList.toggle("active", isStock);
  if (panelCot) panelCot.style.display = isCot ? "flex" : "none";
  if (panelRep) panelRep.style.display = isRep ? "flex" : "none";
  if (panelStock) panelStock.style.display = isStock ? "flex" : "none";

  if (!quotesAccessToken || !cargar) return;
  if (isCot || isRep) {
    cargarCotizacionesAdmin().catch((err) => {
      actualizarEstadoQuotesUI("");
      if ((err?.message || "").toLowerCase().includes("iniciar sesion")) {
        mostrarToastError("No se pudo iniciar sesion", "Vuelve a ingresar tus credenciales.");
      } else {
        mostrarToastError("No se pudo cargar", err?.message || "Error cargando pedidos.");
      }
    });
    return;
  }
  if (isStock) {
    cargarStockCatalogAdmin().catch((err) => {
      const summaryEl = document.getElementById("stockCatalogSummary");
      if (summaryEl) summaryEl.innerText = err.message || "No se pudo cargar Stock";
      renderStockCatalogAdmin([]);
    });
    return;
  }
}

function actualizarEstadoQuotesUI(msg = "") {
  const loginSection = document.getElementById("quotesLoginSection");
  const panel = document.getElementById("quotesPanel");
  const badge = document.getElementById("quotesUserBadge");
  const tabs = document.getElementById("quotesAdminTabs");
  const msgEl = document.getElementById("quotesLoginMsg");
  const refreshBtn = document.getElementById("refreshQuotesBtn");
  const logoutBtn = document.getElementById("logoutQuotesBtn");
  const quotesModalContent = document.querySelector("#quotesModal .quotes-modal-content");
  const quotesAdminWrap = document.querySelector("#quotesModal .quotes-admin");
  const autenticado = !!quotesAccessToken;

  if (msgEl) msgEl.innerText = msg;
  if (loginSection) loginSection.style.display = autenticado ? "none" : "flex";
  if (panel) panel.style.display = autenticado ? "flex" : "none";
  if (tabs) tabs.style.display = autenticado ? "flex" : "none";
  if (badge) badge.innerText = autenticado ? `Sesion: ${quotesUserEmail}` : "";
  if (refreshBtn) refreshBtn.style.display = autenticado ? "inline-flex" : "none";
  if (logoutBtn) logoutBtn.style.display = autenticado ? "inline-flex" : "none";
  quotesModalContent?.classList.toggle("login-only", !autenticado);
  quotesAdminWrap?.classList.toggle("login-only", !autenticado);
  if (autenticado) activarTabAdmin(adminActiveTab, { cargar: false });
}

function agruparItemsPorQuote(items = []) {
  const map = new Map();
  items.forEach((it) => {
    if (!map.has(it.quote_id)) map.set(it.quote_id, []);
    map.get(it.quote_id).push(it);
  });
  return map;
}

function agruparDetallePorModelo(items = []) {
  const map = new Map();
  items.forEach((it) => {
    const sku = String(it.sku || "");
    if (!sku) return;
    if (!map.has(sku)) map.set(sku, {});
    const tallas = map.get(sku);
    const talla = String(it.size || "");
    tallas[talla] = (Number(tallas[talla]) || 0) + (Number(it.quantity) || 0);
  });
  return [...map.entries()].map(([sku, tallas]) => ({ sku, tallas }));
}

function obtenerCotizacionesFiltradas(quotes = []) {
  if (quotesStatusFilter === "ready") return quotes.filter((q) => !!q.is_ready);
  if (quotesStatusFilter === "open") return quotes.filter((q) => !q.is_ready);
  return quotes;
}

function obtenerClaveMesDesdeFecha(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function obtenerEtiquetaMesDesdeClave(monthKey = "") {
  const match = String(monthKey || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return "";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = new Date(year, month - 1, 1);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
}

function obtenerClaveMesActual() {
  return obtenerClaveMesDesdeFecha(new Date());
}

function obtenerCotizacionesMesSeleccionado(quotes = []) {
  if (quotesMonthFilter === "all") return quotes;
  const selected = quotesMonthFilter || obtenerClaveMesActual();
  return quotes.filter((q) => {
    if (!q?.created_at) return false;
    return obtenerClaveMesDesdeFecha(q.created_at) === selected;
  });
}

function obtenerEtiquetaMesSeleccionado() {
  if (quotesMonthFilter === "all") return "todos los meses";
  return obtenerEtiquetaMesDesdeClave(quotesMonthFilter || obtenerClaveMesActual()) || obtenerEtiquetaMesDesdeClave(obtenerClaveMesActual());
}

function obtenerOpcionesMesCotizaciones(quotes = []) {
  const monthMap = new Map();
  quotes.forEach((quote) => {
    const monthKey = obtenerClaveMesDesdeFecha(quote?.created_at);
    if (!monthKey || monthMap.has(monthKey)) return;
    monthMap.set(monthKey, {
      value: monthKey,
      label: obtenerEtiquetaMesDesdeClave(monthKey) || monthKey,
    });
  });

  const options = [...monthMap.values()].sort((a, b) => b.value.localeCompare(a.value));
  const currentKey = obtenerClaveMesActual();
  if (!monthMap.has(currentKey)) {
    options.unshift({
      value: currentKey,
      label: obtenerEtiquetaMesDesdeClave(currentKey) || currentKey,
    });
  }
  options.unshift({ value: "all", label: "Todos los meses" });
  return options;
}

function normalizarTextoCeldaExcel(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function buscarIndicesBaseVendedores(row = []) {
  const normalized = row.map((value) => normalizarTextoCeldaExcel(value).toUpperCase());
  const rutIndex = normalized.findIndex((value) => value === "RUT");
  const razonSocialIndex = normalized.findIndex((value) => value === "RAZON SOCIAL");
  const vendedorIndex = normalized.findIndex((value) => value === "VENDEDOR");
  if (rutIndex === -1 || vendedorIndex === -1) return null;
  return { rutIndex, razonSocialIndex, vendedorIndex };
}

async function cargarBaseVendedoresDesdeExcel(file) {
  const XlsxPopulate = await loadXlsxPopulate();
  const workbook = await XlsxPopulate.fromDataAsync(await file.arrayBuffer());
  const sheet = workbook.sheet("BASE DE DATOS OFICIAL") || workbook.sheets()[0];
  if (!sheet) throw new Error("No se encontró la hoja BASE DE DATOS OFICIAL");
  const usedRange = sheet.usedRange();
  const values = usedRange ? usedRange.value() : [];
  const rows = Array.isArray(values?.[0]) ? values : [];
  if (!rows.length) throw new Error("La hoja BASE DE DATOS OFICIAL viene vacía");

  let indices = null;
  let headerRowIndex = -1;
  rows.some((row, index) => {
    const found = buscarIndicesBaseVendedores(Array.isArray(row) ? row : []);
    if (!found) return false;
    indices = found;
    headerRowIndex = index;
    return true;
  });

  if (!indices) throw new Error("No pude ubicar las columnas RUT y VENDEDOR en la base");

  const result = [];
  const seenRuts = new Set();
  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const row = Array.isArray(rows[i]) ? rows[i] : [];
    const rutRaw = row[indices.rutIndex];
    const vendedorRaw = row[indices.vendedorIndex];
    const razonSocialRaw = indices.razonSocialIndex >= 0 ? row[indices.razonSocialIndex] : "";
    const rutNormalized = normalizarRut(rutRaw);
    const vendedor = normalizarTextoCeldaExcel(vendedorRaw);
    const razonSocial = normalizarTextoCeldaExcel(razonSocialRaw);
    if (!rutNormalized || !vendedor) continue;
    if (seenRuts.has(rutNormalized)) continue;
    seenRuts.add(rutNormalized);
    result.push({
      rut: normalizarTextoCeldaExcel(rutRaw),
      rut_normalized: rutNormalized,
      razon_social: razonSocial,
      vendedor,
    });
  }

  if (!result.length) throw new Error("La base no trajo filas válidas de clientes con vendedor");

  vendorCoverageRows = result;
  vendorCoverageWorkbookName = file.name || "base-vendedores.xlsx";
}

function construirResumenCoberturaVendedores(quotes = []) {
  if (!Array.isArray(vendorCoverageRows) || !vendorCoverageRows.length) return null;

  const quotesMes = obtenerCotizacionesMesSeleccionado(quotes);
  const vendorMap = new Map();
  const landingRutSet = new Set();
  const unmatchedQuotes = [];

  quotesMes.forEach((quote) => {
    const rutNormalized = normalizarRut(quote?.client_rut_normalized || quote?.client_rut || "");
    if (rutNormalized) landingRutSet.add(rutNormalized);
  });

  vendorCoverageRows.forEach((row) => {
    const vendedor = row.vendedor || "Sin vendedor";
    if (!vendorMap.has(vendedor)) {
      vendorMap.set(vendedor, {
        vendedor,
        total_clientes: 0,
        clientes_landing: 0,
        clientes_fuera: 0,
      });
    }
    const entry = vendorMap.get(vendedor);
    entry.total_clientes += 1;
    if (landingRutSet.has(row.rut_normalized)) entry.clientes_landing += 1;
  });

  const baseRutSet = new Set(vendorCoverageRows.map((row) => row.rut_normalized).filter(Boolean));
  quotesMes.forEach((quote) => {
    const rutNormalized = normalizarRut(quote?.client_rut_normalized || quote?.client_rut || "");
    if (!rutNormalized || baseRutSet.has(rutNormalized)) return;
    unmatchedQuotes.push(quote);
  });

  const vendors = [...vendorMap.values()]
    .map((entry) => ({
      ...entry,
      clientes_fuera: Math.max(0, entry.total_clientes - entry.clientes_landing),
      porcentaje_landing: entry.total_clientes ? (entry.clientes_landing / entry.total_clientes) * 100 : 0,
    }))
    .sort((a, b) => b.total_clientes - a.total_clientes || a.vendedor.localeCompare(b.vendedor));

  const totalClientes = vendors.reduce((acc, entry) => acc + entry.total_clientes, 0);
  const totalLanding = vendors.reduce((acc, entry) => acc + entry.clientes_landing, 0);

  return {
    workbookName: vendorCoverageWorkbookName,
    vendors,
    totalClientes,
    totalLanding,
    unmatchedQuotes,
  };
}

function renderCoberturaVendedoresAdmin(quotes = []) {
  const resumen = construirResumenCoberturaVendedores(quotes);
  const mesLabel = obtenerEtiquetaMesSeleccionado();
  const uploader = `
    <div class="quotes-vendor-upload">
      <div>
        <div class="quotes-report-kicker">Cruce clientes vs landing</div>
        <div class="quotes-report-title">Cobertura por vendedor</div>
        <p class="quotes-vendor-upload-copy">Carga la hoja <strong>BASE DE DATOS OFICIAL</strong> de la planilla para cruzar RUT cliente con vendedor y medir qué porcentaje pasó por la landing en <strong>${escapeHtmlExcel(mesLabel)}</strong>.</p>
      </div>
      <label class="quotes-vendor-upload-btn">
        <input id="vendorCoverageFileInput" type="file" accept=".xlsx,.xlsm,.xltx,.xltm" hidden>
        <span>Cargar base vendedores</span>
      </label>
    </div>
  `;

  if (!resumen) {
    return `
      <div class="quotes-report-card quotes-vendor-report-card">
        ${uploader}
        <div class="quotes-vendor-empty">Aún no cargas la base de vendedores. Cuando la subas, aquí aparecerá el porcentaje por vendedor dentro de Admin.</div>
      </div>
    `;
  }

  const rows = resumen.vendors.map((entry) => `
    <tr>
      <td>${escapeHtmlExcel(entry.vendedor)}</td>
      <td class="is-num">${escapeHtmlExcel(entry.total_clientes)}</td>
      <td class="is-num">${escapeHtmlExcel(entry.clientes_landing)}</td>
      <td class="is-num">${escapeHtmlExcel(entry.clientes_fuera)}</td>
      <td class="is-num">${escapeHtmlExcel(`${entry.porcentaje_landing.toFixed(1)}%`)}</td>
    </tr>
  `).join("");

  return `
    <div class="quotes-report-card quotes-vendor-report-card">
      ${uploader}
      <div class="quotes-vendor-summary">
        <div class="quotes-report-metric">
          <span>Base cargada</span>
          <strong>${escapeHtmlExcel(resumen.workbookName)}</strong>
        </div>
        <div class="quotes-report-metric">
          <span>Total clientes base</span>
          <strong>${escapeHtmlExcel(resumen.totalClientes)}</strong>
        </div>
        <div class="quotes-report-metric is-ready">
          <span>Con pedido landing</span>
          <strong>${escapeHtmlExcel(resumen.totalLanding)}</strong>
        </div>
        <div class="quotes-report-metric is-open">
          <span>Sin pedido landing</span>
          <strong>${escapeHtmlExcel(Math.max(0, resumen.totalClientes - resumen.totalLanding))}</strong>
        </div>
      </div>
      <div class="quotes-vendor-table-wrap">
        <table class="quotes-report-preview-table quotes-vendor-table">
          <thead>
            <tr>
              <th>Vendedor</th>
              <th>Total clientes</th>
              <th>Con landing</th>
              <th>Sin landing</th>
              <th>% landing</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="quotes-vendor-note">Este cruce cuenta clientes únicos por RUT y toma todos los pedidos landing de ${escapeHtmlExcel(mesLabel)}, sin importar si están listos o no.</div>
      ${resumen.unmatchedQuotes.length ? `<div class="quotes-vendor-note">Hay ${escapeHtmlExcel(resumen.unmatchedQuotes.length)} pedidos landing de ${escapeHtmlExcel(mesLabel)} cuyo RUT no apareció en la base cargada.</div>` : ""}
    </div>
  `;
}

function obtenerEtiquetaFiltroCotizaciones() {
  if (quotesStatusFilter === "ready") return "Listas";
  if (quotesStatusFilter === "open") return "No listas / caidas";
  return "Todas";
}

function construirResumenVentasColecciones(quotes = [], itemsMap = new Map()) {
  const quotesMes = obtenerCotizacionesFiltradas(obtenerCotizacionesMesSeleccionado(quotes));
  const collections = {
    "catalogo-42": {
      key: "catalogo-42",
      label: "Cole 42",
      totalPrendas: 0,
      totalDinero: 0,
      totalPedidos: 0,
      sizes: {},
      models: new Map(),
    },
    "catalogo-43": {
      key: "catalogo-43",
      label: "Cole 43",
      totalPrendas: 0,
      totalDinero: 0,
      totalPedidos: 0,
      sizes: {},
      models: new Map(),
    },
  };

  quotesMes.forEach((quote) => {
    const detalles = Array.isArray(itemsMap.get(quote.id)) ? itemsMap.get(quote.id) : [];
    const touchedCollections = new Set();
    detalles.forEach((item) => {
      const qty = Number(item?.quantity) || 0;
      if (qty <= 0) return;
      const sku = normalizarSkuCatalogo(item?.sku);
      if (!sku) return;
      const source = String(item?.source || inferirCatalogoDesdeSku(sku) || quote?.source || CATALOG_SOURCE).trim() || CATALOG_SOURCE;
      const collectionKey = source === "catalogo-43" ? "catalogo-43" : "catalogo-42";
      const collection = collections[collectionKey];
      const size = String(item?.size || "").trim().toUpperCase() || "SIN TALLA";
      const precioUnitario = Number(obtenerPrecioCatalogo(sku, source)) || 0;
      const totalLinea = precioUnitario * qty;

      touchedCollections.add(collectionKey);
      collection.totalPrendas += qty;
      collection.totalDinero += totalLinea;
      collection.sizes[size] = (Number(collection.sizes[size]) || 0) + qty;

      if (!collection.models.has(sku)) {
        collection.models.set(sku, {
          sku,
          prendas: 0,
          dinero: 0,
          sizes: {},
        });
      }
      const modelEntry = collection.models.get(sku);
      modelEntry.prendas += qty;
      modelEntry.dinero += totalLinea;
      modelEntry.sizes[size] = (Number(modelEntry.sizes[size]) || 0) + qty;
    });

    touchedCollections.forEach((key) => {
      collections[key].totalPedidos += 1;
    });
  });

  const collectionList = Object.values(collections).map((collection) => ({
    ...collection,
    sizesList: Object.entries(collection.sizes)
      .map(([size, prendas]) => ({ size, prendas: Number(prendas) || 0 }))
      .sort((a, b) => String(a.size).localeCompare(String(b.size), undefined, { numeric: true })),
    modelsList: [...collection.models.values()]
      .map((model) => ({
        ...model,
        sizesText: Object.entries(model.sizes)
          .sort((a, b) => String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true }))
          .map(([size, prendas]) => `T${size}: ${prendas}`)
          .join(" · "),
      }))
      .sort((a, b) => b.prendas - a.prendas || a.sku.localeCompare(b.sku, undefined, { numeric: true })),
  }));

  return {
    monthLabel: obtenerEtiquetaMesSeleccionado(),
    filterLabel: obtenerEtiquetaFiltroCotizaciones(),
    totalPedidos: quotesMes.length,
    totalPrendas: collectionList.reduce((acc, collection) => acc + collection.totalPrendas, 0),
    totalDinero: collectionList.reduce((acc, collection) => acc + collection.totalDinero, 0),
    collections: collectionList,
  };
}

function generarExcelHtmlResumenVentasColecciones(quotes = [], itemsMap = new Map()) {
  const resumen = construirResumenVentasColecciones(quotes, itemsMap);
  const resumenRows = resumen.collections.map((collection) => `
    <tr>
      <td>${escapeHtmlExcel(collection.label)}</td>
      <td class="num">${escapeHtmlExcel(collection.totalPedidos)}</td>
      <td class="num">${escapeHtmlExcel(collection.totalPrendas)}</td>
      <td class="num">${escapeHtmlExcel(formatearPrecioCLP(collection.totalDinero) || "$0")}</td>
    </tr>
  `).join("");

  const tallasSections = resumen.collections.map((collection) => {
    const rows = collection.sizesList.length
      ? collection.sizesList.map((entry) => `
        <tr>
          <td>${escapeHtmlExcel(collection.label)}</td>
          <td>${escapeHtmlExcel(entry.size)}</td>
          <td class="num">${escapeHtmlExcel(entry.prendas)}</td>
        </tr>
      `).join("")
      : `<tr><td>${escapeHtmlExcel(collection.label)}</td><td>-</td><td class="num">0</td></tr>`;
    return rows;
  }).join("");

  const modelosSections = resumen.collections.map((collection) => {
    if (!collection.modelsList.length) {
      return `
        <tr class="section-row"><td colspan="5">${escapeHtmlExcel(collection.label)}</td></tr>
        <tr><td colspan="5">Sin ventas en este filtro.</td></tr>
      `;
    }
    const rows = collection.modelsList.map((model) => `
      <tr>
        <td>${escapeHtmlExcel(collection.label)}</td>
        <td>${escapeHtmlExcel(model.sku)}</td>
        <td class="num">${escapeHtmlExcel(model.prendas)}</td>
        <td class="num">${escapeHtmlExcel(formatearPrecioCLP(model.dinero) || "$0")}</td>
        <td>${escapeHtmlExcel(model.sizesText || "-")}</td>
      </tr>
    `).join("");
    return `
      <tr class="section-row"><td colspan="5">${escapeHtmlExcel(collection.label)}</td></tr>
      ${rows}
    `;
  }).join("");

  return `\uFEFF<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="application/vnd.ms-excel; charset=UTF-8" />
<style>
  body{font-family:Calibri,Segoe UI,Arial,sans-serif;background:#fff;color:#0f172a}
  table{border-collapse:collapse;width:100%}
  td,th{border:1px solid #dbe2ea;padding:6px 8px;font-size:11pt;vertical-align:top}
  .title{background:#111827;color:#fff;font-weight:700;font-size:14pt}
  .subtitle{background:#f8fafc;color:#334155}
  .section{background:#d71920;color:#fff;font-weight:700}
  .section-row td{background:#e5e7eb;color:#0f172a;font-weight:700}
  .header th{background:#111827;color:#fff;font-weight:700;text-align:left}
  .num{text-align:right;white-space:nowrap}
  .spacer td{border:none;height:10px;background:#fff}
</style>
</head>
<body>
  <table>
    <tr><td class="title" colspan="4">REPORTE VENTAS COLE 42 Y COLE 43</td></tr>
    <tr><td class="subtitle" colspan="4">Mes: ${escapeHtmlExcel(resumen.monthLabel)} · Filtro: ${escapeHtmlExcel(resumen.filterLabel)}</td></tr>
    <tr><td>Total pedidos</td><td class="num">${escapeHtmlExcel(resumen.totalPedidos)}</td><td>Total prendas</td><td class="num">${escapeHtmlExcel(resumen.totalPrendas)}</td></tr>
    <tr><td colspan="3">Total dinero web</td><td class="num">${escapeHtmlExcel(formatearPrecioCLP(resumen.totalDinero) || "$0")}</td></tr>
    <tr class="spacer"><td colspan="4"></td></tr>
    <tr><td class="section" colspan="4">RESUMEN POR COLECCION</td></tr>
    <tr class="header"><th>Coleccion</th><th>Pedidos</th><th>Prendas</th><th>Dinero web</th></tr>
    ${resumenRows || '<tr><td colspan="4">Sin datos</td></tr>'}
    <tr class="spacer"><td colspan="4"></td></tr>
    <tr><td class="section" colspan="4">TALLAS VENDIDAS</td></tr>
    <tr class="header"><th>Coleccion</th><th>Talla</th><th>Prendas</th><th></th></tr>
    ${tallasSections || '<tr><td colspan="4">Sin datos</td></tr>'}
    <tr class="spacer"><td colspan="4"></td></tr>
    <tr><td class="section" colspan="5">DETALLE POR MODELO</td></tr>
    <tr class="header"><th>Coleccion</th><th>Modelo</th><th>Prendas</th><th>Dinero web</th><th>Tallas</th></tr>
    ${modelosSections || '<tr><td colspan="5">Sin datos</td></tr>'}
  </table>
</body>
</html>`;
}

function descargarReporteVentasColeccionesAdmin(quotes = [], itemsMap = new Map()) {
  const resumen = construirResumenVentasColecciones(quotes, itemsMap);
  if (!resumen.totalPedidos) throw new Error(`No hay pedidos en ${resumen.monthLabel} para este filtro.`);
  const excelHtml = generarExcelHtmlResumenVentasColecciones(quotes, itemsMap);
  const mes = sanitizeFileNamePart(resumen.monthLabel, "mes");
  const filtro = sanitizeFileNamePart(resumen.filterLabel, "todas");
  descargarArchivo(`Reporte ventas cole 42 y 43 ${mes} ${filtro}.xls`, excelHtml, "application/vnd.ms-excel;charset=utf-8;");
}

function calcularMontoCotizacion(quote = {}, items = []) {
  if (!Array.isArray(items) || !items.length) return null;
  let total = 0;
  let hasPrice = false;
  items.forEach((item) => {
    const qty = Number(item?.quantity) || 0;
    if (qty <= 0) return;
    const sku = normalizarSkuCatalogo(item?.sku);
    if (!sku) return;
    const source = String(item?.source || inferirCatalogoDesdeSku(sku) || quote?.source || CATALOG_SOURCE).trim() || CATALOG_SOURCE;
    const precioUnitario = obtenerPrecioCatalogo(sku, source);
    if (!precioUnitario) return;
    total += precioUnitario * qty;
    hasPrice = true;
  });
  return hasPrice ? total : null;
}

function calcularResumenMontoCotizacion(quote = {}, items = []) {
  if (!Array.isArray(items) || !items.length) return null;
  let totalLista = 0;
  let totalPromo = 0;
  let hasPrice = false;
  items.forEach((item) => {
    const qty = Number(item?.quantity) || 0;
    if (qty <= 0) return;
    const sku = normalizarSkuCatalogo(item?.sku);
    if (!sku) return;
    const source = String(item?.source || inferirCatalogoDesdeSku(sku) || quote?.source || CATALOG_SOURCE).trim() || CATALOG_SOURCE;
    const precioLista = obtenerPrecioListaCatalogo(sku, source);
    const precioPromo = obtenerPrecioCatalogo(sku, source);
    if (!precioLista || !precioPromo) return;
    totalLista += precioLista * qty;
    totalPromo += precioPromo * qty;
    hasPrice = true;
  });
  if (!hasPrice) return null;
  return {
    lista: totalLista,
    promo: totalPromo,
    ahorro: Math.max(0, totalLista - totalPromo),
    tienePromo: totalPromo < totalLista,
  };
}

function construirBloqueDetalleReporte(q = {}, items = []) {
  const detalleAgrupado = agruparDetallePorModelo(items);
  if (!detalleAgrupado.length) return ["Sin detalle de artículos."];
  return detalleAgrupado.map((g) => {
    const tallasTxt = Object.entries(g.tallas)
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true }))
      .map(([t, qty]) => `T${t}: ${qty}`)
      .join(" · ");
    return `Artículo ${g.sku}: ${tallasTxt}`;
  });
}

function construirTextoReporteCotizacionesWhatsApp(quotes = []) {
  const quotesMes = obtenerCotizacionesFiltradas(obtenerCotizacionesMesSeleccionado(quotes));
  const total = quotesMes.length;
  const listas = quotesMes.filter((q) => !!q.is_ready).length;
  const caidas = total - listas;
  const pctListas = total ? Math.round((listas / total) * 100) : 0;
  const pctCaidas = total ? Math.round((caidas / total) * 100) : 0;
  const mesLabel = obtenerEtiquetaMesSeleccionado();
  const itemsMap = quotesAdminCache.itemsByQuote instanceof Map ? quotesAdminCache.itemsByQuote : new Map();
  const resumen = construirResumenVentasColecciones(quotes, itemsMap);
  const lines = [
    `*Reporte de pedidos ${mesLabel}*`,
    `Total pedidos: ${total}`,
    `Pedidos listos: ${listas} (${pctListas}%)`,
  ];
  if (caidas > 0) {
    lines.push(`Pedidos no listos / caídos: ${caidas} (${pctCaidas}%)`);
  }
  lines.push(`Total prendas: ${resumen.totalPrendas}`);
  if (resumen.totalDinero) {
    lines.push(`Total dinero web: ${formatearPrecioCLP(resumen.totalDinero)}`);
    resumen.collections.filter((c) => c.totalPrendas > 0).forEach((c) => {
      lines.push(`  ${c.label}: ${c.totalPrendas} prendas · ${formatearPrecioCLP(c.totalDinero)}`);
    });
  }
  if (quotesMes.length) {
    lines.push("", "*Detalle por pedido*");
    quotesMes.forEach((q, index) => {
      const detalles = (itemsMap.get(q.id) || []).sort((a, b) => {
        if (String(a.sku) !== String(b.sku)) return String(a.sku).localeCompare(String(b.sku));
        return String(a.size).localeCompare(String(b.size), undefined, { numeric: true });
      });
      const codigo = generarCodigoCotizacionVisual(q);
      const resumenMonto = calcularResumenMontoCotizacion(q, detalles);
        lines.push(
          "",
          `${index + 1}. ${q.store_name || "Sin cliente"} · ${codigo}`,
          `RUT: ${q.client_rut || "Sin RUT"}${q.client_phone ? ` · Teléfono: ${q.client_phone}` : ""}`,
          `Estado: ${q.is_ready ? "Lista" : "No lista / caída"}`,
          `Prendas: ${q.total_items || 0}${resumenMonto ? ` · Total web: ${formatearPrecioCLP(resumenMonto.promo)}` : ""}${resumenMonto?.ahorro ? ` · Ahorro: ${formatearPrecioCLP(resumenMonto.ahorro)}` : ""}`,
          ...construirBloqueDetalleReporte(q, detalles)
        );
      });
  }
  return lines.join("\n");
}

function construirVistaReporteCotizaciones(quotes = [], itemsMap = new Map()) {
  if (!quotes.length) {
    return `<div class="quotes-report-preview-empty">No hay pedidos de ${escapeHtmlExcel(obtenerEtiquetaMesSeleccionado())} en este filtro.</div>`;
  }

  return quotes.map((q, index) => {
    const detalles = (itemsMap.get(q.id) || []).sort((a, b) => {
      if (String(a.sku) !== String(b.sku)) return String(a.sku).localeCompare(String(b.sku));
      return String(a.size).localeCompare(String(b.size), undefined, { numeric: true });
    });
    const detalleAgrupado = agruparDetallePorModelo(detalles);
    const codigo = generarCodigoCotizacionVisual(q);
    const resumenMonto = calcularResumenMontoCotizacion(q, detalles);
    const fecha = q.created_at ? new Date(q.created_at).toLocaleString() : "-";

    const rows = detalleAgrupado.length
      ? detalleAgrupado.map((g) => {
        const totalModelo = Object.values(g.tallas).reduce((acc, qty) => acc + (Number(qty) || 0), 0);
        const tallasTxt = Object.entries(g.tallas)
          .sort((a, b) => String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true }))
          .map(([t, qty]) => `T${t}: ${qty}`)
          .join(" · ");
        return `
          <tr>
            <td>${escapeHtmlExcel(g.sku)}</td>
            <td>${escapeHtmlExcel(tallasTxt)}</td>
            <td class="is-num">${escapeHtmlExcel(totalModelo)}</td>
          </tr>
        `;
      }).join("")
      : `<tr><td colspan="3">Sin detalle</td></tr>`;

    return `
      <div class="quotes-report-preview-card">
        <div class="quotes-report-preview-head">
          <strong>${index + 1}. ${escapeHtmlExcel(q.store_name || "Sin cliente")}</strong>
          <span>${escapeHtmlExcel(codigo)}</span>
        </div>
        <div class="quotes-report-preview-meta quotes-report-preview-meta-primary">
          <div class="quotes-report-preview-chip"><span>RUT</span><strong>${escapeHtmlExcel(q.client_rut || "Sin RUT")}</strong></div>
          <div class="quotes-report-preview-chip"><span>Estado</span><strong>${escapeHtmlExcel(q.is_ready ? "Lista" : "No lista / caída")}</strong></div>
          <div class="quotes-report-preview-chip quotes-report-preview-chip-date"><span>Fecha</span><strong>${escapeHtmlExcel(fecha)}</strong></div>
          <div class="quotes-report-preview-chip"><span>Prendas</span><strong>${escapeHtmlExcel(q.total_items || 0)}</strong></div>
          ${q.client_phone ? `<div class="quotes-report-preview-chip quotes-report-preview-chip-phone"><span>Teléfono</span><strong>${escapeHtmlExcel(q.client_phone)}</strong></div>` : ""}
        </div>
        <div class="quotes-report-preview-meta quotes-report-preview-meta-finance">
          ${resumenMonto ? `<div class="quotes-report-preview-chip quotes-report-preview-chip-money"><span>Total lista</span><strong>${escapeHtmlExcel(formatearPrecioCLP(resumenMonto.lista))}</strong></div>` : ""}
          ${resumenMonto ? `<div class="quotes-report-preview-chip quotes-report-preview-chip-money is-highlight"><span>Total web ${WEB_DISCOUNT_PERCENT}%</span><strong>${escapeHtmlExcel(formatearPrecioCLP(resumenMonto.promo))}</strong></div>` : ""}
          ${resumenMonto?.ahorro ? `<div class="quotes-report-preview-chip quotes-report-preview-chip-money is-saving"><span>Ahorro</span><strong>${escapeHtmlExcel(formatearPrecioCLP(resumenMonto.ahorro))}</strong></div>` : ""}
          </div>
        <div class="quotes-report-preview-table-wrap">
          <table class="quotes-report-preview-table">
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Tallas</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  }).join("");
}

function renderReporteCotizacionesAdmin(quotes = []) {
  const panel = document.getElementById("quotesReportPanel");
  if (!panel) return;
  const monthOptions = obtenerOpcionesMesCotizaciones(quotes);
  if (quotesMonthFilter !== "all" && !monthOptions.some((option) => option.value === quotesMonthFilter)) {
    quotesMonthFilter = obtenerClaveMesActual();
  }
  const quotesMes = obtenerCotizacionesFiltradas(obtenerCotizacionesMesSeleccionado(quotes));
  const total = quotesMes.length;
  const listas = quotesMes.filter((q) => !!q.is_ready).length;
  const caidas = total - listas;
  const mesLabel = obtenerEtiquetaMesSeleccionado();
  const itemsMap = quotesAdminCache.itemsByQuote instanceof Map ? quotesAdminCache.itemsByQuote : new Map();
  const reportPreview = construirVistaReporteCotizaciones(quotesMes, itemsMap);
  const monthSelectOptions = monthOptions.map((option) => `
    <option value="${escapeHtmlExcel(option.value)}" ${option.value === quotesMonthFilter ? "selected" : ""}>${escapeHtmlExcel(option.label)}</option>
  `).join("");

  const resumen = construirResumenVentasColecciones(quotes, itemsMap);
  const totalPrendas = resumen.totalPrendas;
  const totalDinero = resumen.totalDinero;

  const allModels = new Map();
  resumen.collections.forEach((col) => {
    col.modelsList.forEach((m) => {
      const e = allModels.get(m.sku);
      if (e) { e.prendas += m.prendas; e.dinero += m.dinero; }
      else allModels.set(m.sku, { sku: m.sku, prendas: m.prendas, dinero: m.dinero });
    });
  });
  const topModelos = [...allModels.values()].sort((a, b) => b.prendas - a.prendas).slice(0, 5);

  const collectionRows = resumen.collections
    .filter((col) => col.totalPrendas > 0 || col.totalPedidos > 0)
    .map((col) => `
      <tr>
        <td>${escapeHtmlExcel(col.label)}</td>
        <td class="is-num">${escapeHtmlExcel(String(col.totalPedidos))}</td>
        <td class="is-num">${escapeHtmlExcel(String(col.totalPrendas))}</td>
        <td class="is-num">${col.totalDinero ? escapeHtmlExcel(formatearPrecioCLP(col.totalDinero)) : "-"}</td>
      </tr>
    `).join("");

  const topModelosRows = topModelos.length
    ? topModelos.map((m, i) => `
        <tr>
          <td>${escapeHtmlExcel(String(i + 1))}</td>
          <td><strong>${escapeHtmlExcel(m.sku)}</strong></td>
          <td class="is-num">${escapeHtmlExcel(String(m.prendas))}</td>
          ${totalDinero ? `<td class="is-num">${escapeHtmlExcel(formatearPrecioCLP(m.dinero))}</td>` : ""}
        </tr>
      `).join("")
    : `<tr><td colspan="4">Sin datos este mes.</td></tr>`;

  panel.innerHTML = `
    ${renderCoberturaVendedoresAdmin(quotes)}
    <div class="quotes-report-card">
      <div class="quotes-report-head">
        <div>
          <div class="quotes-report-kicker">Reporte aparte para WhatsApp</div>
          <div class="quotes-report-title">Resumen ${mesLabel}</div>
        </div>
        <div class="quotes-report-actions">
          <label class="quotes-report-month-filter">
            <span>Mes</span>
            <select id="quotesMonthFilterSelect">
              ${monthSelectOptions}
            </select>
          </label>
          <button type="button" class="ghost-btn quotes-report-copy-btn" data-copy-quotes-report>Copiar reporte</button>
          <button type="button" class="ghost-btn quotes-report-copy-btn" data-export-sales-report>Descargar Excel ventas</button>
        </div>
      </div>
      <div class="quotes-report-metrics">
        <div class="quotes-report-metric">
          <span>Pedidos</span>
          <strong>${total}</strong>
        </div>
        <div class="quotes-report-metric is-ready">
          <span>Listas</span>
          <strong>${listas}</strong>
        </div>
        ${caidas > 0 ? `
        <div class="quotes-report-metric is-open">
          <span>Caídas</span>
          <strong>${caidas}</strong>
        </div>` : ""}
        <div class="quotes-report-metric">
          <span>Prendas</span>
          <strong>${escapeHtmlExcel(String(totalPrendas))}</strong>
        </div>
        ${totalDinero ? `
        <div class="quotes-report-metric is-money">
          <span>Dinero web</span>
          <strong>${escapeHtmlExcel(formatearPrecioCLP(totalDinero))}</strong>
        </div>` : ""}
      </div>
      ${collectionRows ? `
      <div class="quotes-report-section">
        <div class="quotes-report-section-title">Por colección</div>
        <div class="quotes-report-preview-table-wrap">
          <table class="quotes-report-preview-table">
            <thead>
              <tr><th>Colección</th><th>Pedidos</th><th>Prendas</th><th>Dinero web</th></tr>
            </thead>
            <tbody>${collectionRows}</tbody>
          </table>
        </div>
      </div>` : ""}
      ${topModelos.length ? `
      <div class="quotes-report-section">
        <div class="quotes-report-section-title">Top modelos del mes</div>
        <div class="quotes-report-preview-table-wrap">
          <table class="quotes-report-preview-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Modelo</th>
                <th>Prendas</th>
                ${totalDinero ? "<th>Dinero web</th>" : ""}
              </tr>
            </thead>
            <tbody>${topModelosRows}</tbody>
          </table>
        </div>
      </div>` : ""}
      <div class="quotes-report-text">
        <div class="quotes-report-text-head">Vista previa ordenada</div>
        <div class="quotes-report-preview-list">${reportPreview}</div>
      </div>
    </div>
    <div class="quotes-filter-row" id="quotesStatusFilters">
      <button type="button" class="ghost-btn quotes-filter-btn ${quotesStatusFilter === "all" ? "active" : ""}" data-quotes-filter="all">Todas</button>
      <button type="button" class="ghost-btn quotes-filter-btn ${quotesStatusFilter === "ready" ? "active" : ""}" data-quotes-filter="ready">Listas</button>
      <button type="button" class="ghost-btn quotes-filter-btn ${quotesStatusFilter === "open" ? "active" : ""}" data-quotes-filter="open">No listas / caídas</button>
    </div>
    <div class="quotes-report-detail-list">
      ${quotesMes.length
        ? quotesMes.map((q) => {
          const detalles = (itemsMap.get(q.id) || []).sort((a, b) => {
            if (String(a.sku) !== String(b.sku)) return String(a.sku).localeCompare(String(b.sku));
            return String(a.size).localeCompare(String(b.size), undefined, { numeric: true });
          });
          const detalleAgrupado = agruparDetallePorModelo(detalles);
          const fecha = q.created_at ? new Date(q.created_at).toLocaleString() : "-";
          const codigo = generarCodigoCotizacionVisual(q);
          const resumenMonto = calcularResumenMontoCotizacion(q, detalles);
          return `
            <div class="quotes-report-detail-card">
              <div class="quotes-report-detail-head">
                <div>
                  <div class="quotes-report-detail-client">${q.store_name || "Sin cliente"}</div>
                  <div class="quotes-report-detail-sub">RUT: ${q.client_rut || "Sin RUT"}${q.client_phone ? ` · Teléfono: ${q.client_phone}` : ""} · ${codigo}</div>
                </div>
                <div class="quotes-report-detail-side">
                  <strong>${q.total_items || 0} prendas</strong>
                  <span>${q.is_ready ? "Lista" : "No lista / caída"} · ${fecha}</span>
                  ${resumenMonto ? `<span>Total web: ${formatearPrecioCLP(resumenMonto.promo)}</span>` : ""}
                  ${resumenMonto?.ahorro ? `<span>Ahorro: ${formatearPrecioCLP(resumenMonto.ahorro)}</span>` : ""}
                </div>
              </div>
              <div class="quotes-report-detail-items">
                ${detalleAgrupado.length
                  ? detalleAgrupado.map((g) => {
                    const totalModelo = Object.values(g.tallas).reduce((acc, qty) => acc + (Number(qty) || 0), 0);
                    const tallasTxt = Object.entries(g.tallas)
                      .sort((a, b) => String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true }))
                      .map(([t, qty]) => `T${t}: ${qty}`)
                      .join(" · ");
                    return `<div class="quotes-report-detail-item"><strong>Artículo ${g.sku}</strong><span>Total: ${totalModelo}</span><span>${tallasTxt}</span></div>`;
                  }).join("")
                  : `<div class="quotes-report-detail-item"><span>Sin detalle</span></div>`
                }
              </div>
            </div>
          `;
        }).join("")
        : `<div class="quote-card"><div class="quote-meta">No hay pedidos de ${escapeHtmlExcel(mesLabel)} en este filtro.</div></div>`
      }
    </div>
  `;
}

function inyectarSubtituloHeroCatalogo43() {
  if (document.getElementById("hero-cta-43")) return;
  const h1 = document.querySelector("h1.hero-title");
  if (!h1) return;
  const s = document.createElement("style");
  s.id = "hero-cta-43-styles";
  s.textContent = `
    .hero-cta-43-wrap{
      display:flex;justify-content:center;
      margin-top:12px;margin-bottom:0;
      min-height:28px;
    }
    .hero-cta-43{
      display:inline-block;
      font-size:14px;font-weight:700;
      letter-spacing:.7px;text-transform:uppercase;
      color:#c0181b;
      overflow:hidden;
      white-space:nowrap;
      width:0;
      border-right:2px solid #c0181b;
      animation:
        hero-type 2s steps(44,end) 0.4s forwards,
        hero-cursor 0.7s step-end infinite,
        hero-cursor-fade 0.5s ease 5s forwards;
    }
    @keyframes hero-type{
      from{width:0;}
      to{width:44ch;}
    }
    @keyframes hero-cursor{
      0%,100%{border-color:#c0181b;}
      50%{border-color:transparent;}
    }
    @keyframes hero-cursor-fade{
      to{border-color:transparent;}
    }
  `;
  document.head.appendChild(s);
  const wrap = document.createElement("div");
  wrap.className = "hero-cta-43-wrap";
  const p = document.createElement("span");
  p.id = "hero-cta-43";
  p.className = "hero-cta-43";
  p.textContent = "Selecciona un modelo y realiza tu pedido";
  wrap.appendChild(p);
  h1.insertAdjacentElement("afterend", wrap);
}

function inyectarEstilosPromoBannerMobile() {
  if (!document.getElementById("promo-banner-mobile-fix")) {
    const s = document.createElement("style");
    s.id = "promo-banner-mobile-fix";
    s.textContent = `
      @media(max-width:768px){
        body .promo-banner::before{background-image:none!important;}
        body .promo-banner-visual{background:url('Imagenes/banners/promo-web-5-mobile.jpg') center top / cover no-repeat !important;}
        body .promo-banner-visual img{visibility:hidden!important;}
      }
    `;
    document.head.appendChild(s);
  }
}

function inyectarEstilosCardCta() {
  if (document.getElementById("card-cta-styles")) return;
  const s = document.createElement("style");
  s.id = "card-cta-styles";
  s.textContent = `
    .card-cta-hint{
      position:absolute!important;
      bottom:12px!important;right:10px!important;
      z-index:6!important;
      display:flex!important;align-items:center!important;gap:5px!important;
      background:rgba(255,255,255,0.88)!important;
      border-radius:20px!important;
      padding:5px 10px 5px 8px!important;
      font-size:11px!important;font-weight:600!important;
      color:#222!important;letter-spacing:.3px!important;
      box-shadow:0 2px 8px rgba(0,0,0,.15)!important;
      pointer-events:none!important;
      animation:cta-pulse 2s ease-in-out infinite!important;
      white-space:nowrap!important;
    }
    @keyframes cta-pulse{
      0%,100%{opacity:1;transform:scale(1);}
      50%{opacity:.7;transform:scale(1.04);}
    }
  `;
  document.head.appendChild(s);
}

function inyectarEstilosQuotesList() {
  if (document.getElementById("ql-styles")) return;
  const s = document.createElement("style");
  s.id = "ql-styles";
  s.textContent = `
    .ql-filters{display:flex!important;flex-direction:column!important;gap:8px!important;padding:14px 0 10px!important;border-bottom:1px solid rgba(0,0,0,.08)!important;margin-bottom:6px!important}
    .ql-search{background:rgba(0,0,0,.05)!important;border:none!important;border-radius:10px!important;font-size:13px!important;padding:11px 14px!important;outline:none!important;width:100%!important;box-sizing:border-box!important;transition:background .2s!important;color:inherit!important}
    .ql-search:focus{background:rgba(0,0,0,.09)!important}
    .ql-search::placeholder{opacity:.5!important}
    .ql-status-btns{display:flex!important;gap:3px!important;background:rgba(0,0,0,.07)!important;border-radius:10px!important;padding:3px!important}
    .ql-filter-btn{flex:1!important;text-align:center!important;font-size:11.5px!important;padding:7px 6px!important;border-radius:8px!important;border:none!important;color:inherit!important;opacity:.55!important;background:transparent!important;cursor:pointer!important;white-space:nowrap!important;transition:all .15s!important;font-family:inherit!important}
    .ql-filter-btn.active{opacity:1!important;font-weight:600!important;background:rgba(255,255,255,.88)!important;color:#111!important;box-shadow:0 1px 4px rgba(0,0,0,.12),0 0 0 .5px rgba(0,0,0,.06)!important}
  `;
  document.head.appendChild(s);
}

function renderCotizacionesAdmin(quotes = [], items = []) {
  const list = document.getElementById("quotesList");
  if (!list) return;
  inyectarEstilosQuotesList();

  if (items.length || quotes.length) {
    const itemsMap = agruparItemsPorQuote(items);
    quotesAdminCache = { quotes: [...quotes], itemsByQuote: itemsMap };
  }

  const allQuotes = quotesAdminCache.quotes;
  const search = quotesListSearchFilter.trim().toLowerCase();
  let filtered = allQuotes;
  if (quotesListStatusFilter === "open") filtered = filtered.filter((q) => !q.is_ready);
  else if (quotesListStatusFilter === "ready") filtered = filtered.filter((q) => !!q.is_ready);
  if (search) {
    filtered = filtered.filter((q) =>
      (q.store_name || "").toLowerCase().includes(search) ||
      (q.client_rut || "").toLowerCase().replace(/[.\-]/g, "").includes(search.replace(/[.\-]/g, ""))
    );
  }

  const pendientes = allQuotes.filter((q) => !q.is_ready).length;
  const filterBar = `
    <div class="ql-filters">
      <input id="quotesListSearchInput" type="text" class="ql-search" placeholder="Buscar por nombre o RUT…" value="${escapeHtmlExcel(quotesListSearchFilter)}">
      <div class="ql-status-btns">
        <button type="button" class="ql-filter-btn${quotesListStatusFilter === "all" ? " active" : ""}" data-ql-filter="all">Todos (${allQuotes.length})</button>
        <button type="button" class="ql-filter-btn${quotesListStatusFilter === "open" ? " active" : ""}" data-ql-filter="open">Pendientes (${pendientes})</button>
        <button type="button" class="ql-filter-btn${quotesListStatusFilter === "ready" ? " active" : ""}" data-ql-filter="ready">Listos (${allQuotes.length - pendientes})</button>
      </div>
    </div>
  `;

  const inputFocused = document.activeElement?.id === "quotesListSearchInput";
  const cursorPos = inputFocused ? (document.activeElement.selectionStart ?? null) : null;

  if (!filtered.length) {
    list.innerHTML = filterBar + `<div class="quote-card"><div class="quote-meta">No hay pedidos para mostrar.</div></div>`;
    if (inputFocused) { const i = document.getElementById("quotesListSearchInput"); if (i) { i.focus(); if (cursorPos !== null) i.setSelectionRange(cursorPos, cursorPos); } }
    return;
  }

  const itemsMap = quotesAdminCache.itemsByQuote instanceof Map ? quotesAdminCache.itemsByQuote : new Map();
  list.innerHTML = filterBar + filtered.map((q) => {
    const detalles = (itemsMap.get(q.id) || []).sort((a, b) => {
      if (String(a.sku) !== String(b.sku)) return String(a.sku).localeCompare(String(b.sku));
      return String(a.size).localeCompare(String(b.size), undefined, { numeric: true });
    });
    const detalleAgrupado = agruparDetallePorModelo(detalles);
    const fecha = q.created_at ? new Date(q.created_at).toLocaleString() : "-";
    const isReady = !!q.is_ready;
    const codigo = generarCodigoCotizacionVisual(q);
    return `
      <div class="quote-card" data-quote-id="${q.id}">
        <div class="quote-card-head">
          <div class="quote-card-main">
            <div class="quote-card-title-row">
              <div class="quote-card-title">${q.store_name || "Sin tienda"}</div>
              ${q.client_rut ? `<div class="quote-meta quote-meta-inline">RUT: ${q.client_rut}</div>` : ""}
              ${q.client_phone ? `<div class="quote-meta quote-meta-inline">Tel: ${q.client_phone}</div>` : ""}
            </div>
            <div class="quote-code-row">
              <span class="quote-code-pill">${codigo}</span>
              <button type="button" class="ghost-btn quote-export-btn" data-quote-export="${q.id}">Descargar pedido</button>
              <button type="button" class="ghost-btn quote-delete-btn" data-quote-delete="${q.id}">Eliminar pedido</button>
            </div>
          </div>
          <div class="quote-card-summary">
            <div class="quote-card-total">Total items: ${q.total_items || 0}</div>
            <div class="quote-card-date">${fecha}</div>
          </div>
        </div>
        <div class="quote-status">
          <div class="quote-status-text ${isReady ? "ready" : ""}">
            ${isReady ? "Pedido listo" : "En proceso"}
          </div>
          <label class="quote-status-toggle">
            <input type="checkbox" class="quote-ready-checkbox" data-quote-id="${q.id}" ${isReady ? "checked" : ""}>
            Pedido listo
          </label>
        </div>
        <div class="quote-items-grid">
          ${detalleAgrupado.length
            ? detalleAgrupado.map((g) => {
              const tallasTxt = Object.entries(g.tallas)
                .sort((a, b) => String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true }))
                .map(([t, q]) => `T${t}: <strong>${q}</strong>`)
                .join(" · ");
              return `<div class="quote-item-line"><span class="quote-item-model">Modelo ${g.sku}</span><span class="quote-item-sizes">${tallasTxt}</span></div>`;
            }).join("")
            : `<div class="quote-item-line">Sin detalle</div>`
          }
        </div>
      </div>
    `;
  }).join("");

  if (inputFocused) {
    const i = document.getElementById("quotesListSearchInput");
    if (i) { i.focus(); if (cursorPos !== null) i.setSelectionRange(cursorPos, cursorPos); }
  }
}

async function actualizarEstadoCotizacion(quoteId, isReady) {
  if (!quotesAccessToken) throw new Error("Debes iniciar sesion");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/quotes?id=eq.${quoteId}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${quotesAccessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      is_ready: !!isReady,
      ready_at: isReady ? new Date().toISOString() : null,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`No se pudo actualizar estado: ${txt || res.status}`);
  }
}

async function eliminarCotizacionAdmin(quoteId) {
  if (!quotesAccessToken) throw new Error("Debes iniciar sesion");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/quotes?id=eq.${quoteId}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${quotesAccessToken}`,
      Prefer: "return=minimal",
    },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`No se pudo eliminar el pedido: ${txt || res.status}`);
  }
}

async function cargarCotizacionesAdmin() {
  if (!quotesAccessToken) throw new Error("Debes iniciar sesion");

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${quotesAccessToken}`,
  };

  let quotesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/quotes?select=id,store_name,client_rut,client_rut_normalized,client_phone,total_items,created_at,created_at_client,source,is_ready,ready_at&order=created_at.desc&limit=500`,
    { headers }
  );

  if (!quotesRes.ok) {
    const errText = await quotesRes.text();
    if ((errText || "").toLowerCase().includes("client_phone")) {
      quotesRes = await fetch(
        `${SUPABASE_URL}/rest/v1/quotes?select=id,store_name,client_rut,client_rut_normalized,total_items,created_at,created_at_client,source,is_ready,ready_at&order=created_at.desc&limit=500`,
        { headers }
      );
    } else {
      const passthrough = new Response(errText, { status: quotesRes.status, statusText: quotesRes.statusText });
      quotesRes = passthrough;
    }
  }

  if (!quotesRes.ok) {
    if (quotesRes.status === 401 || quotesRes.status === 403) {
      logoutCotizaciones();
      throw new Error("No se pudo iniciar sesion");
    }
    const errText = await quotesRes.text();
    throw new Error(`No se pudieron cargar pedidos: ${errText || quotesRes.status}`);
  }

  const quotes = await quotesRes.json();
  if (!quotes.length) {
    renderCotizacionesAdmin([], []);
    renderReporteCotizacionesAdmin([]);
    return;
  }

  const ids = quotes.map((q) => q.id).filter(Boolean);
  let items = [];
  if (ids.length) {
    const inFilter = `(${ids.join(",")})`;
    const itemsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/quote_items?select=quote_id,sku,size,quantity&quote_id=in.${inFilter}&order=id.desc&limit=9999`,
      { headers }
    );
    if (!itemsRes.ok) {
      const errText = await itemsRes.text();
      throw new Error(`No se pudieron cargar items: ${errText || itemsRes.status}`);
    }
    items = await itemsRes.json();
  }

  renderCotizacionesAdmin(quotes, items);
  renderReporteCotizacionesAdmin(quotes);
}

function paginaEnModoAdmin() {
  try {
    const params = new URLSearchParams(window.location.search || "");
    const adminParam = String(params.get("admin") || params.get("quotesAdmin") || "").trim().toLowerCase();
    const hash = String(window.location.hash || "").trim().toLowerCase();
    return ["1", "true", "si", "yes", "open"].includes(adminParam) || hash === "#admin";
  } catch (_) {
    return false;
  }
}

function adminDebeAbrirAlCargar() {
  try {
    const params = new URLSearchParams(window.location.search || "");
    const openParam = String(params.get("openAdmin") || params.get("adminOpen") || "").trim().toLowerCase();
    const hash = String(window.location.hash || "").trim().toLowerCase();
    return hash === "#admin" || ["1", "true", "si", "yes", "open"].includes(openParam);
  } catch (_) {
    return false;
  }
}

function abrirQuotesModal() {
  document.getElementById("quotesModal")?.classList.add("active");
  actualizarEstadoQuotesUI("");
  loadXlsxPopulate().catch(() => {});
  loadOrderTemplateBuffer().catch(() => {});
  if (quotesAccessToken) {
    activarTabAdmin(adminActiveTab || "cotizaciones", { cargar: true });
  }
}

function cerrarQuotesModal() {
  document.getElementById("quotesModal")?.classList.remove("active");
}

function configurarPanelCotizaciones() {
  const btnOpen = document.getElementById("quotesAdminBtn");
  const btnClose = document.getElementById("closeQuotesModal");
  const modal = document.getElementById("quotesModal");
  const btnLogin = document.getElementById("quotesLoginBtn");
  const btnRefresh = document.getElementById("refreshQuotesBtn");
  const btnLogout = document.getElementById("logoutQuotesBtn");
  const btnTabCotizaciones = document.getElementById("quotesTabCotizaciones");
  const btnTabReporte = document.getElementById("quotesTabReporte");
  const btnTabStock = document.getElementById("quotesTabStock");
  const stockSearchInput = document.getElementById("stockCatalogSearchInput");
  const stockSearchClear = document.getElementById("stockCatalogSearchClear");
  const stockSeasonTabs = document.getElementById("stockCatalogSeasonTabs");
  const stockNewBtn = document.getElementById("stockCatalogNewBtn");
  const stockListEl = document.getElementById("stockCatalogList");
  const stockEditorModal = document.getElementById("stockEditorModal");
  const stockEditorCloseBtn = document.getElementById("closeStockEditorModal");
  const stockEditorCancelBtn = document.getElementById("stockEditorCancelBtn");
  const stockEditorSaveBtn = document.getElementById("stockEditorSaveBtn");
  const stockEditorDeleteBtn = document.getElementById("stockEditorDeleteBtn");
  const emailEl = document.getElementById("quotesEmail");
  const passEl = document.getElementById("quotesPassword");
  const quotesListEl = document.getElementById("quotesList");
  const quotesReportePanel = document.getElementById("quotesReportePanel");
  const adminVisible = paginaEnModoAdmin();

  if (btnOpen) {
    btnOpen.hidden = !adminVisible;
    btnOpen.setAttribute("aria-hidden", adminVisible ? "false" : "true");
  }

  const ejecutarLogin = async () => {
    const email = emailEl?.value.trim();
    const password = passEl?.value || "";
    if (!email || !password) {
      mostrarToastError("Datos incompletos", "Ingresa correo y contrasena.");
      return;
    }

    btnLogin.disabled = true;
    btnLogin.innerText = "Ingresando...";
    actualizarEstadoQuotesUI("");
    try {
      await loginCotizacionesSupabase(email, password);
      actualizarEstadoQuotesUI("");
      activarTabAdmin("cotizaciones", { cargar: true });
      if (passEl) passEl.value = "";
    } catch (err) {
      actualizarEstadoQuotesUI("");
      mostrarToastError("No se pudo iniciar sesion", "Revisa tus credenciales e intenta nuevamente.");
    } finally {
      btnLogin.disabled = false;
      btnLogin.innerText = "Ingresar";
    }
  };

  actualizarEstadoQuotesUI("");

  btnOpen?.addEventListener("click", abrirQuotesModal);
  btnClose?.addEventListener("click", cerrarQuotesModal);
  modal?.addEventListener("click", (e) => {
    if (e.target?.id === "quotesModal") cerrarQuotesModal();
  });
  if (adminVisible && adminDebeAbrirAlCargar()) {
    abrirQuotesModal();
  }

  btnLogin?.addEventListener("click", ejecutarLogin);

  [emailEl, passEl].forEach((el) => {
    el?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        ejecutarLogin();
      }
    });
  });

  btnRefresh?.addEventListener("click", async () => {
    try {
      if (adminActiveTab === "stock") await cargarStockCatalogAdmin();
      else await cargarCotizacionesAdmin();
    } catch (err) {
      actualizarEstadoQuotesUI("");
      if ((err?.message || "").toLowerCase().includes("iniciar sesion")) {
        mostrarToastError("No se pudo iniciar sesion", "Vuelve a ingresar tus credenciales.");
      } else {
        mostrarToastError("No se pudo actualizar", err?.message || "Intentalo nuevamente.");
      }
    }
  });

  btnTabCotizaciones?.addEventListener("click", () => activarTabAdmin("cotizaciones", { cargar: true }));
  btnTabReporte?.addEventListener("click", () => activarTabAdmin("reporte", { cargar: true }));
  btnTabStock?.addEventListener("click", () => activarTabAdmin("stock", { cargar: true }));
  stockSearchInput?.addEventListener("input", aplicarFiltroStockCatalogAdmin);
  stockSeasonTabs?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-stock-season]");
    if (!btn) return;
    stockCatalogSeasonFilter = String(btn.dataset.stockSeason || "").trim();
    stockSeasonTabs.querySelectorAll("[data-stock-season]").forEach((tab) => {
      tab.classList.toggle("active", tab === btn);
    });
    aplicarFiltroStockCatalogAdmin();
  });
  stockSearchClear?.addEventListener("click", () => {
    if (stockSearchInput) stockSearchInput.value = "";
    stockCatalogSeasonFilter = "";
    stockSeasonTabs?.querySelectorAll("[data-stock-season]").forEach((tab) => {
      tab.classList.toggle("active", (tab.dataset.stockSeason || "") === "");
    });
    aplicarFiltroStockCatalogAdmin();
    const stockSheetWrap = document.querySelector("#stockCatalogList .stock-sheet-wrap");
    if (stockSheetWrap) stockSheetWrap.scrollLeft = 0;
    stockSearchInput?.focus();
  });
  stockNewBtn?.addEventListener("click", () => {
    abrirEditorStock(crearFilaStockCatalogVacia());
  });

  btnLogout?.addEventListener("click", logoutCotizaciones);

  quotesListEl?.addEventListener("input", (e) => {
    if (e.target.id !== "quotesListSearchInput") return;
    quotesListSearchFilter = e.target.value;
    renderCotizacionesAdmin();
  });

  quotesListEl?.addEventListener("click", (e) => {
    const filterBtn = e.target.closest(".ql-filter-btn[data-ql-filter]");
    if (filterBtn) {
      quotesListStatusFilter = filterBtn.dataset.qlFilter || "all";
      renderCotizacionesAdmin();
    }
  });

  quotesListEl?.addEventListener("change", async (e) => {
    const checkbox = e.target.closest(".quote-ready-checkbox");
    if (!checkbox) return;
    const quoteId = checkbox.dataset.quoteId;
    const checked = !!checkbox.checked;
    checkbox.disabled = true;
    try {
      await actualizarEstadoCotizacion(quoteId, checked);
      await cargarCotizacionesAdmin();
    } catch (err) {
      checkbox.checked = !checked;
      actualizarEstadoQuotesUI(err.message || "No se pudo actualizar estado");
    } finally {
      checkbox.disabled = false;
    }
  });

  quotesReportePanel?.addEventListener("click", (e) => {
    const filterBtn = e.target.closest("[data-quotes-filter]");
    if (filterBtn) {
      quotesStatusFilter = filterBtn.dataset.quotesFilter || "all";
      renderReporteCotizacionesAdmin(quotesAdminCache.quotes);
      return;
    }

    const copyReportBtn = e.target.closest("[data-copy-quotes-report]");
    if (copyReportBtn) {
      const reportText = construirTextoReporteCotizacionesWhatsApp(quotesAdminCache.quotes);
      navigator.clipboard?.writeText(reportText)
        .then(() => mostrarToastExito("Reporte copiado", "Ya puedes pegarlo en WhatsApp."))
        .catch(() => mostrarToastError("No se pudo copiar", "Copia manualmente el texto del reporte."));
      return;
    }

    const exportSalesBtn = e.target.closest("[data-export-sales-report]");
    if (exportSalesBtn) {
      try {
        const itemsMap = quotesAdminCache.itemsByQuote instanceof Map ? quotesAdminCache.itemsByQuote : new Map();
        descargarReporteVentasColeccionesAdmin(quotesAdminCache.quotes, itemsMap);
        mostrarToastExito("Excel generado", "Se descargó el reporte de ventas por colección.");
      } catch (err) {
        console.error("No se pudo generar reporte de ventas", err);
        mostrarToastError("No se pudo generar Excel", err?.message || "Error preparando el reporte.");
      }
      return;
    }
  });

  quotesReportePanel?.addEventListener("change", (e) => {
    const monthSelect = e.target.closest("#quotesMonthFilterSelect");
    if (!monthSelect) return;
    quotesMonthFilter = monthSelect.value || obtenerClaveMesActual();
    renderReporteCotizacionesAdmin(quotesAdminCache.quotes);
  });

  quotesReportePanel?.addEventListener("change", async (e) => {
    const input = e.target.closest("#vendorCoverageFileInput");
    if (!input) return;
    const file = input.files?.[0];
    if (!file) return;
    try {
      await cargarBaseVendedoresDesdeExcel(file);
      renderReporteCotizacionesAdmin(quotesAdminCache.quotes);
      mostrarToastExito("Base cargada", "Ya puedes revisar la cobertura por vendedor dentro del reporte.");
    } catch (err) {
      console.error("No se pudo cargar base de vendedores", err);
      mostrarToastError("No se pudo cargar base", err?.message || "Error leyendo la planilla.");
    } finally {
      input.value = "";
    }
  });

  quotesListEl?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-quote-export]");
    if (btn) {
      btn.disabled = true;
      const originalText = btn.innerText;
      btn.innerText = "Preparando...";
      descargarCotizacionAdmin(btn.dataset.quoteExport)
        .catch((err) => {
          console.error("No se pudo descargar pedido", err);
          mostrarToastError("No se pudo descargar", err?.message || "Error preparando el pedido.");
        })
        .finally(() => {
          btn.disabled = false;
          btn.innerText = originalText;
        });
      return;
    }

    const deleteBtn = e.target.closest("[data-quote-delete]");
    if (!deleteBtn) return;

    const quoteId = deleteBtn.dataset.quoteDelete;
    const quote = quotesAdminCache.quotes.find((q) => q.id === quoteId);
    const codigo = generarCodigoCotizacionVisual(quote);

    (async () => {
      const confirmar = await mostrarConfirmacionAccion({
        titulo: "Eliminar pedido",
        mensaje: `Se eliminará ${codigo}${quote?.store_name ? ` (${quote.store_name})` : ""}. Esta acción no se puede deshacer.`,
        confirmarTexto: "Sí, eliminar",
      });
      if (!confirmar) return;

      const textoOriginal = deleteBtn.innerText;
      deleteBtn.disabled = true;
      deleteBtn.innerText = "Eliminando...";
      try {
        await eliminarCotizacionAdmin(quoteId);
        mostrarToastExito("Pedido eliminado", "El pedido se eliminó correctamente.");
        await cargarCotizacionesAdmin();
      } catch (err) {
        mostrarToastError("No se pudo eliminar", err.message || "Error eliminando pedido");
      } finally {
        deleteBtn.disabled = false;
        deleteBtn.innerText = textoOriginal;
      }
    })();
  });

  stockListEl?.addEventListener("click", async (e) => {
    const openBtn = e.target.closest("[data-stock-open]");
    if (!openBtn) return;
    const itemId = Number(openBtn.dataset.stockOpen || 0);
    const row = stockCatalogRows.find((item) => Number(item.id) === itemId);
    if (!row) return;
    abrirEditorStock(row);
  });

  stockEditorCloseBtn?.addEventListener("click", cerrarEditorStock);
  stockEditorCancelBtn?.addEventListener("click", cerrarEditorStock);
  stockEditorModal?.addEventListener("click", (e) => {
    if (e.target?.id === "stockEditorModal") cerrarEditorStock();
  });

  stockEditorModal?.addEventListener("click", async (e) => {
    const addBtn = e.target.closest("#stockEditorAddSizeBtn");
    if (addBtn) {
      agregarTallaEditorStock();
      return;
    }
    const removeBtn = e.target.closest("[data-size-remove]");
    if (removeBtn) {
      quitarTallaEditorStock(Number(removeBtn.dataset.sizeRemove || 0));
      return;
    }
  });

  stockEditorModal?.addEventListener("input", (e) => {
    const field = e.target.closest('input[type="text"], input[type="number"], input[type="checkbox"]');
    if (!field) return;
    stockEditorState.item = leerStockEditorActual();
    const totalEl = stockEditorModal.querySelector(".stock-editor-total strong");
    if (totalEl) totalEl.innerText = formatNumberCL(stockEditorState.item.total);
  });

  stockEditorSaveBtn?.addEventListener("click", async () => {
    const payload = leerStockEditorActual();
    if (!payload.article_code || !payload.sku) {
      mostrarToastError("Faltan datos", "Completa el código y el SKU antes de guardar.");
      return;
    }
    try {
      await guardarStockCatalogAdmin(payload, { id: payload.id });
      await cargarStockCatalogAdmin();
      await cargarStockData();
      cerrarEditorStock();
      mostrarToastExito("Stock guardado", "Los cambios del artículo se guardaron correctamente.");
    } catch (err) {
      mostrarToastError("No se pudo guardar", err.message || "Error guardando stock");
    }
  });

  stockEditorDeleteBtn?.addEventListener("click", async () => {
    const itemId = Number(stockEditorState.item?.id || 0);
    if (!itemId) return;
    const confirmar = await mostrarConfirmacionAccion({
      titulo: "Eliminar artículo",
      mensaje: `Se eliminará ${stockEditorState.item?.article_code || stockEditorState.item?.sku || "este artículo"} junto con sus tallas.`,
      confirmarTexto: "Sí, eliminar",
    });
    if (!confirmar) return;
    try {
      await eliminarStockCatalogAdmin(itemId);
      await cargarStockCatalogAdmin();
      await cargarStockData();
      cerrarEditorStock();
      mostrarToastExito("Artículo eliminado", "El artículo se eliminó correctamente.");
    } catch (err) {
      mostrarToastError("No se pudo eliminar", err.message || "Error eliminando artículo");
    }
  });
}

function limpiarCarrito() {
  pedido = [];
  const rutEl = document.getElementById("clientRut");
  const nameEl = document.getElementById("clientName");
  const phoneEl = document.getElementById("clientPhone");
  if (rutEl) rutEl.value = "";
  if (nameEl) nameEl.value = "";
  if (phoneEl) phoneEl.value = "";
  clienteSeleccionado = null;
  clearCartFieldInvalidState();
  setClientLookupUI();
  renderClientNewHelper(false);
  toggleClientNameField(false);
  toggleClientPhoneField(false);
  document.getElementById("cartSidebar").classList.remove("open");
  limpiarCotizacionPersistida();
  actualizarCarrito();
}

function resolverTituloErrorCotizacion(error) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("internal_contact_support")) return "Error";
  if (message.includes("rut")) return "Falta RUT válido";
  if (message.includes("nombre") || message.includes("razón social") || message.includes("razon social")) {
    return "Falta nombre o razón social";
  }
  if (message.includes("teléfono") || message.includes("telefono")) return "Falta teléfono";
  if (message.includes("stock")) return "Stock insuficiente";
  if (message.includes("items") || message.includes("productos") || message.includes("modelos")) {
    return "Faltan productos";
  }
  return "No se pudo enviar";
}

function resolverMensajeErrorCotizacion(error) {
  const message = String(error?.message || "");
  if (message.toLowerCase().includes("internal_contact_support")) {
    return "Error. Contáctanos para poder solucionarlo.";
  }
  return message || "Revisa los datos ingresados e inténtalo nuevamente.";
}

document.getElementById("sendRequest").onclick = async () => {
  if (!pedido.length) {
    return mostrarToastError("Faltan productos", "Agrega al menos un modelo antes de enviar el pedido.");
  }

  const totalUnidades = pedido.reduce((s, item) =>
    s + Object.values(item.tallas).reduce((a, b) => a + (Number(b) || 0), 0), 0);
  if (totalUnidades < 24) {
    return mostrarToastError(
      "Mínimo 24 unidades",
      `Tu pedido tiene ${totalUnidades} unidad${totalUnidades !== 1 ? "es" : ""}. El pedido mínimo mayorista es de 24 unidades.`
    );
  }

  const btn = document.getElementById("sendRequest");
  const textoOriginal = btn.innerText;
  btn.disabled = true;
  btn.innerText = "Guardando...";

  try {
    clearCartFieldInvalidState();
    const cliente = await obtenerClienteParaCotizacion();
    btn.innerText = "Enviando pedido...";
    await guardarCotizacionSupabase(cliente);

    // ── CRM: registrar pedido si el cliente vino desde WhatsApp ──────────
    const _waPhone = sessionStorage.getItem("crm_wa_phone") || cliente.client_phone || "";
    const _mcId    = sessionStorage.getItem("crm_mc_id")    || "";
    if (_waPhone || _mcId) {
      fetch("/.netlify/functions/crm-lead", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret:     "mohicano-crm-2026",
          canal:      "whatsapp",
          tipo_flujo: "mayorista",
          nombre:     cliente.razon_social || "",
          telefono:   _waPhone,
          mc_id:      _mcId,
          mensaje:    `Realizó un pedido en la página (${CATALOG_SOURCE})`,
          etapa:      "Realizó pedido",
        }),
      }).catch(() => {});
    }

    mostrarToastExito("Pedido enviado con éxito", "Recibimos tu solicitud correctamente.");
    limpiarCarrito();
  } catch (error) {
    console.error(error);
    mostrarToastError(
      resolverTituloErrorCotizacion(error),
      resolverMensajeErrorCotizacion(error)
    );
  } finally {
    btn.disabled = false;
    btn.innerText = textoOriginal;
  }
};
configurarInputsTallas();
configurarLookupCliente();
restaurarCotizacionPersistida();
actualizarCarrito();
inicializarPromoReemplazoScroll();
if (document.getElementById("clientRut")?.value) {
  validarRutClienteEnUI({ silencioso: true });
}
configurarPanelCotizaciones();

document.getElementById("closeCart").onclick = () => {
  document.getElementById("cartSidebar").classList.remove("open");
  document.querySelector(".cart-overlay")?.classList.remove("active");
};

// ── CRM: tracking de visita desde WhatsApp ManyChat ──────────────────────────
// ManyChat manda los links con ?wa={{phone}}&mc={{subscriber id}}
// Ej: mohicanojeans.netlify.app/cole-43?wa=56912345678&mc=1234567890
(function _crmWaTracking() {
  try {
    const params  = new URLSearchParams(window.location.search);
    const waPhone = params.get("wa") || "";
    const mcId    = params.get("mc") || "";
    if (!waPhone && !mcId) return;

    // Guardar para usarlo si después hacen un pedido
    if (waPhone) sessionStorage.setItem("crm_wa_phone", waPhone);
    if (mcId)    sessionStorage.setItem("crm_mc_id",    mcId);

    // Registrar visita en CRM (fire-and-forget)
    fetch("/.netlify/functions/crm-lead", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret:     "mohicano-crm-2026",
        canal:      "whatsapp",
        tipo_flujo: "mayorista",
        telefono:   waPhone,
        mc_id:      mcId,
        mensaje:    "Visitó la página desde WhatsApp",
        etapa:      "Contactó",
      }),
    }).catch(() => {});
  } catch (_) {}
})();
