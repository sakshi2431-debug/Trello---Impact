import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import postcss, { type AtRule, type ChildNode, type Declaration, type Rule } from 'postcss'

/**
 * Atlaskit ships pre-extracted atomic CSS as one `*.compiled.css` file per module. The same
 * atomic class (e.g. `display:none`) is repeated across files, so when files load separately a
 * later base rule can override an earlier media-query rule and break responsive components such as
 * the navigation-system layout. Atlassian's own bundlers sort this CSS globally; here we get the same
 * precedence by assigning every rule to an ordered cascade layer.
 */
const LAYERS = [
  'ak.reset',
  'ak.shorthand',
  'ak.base',
  'ak.link',
  'ak.visited',
  'ak.focus-within',
  'ak.focus',
  'ak.focus-visible',
  'ak.hover',
  'ak.active',
  'ak.mq-30',
  'ak.mq-40',
  'ak.mq-48',
  'ak.mq-64',
  'ak.mq-90',
  'ak.mq-110',
  'ak.mq-other',
]

const PSEUDO_LAYERS: [string, string][] = [
  [':active', 'ak.active'],
  [':hover', 'ak.hover'],
  [':focus-visible', 'ak.focus-visible'],
  [':focus-within', 'ak.focus-within'],
  [':focus', 'ak.focus'],
  [':visited', 'ak.visited'],
  [':link', 'ak.link'],
]

/**
 * Shorthands must lose to longhands (`font` vs `font-weight`), as Compiled guarantees within one sheet.
 * Across sheets a repeated shorthand class can load later, so shorthands get their own earlier layer.
 */
const SHORTHANDS = new Set([
  'font', 'margin', 'margin-block', 'margin-inline', 'padding', 'padding-block', 'padding-inline',
  'border', 'border-block', 'border-inline', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-width', 'border-style', 'border-color', 'border-radius', 'background', 'inset', 'inset-block', 'inset-inline',
  'flex', 'flex-flow', 'grid', 'grid-area', 'grid-template', 'gap', 'overflow', 'outline', 'text-decoration',
  'transition', 'animation', 'place-items', 'place-content', 'place-self', 'list-style', 'columns',
])

function layerForRule(rule: Rule) {
  const pseudo = PSEUDO_LAYERS.find(([p]) => rule.selector.includes(p))?.[1]
  if (pseudo) return pseudo
  const props = rule.nodes.filter((n): n is Declaration => n.type === 'decl').map((n) => n.prop)
  return props.length > 0 && props.every((prop) => SHORTHANDS.has(prop)) ? 'ak.shorthand' : 'ak.base'
}

function layerForMedia(params: string) {
  const min = params.match(/min-width:\s*([\d.]+)rem/)
  if (min && !/max-width|not all/.test(params)) {
    const layer = `ak.mq-${Math.floor(Number(min[1]))}`
    if (LAYERS.includes(layer)) return layer
  }
  return 'ak.mq-other'
}

function layerCompiledCss(css: string) {
  const root = postcss.parse(css)
  const buckets = new Map<string, ChildNode[]>()
  const unlayered: ChildNode[] = []
  root.each((node) => {
    let layer: string | null = null
    if (node.type === 'rule') layer = layerForRule(node)
    else if (node.type === 'atrule' && (node as AtRule).name === 'media') layer = layerForMedia((node as AtRule).params)
    if (!layer) return void unlayered.push(node)
    buckets.set(layer, [...(buckets.get(layer) ?? []), node])
  })
  const out = postcss.root()
  unlayered.forEach((node) => out.append(node.clone()))
  for (const [layer, nodes] of buckets) {
    const block = postcss.atRule({ name: 'layer', params: layer })
    nodes.forEach((node) => block.append(node.clone()))
    out.append(block)
  }
  return out.toString()
}

function atlaskitCssLayers(): Plugin {
  return {
    name: 'atlaskit-css-layers',
    enforce: 'pre',
    transformIndexHtml: () => [{ tag: 'style', children: `@layer ${LAYERS.join(', ')};`, injectTo: 'head-prepend' }],
    transform(code, id) {
      const file = id.split('?')[0]
      if (file.endsWith('.compiled.css')) return { code: layerCompiledCss(code), map: null }
      // The reset sits underneath every component style.
      if (file.includes('@atlaskit/css-reset') && file.endsWith('.css')) return { code: `@layer ak.reset {\n${code}\n}`, map: null }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    atlaskitCssLayers(),
    react({
      babel: {
        plugins: [
          ['@atlaskit/tokens/babel-plugin', { shouldUseAutoFallback: true }],
          // Compiles `cssMap` from @atlaskit/css so styles can be passed to ADS primitives via `xcss`.
          // The prefix keeps our runtime atomic classes from redefining Atlaskit's layered ones.
          ['@compiled/babel-plugin', { importSources: ['@atlaskit/css'], classHashPrefix: 'app' }],
        ],
      },
    }),
  ],
})
