import { AndroidInstance } from "../../types";
import { WinboatConfig } from "./config";
import { execFileAsync } from "./exec-helper";
import { createLogger } from "../utils/log";
import { WINBOAT_DIR } from "./constants";

const path: typeof import("path") = require("node:path");
const logger = createLogger(path.join(WINBOAT_DIR, "android.log"));

export class AndroidManager {
    private static instance: AndroidManager | null = null;
    public isPulling = false;
    public pullProgress = 0;
    
    public static getInstance(): AndroidManager {
        if (!AndroidManager.instance) {
            AndroidManager.instance = new AndroidManager();
        }
        return AndroidManager.instance;
    }

    private constructor() {}

    /**
     * Pull the Redroid image
     */
    async pullImage(): Promise<void> {
        this.isPulling = true;
        logger.info("Starting Redroid image pull...");
        try {
            await execFileAsync("docker", ["pull", "redroid/redroid:11.0.0-latest"]);
            logger.info("Redroid image pulled successfully");
        } catch (e) {
            logger.error(`Failed to pull Redroid image: ${e}`);
            throw e;
        } finally {
            this.isPulling = false;
        }
    }

    /**
     * Create a new Android instance (Redroid)
     */
    async createInstance(conf: Partial<AndroidInstance>): Promise<AndroidInstance> {
        const id = `android-${Date.now()}`;
        
        // Find a free ADB port starting from 5555
        const config = WinboatConfig.getInstance();
        let adbPort = 5555;
        while (config.config.androidInstances.some(i => i.adbPort === adbPort)) {
            adbPort++;
        }

        const instance: AndroidInstance = {
            id,
            name: conf.name || `Android ${config.config.androidInstances.length + 1}`,
            width: conf.width || 720,
            height: conf.height || 1280,
            dpi: conf.dpi || 320,
            fps: conf.fps || 60,
            cpuCores: conf.cpuCores || 2,
            ramGB: conf.ramGB || 2,
            gpuDevice: conf.gpuDevice || "disabled",
            isRoot: conf.isRoot || false,
            status: "stopped",
            adbPort: adbPort,
            vncPort: adbPort + 3000, 
        };

        config.config.androidInstances.push(instance);
        return instance;
    }

    /**
     * Start a Redroid container
     */
    async startInstance(id: string): Promise<void> {
        const config = WinboatConfig.getInstance();
        const instance = config.config.androidInstances.find(i => i.id === id);
        if (!instance) throw new Error("Instance not found");

        // Check if image exists, if not pull it
        try {
            await execFileAsync("docker", ["inspect", "redroid/redroid:11.0.0-latest"]);
        } catch (e) {
            await this.pullImage();
        }

        instance.status = "starting";

        const args = [
            "run", "-d",
            "--name", instance.id,
            "--memory-swappiness=0",
            "--privileged",
            // We'll need unique ports for each instance
            "-p", `${instance.adbPort}:5555`,
        ];

        // RAM and CPU limits
        args.push("--cpus", String(instance.cpuCores));
        args.push("--memory", `${instance.ramGB}g`);

        // GPU Passthrough
        if (instance.gpuDevice && instance.gpuDevice !== "disabled") {
            args.push("--device", instance.gpuDevice);
            // Redroid specific: force guest mode for virgl if needed, 
            // but usually it autodetects.
        }

        // Image Selection (Defaulting to 11.0.0-latest)
        args.push("redroid/redroid:11.0.0-latest");

        // Boot properties (Resolution, FPS, etc.)
        args.push(`androidboot.redroid_width=${instance.width}`);
        args.push(`androidboot.redroid_height=${instance.height}`);
        args.push(`androidboot.redroid_fps=${instance.fps}`);
        args.push(`androidboot.redroid_dpi=${instance.dpi}`);

        // Advanced: Device Spoofing
        // We use some common high-end device info as defaults if spoofing is enabled
        args.push("ro.product.model=SM-G998B"); // S21 Ultra
        args.push("ro.product.brand=samsung");
        args.push("ro.product.manufacturer=samsung");
        
        if (instance.isRoot) {
            // Some redroid variants support this or we can use custom scripts
            // For now we just ensure privileged mode (added above)
        }

        try {
            await execFileAsync("docker", args);
            instance.status = "running";
            logger.info(`Started Android instance ${instance.id}`);
        } catch (e) {
            instance.status = "stopped";
            logger.error(`Failed to start Android instance ${instance.id}: ${e}`);
            throw e;
        }
    }

    /**
     * Stop a Redroid container
     */
    async stopInstance(id: string): Promise<void> {
        const config = WinboatConfig.getInstance();
        const instance = config.config.androidInstances.find(i => i.id === id);
        if (!instance) throw new Error("Instance not found");

        try {
            await execFileAsync("docker", ["stop", instance.id]);
            await execFileAsync("docker", ["rm", instance.id]);
            instance.status = "stopped";
            logger.info(`Stopped and removed Android instance ${instance.id}`);
        } catch (e) {
            logger.error(`Failed to stop Android instance ${instance.id}: ${e}`);
            throw e;
        }
    }

    /**
     * Check if adb is installed, try to install if missing
     */
    async ensureAdb(): Promise<void> {
        try {
            await execFileAsync("adb", ["--version"]);
        } catch (e) {
            logger.info("ADB missing, attempting to install...");
            try {
                // Using pkexec to get root for apt install
                await execFileAsync("pkexec", ["apt", "update"]);
                await execFileAsync("pkexec", ["apt", "install", "-y", "adb"]);
                logger.info("ADB installed successfully via apt");
            } catch (err) {
                logger.error(`Failed to install ADB: ${err}`);
                throw new Error("ADB required but not installed and could not be installed automatically.");
            }
        }
    }

    /**
     * Install an APK into an instance
     */
    async installApk(id: string, apkPath: string): Promise<void> {
        const config = WinboatConfig.getInstance();
        const instance = config.config.androidInstances.find(i => i.id === id);
        if (!instance) throw new Error("Instance not found");
        if (instance.status !== "running") throw new Error("Instance must be running to install APK");

        await this.ensureAdb();

        const adbAddr = `127.0.0.1:${instance.adbPort}`;
        try {
            logger.info(`Installing APK ${apkPath} to ${id}...`);
            await execFileAsync("adb", ["connect", adbAddr]);
            await execFileAsync("adb", ["-s", adbAddr, "install", apkPath]);
            logger.info(`Successfully installed ${apkPath} to ${id}`);
        } catch (e) {
            logger.error(`Failed to install APK to ${id}: ${e}`);
            throw e;
        } finally {
            await execFileAsync("adb", ["disconnect", adbAddr]);
        }
    }

    /**
     * Sync instance status with Docker
     */
    async syncStatus(): Promise<void> {
        const config = WinboatConfig.getInstance();
        try {
            const { stdout } = await execFileAsync("docker", ["ps", "-a", "--format", "{{.Names}}:{{.Status}}"]);
            const lines = stdout.trim().split("\n");
            
            for (const instance of config.config.androidInstances) {
                const match = lines.find(l => l.startsWith(`${instance.id}:`));
                if (match) {
                    instance.status = match.includes("Up") ? "running" : "stopped";
                } else {
                    instance.status = "stopped";
                }
            }
        } catch (e) {
            logger.error(`Failed to sync Android status: ${e}`);
        }
    }
}
