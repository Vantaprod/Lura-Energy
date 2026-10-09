const fs = require('fs');
const path = 'src/lib/i18n/dictionaries.ts';
let src = fs.readFileSync(path, 'utf8');

const newKeysEn = [
  "    'admin.translations.title': 'Translations',",
  "    'admin.translations.hint': 'Optional. Fill in the language-specific versions of the fields above. Anything left blank falls back to the English value.',",
  "    'admin.translations.countFilled': '{n} field(s) translated',",
  "    'admin.translations.none': 'Not translated',",
  "    'admin.translations.linesHint': 'One item per line.',",
  "    'admin.translations.clearLang': 'Clear this language',",
].join('\n');

const newKeysZh = [
  "    'admin.translations.title': '翻译',",
  "    'admin.translations.hint': '可选。填写上方字段的对应语言版本。留空则使用英文版本。',",
  "    'admin.translations.countFilled': '已翻译 {n} 个字段',",
  "    'admin.translations.none': '尚未翻译',",
  "    'admin.translations.linesHint': '每行一项。',",
  "    'admin.translations.clearLang': '清除此语言',",
].join('\n');

const newKeysFr = [
  "    'admin.translations.title': 'Traductions',",
  "    'admin.translations.hint': 'Facultatif. Saisissez les versions dans la langue cible des champs ci-dessus. Tout champ vide revient à la valeur anglaise.',",
  "    'admin.translations.countFilled': '{n} champ(s) traduit(s)',",
  "    'admin.translations.none': 'Non traduit',",
  "    'admin.translations.linesHint': 'Un élément par ligne.',",
  "    'admin.translations.clearLang': 'Effacer cette langue',",
].join('\n');

const anchors = [
  { lang: 'en', anchor: "'admin.settings.action.save': 'Save site settings',", insert: newKeysEn },
  { lang: 'zh', anchor: "'admin.settings.action.save': '保存网站设置',", insert: newKeysZh },
  { lang: 'fr', anchor: "'admin.settings.action.save': 'Enregistrer les paramètres',", insert: newKeysFr },
];

for (const a of anchors) {
  const already = src.includes("'admin.translations.title'");
  if (already) {
    console.log(`Skipping ${a.lang} — translations keys already present`);
    continue;
  }
  if (src.includes(a.anchor)) {
    src = src.replace(a.anchor, a.anchor + '\n\n    // ---- TRANSLATIONS EDITOR ----\n' + a.insert);
    console.log(`Added translations keys to ${a.lang}`);
  } else {
    console.log(`Anchor not found for ${a.lang}`);
  }
}

fs.writeFileSync(path, src, 'utf8');
console.log('Done.');