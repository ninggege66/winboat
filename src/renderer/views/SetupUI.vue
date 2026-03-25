<template>
    <div class="relative size-full p-16 overflow-hidden">
        <div class="size-full rounded-3xl bg-[#1F1F1F] shadow-lg shadow-black/50 gap-4 p-5 grid grid-cols-2">
            <div>
                <div id="stepStatus" class="flex flex-row justify-center gap-4 pt-2">
                    <div
                        v-for="(_, idx) of steps"
                        :key="idx"
                        class="w-4 h-4 rounded-full bg-neutral-700 transition duration-1000"
                        :class="{
                            'bg-neutral-500': idx < currentStepIdx,
                            'bg-violet-400': idx === currentStepIdx,
                            'bg-neutral-700': idx > currentStepIdx,
                        }"
                    ></div>
                </div>
                <Transition name="bounce" mode="out-in">
                    <div :key="currentStepIdx" id="stepIcon" class="flex items-center justify-center relative h-full">
                        <Icon key="icon1" class="size-[60%] text-violet-400 z-30 relative" :icon="currentStep.icon" />
                        <Icon
                            key="icon-gradient"
                            class="size-[60%] text-violet-400 brightness-75 z-20 absolute top-[50%] translate-y-[-50%] blur-2xl"
                            :icon="currentStep.icon"
                        />
                        <Icon
                            key="icon2"
                            class="size-[60%] text-violet-400 brightness-75 z-20 absolute top-[51.5%] translate-y-[-50%] translate-x-[1.5%]"
                            :icon="currentStep.icon"
                        />
                        <Icon
                            key="icon3"
                            class="size-[60%] text-violet-400 brightness-50 z-10 absolute top-[53%] translate-y-[-50%] translate-x-[3%]"
                            :icon="currentStep.icon"
                        />
                    </div>
                </Transition>
            </div>

            <Transition name="bouncedown" mode="out-in">
                <div :key="currentStepIdx" id="stepContent" class="overflow-scroll">
                    <!-- Welcome -->
                    <div v-if="currentStep.id === StepID.WELCOME" class="step-block">
                        <h1 class="text-3xl font-semibold">{{ currentStep.title }}</h1>
                        <p class="text-lg text-gray-400">
                            WinBoat 是一款功能齐全的应用，可帮助您在 Linux 机器上轻松运行 Windows 应用程序。
                        </p>
                        <p class="text-lg text-gray-400">
                            我们将引导您完成几个必要步骤，让您立即开始使用。
                        </p>
                        <div class="flex flex-row gap-4">
                            <x-button toggled class="px-6" @click="currentStepIdx++">下一步</x-button>
                        </div>
                    </div>

                    <!-- License -->
                    <div v-if="currentStep.id === StepID.LICENSE" class="step-block">
                        <h1 class="text-3xl font-semibold">{{ currentStep.title }}</h1>
                        <p class="text-lg text-gray-400">
                            WinBoat 是基于 MIT 许可协议的开源软件。请阅读下面的许可协议。
                        </p>
                        <pre class="text-sm text-gray-400 bg-neutral-800 p-4 rounded-lg overflow-auto">
                            {{ license }}
                        </pre>
                        <div class="flex flex-row gap-4">
                            <x-button class="px-6" @click="currentStepIdx--">上一步</x-button>
                            <x-button toggled class="px-6" @click="currentStepIdx++">我同意</x-button>
                        </div>
                    </div>

                    <!-- Pre-Requisites -->
                    <div v-if="currentStep.id === StepID.PREREQUISITES" class="step-block">
                        <h1 class="text-3xl font-semibold">{{ currentStep.title }}</h1>
                        <p class="text-lg text-gray-400">
                            为了运行 WinBoat，您的计算机必须满足以下要求。
                        </p>
                        <ul class="text-lg text-gray-400 list-none space-y-1.5 bg-neutral-800 py-3 rounded-lg">
                            <li class="flex items-center gap-2">
                                <span v-if="specs.ramGB >= 4" class="text-green-500">✔</span>
                                <span v-else class="text-red-500">✘</span>
                                至少 4 GB 内存 (检测到: {{ specs.ramGB }} GB)
                            </li>

                            <li class="flex items-center gap-2">
                                <span v-if="specs.cpuCores >= 2" class="text-green-500">✔</span>
                                <span v-else class="text-red-500">✘</span>
                                至少 2 CPU 核心 (检测到: {{ specs.cpuCores }} 核心)
                            </li>

                            <li class="flex items-center gap-2">
                                <span v-if="specs.kvmEnabled" class="text-green-500">✔</span>
                                <span v-else class="text-red-500">✘</span>
                                虚拟化 (KVM) 已启用
                                <a
                                    href="https://duckduckgo.com/?t=h_&q=how+to+enable+virtualization+in+%3Cmotherboard+brand%3E+bios&ia=web"
                                    @click="openAnchorLink"
                                    target="_blank"
                                    class="text-violet-400 hover:underline ml-1"
                                >
                                    如何开启？
                                </a>
                            </li>

                            <li class="flex items-center gap-2">
                                <span v-if="containerInstalled(containerSpecs)" class="text-green-500">✔</span>
                                <span v-else class="text-red-500">✘</span>

                                <div>
                                    <x-select
                                        @change="(e: any) => (containerRuntime = e.detail.newValue)"
                                        class="w-fit"
                                    >
                                        <x-menu>
                                            <x-menuitem
                                                v-for="(runtime, key) in Object.values(ContainerRuntimes)"
                                                :key="key"
                                                :value="runtime"
                                                :toggled="runtime === containerRuntime"
                                            >
                                                <x-label>{{ runtime }}</x-label>
                                            </x-menuitem>
                                        </x-menu>
                                    </x-select>
                                </div>
                                已安装
                                <a
                                    :href="containerRuntime === ContainerRuntimes.PODMAN
                                        ? 'https://podman.io/getting-started/installation'
                                        : 'https://docs.docker.com/engine/install/'"
                                    @click="openAnchorLink"
                                    target="_blank"
                                    class="text-violet-400 hover:underline ml-1"
                                >如何开启？</a>
                            </li>

                            <!-- Docker Specific Requirements -->
                            <template v-if="containerRuntime == ContainerRuntimes.DOCKER">
                                <li class="flex items-center gap-2">
                                    <span
                                        v-if="
                                            containerSpecs &&
                                            'dockerComposeInstalled' in containerSpecs &&
                                            containerSpecs.dockerComposeInstalled
                                        "
                                        class="text-green-500"
                                        >✔</span
                                    >
                                    <span v-else class="text-red-500">✘</span>
                                    Docker Compose v2 已安装
                                    <a
                                        href="https://docs.docker.com/compose/install/#plugin-linux-only"
                                        @click="openAnchorLink"
                                        target="_blank"
                                        class="text-violet-400 hover:underline ml-1"
                                        >如何开启？</a
                                    >
                                </li>

                                <li class="flex items-center gap-2">
                                    <span
                                        v-if="
                                            containerSpecs &&
                                            'dockerIsInUserGroups' in containerSpecs &&
                                            containerSpecs.dockerIsInUserGroups
                                        "
                                        class="text-green-500"
                                        >✔</span
                                    >
                                    <span v-else class="text-red-500">✘</span>
                                    当前用户已添加至
                                    <span class="font-mono bg-neutral-700 rounded-md px-0.5">docker</span> 组
                                    <span class="text-gray-600"> (需要重新登录) </span>
                                    <a
                                        href="https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user"
                                        @click="openAnchorLink"
                                        target="_blank"
                                        class="text-violet-400 hover:underline ml-1"
                                        >详情?</a
                                    >
                                </li>

                                <li class="flex items-center gap-2">
                                    <span
                                        v-if="
                                            containerSpecs &&
                                            'dockerIsRunning' in containerSpecs &&
                                            containerSpecs.dockerIsRunning
                                        "
                                        class="text-green-500"
                                        >✔</span
                                    >
                                    <span v-else class="text-red-500">✘</span>
                                    Docker 守护进程正在运行
                                    <span class="text-gray-600"> (同时也请开启开机自启) </span>
                                    <a
                                        href="https://docs.docker.com/config/daemon/start/"
                                        @click="openAnchorLink"
                                        target="_blank"
                                        class="text-violet-400 hover:underline ml-1"
                                        >详情?</a
                                    >
                                </li>
                            </template>

                            <!-- Podman Specific Requirements -->
                            <template v-else>
                                <li class="flex items-center gap-2">
                                    <span
                                        v-if="
                                            containerSpecs &&
                                            'podmanComposeInstalled' in containerSpecs &&
                                            containerSpecs.podmanComposeInstalled
                                        "
                                        class="text-green-500"
                                        >✔</span
                                    >
                                    <span v-else class="text-red-500">✘</span>
                                    Podman Compose 已安装
                                    <a
                                        href="https://github.com/containers/podman-compose?tab=readme-ov-file#installation"
                                        @click="openAnchorLink"
                                        target="_blank"
                                        class="text-violet-400 hover:underline ml-1"
                                        >详情?</a
                                    >
                                </li>
                            </template>
                            <li class="flex items-center gap-2">
                                <span v-if="specs.freeRDP3Installed" class="text-green-500">✔</span>
                                <span v-else class="text-red-500">✘</span>
                                FreeRDP 3.x.x 已安装
                                <a
                                    href="https://github.com/FreeRDP/FreeRDP/wiki/PreBuilds"
                                    @click="openAnchorLink"
                                    target="_blank"
                                    class="text-violet-400 hover:underline ml-1"
                                >
                                    如何开启？
                                </a>
                            </li>
                        </ul>
                        <div class="flex flex-row gap-4 mt-6">
                            <x-button class="px-6" @click="currentStepIdx--">上一步</x-button>
                            <x-button
                                toggled
                                class="px-6"
                                @click="currentStepIdx++"
                                :disabled="!satisfiesPrequisites(specs, containerSpecs)"
                            >
                                下一步
                            </x-button>
                        </div>
                    </div>

                    <!-- Install Location -->
                    <div v-if="currentStep.id === StepID.INSTALL_LOCATION" class="step-block">
                        <h1 class="text-3xl font-semibold">{{ currentStep.title }}</h1>
                        <p class="text-lg text-gray-400">
                            Choose where you want to install WinBoat. Files related to the Windows virtual machine will
                            be stored in this location.
                        </p>
                        <p class="text-lg text-gray-400">
                            Make sure you have at least {{ MIN_DISK_GB }}GB of disk space available in the selected
                            location.
                        </p>

                        <div class="flex flex-row items-center mt-4">
                            <x-input
                                id="install-location"
                                type="text"
                                placeholder="Select Install Location"
                                readonly
                                :value="installFolder"
                                class="!max-w-full w-[300px] rounded-r-none"
                            >
                                <x-icon href="#folder"></x-icon>
                                <x-label>/your/install/folder</x-label>
                            </x-input>
                            <x-button class="!rounded-l-none" toggled @click="selectInstallFolder">
                                {{ installFolder ? "Change" : "Select" }}
                            </x-button>
                        </div>

                        <div id="install-folder-errors" class="h-[4rem] text-red-400 text-sm font-semibold space-y-1">
                            <div v-for="error in installFolderErrors" :key="error">
                                <Icon icon="line-md:alert" class="inline size-4 -translate-y-0.5"></Icon>
                                {{ error }}
                            </div>
                            <div
                                v-if="installFolder && !installFolderErrors?.length"
                                class="text-green-400 font-semibold"
                            >
                                <Icon icon="line-md:check-all" class="inline size-4 -translate-y-0.5"></Icon>
                                Valid install folder
                            </div>
                        </div>

                        <div class="flex flex-row gap-4 mt-6">
                            <x-button class="px-6" @click="currentStepIdx--">上一步</x-button>
                            <x-button
                                toggled
                                class="px-6"
                                :disabled="!installFolder || installFolderErrors?.length"
                                @click="currentStepIdx++"
                            >
                                下一步
                            </x-button>
                        </div>
                    </div>

                    <!-- Windows Configuration -->
                    <div v-if="currentStep.id === StepID.WINDOWS_CONFIG" class="step-block">
                        <h1 class="text-3xl font-semibold">{{ currentStep.title }}</h1>
                        <p class="text-lg text-gray-400">
                            Pick the version of Windows you want to install, and the language you'd like to use.
                        </p>
                        <p class="text-lg text-gray-400">
                            You can only change these settings now. Once the installation is complete, you will not be
                            able to change them unless you reinstall.
                        </p>
                        <div>
                            <label for="select-edition" class="text-sm mb-4 text-neutral-400">Select Edition</label>
                            <x-select
                                id="select-edition"
                                @change="(e: any) => (windowsVersion = e.detail.newValue)"
                                class="w-64"
                                :disabled="!!customIsoPath"
                            >
                                <x-menu>
                                    <x-menuitem
                                        v-for="(version, key) in WINDOWS_VERSIONS"
                                        :key="key"
                                        :value="key"
                                        :toggled="windowsVersion === key"
                                        v-show="key !== 'custom'"
                                    >
                                        <x-label>{{ version }}</x-label>
                                    </x-menuitem>
                                </x-menu>
                            </x-select>
                        </div>
                        <div>
                            <label for="select-language" class="text-sm mb-4 text-neutral-400">Select Language</label>
                            <x-select
                                id="select-language"
                                @change="(e: any) => (windowsLanguage = e.detail.newValue)"
                                class="w-64"
                                :disabled="!!customIsoPath"
                            >
                                <x-menu @change="(e: any) => (windowsLanguage = e.detail.newValue)">
                                    <x-menuitem
                                        v-for="(language, languageWithBanner) in WINDOWS_LANGUAGES"
                                        :key="language"
                                        :value="language"
                                        :toggled="windowsLanguage === language"
                                        :disabled="['German', 'Hungarian'].includes(language)"
                                    >
                                        <x-label>
                                            {{ languageWithBanner }}
                                            <span
                                                v-if="['German', 'Hungarian'].includes(language)"
                                                class="text-red-400"
                                            >
                                                (Broken, use Language Pack)
                                            </span>
                                        </x-label>
                                    </x-menuitem>
                                </x-menu>
                            </x-select>
                        </div>
                        <div class="mt-4">
                            <div class="flex flex-col gap-2">
                                <label for="select-iso" class="text-xs text-neutral-400">Custom ISO (Optional)</label>
                                <div class="flex items-center gap-2">
                                    <x-button id="select-iso" class="text-sm w-64" @click="selectIsoFile">
                                        Select ISO File
                                    </x-button>
                                    <span class="relative group">
                                        <Icon icon="line-md:alert" class="text-neutral-400 cursor-pointer" />
                                        <span
                                            class="absolute bottom-5 left-[-160px] z-50 w-[320px] bg-neutral-900 text-xs text-gray-300 rounded-lg shadow-lg px-3 py-2 hidden group-hover:block transition-opacity duration-200 pointer-events-none"
                                        >
                                            We offer you the possibility of using a custom Windows ISO for your
                                            convenience, however we can't provide any support if your custom ISO breaks
                                            or certain features within WinBoat stop working.
                                        </span>
                                    </span>
                                </div>
                                <span
                                    v-if="customIsoPath"
                                    class="text-xs text-gray-400 font-semibold flex items-center gap-2"
                                >
                                    Selected: {{ customIsoFileName }}
                                    <x-button size="small" class="ml-2 px-2 py-0" @click="deselectIsoFile"
                                        >Remove</x-button
                                    >
                                </span>
                            </div>
                        </div>
                        <div class="flex flex-row gap-4 mt-6" :class="{ '!mt-2': customIsoPath }">
                            <x-button class="px-6" @click="currentStepIdx--">Back</x-button>
                            <x-button toggled class="px-6" @click="currentStepIdx++">Next</x-button>
                        </div>
                    </div>

                    <!-- User Configuration -->
                    <div v-if="currentStep.id === StepID.USER_CONFIG" class="step-block">
                        <h1 class="text-3xl font-semibold">{{ currentStep.title }}</h1>
                        <p class="text-lg text-gray-400">配置 Windows 的用户名和密码。</p>

                        <p class="text-lg text-gray-400">
                            这些凭据将用于登录 Windows 虚拟机并通过远程桌面协议 (RDP) 访问它。除非重新安装，否则您以后无法更改这些设置。
                        </p>

                        <div class="flex flex-row gap-4">
                            <div class="flex flex-col gap-4">
                                <div>
                                    <label for="select-username" class="text-sm mb-4 text-neutral-400">用户名</label>
                                    <x-input
                                        id="select-username"
                                        class="w-64 max-w-64"
                                        type="text"
                                        minlength="2"
                                        maxlength="32"
                                        required
                                        size="large"
                                        :value="username"
                                        @input="(e: any) => (username = e.target.value)"
                                    >
                                        <x-icon href="#person"></x-icon>
                                        <x-label>名称</x-label>
                                    </x-input>
                                </div>

                                <div>
                                    <label for="select-password" class="text-sm mb-4 text-neutral-400">密码</label>
                                    <x-input
                                        id="select-password"
                                        class="w-64 max-w-64"
                                        type="password"
                                        minlength="2"
                                        maxlength="64"
                                        required
                                        size="large"
                                        :value="password"
                                        @input="(e: any) => (password = e.target.value)"
                                    >
                                        <x-icon href="#lock"></x-icon>
                                        <x-label>密码</x-label>
                                    </x-input>
                                </div>

                                <div>
                                    <label for="confirm-password" class="text-sm mb-4 text-neutral-400">
                                        确认密码
                                    </label>
                                    <x-input
                                        id="confirm-password"
                                        class="w-64 max-w-64"
                                        type="password"
                                        minlength="2"
                                        maxlength="64"
                                        required
                                        size="large"
                                        :value="confirmPassword"
                                        @input="(e: any) => (confirmPassword = e.target.value)"
                                    >
                                        <x-icon href="#lock" />
                                        <x-label>确认密码</x-label>
                                    </x-input>
                                </div>
                            </div>

                            <div class="flex flex-col gap-4 mt-6">
                                <div id="username-errors" class="h-[4rem] text-red-400 text-sm font-semibold space-y-1">
                                    <div v-for="error in usernameErrors" :key="error">
                                        <Icon icon="line-md:alert" class="inline size-4 -translate-y-0.5"></Icon>
                                        {{ error }}
                                    </div>
                                </div>
                                <div id="password-errors" class="text-red-400 text-sm font-semibold space-y-1">
                                    <div v-for="error in passwordErrors" :key="error">
                                        <Icon icon="line-md:alert" class="inline size-4 -translate-y-0.5"></Icon>
                                        {{ error }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-row gap-4 mt-6">
                            <x-button class="px-6" @click="currentStepIdx--">上一步</x-button>
                            <x-button
                                :disabled="usernameErrors.length || passwordErrors.length"
                                toggled
                                class="px-6"
                                @click="currentStepIdx++"
                            >
                                下一步
                            </x-button>
                        </div>
                    </div>

                    <!-- Hardware Configuration -->
                    <div v-if="currentStep.id === StepID.HARDWARE_CONFIG" class="step-block">
                        <h1 class="text-3xl font-semibold">{{ currentStep.title }}</h1>
                        <p class="text-lg text-gray-400">
                            WinBoat 利用容器化的 KVM 虚拟机来运行 Windows 应用程序。请配置虚拟机的硬件设置。
                        </p>

                        <p class="text-lg text-gray-400">
                            建议不要分配超过一半的系统资源给 Windows。如果需要，您以后可以更改这些设置。
                        </p>

                        <div class="flex flex-col gap-6">
                            <div>
                                <label for="select-cpu-cores" class="text-sm text-neutral-400">选择 CPU 核心</label>
                                <div class="flex flex-row gap-4 items-center">
                                    <x-slider
                                        id="select-cpu-cores"
                                        @change="(e: any) => (cpuCores = Number(e.target.value))"
                                        class="w-[50%]"
                                        :value="cpuCores"
                                        :min="MIN_CPU_CORES"
                                        :max="specs.cpuCores"
                                        step="1"
                                        ticks
                                    />
                                    <x-label>{{ cpuCores }} 核心</x-label>
                                </div>
                            </div>

                            <div>
                                <label for="select-ram" class="text-sm text-neutral-400">
                                    选择内存
                                    <span
                                        v-if="memoryInfo.availableGB < ramGB"
                                        class="relative group text-white font-bold text-xs rounded-full bg-red-600 px-2 pb-0.5 ml-2 hover:bg-red-700 transition"
                                    >
                                        <Icon icon="line-md:alert" class="inline size-4 -translate-y-0.5" />
                                        警告
                                        <span
                                            class="absolute bottom-5 right-[-160px] z-50 w-[320px] bg-neutral-900 text-xs text-gray-300 rounded-lg shadow-lg px-3 py-2 hidden group-hover:block transition-opacity duration-200 pointer-events-none"
                                        >
                                            You don't have enough unused memory available to allocate the requested
                                            amount of RAM. You currently have ~{{ memoryInfo.availableGB }} GB of unused
                                            memory available. If you continue with this amount of RAM, the container
                                            will likely crash.
                                        </span>
                                    </span>
                                </label>
                                <div class="flex flex-row gap-4 items-center">
                                    <x-slider
                                        id="select-ram"
                                        @change="(e: any) => (ramGB = Number(e.target.value))"
                                        class="w-[50%]"
                                        :value="ramGB"
                                        :min="MIN_RAM_GB"
                                        :max="specs.ramGB"
                                        step="1"
                                    />
                                    <x-label>{{ ramGB }} GB</x-label>
                                </div>
                            </div>

                            <div>
                                <label for="select-disk" class="text-sm text-neutral-400">
                                    选择磁盘大小
                                    <span
                                        v-if="(installFolderDiskSpaceGB || 0) - diskSpaceGB < 5"
                                        class="relative group text-white font-bold text-xs rounded-full bg-red-600 px-2 pb-0.5 ml-2 hover:bg-red-700 transition"
                                    >
                                        <Icon icon="line-md:alert" class="inline size-4 -translate-y-0.5"></Icon>
                                        警告
                                        <span
                                            class="absolute bottom-5 right-[-160px] z-50 w-[320px] bg-neutral-900 text-xs text-gray-300 rounded-lg shadow-lg px-3 py-2 hidden group-hover:block transition-opacity duration-200 pointer-events-none"
                                        >
                                            You're about to allocate most of your remaining disk space with less than
                                            5GB in excess. You currently have ~{{ installFolderDiskSpaceGB }} GB of disk
                                            space available for the drive corresponding to {{ installFolder }}. If you
                                            continue with this disk size, you may run out of space and encounter
                                            unexpected issues.
                                        </span>
                                    </span>
                                </label>
                                <div class="flex flex-row gap-4 items-center">
                                    <x-slider
                                        id="select-disk"
                                        @change="(e: any) => (diskSpaceGB = Number(e.target.value))"
                                        class="w-[50%]"
                                        :value="diskSpaceGB"
                                        :min="MIN_DISK_GB"
                                        :max="installFolderDiskSpaceGB || 0"
                                        step="8"
                                    />
                                    <x-label>{{ diskSpaceGB }} GB</x-label>
                                </div>
                            </div>

                            <div v-if="gpuList.length > 0">
                                <label for="select-gpu" class="text-sm text-neutral-400">选择显卡加速 (3D)</label>
                                <div class="flex flex-row gap-4 items-center">
                                    <x-select
                                        id="select-gpu"
                                        @change="(e: any) => (gpuDevice = e.detail.newValue)"
                                        class="w-[50%]"
                                    >
                                        <x-menu>
                                            <x-menuitem value="disabled" :toggled="gpuDevice === 'disabled'">
                                                <x-label>禁用显卡加速</x-label>
                                            </x-menuitem>
                                            <x-menuitem
                                                v-for="gpu in gpuList"
                                                :key="gpu.id"
                                                :value="gpu.path"
                                                :toggled="gpuDevice === gpu.path"
                                            >
                                                <x-label>{{ gpu.name }}</x-label>
                                            </x-menuitem>
                                        </x-menu>
                                    </x-select>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-row gap-4 mt-6">
                            <x-button class="px-6" @click="currentStepIdx--">上一步</x-button>
                            <x-button toggled class="px-6" @click="currentStepIdx++">下一步</x-button>
                        </div>
                    </div>

                    <!-- Folder Sharing -->
                    <div v-if="currentStep.id === StepID.SHOULD_SHARE_HOME_FOLDER" class="step-block">
                        <h1 class="text-3xl font-semibold">文件夹共享</h1>
                        <p class="text-lg text-gray-400">
                            WinBoat 允许您将 Linux 系统中的文件夹与 Windows 虚拟机共享。您可以选择是否启用此功能并选择要共享的文件夹。
                        </p>
                        <p class="text-lg text-gray-400">
                            <b>⚠️ 警告：</b>
                            共享文件夹会使您的 Linux 文件面临 Windows 特有的恶意软件和病毒的风险。
                            只有在您了解所涉及的风险时才启用此功能。始终小心您在 Windows 中下载和打开的文件。
                        </p>

                        <x-checkbox
                            class="my-4"
                            @toggle="folderSharing = !folderSharing"
                            :toggled="folderSharing"
                        >
                            <x-label><strong>启用文件夹共享</strong></x-label>
                            <x-label class="text-gray-400">
                                通过勾选此框，您表示知晓上述风险
                            </x-label>
                        </x-checkbox>

                        <div v-if="folderSharing" class="flex flex-col gap-2 my-4">
                            <label class="text-sm text-neutral-400">Shared Folder Location</label>
                            <div class="flex flex-row items-center">
                                <x-input
                                    type="text"
                                    placeholder="Select Folder to Share"
                                    readonly
                                    :value="sharedFolderPath"
                                    class="!max-w-full w-[300px] rounded-r-none"
                                >
                                    <x-icon href="#folder"></x-icon>
                                    <x-label>/your/shared/folder</x-label>
                                </x-input>
                                <x-button class="!rounded-l-none" toggled @click="selectSharedFolder">
                                    {{ sharedFolderPath ? "Change" : "Select" }}
                                </x-button>
                            </div>
                        </div>

                        <div class="flex flex-row gap-4 mt-6">
                            <x-button class="px-6" @click="currentStepIdx--">上一步</x-button>
                            <x-button
                                toggled
                                class="px-6"
                                @click="currentStepIdx++"
                                :disabled="folderSharing && !sharedFolderPath"
                            >
                                下一步
                            </x-button>
                        </div>
                    </div>

                    <!-- Review -->
                    <div v-if="currentStep.id === StepID.REVIEW" class="step-block">
                        <h1 class="text-3xl font-semibold">{{ currentStep.title }}</h1>
                        <p class="text-lg text-gray-400">
                            请检查您为 WinBoat 安装选择的设置。如果一切看起来都正确，请点击“安装”开始。
                        </p>

                        <div class="bg-neutral-800 p-6 rounded-lg flex flex-col gap-4">
                            <h2 class="text-xl font-medium text-white mt-0 mb-2">您的配置</h2>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="flex flex-col">
                                    <span class="text-sm text-gray-400">容器运行时</span>
                                    <span class="text-base text-white">{{ containerRuntime }}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-sm text-gray-400">语言</span>
                                    <span class="text-base text-white">{{ windowsLanguage }}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-sm text-gray-400">Windows 版本</span>
                                    <span class="text-base text-white">{{ WINDOWS_VERSIONS[windowsVersion] }}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-sm text-gray-400">CPU 核心</span>
                                    <span class="text-base text-white">{{ cpuCores }} 核心</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-sm text-gray-400">内存</span>
                                    <span class="text-base text-white">{{ ramGB }} GB</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-sm text-gray-400">磁盘大小</span>
                                    <span class="text-base text-white">{{ diskSpaceGB }} GB</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-sm text-gray-400">用户名</span>
                                    <span class="text-base text-white">{{ username }}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-sm text-gray-400">安装位置</span>
                                    <span class="text-base text-white">{{ installFolder }}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-sm text-gray-400">显卡加速</span>
                                    <span class="text-base text-white">
                                        {{ gpuDevice === 'disabled' ? '已禁用' : (gpuList.find(g => g.path === gpuDevice)?.name || gpuDevice) }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-row gap-4 mt-6">
                            <x-button class="px-6" @click="currentStepIdx--">上一步</x-button>
                            <x-button
                                toggled
                                class="px-6"
                                @click="
                                    currentStepIdx++;
                                    install();
                                "
                            >
                                安装
                            </x-button>
                        </div>
                    </div>

                    <!-- Installation -->
                    <div v-if="currentStep.id === StepID.INSTALL" class="step-block">
                        <h1 class="text-3xl font-semibold">安装</h1>
                        <p class="text-lg text-gray-400 text-justify">
                            WinBoat 正在安装 Windows。请耐心等待，这可能需要长达一小时的时间。在此期间，您可以喝杯咖啡并在浏览器中查看状态
                            <span v-if="linkableInstallSteps.includes(installState)">
                                <a :href="`http://127.0.0.1:${vncPort}`" @click="openAnchorLink">在浏览器中查看</a>。
                            </span>
                            <span v-else>
                                进度详见
                                <div
                                    style="animation-duration: 3s!important;"
                                    class="ml-1 inline-block relative text-transparent rounded-md bg-neutral-700 animate-pulse select-none"
                                >
                                    在浏览器中查看
                                    <Icon icon="eos-icons:three-dots-loading" class="pointer-events-none absolute top-0 left-[50%] size-16 text-violet-400 -translate-x-[50%] -translate-y-[27.5%]"></Icon>
                                </div>
                            </span>
                        </p>

                        <!-- Installing -->
                        <div
                            v-if="
                                installState !== InstallStates.COMPLETED && installState !== InstallStates.INSTALL_ERROR
                            "
                            class="flex flex-col h-full items-center justify-center gap-4"
                        >
                            <x-throbber class="size-16"></x-throbber>
                            <x-label
                                v-if="installState !== InstallStates.MONITORING_PREINSTALL"
                                class="text-lg text-gray-400 text-center"
                            >
                                {{ installState }}...
                            </x-label>
                            <x-label v-else class="text-lg text-gray-400 text-center">
                                {{ preinstallMsg }}
                            </x-label>
                        </div>

                        <!-- Error -->
                        <div
                            v-if="installState === InstallStates.INSTALL_ERROR"
                            class="flex flex-col h-full items-center justify-center gap-4"
                        >
                            <Icon icon="line-md:alert" class="size-16 text-red-500"></Icon>
                            <x-label class="text-lg text-gray-400 text-center">
                                安装 Windows 时发生错误。请检查
                                <span class="font-mono bg-neutral-700 rounded-md px-0.5">~/.winboat</span>
                                中的日志，并在终端中验证
                                <span class="font-mono bg-neutral-700 rounded-md px-0.5"
                                    >{{ installManager!.container.executableAlias }} logs WinBoat</span
                                >
                                以获取更多信息。
                            </x-label>
                            <x-label class="text-lg text-gray-400 text-center">
                                要重置并重试，请遵循
                                <a href="https://rentry.org/winboat_retry_install" @click="openAnchorLink">这些</a>
                                说明。
                            </x-label>
                        </div>

                        <!-- Completed -->
                        <div
                            v-if="installState === InstallStates.COMPLETED"
                            class="flex flex-col h-full items-center justify-center gap-4"
                        >
                            <Icon icon="line-md:confirm-circle" class="size-16 text-green-500"></Icon>
                            <x-label class="text-lg text-gray-400 text-center">
                                Windows 已成功安装！
                            </x-label>
                            <x-button @click="$router.push('/home')">完成</x-button>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>
        <div class="absolute gradient-bg left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] -z-10"></div>
    </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { computedAsync } from "@vueuse/core";
import { InstallConfiguration, Specs } from "../../types";
import { getSpecs, getMemoryInfo, defaultSpecs, satisfiesPrequisites, type MemoryInfo } from "../lib/specs";
import { WINDOWS_VERSIONS, WINDOWS_LANGUAGES, type WindowsVersionKey } from "../lib/constants";
import { InstallManager, InstallStates } from "../lib/install";
import { openAnchorLink } from "../utils/openLink";
import license from "../assets/LICENSE.txt?raw";
import {
    ContainerRuntimes,
    DockerSpecs,
    PodmanSpecs,
    getContainerSpecs,
} from "../lib/containers/common";
import { WinboatConfig } from "../lib/config";
import { getGPUList, type GPUInfo } from "../lib/gpu";

const path: typeof import("path") = require("node:path");
const electron: typeof import("electron") = require("electron").remote || require("@electron/remote");
const fs: typeof import("fs") = require("node:fs");
const os: typeof import("os") = require("node:os");
const checkDiskSpace: typeof import("check-disk-space").default = require("check-disk-space").default;

type Step = {
    id: string;
    title: string;
    icon: string;
};

enum StepID {
    WELCOME = "STEP_WELCOME",
    PREREQUISITES = "STEP_PREREQUISITES",
    LICENSE = "STEP_LICENSE",
    INSTALL_LOCATION = "STEP_INSTALL_LOCATION",
    WINDOWS_CONFIG = "STEP_WINDOWS_CONFIG",
    HARDWARE_CONFIG = "STEP_HARDWARE_CONFIG",
    USER_CONFIG = "STEP_USER_CONFIG",
    SHOULD_SHARE_HOME_FOLDER = "STEP_SHOULD_SHARE_HOME_FOLDER",
    REVIEW = "STEP_OVERVIEW",
    INSTALL = "STEP_INSTALL",
    FINISH = "STEP_FINISH",
}

const steps: Step[] = [
    {
        id: StepID.WELCOME,
        title: "欢迎使用 WinBoat",
        icon: "tdesign:wave-bye-filled",
    },
    {
        id: StepID.LICENSE,
        title: "许可协议",
        icon: "line-md:text-box-multiple",
    },
    {
        id: StepID.PREREQUISITES,
        title: "前置条件",
        icon: "line-md:check-all",
    },
    {
        id: StepID.INSTALL_LOCATION,
        title: "安装位置",
        icon: "line-md:folder-arrow-down-filled",
    },
    {
        id: StepID.WINDOWS_CONFIG,
        title: "配置 Windows",
        icon: "mage:microsoft-windows",
    },
    {
        id: StepID.USER_CONFIG,
        title: "用户配置",
        icon: "line-md:account",
    },
    {
        id: StepID.HARDWARE_CONFIG,
        title: "硬件配置",
        icon: "famicons:hardware-chip-outline",
    },
    {
        id: StepID.SHOULD_SHARE_HOME_FOLDER,
        title: "文件夹共享",
        icon: "line-md:link",
    },
    {
        id: StepID.REVIEW,
        title: "检查",
        icon: "solar:pin-list-bold",
    },
    {
        id: StepID.INSTALL,
        title: "安装",
        icon: "line-md:downloading-loop",
    },
    {
        id: StepID.FINISH,
        title: "完成",
        icon: "bx:bxs-check-circle",
    },
];

const MIN_CPU_CORES = 1;
const MIN_RAM_GB = 2;
const MIN_DISK_GB = 32;
const $router = useRouter();
const specs = ref<Specs>({ ...defaultSpecs });
const currentStepIdx = ref(0);
const currentStep = computed(() => steps[currentStepIdx.value]);
const installFolder = ref(path.join(os.homedir(), "winboat"));
const windowsVersion = ref<WindowsVersionKey>("11");
const windowsLanguage = ref("English");
const customIsoPath = ref("");
const customIsoFileName = ref("");
const cpuCores = ref(2);
const ramGB = ref(4);
const memoryInfo = ref<MemoryInfo>({ totalGB: 0, availableGB: 0 });
const memoryInterval = ref<NodeJS.Timeout | null>(null);
const diskSpaceGB = ref(32);
const username = ref("winboat");
const password = ref("");
const confirmPassword = ref("");
const folderSharing = ref(false);
const sharedFolderPath = ref("");
const installState = ref<InstallStates>(InstallStates.IDLE);
const preinstallMsg = ref("");
const containerRuntime = ref(ContainerRuntimes.DOCKER);
const vncPort = ref(8006);
const gpuList = ref<GPUInfo[]>([]);
const gpuDevice = ref("disabled");
// These are the install steps where the container is actually up and running
const linkableInstallSteps = [ InstallStates.MONITORING_PREINSTALL, InstallStates.INSTALLING_WINDOWS, InstallStates.COMPLETED ];

let installManager: InstallManager | null;

onMounted(async () => {
    specs.value = await getSpecs();
    console.log("Specs", specs.value);

    memoryInfo.value = await getMemoryInfo();
    memoryInterval.value = setInterval(async () => {
        memoryInfo.value = await getMemoryInfo();
    }, 1000);
    console.log("Memory Info", memoryInfo.value);

    username.value = os.userInfo().username;
    console.log("Username", username.value);

    // Set default shared folder path to home directory
    sharedFolderPath.value = os.homedir();

    gpuList.value = await getGPUList();
    console.log("GPU List", gpuList.value);
});

onUnmounted(() => {
    if (memoryInterval.value) {
        clearInterval(memoryInterval.value);
    }
});

// Watch for when folder sharing is enabled and set default path
watch(folderSharing, (newValue) => {
    if (newValue && !sharedFolderPath.value) {
        sharedFolderPath.value = os.homedir();
    }
});

const containerSpecs = computedAsync(async () => {
    return await getContainerSpecs(containerRuntime.value);
});

function containerInstalled(containerSpecs: DockerSpecs | PodmanSpecs | undefined) {
    if (!containerSpecs) return false;
    if ("dockerInstalled" in containerSpecs) return containerSpecs.dockerInstalled;
    if ("podmanInstalled" in containerSpecs) return containerSpecs.podmanInstalled;
    return false;
}

const usernameErrors = computed(() => {
    let errors: string[] = [];

    // At least 2 characters
    if (username.value.length < 2) {
        errors.push("长度必须至少为 2 个字符");
    }

    // Only alphanumeric characters are allowed
    if (!/^[a-zA-Z0-9]+$/.test(username.value)) {
        errors.push("只能包含字母数字字符");
    }

    return errors;
});

const passwordErrors = computed(() => {
    let errors: string[] = [];

    // Must match confirm password
    if (password.value !== confirmPassword.value) {
        errors.push("密码不匹配");
    }

    // Only alphanumeric characters are allowed
    if (!/^[a-zA-Z0-9]+$/.test(password.value)) {
        errors.push("只能包含字母数字字符");
    }

    // At least 4 characters
    if (password.value.length < 4) {
        errors.push("长度必须至少为 4 个字符");
    }

    return errors;
});

function selectIsoFile() {
    electron.dialog
        .showOpenDialog({
            title: "Select ISO File",
            filters: [
                {
                    name: "ISO Files",
                    extensions: ["iso"],
                },
            ],
            properties: ["openFile"],
        })
        .then(result => {
            if (!result.canceled && result.filePaths.length > 0) {
                customIsoPath.value = result.filePaths[0];
                customIsoFileName.value = path.basename(result.filePaths[0]);
                windowsLanguage.value = "English"; // Language can't be custom
                windowsVersion.value = "custom";
                console.log("ISO path updated:", customIsoPath.value);
            }
        });
}

function deselectIsoFile() {
    customIsoPath.value = "";
    customIsoFileName.value = "";
    windowsLanguage.value = "English";
    windowsVersion.value = "11";
}

function selectInstallFolder() {
    electron.dialog
        .showOpenDialog({
            title: "Select Install Folder",
            properties: ["openDirectory", "createDirectory"],
        })
        .then(result => {
            if (!result.canceled && result.filePaths.length > 0) {
                const selectedPath = result.filePaths[0];
                const finalPath = path.join(selectedPath, "winboat");
                console.log("Install path selected:", finalPath);
                installFolder.value = finalPath;
            }
        });
}

const installFolderErrors = computedAsync(async () => {
    let errors: string[] = [];

    if (!installFolder.value) {
        errors.push("Please select an install location");
        return errors; // <- The rest shouldn't be ran if no path is selected
    }

    // Path without /winboat
    const parentPath = path.dirname(installFolder.value);
    console.log("Parent path", parentPath);

    // Check if path is writable
    try {
        fs.accessSync(parentPath, fs.constants.W_OK);
    } catch (err) {
        console.error(err);
        errors.push("The selected install location is not writable");
    }

    // Check if we have enough disk space
    const diskSpace = await checkDiskSpace(parentPath);
    const freeGB = Math.floor(diskSpace.free / (1024 * 1024 * 1024));
    if (freeGB < MIN_DISK_GB) {
        errors.push(
            `Not enough disk space available. At least ${MIN_DISK_GB} GB is required, but only ${freeGB} GB is available.`,
        );
    }

    return errors;
});

const installFolderDiskSpaceGB = computedAsync(async () => {
    if (!installFolder.value) return 0;

    const parentPath = path.dirname(installFolder.value);
    const diskSpace = await checkDiskSpace(parentPath);
    const freeGB = Math.floor(diskSpace.free / (1024 * 1024 * 1024));
    return freeGB;
});

function selectSharedFolder() {
    electron.dialog
        .showOpenDialog({
            title: "Select Folder to Share",
            properties: ["openDirectory"],
            defaultPath: sharedFolderPath.value || os.homedir(),
        })
        .then(result => {
            if (!result.canceled && result.filePaths.length > 0) {
                sharedFolderPath.value = result.filePaths[0];
            }
        });
}

function install() {
    const installConfig: InstallConfiguration = {
        windowsVersion: windowsVersion.value,
        windowsLanguage: windowsLanguage.value,
        cpuCores: cpuCores.value,
        ramGB: ramGB.value,
        installFolder: installFolder.value,
        diskSpaceGB: diskSpaceGB.value,
        username: username.value,
        password: password.value,
        sharedFolderPath: folderSharing.value ? sharedFolderPath.value : undefined,
        gpuDevice: gpuDevice.value,
        ...(customIsoPath.value ? { customIsoPath: customIsoPath.value } : {}),
        container: containerRuntime.value, // Hardcdde for now
    };

    const wbConfig = WinboatConfig.getInstance(); // Create winboat config.
    wbConfig.config.containerRuntime = containerRuntime.value; // Save which runtime to use.

    installManager = new InstallManager(installConfig);

    // Begin installation and attach event listeners
    installManager.emitter.on("stateChanged", newState => {
        installState.value = newState;
        console.log("Install state changed", newState);
    });

    installManager.emitter.on("preinstallMsg", msg => {
        preinstallMsg.value = msg;
        console.log("Preinstall msg", msg);
    });

    installManager.emitter.on("vncPortChanged", port => {
        vncPort.value = port;
    });

    installManager.install();
}
</script>

<style>
.gradient-bg {
    width: 90vw;
    height: 80vh;
    border-radius: 10px;
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
    filter: blur(50px);
}

.step-block {
    @apply flex flex-col gap-4 h-full justify-center;
}

.flex p {
    margin-top: 5px;
    margin-bottom: 5px;
}

/* Transitions */
.bounce-enter-active {
    animation: bounce-in 0.4s;
}
.bounce-leave-active {
    animation: bounce-in 0.4s reverse;
}

@keyframes bounce-in {
    0% {
        transform: scale(0.7) translateY(-20%);
        opacity: 0%;
    }
    100% {
        transform: scale(1) translateY(0);
    }
}

.bouncedown-enter-active {
    animation: bouncedown-in 0.5s;
}
.bouncedown-leave-active {
    animation: bouncedown-in 0.5s reverse;
}
@keyframes bouncedown-in {
    0% {
        transform: scale(0.7) translateY(-20%);
        opacity: 0%;
    }
    100% {
        transform: scale(1) translateY(0);
    }
}
</style>
