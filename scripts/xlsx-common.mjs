// Outils communs aux modèles Excel de l'agence (couleurs de la marque, en-têtes, listes déroulantes)
export const BRAND = { night: "FF0E1420", gold: "FFC9A24B", goldLight: "FFE8D3A0", emerald: "FF0F5C4D", ivory: "FFFBF8F2", example: "FFFFF4D6", required: "FF7A5A14" };

/**
 * Ajoute un onglet de saisie : colonnes { key, header, width, required, note, list, numFmt, formula }.
 * list = nom d'une plage nommée de l'onglet « Listes » (validation de données).
 */
export function dataSheet(wb, name, columns, { rows = [], maxRows = 300, tabColor = BRAND.gold } = {}) {
  const ws = wb.addWorksheet(name, { properties: { tabColor: { argb: tabColor } }, views: [{ state: "frozen", xSplit: 1, ySplit: 1 }] });
  ws.columns = columns.map((c) => ({ key: c.key, width: c.width ?? 18 }));
  const head = ws.getRow(1);
  columns.forEach((c, i) => {
    const cell = head.getCell(i + 1);
    cell.value = c.required ? `${c.header} *` : c.header;
    cell.font = { bold: true, color: { argb: c.required ? BRAND.goldLight : "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: c.formula ? BRAND.emerald : BRAND.night } };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.border = { bottom: { style: "medium", color: { argb: BRAND.gold } } };
    if (c.note) cell.note = { texts: [{ text: c.note }], margins: { insetmode: "auto" } };
  });
  head.height = 42;
  for (const r of rows) {
    const row = ws.addRow(r);
    row.eachCell({ includeEmpty: true }, (cell) => (cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.example } }));
  }
  // validations et formats sur toute la zone de saisie
  columns.forEach((c, i) => {
    const col = ws.getColumn(i + 1);
    for (let r = 2; r <= maxRows; r++) {
      const cell = ws.getCell(r, i + 1);
      if (c.list) cell.dataValidation = { type: "list", allowBlank: !c.required, formulae: [c.list], showErrorMessage: true, errorStyle: "stop", errorTitle: "Valeur non autorisée", error: "Choisissez une valeur dans la liste." };
      if (c.int) cell.dataValidation = { type: "whole", operator: "between", allowBlank: !c.required, formulae: [c.int[0], c.int[1]], showErrorMessage: true, error: `Nombre entier entre ${c.int[0]} et ${c.int[1]}.` };
      if (c.date) cell.dataValidation = { type: "date", operator: "greaterThan", allowBlank: !c.required, formulae: [new Date(Date.UTC(2015, 0, 1))], showErrorMessage: true, error: "Date attendue (JJ/MM/AAAA)." };
      if (c.formula && r > 1) cell.value = { formula: c.formula(r) };
      if (c.formula) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F1EE" } };
    }
    if (c.numFmt) col.numFmt = c.numFmt;
    if (c.date) col.numFmt = "dd/mm/yyyy";
    if (c.wrap) col.alignment = { wrapText: true, vertical: "top" };
  });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  return ws;
}

/** onglet « Listes » : une colonne par liste, chacune exposée comme plage nommée */
export function listsSheet(wb, lists) {
  const ws = wb.addWorksheet("Listes", { state: "hidden" });
  Object.entries(lists).forEach(([name, values], i) => {
    const col = i + 1;
    ws.getCell(1, col).value = name;
    ws.getCell(1, col).font = { bold: true };
    values.forEach((v, j) => (ws.getCell(j + 2, col).value = v));
    const letter = ws.getColumn(col).letter;
    wb.definedNames.add(`'Listes'!$${letter}$2:$${letter}$${values.length + 1}`, name);
    ws.getColumn(col).width = Math.max(14, ...values.map((v) => String(v).length + 2));
  });
  return ws;
}

/** onglet « Mode d'emploi » : titre, paragraphes et tableau de légende */
export function guideSheet(wb, title, blocks) {
  const ws = wb.addWorksheet("Mode d'emploi", { properties: { tabColor: { argb: BRAND.night } } });
  ws.getColumn(1).width = 4;
  ws.getColumn(2).width = 120;
  const t = ws.getCell("B2");
  t.value = title;
  t.font = { bold: true, size: 18, color: { argb: BRAND.night } };
  let r = 4;
  for (const b of blocks) {
    const c = ws.getCell(r, 2);
    if (b.h) {
      c.value = b.h;
      c.font = { bold: true, size: 13, color: { argb: BRAND.required } };
      r += 1;
      continue;
    }
    c.value = b.p ?? b;
    c.alignment = { wrapText: true, vertical: "top" };
    if (b.fill) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: b.fill } };
    if (b.bold) c.font = { bold: true };
    ws.getRow(r).height = Math.max(16, Math.ceil(String(c.value).length / 110) * 16);
    r += 1;
  }
  return ws;
}
