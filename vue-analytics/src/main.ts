import { createApp } from "vue";
import AnalyticsApp from "./AnalyticsApp.vue";

const FORM_ID_FROM_PATH = window.location.pathname.match(/\/analytics\/([^/]+)/)?.[1];
const formId = FORM_ID_FROM_PATH || import.meta.env.VITE_DEV_FORM_ID || "";
const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const appRoot = document.getElementById("app")!;

if (!formId) {
  appRoot.innerHTML = `
    <div style="padding:40px;font-family:ui-sans-serif,system-ui,sans-serif;color:#475569;max-width:520px;margin:0 auto">
      <h1 style="font-size:18px;color:#1e293b">formId не заданий</h1>
      <p style="font-size:13px;line-height:1.6">
        Це standalone dev-режим vue-analytics (прев'ю компонента, не повноцінна сторінка з роутером).
        Щоб побачити реальні дані, або відкрий:<br/>
        <code>http://localhost:5174/analytics/&lt;formId&gt;</code><br/>
        або встанови <code>VITE_DEV_FORM_ID</code> у <code>vue-analytics/.env</code>.<br/><br/>
        Для звичайного використання (не dev-прев'ю) відкривай аналітику
        через React-хост: <code>http://localhost:5173/analytics/&lt;formId&gt;</code>.
      </p>
    </div>
  `;
} else {
  createApp(AnalyticsApp, { formId, apiBaseUrl }).mount(appRoot);
}
