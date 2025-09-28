// safeStringify.ts
export function safeStringify(obj: any, space = 2): string {
    const seen = new WeakSet();

    return JSON.stringify(
        obj,
        (_, value) => {
            if (typeof value === "bigint") {
                return value.toString() + "n";
            }
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) return "[Circular]";
                seen.add(value);
            }
            return value;
        },
        space
    );
}

export function safeParse(json: string): any {
    return JSON.parse(json, (_, value) => {
        if (typeof value === "string" && /^\d+n$/.test(value)) {
            return BigInt(value.slice(0, -1));
        }
        return value;
    });
}

/*
// 用法
const astJson = safeStringify(ast, 2);
console.log(astJson);

const astBack = safeParse(astJson);
console.log(astBack);
*/