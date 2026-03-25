<template>
    <div class="flex flex-col gap-6">
        <div class="flex flex-row justify-between items-center">
            <h2 class="text-2xl font-semibold m-0 flex flex-row items-center gap-2">
                <Icon icon="mdi:android" class="text-green-500" />
                安卓多开中心
            </h2>
            <x-button @click="showCreateDialog = true" toggled>
                <Icon icon="mdi:plus" class="mr-2" />
                <x-label>新建实例</x-label>
            </x-button>
        </div>

        <!-- Instance List -->
        <div v-if="androidInstances.length === 0" class="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <Icon icon="mdi:android-debug-bridge" class="text-6xl opacity-20 mb-4" />
            <p class="text-neutral-400">目前还没有安卓实例</p>
            <x-button @click="showCreateDialog = true" class="mt-4">
                <x-label>立即创建</x-label>
            </x-button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
                v-for="instance in androidInstances" 
                :key="instance.id" 
                class="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all group relative"
                @dragover.prevent="onDragOver($event, instance.id)"
                @dragleave="onDragLeave(instance.id)"
                @drop.prevent="onDrop($event, instance.id)"
            >
                <!-- Drag Overlay -->
                <div v-if="draggingOver === instance.id" class="absolute inset-0 bg-green-500/20 backdrop-blur-sm rounded-2xl border-2 border-dashed border-green-500 flex flex-col items-center justify-center z-10 animate-pulse">
                    <Icon icon="mdi:package-variant-closed" class="text-4xl text-green-500 mb-2" />
                    <span class="text-green-500 font-bold">释放以安装 APK</span>
                </div>

                <div class="flex flex-row justify-between items-start mb-4">
                    <div class="flex flex-row gap-3 items-center">
                        <div class="size-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <Icon icon="mdi:android" class="text-2xl text-green-500" />
                        </div>
                        <div>
                            <h3 class="m-0 text-lg">{{ instance.name }}</h3>
                            <div class="flex flex-row gap-2 items-center mt-1">
                                <span class="size-2 rounded-full" :class="instance.status === 'running' ? 'bg-green-500' : 'bg-red-500'"></span>
                                <span class="text-xs text-neutral-400 capitalize">{{ instance.status }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-row gap-1">
                        <x-button v-if="instance.status === 'running'" @click="openView(instance)" skin="flat" title="打开画面" class="text-green-500">
                            <Icon icon="mdi:eye" />
                        </x-button>
                        <x-button v-if="instance.status === 'running'" @click="triggerApkSelect(instance.id)" skin="flat" title="安装 APK">
                            <Icon icon="mdi:file-import" />
                        </x-button>
                        <x-button @click="toggleInstance(instance)" skin="flat">
                            <Icon :icon="instance.status === 'running' ? 'mdi:stop' : 'mdi:play'" />
                        </x-button>
                        <x-button @click="deleteInstance(instance.id)" skin="flat" class="text-red-400">
                            <Icon icon="mdi:delete" />
                        </x-button>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-y-2 text-sm text-neutral-400">
                    <div class="flex items-center gap-2">
                        <Icon icon="mdi:monitor-screenshot" />
                        {{ instance.width }}x{{ instance.height }}
                    </div>
                    <div class="flex items-center gap-2">
                        <Icon icon="mdi:cpu-64-bit" />
                        {{ instance.cpuCores }} 核
                    </div>
                    <div class="flex items-center gap-2">
                        <Icon icon="mdi:memory" />
                        {{ instance.ramGB }} GB
                    </div>
                    <div class="flex items-center gap-2">
                        <Icon icon="mdi:refresh" />
                        {{ instance.fps }} FPS
                    </div>
                </div>
            </div>
        </div>

        <!-- Hidden File Input -->
        <input type="file" ref="apkInput" class="hidden" accept=".apk" @change="onApkFileSelected" />

        <!-- Create Dialog -->
        <dialog v-if="showCreateDialog" class="p-0 bg-transparent" open>
            <div class="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
                <div class="bg-neutral-900 border border-white/10 rounded-3xl w-[500px] overflow-hidden shadow-2xl">
                    <div class="p-6 border-b border-white/10 flex flex-row justify-between items-center">
                        <h3 class="m-0">创建新安卓实例</h3>
                        <x-button @click="showCreateDialog = false" skin="flat">
                            <Icon icon="mdi:close" />
                        </x-button>
                    </div>
                    <div class="p-6 flex flex-col gap-4">
                        <div class="flex flex-col gap-2">
                            <x-label>实例名称</x-label>
                            <input v-model="newConfig.name" type="text" class="bg-white/5 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-green-500" placeholder="我的安卓 01" />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col gap-2">
                                <x-label>分辨率</x-label>
                                <select v-model="preset" class="bg-white/5 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-green-500">
                                    <option value="tablet-1080p">平板 (1080p)</option>
                                    <option value="phone-1080p">手机 (1080p)</option>
                                    <option value="phone-720p">手机 (720p)</option>
                                </select>
                            </div>
                            <div class="flex flex-col gap-2">
                                <x-label>帧率 (FPS)</x-label>
                                <select v-model="newConfig.fps" class="bg-white/5 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-green-500">
                                    <option :value="60">60 FPS</option>
                                    <option :value="90">90 FPS</option>
                                    <option :value="120">120 FPS</option>
                                </select>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col gap-2">
                                <x-label>CPU 核心</x-label>
                                <input v-model.number="newConfig.cpuCores" type="number" class="bg-white/5 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-green-500" />
                            </div>
                            <div class="flex flex-col gap-2">
                                <x-label>内存 (GB)</x-label>
                                <input v-model.number="newConfig.ramGB" type="number" class="bg-white/5 border border-white/10 rounded-lg p-2 text-white outline-none focus:border-green-500" />
                            </div>
                        </div>

                        <div class="flex flex-row gap-6 mt-2">
                            <div class="flex items-center gap-2 cursor-pointer" @click="newConfig.isRoot = !newConfig.isRoot">
                                <x-checkbox :toggled="newConfig.isRoot"></x-checkbox>
                                <x-label class="cursor-pointer">开启 Root (Magisk)</x-label>
                            </div>
                            <div class="flex items-center gap-2 cursor-pointer">
                                <Icon icon="mdi:gpu" class="text-neutral-400" />
                                <x-label>启用 GPU 加速</x-label>
                                <!-- We'll default to enabled if available -->
                            </div>
                        </div>
                    </div>
                    <div class="p-6 bg-white/5 flex flex-row justify-end gap-3">
                        <x-button @click="showCreateDialog = false">
                            <x-label>取消</x-label>
                        </x-button>
                        <x-button @click="confirmCreate" toggled skin="primary">
                            <x-label>确认创建</x-label>
                        </x-button>
                    </div>
                </div>
            </div>
        </dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { WinboatConfig } from '../lib/config';
import { AndroidManager } from '../lib/android';
import { AndroidInstance } from '../../types';

const wbConfig = WinboatConfig.getInstance();
const androidMgr = AndroidManager.getInstance();

const androidInstances = computed(() => wbConfig.config.androidInstances);
const showCreateDialog = ref(false);
const preset = ref('tablet-1080p');
const draggingOver = ref<string | null>(null);
const activeInstanceId = ref<string | null>(null);
const apkInput = ref<HTMLInputElement | null>(null);

const newConfig = reactive({
    name: '',
    width: 1920,
    height: 1080,
    dpi: 480,
    fps: 60,
    cpuCores: 2,
    ramGB: 2,
    isRoot: false,
});

onMounted(async () => {
    await androidMgr.syncStatus();
});

function onDragOver(event: DragEvent, id: string) {
    draggingOver.value = id;
}

function onDragLeave(id: string) {
    if (draggingOver.value === id) draggingOver.value = null;
}

async function onDrop(event: DragEvent, id: string) {
    draggingOver.value = null;
    const file = event.dataTransfer?.files[0];
    if (file && file.name.endsWith('.apk')) {
        await installApk(id, file.path);
    }
}

function triggerApkSelect(id: string) {
    activeInstanceId.value = id;
    apkInput.value?.click();
}

async function onApkFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?[0];
    if (file && activeInstanceId.value) {
        // @ts-ignore - Electron file object has 'path'
        await installApk(activeInstanceId.value, file.path);
    }
    // Reset input
    input.value = '';
}

async function installApk(id: string, path: string) {
    try {
        await androidMgr.installApk(id, path);
        // Show success notification (we could use a built-in one if exists)
        alert('APK 安装成功！');
    } catch (e: any) {
        alert(`安装失败: ${e.message}`);
    }
}

async function openView(instance: AndroidInstance) {
    // For now, we'll try to use a local scrcpy if available, 
    // or tell user to connect via adb
    alert(`请使用 scrcpy 连接到 127.0.0.1:${instance.adbPort}\n\n后续版本将集成内置浏览器窗口！`);
}

async function confirmCreate() {
    // Apply preset
    if (preset.value === 'tablet-1080p') {
        newConfig.width = 1920;
        newConfig.height = 1080;
        newConfig.dpi = 480;
    } else if (preset.value === 'phone-1080p') {
        newConfig.width = 1080;
        newConfig.height = 1920;
        newConfig.dpi = 480;
    } else if (preset.value === 'phone-720p') {
        newConfig.width = 720;
        newConfig.height = 1280;
        newConfig.dpi = 320;
    }

    await androidMgr.createInstance({
        ...newConfig,
        status: 'stopped'
    });
    showCreateDialog.value = false;
    // Reset form
    newConfig.name = '';
    newConfig.isRoot = false;
}

async function toggleInstance(instance: AndroidInstance) {
    if (instance.status === 'running') {
        await androidMgr.stopInstance(instance.id);
    } else {
        await androidMgr.startInstance(instance.id);
    }
}

async function deleteInstance(id: string) {
    // Remove from config
    const idx = wbConfig.config.androidInstances.findIndex(i => i.id === id);
    if (idx !== -1) {
        const instance = wbConfig.config.androidInstances[idx];
        if (instance.status === 'running') {
            await androidMgr.stopInstance(id);
        }
        wbConfig.config.androidInstances.splice(idx, 1);
    }
}
</script>

<style scoped>
.size-12 {
    width: 3rem;
    height: 3rem;
}

input[type="number"] {
    -moz-appearance: textfield;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
</style>
