<template>
    <div class="flex flex-col gap-10 overflow-x-hidden" :class="{ hidden: !maxNumCores }">
        <div>
            <x-label class="mb-4 text-neutral-300">容器设置</x-label>
            <div class="flex flex-col gap-4">
                <!-- RAM Allocation -->
                <ConfigCard
                    icon="game-icons:ram"
                    title="内存分配"
                    desc="为 Windows 虚拟机分配多少 GB 内存"
                    type="number"
                    unit="GB"
                    :min="2"
                    :max="maxRamGB"
                    v-model:value="ramGB"
                />

                <!-- CPU Cores -->
                <ConfigCard
                    icon="solar:cpu-bold"
                    title="CPU 核心"
                    desc="为 Windows 虚拟机分配多少个 CPU 核心"
                    type="number"
                    unit="核"
                    :min="2"
                    :max="maxNumCores"
                    v-model:value="numCores"
                />

                <!-- Shared Folder -->
                <ConfigCard
                    icon="fluent:folder-link-32-filled"
                    title="共享文件夹"
                    type="switch"
                    v-model:value="shareFolder"
                >
                    <template v-slot:desc>
                        如果启用，您可以在 Windows 的
                        <span class="font-mono bg-neutral-700 rounded-md px-1 py-0.5">Network\host.lan</span>
                        下访问选定的文件夹
                    </template>
                </ConfigCard>

                <!-- Shared Folder Location -->
                <ConfigCard
                    v-if="shareFolder"
                    icon="mdi:folder-cog"
                    title="共享文件夹位置"
                    type="custom"
                >
                    <template v-slot:desc>
                        <span v-if="sharedFolderPath">
                            当前共享：<span class="font-mono bg-neutral-700 rounded-md px-1 py-0.5">{{ sharedFolderPath }}</span>
                        </span>
                        <span v-else>
                            选择要与 Windows 共享的文件夹
                        </span>
                    </template>
                    <x-button @click="selectSharedFolder">
                        浏览
                    </x-button>
                </ConfigCard>

                <!-- Auto Start Container -->
                <ConfigCard
                    icon="clarity:power-solid"
                    title="自动启动容器"
                    desc="如果启用，Windows 容器将在系统启动时自动启动"
                    type="switch"
                    v-model:value="autoStartContainer"
                />

                <!-- FreeRDP Port -->
                <ConfigCard
                    icon="lucide:ethernet-port"
                    title="FreeRDP 端口"
                    desc="您可以更改 FreeRDP 与虚拟机通信使用的端口"
                    type="custom"
                >
                    <x-input
                        class="max-w-16 text-right text-[1.1rem]"
                        :value="Number.isNaN(freerdpPort) ? '' : freerdpPort"
                        @input="
                            (e: any) => {
                                freerdpPort = Number(
                                    /^\d+$/.exec(e.target.value)?.at(0) ||
                                        portMapper?.getShortPortMapping(GUEST_RDP_PORT)?.host,
                                );
                            }
                        "
                    >
                        <x-label v-if="Number.isNaN(freerdpPort)">无</x-label>
                    </x-input>
                </ConfigCard>
                <div class="flex flex-col">
                    <p class="my-0 text-red-500" v-for="(error, k) of errors" :key="k">❗ {{ error }}</p>
                </div>
                <!-- GPU Acceleration -->
                <ConfigCard
                    v-if="gpuList.length > 0"
                    icon="mdi:gpu"
                    title="显卡加速 (3D)"
                    desc="选择用于提供 3D 硬件加速的显卡。如果选择专用显卡，渲染性能会更强。"
                    type="dropdown"
                    :options="['disabled', ...gpuList.map(g => g.path)]"
                    v-model:value="wbConfig.config.gpuDevice"
                >
                    <template v-slot:custom-label="{ option }">
                        {{ option === 'disabled' ? '禁用' : (gpuList.find(g => g.path === option)?.name || option) }}
                    </template>
                </ConfigCard>

                <x-button
                    :disabled="saveButtonDisabled || isUpdatingUSBPrerequisites"
                    @click="saveCompose()"
                    class="w-24"
                >
                    <span v-if="!isApplyingChanges || isUpdatingUSBPrerequisites">保存</span>
                    <x-throbber v-else class="w-10"></x-throbber>
                </x-button>
            </div>
        </div>
        <div v-show="wbConfig.config.experimentalFeatures">
            <x-label class="mb-4 text-neutral-300">设备透传</x-label>
            <div class="flex flex-col gap-4">
                <!-- USB Passthrough -->
                <x-card
                    class="flex relative z-20 flex-row justify-between items-center p-2 py-3 my-0 w-full backdrop-blur-xl backdrop-brightness-150 bg-neutral-800/20"
                >
                    <div class="w-full">
                        <div class="flex flex-row gap-2 items-center mb-2">
                            <Icon class="inline-flex text-violet-400 size-8" icon="fluent:tv-usb-24-filled"></Icon>
                            <h1 class="my-0 text-lg font-semibold">
                                USB 透传
                                <span class="bg-violet-500 rounded-full px-3 py-0.5 text-sm ml-2"> 实验性 </span>
                            </h1>
                        </div>

                        <template v-if="usbPassthroughDisabled || isUpdatingUSBPrerequisites">
                            <x-card
                                class="flex items-center py-2 w-full my-2 backdrop-blur-xl gap-4 backdrop-brightness-150 bg-yellow-200/10"
                            >
                                <Icon class="inline-flex text-yellow-500 size-8" icon="clarity:warning-solid"></Icon>
                                <h1 class="my-0 text-base font-normal text-yellow-200">
                                    我们需要更新您的 Compose 文件才能使用此功能！
                                </h1>

                                <x-button
                                    :disabled="isUpdatingUSBPrerequisites"
                                    class="mt-1 !bg-gradient-to-tl from-yellow-200/20 to-transparent ml-auto hover:from-yellow-300/30 transition !border-0"
                                    @click="addRequiredComposeFieldsUSB"
                                >
                                    <x-label
                                        class="ext-lg font-normal text-yellow-200"
                                        v-if="!isUpdatingUSBPrerequisites"
                                    >
                                        更新
                                    </x-label>

                                    <x-throbber v-else class="w-8 text-yellow-300"></x-throbber>
                                </x-button>
                            </x-card>
                        </template>
                        <template v-if="wbConfig.config.containerRuntime === ContainerRuntimes.PODMAN">
                            <x-card
                                class="flex items-center py-2 w-full my-2 backdrop-blur-xl gap-4 backdrop-brightness-150 bg-yellow-200/10"
                            >
                                <Icon class="inline-flex text-yellow-500 size-8" icon="clarity:warning-solid"></Icon>
                                <h1 class="my-0 text-base font-normal text-yellow-200">
                                    使用 Podman 作为容器运行时还不支持 USB 透传。
                                </h1>
                            </x-card>
                        </template>
                        <template
                            v-if="
                                !usbPassthroughDisabled &&
                                !isUpdatingUSBPrerequisites &&
                                wbConfig.config.containerRuntime === ContainerRuntimes.DOCKER
                            "
                        >
                            <x-label
                                class="text-neutral-400 text-[0.9rem] !pt-0 !mt-0"
                                v-if="usbManager.ptDevices.value.length == 0"
                            >
                                点击下方按钮将 USB 设备添加到透传列表
                            </x-label>
                            <TransitionGroup name="devices" tag="x-box" class="flex-col gap-2 mt-4">
                                <x-card
                                    class="flex justify-between items-center px-2 py-0 m-0 bg-white/5"
                                    v-for="device of usbManager.ptDevices.value"
                                    :key="`${device.vendorId}-${device.productId}`"
                                    :class="{
                                        'bg-white/[calc(0.05*0.75)] [&_*:not(div):not(span)]:opacity-75':
                                            !usbManager.isPTDeviceConnected(device),
                                    }"
                                >
                                    <div class="flex flex-row gap-2 items-center">
                                        <span
                                            v-if="
                                                usbManager.isMTPDevice(device) ||
                                                usbManager
                                                    .stringifyPTSerializableDevice(device)
                                                    .toLowerCase()
                                                    .includes('mtp')
                                            "
                                            class="relative group"
                                        >
                                            <Icon
                                                icon="clarity:warning-solid"
                                                class="text-yellow-300 size-7 cursor-pointer"
                                            />
                                            <span
                                                class="absolute bottom-5 z-50 w-[320px] bg-neutral-800/90 backdrop-blur-sm text-xs text-gray-300 rounded-lg shadow-lg px-3 py-2 hidden group-hover:block transition-opacity duration-200 pointer-events-none"
                                            >
                                                此设备似乎正在使用 MTP 协议，已知该协议存在问题。某些桌面环境会自动挂载 MTP 设备，从而导致 WinBoat 无法透传该设备。
                                            </span>
                                        </span>

                                        <span v-if="!usbManager.isPTDeviceConnected(device)" class="relative group">
                                            <Icon
                                                icon="ix:connection-fail"
                                                class="text-red-500 size-7 cursor-pointer"
                                            />
                                            <span
                                                class="absolute bottom-5 z-50 w-[320px] bg-neutral-800/90 backdrop-blur-sm text-xs text-gray-300 rounded-lg shadow-lg px-3 py-2 hidden group-hover:block transition-opacity duration-200 pointer-events-none"
                                            >
                                                此设备当前未连接。
                                            </span>
                                        </span>

                                        <p class="text-base !m-0 text-gray-200">
                                            {{ usbManager.stringifyPTSerializableDevice(device) }}
                                        </p>
                                    </div>
                                    <x-button
                                        @click="removeDevice(device)"
                                        class="mt-1 !bg-gradient-to-tl from-red-500/20 to-transparent hover:from-red-500/30 transition !border-0"
                                    >
                                        <x-icon href="#remove"></x-icon>
                                    </x-button>
                                </x-card>
                            </TransitionGroup>
                            <x-button
                                v-if="availableDevices.length > 0"
                                class="!bg-gradient-to-tl from-blue-400/20 shadow-md shadow-blue-950/20 to-transparent hover:from-blue-400/30 transition"
                                :class="{ 'mt-4': usbManager.ptDevices.value.length }"
                                @click="refreshAvailableDevices()"
                            >
                                <x-icon href="#add"></x-icon>
                                <x-label>添加设备</x-label>
                                <TransitionGroup ref="usbMenu" name="menu" tag="x-menu" class="max-h-52">
                                    <x-menuitem
                                        v-for="(device, k) of availableDevices as Device[]"
                                        :key="device.portNumbers.join(',')"
                                        @click="addDevice(device)"
                                    >
                                        <x-label>{{ usbManager.stringifyDevice(device) }}</x-label>
                                    </x-menuitem>
                                    <x-menuitem v-if="availableDevices.length === 0" disabled>
                                        <x-label>无可用设备</x-label>
                                    </x-menuitem>
                                </TransitionGroup>
                            </x-button>
                        </template>
                    </div>
                </x-card>
            </div>
        </div>
        <div v-show="wbConfig.config.advancedFeatures">
            <x-label class="mb-4 text-neutral-300">FreeRDP 设置</x-label>
            <div class="flex flex-col gap-4">
                <!-- RDP args -->
                <x-card
                    class="flex flex-row justify-between items-center p-2 py-3 my-0 w-full backdrop-blur-xl backdrop-brightness-150 bg-neutral-800/20"
                >
                    <div class="w-full">
                        <div class="flex flex-row gap-2 items-center mb-2">
                            <Icon class="inline-flex text-violet-400 size-8" icon="fluent:tv-24-filled"></Icon>
                            <h1 class="my-0 text-lg font-semibold">
                                FreeRDP 参数
                                <span class="bg-blue-500 rounded-full px-3 py-0.5 text-sm ml-2"> 高级 </span>
                            </h1>
                        </div>

                        <x-label
                            v-if="wbConfig.config.rdpArgs.length == 0"
                            class="text-neutral-400 text-[0.9rem] !pt-0 !mt-0"
                        >
                            点击下方按钮向 FreeRDP 添加参数。您可以选择添加新参数或通过替换修改现有参数。
                        </x-label>
                        <TransitionGroup name="devices" tag="x-box" class="flex-col gap-2 mt-4">
                            <x-card
                                class="flex justify-between items-center gap-2 px-2 py-0 m-0 bg-white/5"
                                v-for="(arg, index) in wbConfig.config.rdpArgs"
                                :key="index"
                            >
                                <div class="grid grid-cols-2 gap-2 items-center w-full">
                                    <x-input
                                        type="text"
                                        class="!max-w-full"
                                        v-if="arg.isReplacement"
                                        :value="arg.original"
                                        @input="(e: any) => (arg.original = e.target.value)"
                                    >
                                        <x-label>原始参数</x-label>
                                    </x-input>
                                    <x-input
                                        type="text"
                                        class="!max-w-full !mt-0"
                                        :class="{ 'col-span-2': !arg.isReplacement }"
                                        :value="arg.newArg"
                                        @input="(e: any) => (arg.newArg = e.target.value)"
                                    >
                                        <x-label>新参数</x-label>
                                    </x-input>
                                </div>
                                <x-button
                                    class="mt-1 !bg-gradient-to-tl from-red-500/20 to-transparent hover:from-red-500/30 transition !border-0"
                                    @click="wbConfig.config.rdpArgs.splice(index, 1)"
                                >
                                    <x-icon href="#remove"></x-icon>
                                </x-button>
                            </x-card>
                        </TransitionGroup>
                        <div class="flex flex-row gap-2" :class="{ 'mt-4': wbConfig.config.rdpArgs.length }">
                            <x-button
                                class="!bg-gradient-to-tl from-blue-400/20 shadow-md shadow-blue-950/20 to-transparent hover:from-blue-400/30 transition"
                                @click="wbConfig.config.rdpArgs.push({ newArg: '', isReplacement: false })"
                            >
                                <x-icon href="#add"></x-icon>
                                <x-label>添加参数</x-label>
                            </x-button>
                            <x-button
                                class="!bg-gradient-to-tl from-yellow-400/20 shadow-md shadow-yellow-950/20 to-transparent hover:from-yellow-400/30 transition"
                                @click="wbConfig.config.rdpArgs.push({ newArg: '', original: '', isReplacement: true })"
                            >
                                <Icon class="inline-flex size-6" icon="codex:replace" />
                                <x-label>替换参数</x-label>
                            </x-button>
                        </div>
                    </div>
                </x-card>
            </div>
        </div>
        <div>
            <x-label class="mb-4 text-neutral-300">通用设置</x-label>
            <div class="flex flex-col gap-4">
                <!-- Display Scaling -->
                <ConfigCard
                    class="relative z-30"
                    icon="uil:scaling-right"
                    title="显示缩放"
                    desc="控制显示缩放比例。"
                    type="dropdown"
                    unit="%"
                    :options="[100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300]"
                    v-model:value="wbConfig.config.scale"
                />

                <!-- Fullscreen Toggle -->
                <ConfigCard
                    icon="mdi:fullscreen"
                    title="全屏模式"
                    desc="控制 Windows 桌面是否以全屏方式启动。禁用后将以窗口模式启动并支持动态调整分辨率。"
                    type="switch"
                    v-model:value="wbConfig.config.fullscreen"
                />

                <!-- Application Scaling -->
                <ConfigCard
                    class="relative z-20"
                    icon="uil:apps"
                    title="应用缩放"
                    desc="控制应用界面的缩放比例。"
                    type="number"
                    :step="10"
                    :min="100"
                    :max="500"
                    v-model:value="wbConfig.config.scaleDesktop"
                />

                <!-- Multi Monitor -->
                <ConfigCard
                    class="relative z-10"
                    icon="uil:monitor"
                    title="多显示器支持"
                    type="dropdown"
                    :options="Object.values(MultiMonitorMode)"
                    v-model:value="wbConfig.config.multiMonitor"
                >
                    <template v-slot:desc>
                        控制如何处理多显示器。MultiMon 为每个显示器创建单独的显示，而 Span 将显示拉伸到所有显示器。注意：根据您的设置，Span 或 MultiMon 的效果可能更好。
                    </template>
                </ConfigCard>

                <!-- Smartcard Passthrough -->
                <ConfigCard
                    icon="game-icons:swipe-card"
                    title="智能卡透传"
                    desc="如果启用，在启动应用时您的智能卡读取器将透传给 Windows"
                    type="switch"
                    v-model:value="wbConfig.config.smartcardEnabled"
                >
                </ConfigCard>

                <!-- RDP Monitoring -->
                <ConfigCard
                    icon="fluent:remote-16-filled"
                    title="RDP 监控"
                    desc="如果启用，当 RDP 会话连接时将显示横幅（可能会导致 CPU 占用较高，如果发现性能问题请禁用）"
                    type="switch"
                    v-model:value="wbConfig.config.rdpMonitoringEnabled"
                />
            </div>
        </div>

        <div>
            <x-label class="mb-4 text-neutral-300">WinBoat 设置</x-label>

            <div class="flex flex-col gap-4">
                <!-- Experimental Features -->
                <ConfigCard
                    icon="streamline-ultimate:lab-tube-experiment"
                    title="实验性功能"
                    desc="如果启用，您将可以使用可能不稳定或不完整的实验性功能"
                    type="switch"
                    v-model:value="wbConfig.config.experimentalFeatures"
                    @toggle="toggleExperimentalFeatures"
                />

                <!-- Advanced Settings -->
                <ConfigCard
                    icon="mdi:administrator"
                    title="高级设置"
                    desc="如果启用，您将可以使用如果配置错误可能会导致 WinBoat 无法工作的高级设置"
                    type="switch"
                    v-model:value="wbConfig.config.advancedFeatures"
                />

                <!-- Disable Animations -->
                <ConfigCard
                    icon="mdi:animation-outline"
                    title="禁用动画"
                    desc="如果启用，UI 中的所有动画都将被禁用（当 GPU 加速工作不佳时非常有用）"
                    type="switch"
                    v-model:value="wbConfig.config.disableAnimations"
                />
            </div>
        </div>

        <div>
            <x-label class="mb-4 text-neutral-300">危险区域</x-label>
            <x-card class="flex flex-col py-3 my-0 mb-6 w-full backdrop-blur-xl backdrop-brightness-150 bg-red-500/10">
                <h1 class="my-0 text-lg font-normal text-red-300">
                    ⚠️ <span class="font-bold">警告：</span> 此处的所有操作都具有潜在的破坏性，请谨慎操作！
                </h1>
            </x-card>
            <div></div>
            <x-button
                class="!bg-red-800/20 px-4 py-1 !border-red-500/10 generic-hover flex flex-row items-center gap-2 !text-red-300"
                @click="resetWinboat()"
                :disabled="isResettingWinboat"
            >
                <Icon v-if="resetQuestionCounter < 3" icon="mdi:bomb" class="size-8"></Icon>
                <x-throbber v-else class="size-8"></x-throbber>

                <span v-if="resetQuestionCounter === 0">重置 Winboat 并删除虚拟机</span>
                <span v-else-if="resetQuestionCounter === 1">您确定吗？此操作无法撤销。</span>
                <span v-else-if="resetQuestionCounter === 2">最后确认，您“绝对”确定吗？</span>
                <span v-else-if="resetQuestionCounter === 3">正在重置 Winboat...</span>
            </x-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import ConfigCard from "../components/ConfigCard.vue";
import { computed, onMounted, ref, watch, reactive } from "vue";
import { computedAsync } from "@vueuse/core";
import { Winboat } from "../lib/winboat";
import { ContainerRuntimes, ContainerStatus } from "../lib/containers/common";
import type { ComposeConfig } from "../../types";
import { getSpecs } from "../lib/specs";
import { Icon } from "@iconify/vue";
import { MultiMonitorMode, RdpArg, WinboatConfig } from "../lib/config";
import { USBManager, type PTSerializableDeviceInfo } from "../lib/usbmanager";
import { type Device } from "usb";
import { getGPUList, type GPUInfo } from "../lib/gpu";
import {
    USB_VID_BLACKLIST,
    RESTART_ON_FAILURE,
    RESTART_NO,
    GUEST_RDP_PORT,
    GUEST_QMP_PORT,
} from "../lib/constants";
import { ComposePortEntry, ComposePortMapper, Range } from "../utils/port";
const { app }: typeof import("@electron/remote") = require("@electron/remote");
const electron: typeof import("electron") = require("electron").remote || require("@electron/remote");
const os: typeof import("os") = require("node:os");

// For Resources
const compose = ref<ComposeConfig | null>(null);
const numCores = ref(0);
const origNumCores = ref(0);
const maxNumCores = ref(0);
const ramGB = ref(0);
const origRamGB = ref(0);
const maxRamGB = ref(0);
const shareFolder = ref(false);
const origShareFolder = ref(false);
const sharedFolderPath = ref("");
const origSharedFolderPath = ref("");
const origAutoStartContainer = ref(false);
const autoStartContainer = ref(false);
const freerdpPort = ref(0);
const origFreerdpPort = ref(0);
const isApplyingChanges = ref(false);
const resetQuestionCounter = ref(0);
const isResettingWinboat = ref(false);
const isUpdatingUSBPrerequisites = ref(false);

// For USB Devices
const availableDevices = ref<Device[]>([]);
const gpuList = ref<GPUInfo[]>([]);
const origGpuDevice = ref("disabled");

// For handling the QMP port, as we can't rely on the winboat instance doing this for us.
// A great example is when the container is offline. In that case, winboat's portManager isn't instantiated.
let portMapper = ref<ComposePortMapper | null>(null);
// ^ Has to be reactive for usbPassthroughDisabled computed to trigger.

// For General
const wbConfig = reactive(WinboatConfig.getInstance());
const winboat = Winboat.getInstance();
const usbManager = USBManager.getInstance();

// Constants
const USB_BUS_PATH = "/dev/bus/usb:/dev/bus/usb";
const QMP_ARGUMENT = "-qmp tcp:0.0.0.0:7149,server,wait=off"; // 7149 can remain hardcoded as it refers to a guest port

onMounted(async () => {
    await assignValues();
});

/**
 * Assigns the initial values from the Compose file to the reactive refs
 * so we can display them and track when a change has been made
 */
async function assignValues() {
    compose.value = Winboat.readCompose(winboat.containerMgr!.composeFilePath);
    portMapper.value = new ComposePortMapper(compose.value);

    numCores.value = Number(compose.value.services.windows.environment.CPU_CORES);
    origNumCores.value = numCores.value;

    ramGB.value = Number(compose.value.services.windows.environment.RAM_SIZE.split("G")[0]);
    origRamGB.value = ramGB.value;

    // Find any volume that ends with /shared
    const sharedVolume = compose.value.services.windows.volumes.find(v => v.includes("/shared"));
    if (sharedVolume) {
        shareFolder.value = true;
        // Extract the path before :/shared
        const [hostPath] = sharedVolume.split(":");
        sharedFolderPath.value = hostPath.replace("${HOME}", os.homedir());
    } else {
        shareFolder.value = false;
        sharedFolderPath.value = "";
    }
    origShareFolder.value = shareFolder.value;
    origSharedFolderPath.value = sharedFolderPath.value;

    autoStartContainer.value = compose.value.services.windows.restart === RESTART_ON_FAILURE;
    origAutoStartContainer.value = autoStartContainer.value;

    freerdpPort.value = (portMapper.value.getShortPortMapping(GUEST_RDP_PORT)?.host as number) ?? GUEST_RDP_PORT;
    origFreerdpPort.value = freerdpPort.value;

    const specs = await getSpecs();
    maxRamGB.value = specs.ramGB;
    maxNumCores.value = specs.cpuCores;

    gpuList.value = await getGPUList();
    const gpuEnv = compose.value.services.windows.environment.GPU;
    if (gpuEnv === "on") {
        const gpuDevice = compose.value.services.windows.devices?.find(d => d.includes("/dev/dri/renderD"));
        wbConfig.config.gpuDevice = gpuDevice || "disabled";
    } else {
        wbConfig.config.gpuDevice = "disabled";
    }
    origGpuDevice.value = wbConfig.config.gpuDevice;

    refreshAvailableDevices();
}

/**
 * Saves the currently specified values to the Compose file
 * and then re-assigns the initial values to the reactive refs
 */
async function saveCompose() {
    compose.value!.services.windows.environment.RAM_SIZE = `${ramGB.value}G`;
    compose.value!.services.windows.environment.CPU_CORES = `${numCores.value}`;

    // Remove any existing shared volume
    const existingSharedVolume = compose.value!.services.windows.volumes.find(v => v.includes("/shared"));
    if (existingSharedVolume) {
        compose.value!.services.windows.volumes = compose.value!.services.windows.volumes.filter(
            v => !v.includes("/shared"),
        );
    }

    // Add the new shared volume if enabled
    if (shareFolder.value && sharedFolderPath.value) {
        const volumeStr = `${sharedFolderPath.value}:/shared`;
        compose.value!.services.windows.volumes.push(volumeStr);
    }

    compose.value!.services.windows.restart = autoStartContainer.value ? RESTART_ON_FAILURE : RESTART_NO;

    portMapper.value!.setShortPortMapping(GUEST_RDP_PORT, freerdpPort.value, {
        protocol: "tcp",
        hostIP: "127.0.0.1",
    });

    portMapper.value!.setShortPortMapping(GUEST_RDP_PORT, freerdpPort.value, {
        protocol: "udp",
        hostIP: "127.0.0.1",
    });

    compose.value!.services.windows.ports = portMapper.value!.composeFormat;

    // GPU mapping
    const gpuDevice = wbConfig.config.gpuDevice;
    if (gpuDevice && gpuDevice !== "disabled") {
        if (!compose.value!.services.windows.devices) {
            compose.value!.services.windows.devices = ["/dev/kvm"];
        }
        // Remove old renderD devices if any
        compose.value!.services.windows.devices = compose.value!.services.windows.devices.filter(d => !d.includes("/dev/dri/renderD"));
        compose.value!.services.windows.devices.push(gpuDevice);
        compose.value!.services.windows.environment.GPU = "on";

        // Check if discrete GPU and set DRI_PRIME
        const selectedGpu = gpuList.value.find(g => g.path === gpuDevice);
        if (selectedGpu?.isDiscrete) {
            compose.value!.services.windows.environment.DRI_PRIME = "1";
        } else {
            delete compose.value!.services.windows.environment.DRI_PRIME;
        }
    } else {
        compose.value!.services.windows.environment.GPU = "off";
        delete compose.value!.services.windows.environment.DRI_PRIME;
        // Remove renderD devices
        if (compose.value!.services.windows.devices) {
            compose.value!.services.windows.devices = compose.value!.services.windows.devices.filter(d => !d.includes("/dev/dri/renderD"));
        }
    }

    isApplyingChanges.value = true;
    try {
        await winboat.replaceCompose(compose.value!);
        await assignValues();
    } catch (e) {
        console.error("Failed to apply changes");
        console.error(e);
    } finally {
        isApplyingChanges.value = false;
    }
}

/**
 * Opens a dialog to select a folder to share with Windows
 */
function selectSharedFolder() {
    electron.dialog
        .showOpenDialog({
            title: "选择要共享的文件夹",
            properties: ["openDirectory"],
            defaultPath: sharedFolderPath.value || os.homedir(),
        })
        .then(result => {
            if (!result.canceled && result.filePaths.length > 0) {
                sharedFolderPath.value = result.filePaths[0];
            }
        });
}

/**
 * Adds the required fields for USB passthrough to work
 * to the Compose file if they don't already exist
 */
async function addRequiredComposeFieldsUSB() {
    if (!usbPassthroughDisabled.value) {
        return;
    }

    isUpdatingUSBPrerequisites.value = true;
    await winboat.stopContainer();

    if (!hasUsbVolume(compose)) {
        compose.value!.services.windows.volumes.push(USB_BUS_PATH);
    }
    if (!hasQmpPort()) {
        const composePorts = winboat.containerMgr!.defaultCompose.services.windows.ports;
        const portEntries = composePorts.filter(x => typeof x === "string").map(x => new ComposePortEntry(x));
        const QMPPredicate = (entry: ComposePortEntry) =>
            (entry.host instanceof Range || Number.isNaN(entry.host)) && // We allow NaN in case the QMP port entry isn't already there on podman for whatever reason
            typeof entry.container === "number" &&
            entry.container === GUEST_QMP_PORT;
        const QMPPort = portEntries.find(QMPPredicate)!.host;

        portMapper.value!.setShortPortMapping(GUEST_QMP_PORT, QMPPort, {
            protocol: "tcp",
            hostIP: "127.0.0.1",
        });
    }

    if (!compose.value!.services.windows.environment.ARGUMENTS) {
        compose.value!.services.windows.environment.ARGUMENTS = "";
    }
    if (!hasQmpArgument(compose)) {
        compose.value!.services.windows.environment.ARGUMENTS += `\n${QMP_ARGUMENT}`;
    }

    if (!compose.value!.services.windows.environment.HOST_PORTS) {
        compose.value!.services.windows.environment.HOST_PORTS = "";
    }
    if (!hasHostPort(compose)) {
        const delimiter = compose.value!.services.windows.environment.HOST_PORTS.length == 0 ? "" : ",";
        compose.value!.services.windows.environment.HOST_PORTS += delimiter + GUEST_QMP_PORT;
    }

    await saveCompose();

    isUpdatingUSBPrerequisites.value = false;
}

const errors = computedAsync(async () => {
    let errCollection: string[] = [];

    if (!numCores.value || numCores.value < 2) {
        errCollection.push("您必须为 Windows 分配至少两个 CPU 核心才能正常运行");
    }

    if (numCores.value > maxNumCores.value) {
        errCollection.push("分配给 Windows 的 CPU 核心不能超过可用数量");
    }

    if (!ramGB.value || ramGB.value < 4) {
        errCollection.push("您必须为 Windows 分配至少 4 GB 内存才能正常运行");
    }

    if (ramGB.value > maxRamGB.value) {
        errCollection.push("分配给 Windows 的 内存不能超过可用容量");
    }

    if (
        freerdpPort.value !== origFreerdpPort.value &&
        !Number.isNaN(freerdpPort.value) &&
        !(await ComposePortMapper.isPortOpen(freerdpPort.value))
    ) {
        errCollection.push("您必须为 FreeRDP 选择一个开放端口！");
    }

    return errCollection;
});

const hasUsbVolume = (_compose: typeof compose) =>
    _compose.value?.services.windows.volumes?.some(x => x.includes(USB_BUS_PATH));
const hasQmpArgument = (_compose: typeof compose) =>
    _compose.value?.services.windows.environment.ARGUMENTS?.includes(QMP_ARGUMENT);
const hasQmpPort = () => portMapper.value!.hasShortPortMapping(GUEST_QMP_PORT) ?? false;
const hasHostPort = (_compose: typeof compose) =>
    _compose.value?.services.windows.environment.HOST_PORTS?.includes(GUEST_QMP_PORT.toString());

const usbPassthroughDisabled = computed(() => {
    return !hasUsbVolume(compose) || !hasQmpArgument(compose) || !hasQmpPort() || !hasHostPort(compose);
});

const saveButtonDisabled = computed(() => {
    const hasResourceChanges =
        origNumCores.value !== numCores.value ||
        origRamGB.value !== ramGB.value ||
        shareFolder.value !== origShareFolder.value ||
        sharedFolderPath.value !== origSharedFolderPath.value ||
        (!Number.isNaN(freerdpPort.value) && freerdpPort.value !== origFreerdpPort.value) ||
        autoStartContainer.value !== origAutoStartContainer.value ||
        wbConfig.config.gpuDevice !== origGpuDevice.value;

    const shouldBeDisabled = errors.value?.length || !hasResourceChanges || isApplyingChanges.value;

    return shouldBeDisabled;
});

async function resetWinboat() {
    if (++resetQuestionCounter.value < 3) {
        return;
    }

    isResettingWinboat.value = true;
    await winboat.resetWinboat();
    app.exit();
}

// Reactivity utterly fails here, so we use this function to
// refresh via the button
function refreshAvailableDevices() {
    availableDevices.value = usbManager.devices.value.filter(device => {
        return (
            !usbManager.isDeviceInPassthroughList(device) &&
            !USB_VID_BLACKLIST.some(x => usbManager.stringifyDevice(device).includes(x))
        );
    });
    console.info("[Available Devices] Debug", availableDevices.value);
}

function addDevice(device: Device): void {
    try {
        usbManager.addDeviceToPassthroughList(device);
        refreshAvailableDevices();
    } catch (error) {
        console.error("Failed to add device to passthrough list:", error);
    }
}

function removeDevice(ptDevice: PTSerializableDeviceInfo): void {
    try {
        usbManager.removeDeviceFromPassthroughList(ptDevice);
        refreshAvailableDevices();
    } catch (error) {
        console.error("Failed to remove device from passthrough list:", error);
    }
}

async function toggleExperimentalFeatures() {
    // Remove all passthrough USB devices if we're disabling experimental features
    // since USB passthrough is an experimental feature
    if (!wbConfig.config.experimentalFeatures) {
        await usbManager.removeAllPassthroughDevicesAndConfig();

        // Create the QMP interval if experimental features are enabled
        // This would get created by default since we're changing the compose and re-deploying,
        // but a scenario could also occur where the user is re-enabling experimental features
        // after the compose changes, which then would cause a bug
        // TODO: Remove after USB passthrough is no longer experimental
    } else if (winboat.containerStatus.value == ContainerStatus.RUNNING && !winboat.hasQMPInterval) {
        console.log("Creating QMP interval because experimental features were turned on");
        winboat.createQMPInterval();
    }
}

// Watch for when shared folder is enabled and set default path
watch(shareFolder, (newValue) => {
    if (newValue && !sharedFolderPath.value) {
        sharedFolderPath.value = os.homedir();
    }
});
</script>

<style scoped>
.devices-move,
.devices-enter-active,
.devices-leave-active,
.menu-move,
.menu-enter-active,
.menu-leave-active {
    transition: all 0.5s ease;
}

.devices-enter-from,
.devices-leave-to {
    opacity: 0;
    transform: translateX(30px);
}

.devices-leave-active,
.menu-leave-active {
    position: absolute;
}

.menu-enter-from,
.menu-leave-to {
    opacity: 0;
    transform: translateX(20px) scale(0.9);
}
</style>
