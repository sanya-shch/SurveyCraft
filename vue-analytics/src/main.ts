import { createApp } from "vue";
import AnalyticsApp from "./AnalyticsApp.vue";

createApp(AnalyticsApp, {
  formId: import.meta.env.VITE_DEV_FORM_ID || "",
  apiBaseUrl: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
}).mount("#app");
