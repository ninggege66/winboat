import { createMemoryHistory, createRouter, RouteRecordRaw } from "vue-router";

import Home from "./views/Home.vue";
import SetupUI from "./views/SetupUI.vue";
import Apps from "./views/Apps.vue";
import About from "./views/About.vue";
import Blank from "./views/Blank.vue";
import Config from "./views/Config.vue";
import Migration from "./views/Migration.vue";
import Android from "./views/Android.vue";

export const routes: RouteRecordRaw[] = [
    { path: "/", name: "Loading", component: Blank, meta: { label: "加载中", icon: "line-md:loading-loop" } },
    { path: "/home", name: "Home", component: Home, meta: { label: "主页", icon: "fluent:home-32-filled" } },
    { path: "/android", name: "Android", component: Android, meta: { label: "安卓", icon: "mdi:android" } },
    { path: "/migration", name: "Migration", component: Migration, meta: { label: "迁移", icon: "fluent:home-32-filled" } },
    { path: "/setup", name: "SetupUI", component: SetupUI, meta: { label: "设置", icon: "fluent-mdl2:install-to-drive" } },
    { path: "/apps", name: "Apps", component: Apps, meta: { label: "应用", icon: "fluent:apps-32-filled" } },
    { path: "/configuration", name: "Config", component: Config, meta: { label: "配置", icon: "icon-park-outline:config" } },
    { path: "/about", name: "About", component: About, meta: { label: "关于", icon: "fluent:info-32-filled" } },
];

export const router = createRouter({
    history: createMemoryHistory(),
    routes,
});
