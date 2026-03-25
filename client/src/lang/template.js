/** Replace `{key}` placeholders in translation strings (e.g. `{volume}`, `{current}`). */
export function fillTranslationTemplate(template, vars) {
  if (template == null || typeof template !== 'string') return '';
  let s = template;
  for (const [k, v] of Object.entries(vars || {})) {
    s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}
