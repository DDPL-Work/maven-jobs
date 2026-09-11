/* ─────────────────────────────────────────────────────────────
   Shared font resolution — single source of truth so that
   /resume-builder preview, /resume-view, and PDF export all
   honor the selected font family.
───────────────────────────────────────────────────────────── */
export const loadGoogleFont = (fontName) => {
  if (!fontName || typeof document === "undefined") return;
  const systemFonts = [
    "Georgia",
    "Courier New",
    "Arial",
    "Times New Roman",
    "Helvetica",
  ];
  if (systemFonts.includes(fontName)) return;

  const id = `gfont-${fontName.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  const formattedName = fontName.replace(/\s+/g, "+");
  link.href = `https://fonts.googleapis.com/css2?family=${formattedName}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700&display=swap`;
  document.head.appendChild(link);
};

export const FONT_STACK_MAP = {
  // Sans-Serif (Clean, Modern & Technical)
  "DM Sans": "'DM Sans', sans-serif",
  Inter: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  Roboto: "'Roboto', sans-serif",
  "Open Sans": "'Open Sans', sans-serif",
  Lato: "'Lato', sans-serif",
  Montserrat: "'Montserrat', sans-serif",
  Poppins: "'Poppins', sans-serif",
  "Plus Jakarta Sans": "'Plus Jakarta Sans', sans-serif",
  Nunito: "'Nunito', sans-serif",
  "Nunito Sans": "'Nunito Sans', sans-serif",
  "Work Sans": "'Work Sans', sans-serif",
  Raleway: "'Raleway', sans-serif",
  Ubuntu: "'Ubuntu', sans-serif",
  Rubik: "'Rubik', sans-serif",
  Outfit: "'Outfit', sans-serif",
  "Space Grotesk": "'Space Grotesk', sans-serif",
  "Fira Sans": "'Fira Sans', sans-serif",
  Barlow: "'Barlow', sans-serif",
  Quicksand: "'Quicksand', sans-serif",
  Manrope: "'Manrope', sans-serif",
  Karla: "'Karla', sans-serif",
  Cabin: "'Cabin', sans-serif",
  "PT Sans": "'PT Sans', sans-serif",
  "Source Sans 3": "'Source Sans 3', sans-serif",
  Mulish: "'Mulish', sans-serif",
  Urbanist: "'Urbanist', sans-serif",
  "Noto Sans": "'Noto Sans', sans-serif",
  Figtree: "'Figtree', sans-serif",
  Geist: "'Geist', sans-serif",
  Oswald: "'Oswald', sans-serif",
  "Bebas Neue": "'Bebas Neue', sans-serif",
  Syne: "'Syne', sans-serif",

  // Serif (Classic, Elegant & Executive)
  Georgia: "Georgia, serif",
  Merriweather: "'Merriweather', Georgia, serif",
  "Playfair Display": "'Playfair Display', Georgia, serif",
  Lora: "'Lora', Georgia, serif",
  "PT Serif": "'PT Serif', Georgia, serif",
  "Libre Baskerville": "'Libre Baskerville', Georgia, serif",
  "EB Garamond": "'EB Garamond', Georgia, serif",
  "Crimson Text": "'Crimson Text', Georgia, serif",
  "Crimson Pro": "'Crimson Pro', Georgia, serif",
  "Cormorant Garamond": "'Cormorant Garamond', Georgia, serif",
  Cinzel: "'Cinzel', serif",
  "Bodoni Moda": "'Bodoni Moda', Georgia, serif",
  Bitter: "'Bitter', Georgia, serif",
  Spectral: "'Spectral', Georgia, serif",
  "Source Serif 4": "'Source Serif 4', Georgia, serif",
  Arvo: "'Arvo', serif",
  "Zilla Slab": "'Zilla Slab', serif",

  // Monospace (Coding, Engineering & Tech)
  "Courier New": "'Courier New', monospace",
  "Fira Code": "'Fira Code', monospace",
  "JetBrains Mono": "'JetBrains Mono', monospace",
  "Roboto Mono": "'Roboto Mono', monospace",
  "Source Code Pro": "'Source Code Pro', monospace",
  "Space Mono": "'Space Mono', monospace",
  Inconsolata: "'Inconsolata', monospace",
  "Ubuntu Mono": "'Ubuntu Mono', monospace",
};

export const ALL_GOOGLE_FONTS = [
  // Sans-Serif
  "DM Sans",
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Plus Jakarta Sans",
  "Nunito",
  "Nunito Sans",
  "Work Sans",
  "Raleway",
  "Outfit",
  "Space Grotesk",
  "Manrope",
  "Mulish",
  "Urbanist",
  "Quicksand",
  "Rubik",
  "Fira Sans",
  "Barlow",
  "Karla",
  "Cabin",
  "Figtree",
  "Geist",
  "PT Sans",
  "Source Sans 3",
  "Ubuntu",
  "Noto Sans",

  // Serif
  "Merriweather",
  "Playfair Display",
  "Lora",
  "PT Serif",
  "Libre Baskerville",
  "EB Garamond",
  "Crimson Text",
  "Crimson Pro",
  "Cormorant Garamond",
  "Cinzel",
  "Bodoni Moda",
  "Bitter",
  "Spectral",
  "Source Serif 4",
  "Arvo",
  "Georgia",

  // Monospace
  "Fira Code",
  "JetBrains Mono",
  "Roboto Mono",
  "Source Code Pro",
  "Space Mono",
  "Inconsolata",
  "Courier New",

  // Display
  "Oswald",
  "Bebas Neue",
  "Syne",
];

export function getFontFamily(
  formatting = {},
  fallback = "'DM Sans', sans-serif",
) {
  if (!formatting?.font) return fallback;
  if (FONT_STACK_MAP[formatting.font]) return FONT_STACK_MAP[formatting.font];
  return `'${formatting.font}', sans-serif`;
}
