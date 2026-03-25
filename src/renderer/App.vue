<template>
    <main 
        class="overflow-hidden relative w-screen h-screen"
        :class="{ animationsDisabled: 'disable-animations' }"
    >
        <!-- Decoration -->
        <div
            class="gradient-ball absolute -z-10 left-0 bottom-0 translate-x-[-50%] translate-y-[50%] w-[90vw] aspect-square opacity-15 blob-anim"
        ></div>
        <div
            class="gradient-ball absolute -z-10 right-0 top-0 translate-x-[50%] translate-y-[-50%] w-[90vw] aspect-square opacity-15 blob-anim"
        ></div>

        <!-- Stripes for experimental -->
        <div
            v-show="wbConfig?.config.experimentalFeatures"
            class="experimental-stripes absolute top-0 left-0 w-full h-[3rem] pointer-events-none z-[10] opacity-15 grayscale"
        ></div>

        <!-- Titlebar -->
        <x-titlebar
            @minimize="handleMinimize()"
            @buttonclick="handleTitleBarEvent"
            class="backdrop-blur-xl bg-neutral-900/50"
        >
            <x-label>WinBoat</x-label>
        </x-titlebar>

        <!-- Updater -->
        <dialog ref="updateDialog">
            <Icon class="text-indigo-400 size-12" icon="mdi:cloud-upload"></Icon>
            <template v-if="manualUpdateRequired">
                <h3 class="mt-2">需要手动更新访客端服务</h3>
                <div class="max-w-[60vw]">
                    <strong
                        >WinBoat 在尝试自动更新访客端服务时遇到问题。请按照以下步骤手动更新：</strong
                    >
                    <ol class="mt-2 list-decimal list-inside">
                        <li>
                            通过 VNC 访问 Windows：
                            <a @click="openAnchorLink" :href="novncURL" target="_blank" rel="noopener noreferrer">
                                {{ novncURL }}
                            </a>
                            以访问 Windows
                        </li>
                        <li>按 Win + R 或搜索 <code>运行</code>，输入 <code>services.msc</code></li>
                        <li>右键点击 <code>WinBoatGuestServer</code> 服务并选择“停止”</li>
                        <li>
                            从以下地址下载新的访客端服务：
                            <a
                                @click="openAnchorLink"
                                href="https://github.com/TibixDev/winboat/releases"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                https://github.com/TibixDev/winboat/releases
                            </a>
                            ，您应该选择版本 <strong>{{ appVer }}</strong>
                        </li>
                        <li>导航至 <code>C:\Program Files\WinBoat</code> 并删除其中的内容</li>
                        <li>将新下载的压缩包解压到同一文件夹中</li>
                        <li>
                            右键点击 <code>WinBoatGuestServer</code> 服务并选择“启动”
                        </li>
                        <li>如果您正在使用 VNC，请注销 Windows 并关闭它</li>
                        <li>重启 WinBoat</li>
                    </ol>
                    <p>很抱歉给您带来不便。 😟</p>
                </div>
            </template>

            <template v-else>
                <h3 class="mt-2" v-if="winboat?.isUpdatingGuestServer.value">正在更新访客端服务</h3>
                <h3 class="mt-2" v-else>访客端服务更新成功！</h3>
                <p v-if="winboat?.isUpdatingGuestServer.value" class="max-w-[40vw]">
                    访客端当前运行的是旧版本的 WinBoat 访客端服务。正在更新至当前版本，请稍候。
                </p>
                <p v-else class="max-w-[40vw]">
                    WinBoat 访客端服务已成功更新！现在您可以关闭此对话框并继续使用。
                </p>
            </template>
            <footer v-if="!manualUpdateRequired">
                <x-progressbar v-if="winboat?.isUpdatingGuestServer.value" class="my-4"></x-progressbar>
                <x-button v-else id="close-button" @click="updateDialog!.close()" toggled>
                    <x-label>关闭</x-label>
                </x-button>
            </footer>
        </dialog>

        <!-- UI / SetupUI -->
        <div
            v-if="!['SetupUI', 'Migration'].includes($route.name?.toString() || '')"
            class="flex flex-row h-[calc(100vh-2rem)]"
        >
            <x-nav class="flex flex-col flex-none gap-0.5 w-72 backdrop-blur-xl bg-gray-500/10 backdrop-contrast-90">
                <div
                    v-if="winboat?.rdpConnected.value"
                    class="w-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-blue-500 text-white !mt-0 py-1 shadow-md shadow-indigo-500/50 transition-all duration-300 hover:brightness-105 flex flex-row items-center justify-center gap-2"
                >
                    <Icon class="size-5" icon="mdi:remote-desktop"></Icon>
                    <span class="font-semibold text-center"> RDP 会话活动中 </span>
                </div>
                <div class="flex flex-row gap-4 items-center p-4">
                    <img
                        class="w-16 rounded-full"
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Windows_10_Default_Profile_Picture.svg/2048px-Windows_10_Default_Profile_Picture.svg.png"
                        alt="Profile"
                    />
                    <div>
                        <x-label class="text-lg font-semibold">{{ os.userInfo().username }}</x-label>
                        <x-label class="text-[0.8rem]">本地账户</x-label>
                    </div>
                </div>
                <RouterLink
                    v-for="route of routes.filter(
                        (r: RouteRecordRaw) => !['SetupUI', 'Loading', 'Migration'].includes(String(r.name)),
                    )"
                    :to="route.path"
                    :key="route.path"
                >
                    <x-navitem>
                        <Icon class="mr-4 w-5 h-5" :icon="(route.meta!.icon as string)" />
                        <x-label>{{ route.meta!.label }}</x-label>
                    </x-navitem>
                </RouterLink>
                <div class="flex flex-col justify-end items-center p-4 h-full">
                    <p class="text-xs text-neutral-500">WinBoat Beta v{{ appVer }} {{ isDev ? "Dev" : "Prod" }}</p>
                </div>
            </x-nav>
            <div class="px-5 flex-grow max-h-[calc(100vh-2rem)] overflow-y-auto py-4">
                <div class="flex flex-row gap-2 items-center my-6">
                    <Icon class="w-6 h-6 opacity-60" icon="icon-park-solid:toolkit"></Icon>
                    <h1 class="my-0 text-2xl font-semibold opacity-60">WinBoat</h1>
                    <Icon class="w-6 h-6" icon="bitcoin-icons:caret-right-filled"></Icon>
                    <Icon class="w-6 h-6" :icon="useRoute().meta.icon as string"></Icon>
                    <h1 class="my-0 text-2xl font-semibold">
                        {{ useRoute().meta.label }}
                    </h1>
                </div>
                <router-view v-slot="{ Component }">
                    <transition mode="out-in" name="fade">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </div>
        </div>

        <div v-else class="w-full h-[calc(100vh-2rem)]">
            <RouterView />
        </div>
    </main>
</template>

<script setup lang="ts">
import { RouteRecordRaw, RouterLink, useRoute, useRouter } from "vue-router";
import { routes } from "./router";
import { Icon } from "@iconify/vue";
import { onMounted, ref, useTemplateRef, watch, reactive, computed } from "vue";
import { isInstalled } from "./lib/install";
import { Winboat } from "./lib/winboat";
import { openAnchorLink } from "./utils/openLink";
import { WinboatConfig } from "./lib/config";
import { USBManager } from "./lib/usbmanager";
import { CommonPorts, getActiveHostPort } from "./lib/containers/common";
import { performAutoMigrations } from "./lib/migrate";
const { BrowserWindow }: typeof import("@electron/remote") = require("@electron/remote");
const os: typeof import("os") = require("node:os");

const $router = useRouter();
const $route = useRoute();
const appVer = import.meta.env.VITE_APP_VERSION;
const isDev = import.meta.env.DEV;
let winboat: Winboat | null;
let wbConfig: WinboatConfig | null;

let updateTimeout: NodeJS.Timeout | null = null;
const manualUpdateRequired = ref(false);
const MANUAL_UPDATE_TIMEOUT = 60000; // 60 seconds
const updateDialog = useTemplateRef("updateDialog");
const novncURL = ref("");

const animationsDisabled = computed(() => wbConfig?.config.disableAnimations);

onMounted(async () => {
    try {
        const winboatInstalled = await isInstalled();

        if (winboatInstalled) {
            wbConfig = reactive(WinboatConfig.getInstance()); // Instantiate singleton class
            winboat = Winboat.getInstance(); // Instantiate singleton class
            USBManager.getInstance(); // Instantiate singleton class

            // Migrations
            $router.push("/migration");
            await performAutoMigrations();

            // After migrations, go to home
            $router.push("/home");
        } else {
            console.log("Not installed, redirecting to setup...");
            $router.push("/setup");
        }
    } catch (e: any) {
        console.error("Initialization failed:", e);
        // Show error to user if possible
        try {
            const { dialog } = require("@electron/remote");
            dialog.showErrorBox("WinBoat 初始化失败", e.message || String(e));
        } catch (err) {
            console.error("Could not show error box:", err);
        }
    }

    // Watch for guest server updates and show dialog
    watch(
        () => winboat?.isUpdatingGuestServer.value,
        isUpdating => {
            if (isUpdating === true) {
                novncURL.value = `http://127.0.0.1:${getActiveHostPort(winboat?.containerMgr!, CommonPorts.NOVNC)}`;
                updateDialog.value!.showModal();
                // Prepare the timeout to show manual update required after 45 seconds
                updateTimeout = setTimeout(() => {
                    manualUpdateRequired.value = true;
                }, MANUAL_UPDATE_TIMEOUT);
            } else {
                // Clear the timeout if the update finished before the timeout
                if (updateTimeout) {
                    clearTimeout(updateTimeout);
                    updateTimeout = null;
                }
                manualUpdateRequired.value = false;
            }
        },
    );
});

function handleMinimize() {
    console.log("Minimize");
    window.electronAPI.minimizeWindow();
}

function handleTitleBarEvent(e: CustomEvent) {
    console.log("TitleBarEvt", e);
    switch (e.detail) {
        case "close":
            BrowserWindow.getFocusedWindow()!.close();
            break;
        case "maximize":
            if (BrowserWindow.getFocusedWindow()!.isMaximized()) {
                BrowserWindow.getFocusedWindow()!.unmaximize();
            } else {
                BrowserWindow.getFocusedWindow()!.maximize();
            }
            break;
        case "minimize":
            BrowserWindow.getFocusedWindow()!.minimize();
            break;
    }
}
</script>

<style>
dialog::backdrop {
    pointer-events: none;
    backdrop-filter: blur(8px);
}

.gradient-ball {
    border-radius: 99999px;
    background:
        linear-gradient(197.37deg, #7450db -0.38%, rgba(138, 234, 240, 0) 101.89%),
        linear-gradient(115.93deg, #3e88f6 4.86%, rgba(62, 180, 246, 0.33) 38.05%, rgba(62, 235, 246, 0) 74.14%),
        radial-gradient(
            56.47% 76.87% at 6.92% 7.55%,
            rgba(62, 136, 246, 0.7) 0%,
            rgba(62, 158, 246, 0.182) 52.16%,
            rgba(62, 246, 246, 0) 100%
        ),
        linear-gradient(306.53deg, #2ee4e3 19.83%, rgba(46, 228, 227, 0) 97.33%);
    background-blend-mode: normal, normal, normal, normal, normal, normal;
    filter: blur(200px);
}

@keyframes blob {
    from {
        filter: hue-rotate(0deg) blur(200px);
    }
    to {
        filter: hue-rotate(45deg) blur(200px);
    }
}

.blob-anim {
    animation: blob 5s linear infinite;
    animation-direction: alternate-reverse;
}

.fade-enter-active,
.fade-leave-active {
    transition: all 0.2s ease;
}

.fade-enter-from {
    opacity: 0;
}

.fade-leave-to {
    opacity: 0;
}

/* Stripes for the top of the window to indicate experimental features enabled */
.experimental-stripes {
    background: repeating-linear-gradient(
        45deg,
        #ffffff00,
        #ffffff00 25px,
        rgb(129 140 248) 25px,
        rgb(129 140 248) 50px
    );
    -webkit-mask-image: -webkit-gradient(linear, left 0%, left bottom, from(rgba(0, 0, 0, 1)), to(rgba(0, 0, 0, 0)));
}

/* Disable all animations when the setting is enabled */
body.disable-animations,
body.disable-animations *,
body.disable-animations *::before,
body.disable-animations *::after {
    animation: none !important;
    transition: none !important;
}

/* Specifically disable Vue transition components */
body.disable-animations .fade-enter-active,
body.disable-animations .fade-leave-active,
body.disable-animations .devices-move,
body.disable-animations .devices-enter-active,
body.disable-animations .devices-leave-active,
body.disable-animations .menu-move,
body.disable-animations .menu-enter-active,
body.disable-animations .menu-leave-active,
body.disable-animations .apps-move,
body.disable-animations .apps-enter-active,
body.disable-animations .apps-leave-active,
body.disable-animations .bounce-enter-active,
body.disable-animations .bounce-leave-active,
body.disable-animations .bouncedown-enter-active,
body.disable-animations .bouncedown-leave-active,
body.disable-animations .bounce-in,
body.disable-animations .bouncedown-in {
    transition: none !important;
    animation: none !important;
}

/* Disable keyframe animations */
body.disable-animations .blob-anim {
    animation: none !important;
}
</style>
