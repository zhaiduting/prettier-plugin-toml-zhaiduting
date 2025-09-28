// prettier-plugin-toml-zhaiduting/src/test-runner.ts

import './style.css'; // 导入样式表
import {format} from 'prettier';
import * as tomlPlugin from './index'; // 导入您的插件核心
import testInput from './example.toml?raw'; // 导入 TOML 文件内容
import {safeStringify} from './safeStringify.ts';
// --- HTML 元素 ID ---
const AST_OUTPUT_ID = 'ast-output';
const FORMATTED_OUTPUT_ID = 'formatted-output';

/**
 * 运行 Prettier 格式化测试。
 */
async function runTest() {
    console.clear();
    console.log("--- 🚀 Prettier Plugin Test Started ---");

    // 获取元素
    const astOutputElement = document.getElementById(AST_OUTPUT_ID);
    const formattedOutputElement = document.getElementById(FORMATTED_OUTPUT_ID);

    if (!astOutputElement || !formattedOutputElement) {
        console.error("❌ ERROR: Required HTML elements not found in index.html.");
        return;
    }

    astOutputElement.textContent = "Loading...";
    formattedOutputElement.textContent = "Loading...";


    try {
        // -----------------------------------------------------------------
        // 1. 手动运行解析器并显示 AST (用于调试)
        // -----------------------------------------------------------------
        const parser = tomlPlugin.parsers['toml-parse'];
        if ('parse' in parser) {
            // @ts-ignore
            const ast = parser.parse(testInput);

            // 使用 JSON.stringify 格式化输出，设置 null, 2 方便阅读
            const astJson = safeStringify(ast);
            console.log(astJson)
            astOutputElement.textContent = astJson;
            console.log("✅ Parser Test (AST Generated).");
        }


        // -----------------------------------------------------------------
        // 2. 运行 Prettier 核心格式化 (测试完整的打印流程)
        // -----------------------------------------------------------------
        const formattedCode = await format(testInput, {
            // 告诉 Prettier 使用您的插件定义的解析器
            parser: 'toml-parse',
            // 注入您的本地插件
            plugins: [tomlPlugin],
            // 设置打印宽度，测试 Group/Line break 逻辑
            printWidth: 60,
        });

        console.log("✅ Full Format Test Successful.");
        formattedOutputElement.textContent = formattedCode;

    } catch (e) {
        console.error("❌ Format Test Failed:", e);
        // 显示错误信息
        astOutputElement.textContent = `Parser Error: ${e instanceof Error ? e.message : String(e)}`;
        formattedOutputElement.textContent = `Formatting Error: ${e instanceof Error ? e.message : String(e)}`;
    }

    console.log("--- 🏁 Prettier Plugin Test Finished ---");
}

// 启动测试
runTest();