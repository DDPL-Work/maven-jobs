/* ─────────────────────────────────────────────────────────────
   ResumeTemplates.jsx
   Central modular entry point for all resume template designs,
   font loading utilities, and template metadata.
───────────────────────────────────────────────────────────── */

// Font Utilities & Maps
export {
  loadGoogleFont,
  FONT_STACK_MAP,
  ALL_GOOGLE_FONTS,
  getFontFamily,
} from "./components/templates/fontUtils";

// Helper components & utilities
export {
  nameParts,
  SectionHead,
  ContactLinks,
  BulletPoints,
  formatText,
  FONT_SIZE_SCALE_MAP,
  LINE_HEIGHT_MAP,
  ProjectBullets,
  FormattedParagraph,
  DefaultExtraSections,
} from "./components/templates/templateHelpers";

// Template Components (20 templates)
export {
  TemplateClassicBlue,
  TemplateCorporate,
  TemplateMinimalClean,
  TemplateElegant,
  TemplateModernLight,
  TemplateSidebar,
  TemplateTimeline,
  TemplateCompact,
  TemplateFocus,
  TemplateGrid,
  TemplateExecutive,
  TemplateCreative,
  TemplateProfessionalDark,
  TemplateContemporary,
  TemplateBold,
  TemplateCardinal,
  TemplateObsidian,
  TemplateLuxury,
  TemplateNature,
  TemplateSlate,
} from "./components/templates/AllTemplateDefinitions";

// Template Registry & Preview
export {
  TemplateCardPreview,
  TEMPLATES,
  getTemplate,
  isProTemplate,
} from "./components/templates/templateRegistry";
