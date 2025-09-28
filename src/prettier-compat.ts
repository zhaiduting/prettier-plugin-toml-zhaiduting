import type {Doc} from 'prettier';

/**
 * 这是 Prettier v3+ 中 'concat' 的替代实现。
 * 它只是返回 Doc 数组本身，利用 Prettier 核心处理数组。
 */
export function concat(docs: Array<Doc | string>): Array<Doc | string> {
    return docs;
}
