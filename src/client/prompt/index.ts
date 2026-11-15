/**
 * prompt — 提示词管理（上游 dsh-prompt-customizer v0.5.1 的浏览器半身）。
 *
 * 迁移范围：只保留面板本体（Panel 与它的分栏 / 预览 / 快照库）。上游的
 * 侧边栏入口与抽屉外壳（nav.tsx / shell.tsx）由 triad 的「提示词」顶层 tab
 * 取代；宿主路由仍是 /api/prompt-customizer/*（见 vendor/prompt-customizer）。
 *
 * 与上游的唯一差异：面板不再自己开窗（无关闭按钮、无遮罩与侧栏几何推算）。
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { DICT, type Translate } from './locales.ts'
import { RU } from './locales.ru.ts'

/** 文案命名空间（与上游一致，避免两份字典）。 */
const NS = 'prompt-customizer'

/** triad 客户端上下文里本模块用到的部分。 */
interface PromptLocaleHost {
  register(namespace: string, dicts: { zh: Record<string, string>; en: Record<string, string>; ru?: Record<string, string> }): unknown
  bind(namespace: string): Translate
}

/** apply 时绑定的翻译函数（跟随 DSH 当前语言）。 */
/**
 * 面板文案函数：这个 fork 固定输出俄语（RU 表），与 DSH 当前语言无关；
 * 键缺失时回落到英文表，再回落到键名本身。
 */
export function promptT(): Translate {
  return (key, params) => {
    let text = (RU as Record<string, string>)[key]
      ?? (DICT.en as Record<string, string>)[key]
      ?? key
    if (params !== undefined) {
      for (const name of Object.keys(params)) text = text.split(`{${name}}`).join(String(params[name]))
    }
    return text
  }
}

/** 注册文案命名空间；面板本体由「提示词」tab 渲染（这里不建任何入口）。 */
export function applyPrompt(ctx: ClientContext): void {
  const locale = (ctx as unknown as { locale?: PromptLocaleHost }).locale
  if (locale === undefined || typeof locale.bind !== 'function') {
    console.warn('[dsh-prompt-customizer] prompt locale unavailable: панель промптов перейдёт на встроенные китайские тексты')
    return
  }
  // 命名空间是插件自己的（'prompt-customizer'）。注册失败绝不能拖垮整条客户端
  // 插件加载链（同名注册会抛错，且谁先注册谁让后来者抛）——失败就回落插件内
  // 自带的 zh 文案，面板照常能用。
  ctx.effect(() => {
    try {
      return locale.register(NS, DICT)
    } catch (error) {
      console.error('[dsh-prompt-customizer] prompt locale register failed:', error)
      return () => {}
    }
  }, 'prompt-customizer: prompt locale')
}
