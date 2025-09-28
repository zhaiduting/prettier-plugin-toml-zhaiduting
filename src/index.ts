import type {Parser, Printer} from 'prettier';
import * as prettier from 'prettier'
import {concat} from './prettier-compat.ts'
// 导入 toml-eslint-parser，用于 AST 解析
import {parseTOML} from "toml-eslint-parser";
import type {TOMLNode} from "toml-eslint-parser/lib/ast/ast";

const {
    indent, group, line, hardline, softline, join
} = prettier.doc.builders

/**
 * 插件支持的语言定义
 */
export const languages = [
    {
        extensions: ['.toml'],
        name: 'TOML',
        parsers: ['toml-parse'] // 对应的解析器名称
    }
];

// --- AST 位置信息获取函数 ---
// 提取 toml-eslint-parser 提供的 range 属性
const locStart: Parser<TOMLNode>['locStart'] = (node: TOMLNode) => node.range[0];
const locEnd: Parser<TOMLNode>['locEnd'] = (node: TOMLNode) => node.range[1];

/**
 * 插件支持的解析器定义
 */
export const parsers = {
    'toml-parse': {
        parse: (code: string) => {
            try {
                // 确保传入第二个参数 {} 兼容 toml-eslint-parser API
                return parseTOML(code, {});
            } catch (error) {
                throw error;
            }
        },
        astFormat: 'toml-ast',
        locStart: locStart,
        locEnd: locEnd,
    } as Parser<any>
};

/**
 * 核心打印函数：将 TOML AST 转换成 Prettier Docs
 */
const printToml: Printer['print'] = (path, _options, print) => {
    const node = path.node;

    // 关键防护：防止 node 或 node.type 为空 (处理 undefined 错误)
    if (!node || typeof node.type !== 'string') {
        return '';
    }

    if (Array.isArray(node)) {
        return concat(path.map(print));
    }

    switch (node.type) {
        // --- 1. 结构和容器节点 ---

        // 根节点
        case 'Program':
            return concat(path.map(print, 'body'));

        // 顶层表（隐式）
        case 'TOMLTopLevelTable':
            return concat(path.map(print, 'body'));

        // 标准表和数组表 (例如 [owner], [[clients.data]])
        case 'TOMLTable':
        case 'TOMLArrayTable':
            const isArrayTable = node.type === 'TOMLArrayTable';
            const openBrackets = isArrayTable ? '[[' : '[';
            const closeBrackets = isArrayTable ? ']]' : ']';

            return concat([
                hardline, hardline, // 表之间添加空行
                openBrackets,
                path.call(print, 'key'), // 打印表名 (TOMLKey 节点)
                closeBrackets,
                hardline,
                concat(path.map(print, 'body')) // 打印表体内容
            ]);

        // --- 2. 键名和赋值节点 ---

        // 键值对 (例如 name = "Tom")
        case 'TOMLKeyValue':
            return concat([
                // 增加子节点防护
                node.key ? path.call(print, 'key') : '',
                ' = ',
                node.value ? path.call(print, 'value') : '',
                hardline
            ]);

        // 键路径容器 (例如 servers.alpha)
        case 'TOMLKey':
            return join('.', path.map(print, 'keys'));

        // 键名组成部分 (裸键名/带引号的键名)
        case 'TOMLBare':
        case 'TOMLQuotedKey':
            return node.name;

        // --- 3. 值节点 ---

        // 原始值 (字符串、数字、日期等)
        case 'TOMLValue':
            // 修复 'undefined' 崩溃问题: 优先使用 raw/value，并确保返回字符串 Doc
            return String(node.raw || node.value || '');

        // 数组 (例如 ports = [ 8001, 8002 ])
        case 'TOMLArray':
            return group(concat([
                '[',
                indent(concat([
                    softline,
                    // 遍历 'elements' 属性
                    join(concat([',', line]), path.map(print, 'elements'))
                ])),
                softline,
                ']'
            ]));

        // 内联表 (例如 inline = {key=value})
        case 'TOMLInlineTable':
            return group(concat([
                '{',
                indent(concat([
                    softline,
                    join(concat([',', line]), path.map(print, 'body'))
                ])),
                softline,
                '}'
            ]));

        // --- 4. 默认/未知节点 ---
        default:
            return '';
    }
}

/**
 * 插件提供的打印器
 */
export const printers = {
    'toml-ast': {
        print: printToml
    }
};