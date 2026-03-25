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
        <p class="text-sm text-gray-500 text-center !mt-16 w-[40vw]">
            WinBoat 与微软公司（Microsoft Corporation）无任何关联，亦未获得其背书或赞助。“Windows”是微软公司的注册商标，所有相关资产（图标、徽标等）均归微软所有。
        </p>
    </div>
</template>

<script setup lang="ts">
import { openAnchorLink } from "../utils/openLink";
const appVer = import.meta.env.VITE_APP_VERSION;
const isDev = import.meta.env.DEV;
</script>
