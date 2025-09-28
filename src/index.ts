import type {Parser, Printer} from 'prettier';
import * as prettier from 'prettier'
import {concat} from './prettier-compat.ts'
// 导入 toml-eslint-parser
import {parseTOML} from "toml-eslint-parser";
import type {TOMLNode} from "toml-eslint-parser/lib/ast/ast";

const {
    indent, group, line, hardline, softline, join
} = prettier.doc.builders

export const languages = [
    {
        extensions: ['.toml'],
        name: 'TOML',
        parsers: ['toml-parse']
    }
];

// --- locStart 和 locEnd (正确) ---
const locStart: Parser<TOMLNode>['locStart'] = (node: TOMLNode) => node.range[0];
const locEnd: Parser<TOMLNode>['locEnd'] = (node: TOMLNode) => node.range[1];
// ----------------------------------

export const parsers = {
    'toml-parse': {
        parse: (code: string) => {
            try {
                // ✅ 修复 TS2554: 传入第二个参数 {}
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

// --- 核心修复：重写 printToml 以兼容新的 AST 结构 ---
const printToml: Printer['print'] = (path, _options, print) => {
    const node = path.node;

    if (Array.isArray(node)) {
        return concat(path.map(print));
    }

    switch (node.type) {
        // 1. AST 根节点
        case 'Program':
            // 打印 Program 的子节点 (即整个文件内容)
            return path.map(print, 'body');

        // 2. 顶级表和子表 (例如 [owner], [servers.alpha])
        case 'TOMLTopLevelTable':
            return concat(path.map(print, 'body'));
        case 'TOMLTable':
        case 'TOMLArrayTable':
            const isArrayTable = node.type === 'TOMLArrayTable';
            const openBrackets = isArrayTable ? '[[' : '[';
            const closeBrackets = isArrayTable ? ']]' : ']';

            return concat([
                // 表之间添加空行
                hardline, hardline,
                openBrackets,
                path.call(print, 'key'), // 打印表名 (TOMLKey 节点)
                closeBrackets,
                hardline,
                // 打印表内的键值对
                concat(path.map(print, 'body'))
            ]);

        // 3. 键值对 (例如 name = "Tom Preston-Werner")
        case 'TOMLKeyValue':
            return concat([
                path.call(print, 'key'), // 键 (例如 name)
                ' = ',
                path.call(print, 'value'), // 值 (例如 "Tom Preston-Werner")
                hardline
            ]);
            
        case 'TOMLValue':
            // 最终的健壮修复：
            // 1. 优先使用 node.raw (包含格式)。
            // 2. 如果 node.raw 不存在 (导致 undefined 错误)，回退到 node.value。
            // 3. 必须使用 String() 转换，确保返回值是一个有效的 Doc (字符串)。
            //    如果 node.value 是 null 或数字等，String() 能正确处理。
            return String(node.raw || node.value || '');

        // 4. 值 (字符串、数字、日期、布尔值)
        case 'Literal':
            // node.raw 包含原始值，例如 "Tom Preston-Werner" (含引号) 或 1979 (数字)
            return node.raw;

        // 5. 数组 (例如 ports = [ 8001, 8001, 8002 ])
        case 'ArrayExpression':
            return group(concat([
                '[',
                indent(concat([
                    softline,
                    // 数组项在 'elements' 属性中，用逗号和换行符连接
                    join(concat([',', line]), path.map(print, 'elements'))
                ])),
                softline,
                ']'
            ]));

        // 6. 键名 (例如 name)
        case 'TOMLBare':
        case 'TOMLQuotedKey': // 带引号的键名 ("quoted key")
            // 裸键名通常在 'name' 属性中
            return node.name;
        case 'TOMLKey':
            // TOMLKey 是一个包含键路径的容器，我们需要打印其 'keys' 数组
            return join('.', path.map(print, 'keys'));

        default:
            // 默认返回空字符串，但最好在这里捕获未处理的类型
            // console.warn(`Unhandled node type: ${node.type}`);
            return '';
    }
}

export const printers = {
    'toml-ast': {
        print: printToml
    }
};
