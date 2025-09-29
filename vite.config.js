// vite.config.js
import {defineConfig} from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        // 启用库模式
        lib: {
            entry: 'src/index.ts', // 假设您的插件源码入口在 src/index.ts
            name: 'PrettierPluginTomlZhaiduting',
            // 我们只输出 CJS 格式
            formats: ['cjs'],
            fileName: () => `index.js`, // 确保输出文件名就是 index.js
        },
        // 关闭 CSS 提取等不必要的步骤
        cssCodeSplit: false,

        // **Rollup 配置：外部化依赖**
        rollupOptions: {
            external: [
                'prettier', // 必须外部化！
                'toml-eslint-parser' // 您的插件运行时依赖
            ],
        },
    },
    plugins: [
        dts({
            insertTypesEntry: true, // 在 dist/ 自动生成 index.d.ts
            include: ['src/index.ts'],
        }),
    ],
});