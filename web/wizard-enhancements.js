const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));

function markdownBlock(source) {
  const lines = source.split(/\r?\n/).map(line => line.trim()).filter(Boolean), output = [];
  for (let index = 0; index < lines.length;) {
    if (lines[index].startsWith('|')) {
      const rows = [];
      while (index < lines.length && lines[index].startsWith('|')) { if (!/^\|\s*:?-{2,}/.test(lines[index])) rows.push(lines[index].split('|').slice(1,-1).map(cell => escapeHtml(cell.trim()))); index++; }
      if (rows.length) output.push(`<div class="manual-table-wrap"><table class="manual-table"><tbody>${rows.map((row, rowIndex) => `<tr>${row.map(cell => `<${rowIndex ? 'td' : 'th'}>${cell}</${rowIndex ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</tbody></table></div>`);
    } else if (/^[-*]\s+/.test(lines[index])) {
      const items = []; while (index < lines.length && /^[-*]\s+/.test(lines[index])) items.push(`<li>${escapeHtml(lines[index].replace(/^[-*]\s+/, ''))}</li>`), index++;
      output.push(`<ul>${items.join('')}</ul>`);
    } else { output.push(`<p>${escapeHtml(lines[index])}</p>`); index++; }
  }
  return output.join('');
}

function enhanceManual(container) {
  if (!container || container.dataset.enhanced === 'true') return;
  const source = container.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/\s*\n\s*/g, '\n').trim();
  if (!source || source === 'Brak dodatkowego opisu.') return;
  const sections = source.split(/(?:^|\n)###\s+/).map(section => section.trim()).filter(Boolean);
  container.innerHTML = sections.map(section => {
    const newline = section.indexOf('\n'), title = newline < 0 ? section : section.slice(0, newline), body = newline < 0 ? '' : section.slice(newline + 1);
    return `<section class="manual-section"><h4>${escapeHtml(title)}</h4>${markdownBlock(body)}</section>`;
  }).join('');
  container.dataset.enhanced = 'true';
}

function enhanceBilateralGroups(card) {
  if (!card || card.dataset.sidesEnhanced === 'true') return;
  const groups = [...card.querySelectorAll(':scope > div > .answer-group')];
  for (let index = 0; index < groups.length - 1; index++) {
    const left = groups[index], right = groups[index + 1];
    const leftLabel = left.querySelector('.answer-label small')?.textContent.trim();
    const rightLabel = right.querySelector('.answer-label small')?.textContent.trim();
    if (leftLabel === 'Lewa strona' && rightLabel === 'Prawa strona') {
      const wrapper = document.createElement('div');
      wrapper.className = 'bilateral-layout';
      left.parentNode.insertBefore(wrapper, left);
      wrapper.append(left, right);
      index++;
    }
  }
  card.dataset.sidesEnhanced = 'true';
}

function enhanceWizard() {
  document.querySelectorAll('.test-card').forEach(card => {
    enhanceManual(card.querySelector('.manual-copy'));
    enhanceBilateralGroups(card);
  });
}

new MutationObserver(enhanceWizard).observe(document.body, { childList: true, subtree: true });
enhanceWizard();
