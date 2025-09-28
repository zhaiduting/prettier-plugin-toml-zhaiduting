import type {Printer} from 'prettier';
import * as prettier from 'prettier'
import {concat} from './prettier-compat.ts'
import {load} from 'js-toml';

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

export const parsers = {
    'toml-parse': {
        parse: (text: string) => load(text),
        astFormat: 'toml-ast'
    }
};

const printToml: Printer['print'] = (path, _options, print) => {
    const node = path.node;

    if (Array.isArray(node)) {
        return concat(path.map(print));
    }

    switch (node.type) {
        case 'Assign':
            return concat([node.key, ' = ', path.call(print, 'value'), hardline]);
        case 'String':
            return concat(['"', node.value, '"']);
        case 'Integer':
            return node.value.toString();
        case 'Boolean':
            return node.value.toString();
        case 'Date':
            return node.value.toISOString();
        case 'ObjectPath':
            return concat([hardline, '[', node.value.join('.').toString(), ']', hardline]);
        case 'Array':
            return group(concat([
                '[',
                indent(concat([
                    softline,
                    join(concat([',', line]), path.map(print, 'value'))
                ])),
                softline,
                ']'
            ]));
        default:
            return '';
    }
}

export const printers = {
    'toml-ast': {
        print: printToml
    }
};
