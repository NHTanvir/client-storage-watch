// Pure: render a diff + leftovers as Markdown for notes.
export function toMarkdown({ d, a, b, leftovers }) {
  const L = [`# Storage diff — ${a.label} → ${b.label}`, ''];
  if (leftovers && leftovers.length) {
    L.push('## ⚠ Secrets still present after logout', '');
    for (const e of leftovers) L.push(`- \`${e.store}.${e.key}\` — ${e.flags.join(', ')}`);
    L.push('');
  }
  for (const store of Object.keys(d)) {
    const s = d[store];
    if (!s.added.length && !s.removed.length && !s.changed.length) continue;
    L.push(`## ${store}`, '');
    for (const r of s.added) L.push(`- added \`${r.key}\``);
    for (const r of s.removed) L.push(`- removed \`${r.key}\``);
    for (const r of s.changed) L.push(`- changed \`${r.key}\``);
    L.push('');
  }
  return L.join('\n');
}
