// Wrap the admin's Khmer UI strings in t(): JSX text, display attributes and
// status-message properties. Prints what it could not place safely.
const ts = require("/home/claude/work/wedding-e-invitation/node_modules/typescript");
const fs = require("fs");
const KH = /[ក-៿]/;
const ATTRS = new Set(["label", "hint", "title", "placeholder", "description", "aria-label", "alt", "subtitle", "confirmText"]);
const PROPS = new Set(["successText", "text", "hint", "description"]);
const LITERALS = process.argv.includes("--literals");
const files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
// stored values and sample data: never translated
const SKIP = new Set(["លោក", "ឈ្មោះភ្ញៀវ", "ពណ៌សម្លៀកបំពាក់", "ពេលព្រឹក",
  "លោក ថេង រ័ត្នរង្សីរឿង, 2\nលោកស្រី ចាន់ ដារ៉ា, 1\nសុខ វណ្ណា, 1"]);
const keys = new Set();
const report = [];

function jsxClean(text) {
  // React's JSX whitespace rules (babel cleanJSXElementLiteralChild)
  const lines = text.split(/\r\n|\n|\r/);
  let last = 0;
  lines.forEach((l, i) => { if (/[^ \t]/.test(l)) last = i; });
  let out = "";
  lines.forEach((line, i) => {
    let s = line.replace(/\t/g, " ");
    if (i !== 0) s = s.replace(/^[ ]+/, "");
    if (i !== lines.length - 1) s = s.replace(/[ ]+$/, "");
    if (s) { if (i !== last) s += " "; out += s; }
  });
  return out;
}

for (const file of files) {
  let src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const isClient = /^\s*["']use client["']/.test(src);
  const edits = []; // {start,end,text}
  const needT = new Map(); // component node -> true

  const componentOf = (node) => {
    // outermost function whose parent chain reaches the source file
    let fn = null, n = node;
    while (n) {
      if (ts.isFunctionDeclaration(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n)) fn = n;
      n = n.parent;
    }
    if (!fn) return null;
    let name = fn.name?.text;
    if (!name && fn.parent && ts.isVariableDeclaration(fn.parent)) name = fn.parent.name.text;
    if (!name || !/^[A-Z]/.test(name) || !fn.body || !ts.isBlock(fn.body)) return null;
    return fn;
  };
  const shadowed = (node, comp) => {
    for (let n = node.parent; n && n !== comp; n = n.parent) {
      if ((ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isFunctionDeclaration(n)) &&
          n.parameters.some((p) => ts.isIdentifier(p.name) && p.name.text === "t")) return true;
    }
    return false;
  };
  const place = (node, start, end, text, key) => {
    const comp = componentOf(node);
    const line = sf.getLineAndCharacterOfPosition(start).line + 1;
    if (!comp) return report.push(`${file}:${line} no component: ${JSON.stringify(key)}`);
    if (shadowed(node, comp)) return report.push(`${file}:${line} t shadowed: ${JSON.stringify(key)}`);
    if (!isClient && !(comp.modifiers || []).some((m) => m.kind === ts.SyntaxKind.AsyncKeyword))
      return report.push(`${file}:${line} server non-async: ${JSON.stringify(key)}`);
    edits.push({ start, end, text });
    needT.set(comp, true);
    keys.add(key.replace(/\s+/g, " ").trim());
  };

  const visit = (node) => {
    if (ts.isJsxText(node) && KH.test(node.text)) {
      const clean = jsxClean(node.text);
      if (clean.trim()) place(node, node.getStart(sf), node.end, `{t(${JSON.stringify(clean)})}`, clean);
    } else if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer) &&
               KH.test(node.initializer.text) && ATTRS.has(node.name.getText(sf))) {
      place(node, node.initializer.getStart(sf), node.initializer.end, `{t(${JSON.stringify(node.initializer.text)})}`, node.initializer.text);
    } else if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.initializer) && KH.test(node.initializer.text) &&
               PROPS.has(node.name.getText(sf))) {
      // only inside components (status messages); module-level data stays as is
      place(node, node.initializer.getStart(sf), node.initializer.end, `t(${JSON.stringify(node.initializer.text)})`, node.initializer.text);
    } else if (LITERALS && ts.isStringLiteral(node) && KH.test(node.text) && !SKIP.has(node.text) &&
               !(node.parent && ts.isCallExpression(node.parent) && node.parent.expression.getText(sf) === "t") &&
               !(node.parent && (ts.isJsxAttribute(node.parent) || ts.isImportDeclaration(node.parent) ||
                 (ts.isPropertyAssignment(node.parent) && node.parent.initializer === node)))) {
      place(node, node.getStart(sf), node.end, `t(${JSON.stringify(node.text)})`, node.text);
    } else if (ts.isStringLiteral(node) && KH.test(node.text) && !(node.parent && (ts.isJsxAttribute(node.parent) || ts.isPropertyAssignment(node.parent) || ts.isImportDeclaration(node.parent)))) {
      report.push(`${file}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1} literal: ${JSON.stringify(node.text)}`);
    } else if ((ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)) && KH.test(node.getText(sf))) {
      report.push(`${file}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1} template: ${node.getText(sf).slice(0, 90)}`);
      return;
    } else if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.initializer) && KH.test(node.initializer.text)) {
      report.push(`${file}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1} prop ${node.name.getText(sf)}: ${JSON.stringify(node.initializer.text)}`);
    } else if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer) && KH.test(node.initializer.text)) {
      report.push(`${file}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1} attr ${node.name.getText(sf)}: ${JSON.stringify(node.initializer.text)}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (!edits.length) continue;

  // the hook (or the server helper) at the top of each component that needs it
  for (const comp of needT.keys()) {
    const body = comp.body;
    const already = body.statements.some((s) => /const t = (useT\(\)|await getT\(\))/.test(s.getText(sf)));
    if (already) continue;
    edits.push({ start: body.getStart(sf) + 1, end: body.getStart(sf) + 1, text: isClient ? "\n  const t = useT();" : "\n  const t = await getT();" });
  }
  edits.sort((a, b) => b.start - a.start);
  for (const e of edits) src = src.slice(0, e.start) + e.text + src.slice(e.end);
  // the import
  const imp = isClient
    ? (file.includes("/components/admin/") ? `import { useT } from "./AdminPrefs";` : `import { useT } from "@/components/admin/AdminPrefs";`)
    : `import { getT } from "@/lib/i18n/server";`;
  if (!src.includes(imp) && !(isClient && /import \{[^}]*\buseT\b[^}]*\} from "\.\/AdminPrefs"/.test(src))) {
    const m = [...src.matchAll(/^import[^;]*;\s*$/gm)].pop();
    const at = m ? m.index + m[0].length : 0;
    src = src.slice(0, at) + "\n" + imp + src.slice(at);
  }
  fs.writeFileSync(file, src);
}
const prev = fs.existsSync("/tmp/claude-0/i18n/keys.json") ? JSON.parse(fs.readFileSync("/tmp/claude-0/i18n/keys.json", "utf8")) : [];
fs.writeFileSync("/tmp/claude-0/i18n/keys.json", JSON.stringify([...new Set([...prev, ...keys])].sort(), null, 1));
fs.writeFileSync("/tmp/claude-0/i18n/report.txt", report.join("\n"));
console.log("keys", keys.size, "report", report.length);
