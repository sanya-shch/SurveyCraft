declare module "vue_analytics/AnalyticsApp" {
  import type { Component } from "vue";
  const component: Component;
  export default component;
}

declare module "vue_analytics/i18n" {
  import type { I18n } from "vue-i18n";
  export const createAnalyticsI18n: (initialLocale?: string) => I18n;
}
