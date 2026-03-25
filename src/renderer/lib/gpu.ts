const fs: typeof import("fs") = require("node:fs");
const path: typeof import("path") = require("node:path");

export type GPUInfo = {
    name: string;
    path: string;
    id: string; // renderD128 etc
    isDiscrete: boolean;
};

const VENDOR_MAP: Record<string, string> = {
    "0x8086": "Intel UHD Graphics",
    "0x10de": "NVIDIA GeForce",
    "0x1002": "AMD Radeon",
};

export async function getGPUList(): Promise<GPUInfo[]> {
    const gpus: GPUInfo[] = [];
    const driPath = "/dev/dri";

    if (!fs.existsSync(driPath)) {
        return gpus;
    }

    try {
        const files = fs.readdirSync(driPath);
        const renderNodes = files.filter(f => f.startsWith("renderD"));

        for (const node of renderNodes) {
            const nodePath = path.join(driPath, node);
            const sysPath = `/sys/class/drm/${node}/device`;

            let name = "Unknown GPU";
            let vendor = "";

            try {
                if (fs.existsSync(path.join(sysPath, "vendor"))) {
                    vendor = fs.readFileSync(path.join(sysPath, "vendor"), "utf8").trim().toLowerCase();
                    const vendorName = VENDOR_MAP[vendor] || VENDOR_MAP[vendor.replace("0x", "0x0000").slice(-6)]; // Handle 0x8086 vs 0x00008086
                    
                    // Try to match partial or full hex
                    const match = Object.entries(VENDOR_MAP).find(([key]) => vendor.includes(key.toLowerCase().replace("0x", "")));
                    if (match) {
                        name = match[1];
                    }
                }
            } catch (e) {
                console.error(`Error reading vendor for ${node}:`, e);
            }

            const isDiscrete = vendor !== "0x8086";

            gpus.push({
                name: name,
                path: nodePath,
                id: node,
                isDiscrete: isDiscrete,
            });
        }
    } catch (e) {
        console.error("Error reading /dev/dri:", e);
    }

    return gpus;
}
