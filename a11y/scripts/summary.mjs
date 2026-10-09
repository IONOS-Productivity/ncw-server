/**
 * SPDX-FileCopyrightText: 2026 STRATO GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
// Builds a11y-results/SUMMARY.md from the findings-<label>.jsonl files written by helpers/axe.ts
//  - token findings (synthetic harness, ionos only)
//  - page findings introduced by the IONOS theme = in `ionos` but not in `default` baseline
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'a11y-results')

function load(label) {
	const file = join(dir, `findings-${label}.jsonl`)
	if (!existsSync(file)) return []
	return readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l))
}

const ionos = load('ionos')
const baseline = load('default')

const tokens = ionos.filter((f) => f.scenario.startsWith('tokens-'))
const pagesIonos = ionos.filter((f) => !f.scenario.startsWith('tokens-'))

const key = (f) => `${f.scenario}|${f.rule}|${f.target}`
const baselineKeys = new Set(baseline.map(key))
const introduced = pagesIonos.filter((f) => !baselineKeys.has(key(f)))

const uniq = (rows, k) => [...new Map(rows.map((r) => [k(r), r])).values()]

let md = '# IONOS theme a11y summary\n\n'

md += `## Token contrast (${uniq(tokens, (f) => f.scenario).length} failing pairs)\n\n`
if (tokens.length === 0) md += '_No findings._\n\n'
else {
	md += '| Scheme | Foreground on background | Ratio | Needed | fg | bg |\n|---|---|---|---|---|---|\n'
	for (const f of uniq(tokens, (r) => r.scenario)) {
		const [, scheme, rest] = f.scenario.match(/^tokens-(light|dark)-(.*)$/)
		md += `| ${scheme} | \`${rest.replace('-on-', '\` on \`')}\` | ${f.contrast ?? '?'} | ${f.expected ?? '4.5:1'} | ${f.fg ?? ''} | ${f.bg ?? ''} |\n`
	}
	md += '\n'
}

md += `## Pages / states: all findings with IONOS theme: ${pagesIonos.length}\n\n`
md += baseline.length
	? `Baseline (default theme): ${baseline.length}. **Introduced by IONOS customisation: ${introduced.length}**\n\n`
	: '_No `default` baseline found, run with `A11Y_LABEL=default` and `enforce_theme=default` to separate upstream from IONOS issues._\n\n'
for (const f of baseline.length ? introduced : pagesIonos) {
	md += `- \`${f.scenario}\` - ${f.rule} (${f.impact}): ${f.help} - \`${f.target}\`\n`
}

writeFileSync(join(dir, 'SUMMARY.md'), md)
console.log(md)
