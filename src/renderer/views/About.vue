<template>
    <div class="flex flex-col items-center justify-center h-[calc(100vh-9rem)]">
        <img class="w-48" src="/img/winboat_logo.svg" alt="The WinBoat Logo" />
        <h2 class="mb-0">WinBoat</h2>
        <p class="text-sm text-gray-500">为 🐧 企鹅打造的 Windows</p>
        <p class="text-gray-400 !mt-4">WinBoat Beta v{{ appVer }} {{ isDev ? "Dev" : "Prod" }}</p>
        <div></div>
        <p class="text-gray-400 !mt-16">
            WinBoat 是
            <a @click="openAnchorLink" href="https://github.com/TibixDev/WinBoat">开源软件</a>
        </p>
        <p class="text-gray-400 !mt-0">Copyright (c) 2026 TibixDev</p>
        <div class="p-6 my-8 bg-white/5 rounded-2xl border border-white/10 w-[440px] backdrop-blur-md">
            <h3 class="mt-0 mb-4 text-base font-semibold flex items-center gap-2 text-white">
                <Icon icon="mdi:keyboard-outline" class="size-5" />
                虚拟机快捷键指南
            </h3>
            <div class="space-y-3 text-[0.85rem] text-gray-400">
                <div class="flex justify-between items-center">
                    <span>释放鼠标/键盘捕获</span>
                    <kbd class="bg-neutral-700 px-1.5 py-0.5 rounded font-mono text-white text-[0.7rem] border border-white/10 shadow-sm">右 Ctrl</kbd>
                </div>
                <div class="flex justify-between items-center">
                    <span>切换全屏模式</span>
                    <kbd class="bg-neutral-700 px-1.5 py-0.5 rounded font-mono text-white text-[0.7rem] border border-white/10 shadow-sm">Ctrl + Alt + Enter</kbd>
                </div>
                <div class="flex justify-between items-center">
                    <span>最小化虚拟机窗口</span>
                    <kbd class="bg-neutral-700 px-1.5 py-0.5 rounded font-mono text-white text-[0.7rem] border border-white/10 shadow-sm">Ctrl + Alt + M</kbd>
                </div>
            </div>
        </div>

        <p class="text-sm text-gray-500 text-center w-[40vw]">
            WinBoat 与微软公司（Microsoft Corporation）无任何关联，亦未获得其背书或赞助。“Windows”是微软公司的注册商标，所有相关资产（图标、徽标等）均归微软所有。
        </p>
    </div>
</template>

<script setup lang="ts">
import { openAnchorLink } from "../utils/openLink";
const appVer = import.meta.env.VITE_APP_VERSION;
const isDev = import.meta.env.DEV;
</script>
