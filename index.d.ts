// prettier-plugin-toml-zhaiduting/index.d.ts

/**
 * 导入 Prettier 的核心类型。
 * 我们主要需要 Plugin 类型来声明插件的结构。
 */
import {Plugin} from 'prettier';

/**
 * 声明插件的默认导出对象。
 * Prettier 插件的核心是导出一个包含 parsers, printers, options 等属性的 Plugin 对象。
 */
declare const plugin: Plugin;

/**
 * 使用 'export = plugin;' 确保它兼容 CommonJS 的 `module.exports = plugin` 导出模式，
 * 这种模式是 Prettier 插件的标准模式。
 */
export = plugin;
