<script setup lang="ts">

import { ref } from "vue";
import { useFormAnalytics } from "./composables/useFormAnalytics";
import { useFormPaths } from "./composables/useFormPaths";
import { useQuestionAnalytics } from "./composables/useQuestionAnalytics";
import QuestionOverviewCard from "./components/QuestionOverviewCard.vue";
import PathsDiagram from "./components/PathsDiagram.vue";
import QuestionDetailPanel from "./components/QuestionDetailPanel.vue";

const props = defineProps<{
  formId: string;
  apiBaseUrl?: string;
}>();

const apiBaseUrl = props.apiBaseUrl || "http://localhost:5001/api";

const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useFormAnalytics(
  apiBaseUrl,
  props.formId,
);
const { data: paths, isLoading: pathsLoading, error: pathsError } = useFormPaths(apiBaseUrl, props.formId);
const { data: detail, isLoading: detailLoading, error: detailError, load: loadDetail } =
  useQuestionAnalytics(apiBaseUrl, props.formId);

const activeQuestionId = ref<string | null>(null);

const openDetail = (questionId: string) => {
  activeQuestionId.value = questionId;
  loadDetail(questionId);
};
const closeDetail = () => {
  activeQuestionId.value = null;
};
</script>

<template>
  <div class="analytics-root">
    <header class="header">
      <div>
        <h1 class="page-title">Аналітика форми</h1>
        <p class="page-subtitle">Vue 3 · завантажено через Module Federation</p>
      </div>
      <div v-if="analytics" class="total-badge">{{ analytics.totalResponses }} відповідей</div>
    </header>

    <section v-if="analyticsLoading" class="state-msg">Завантаження аналітики...</section>
    <section v-else-if="analyticsError" class="state-msg state-msg--error">{{ analyticsError }}</section>

    <template v-else-if="analytics">
      <section v-if="analytics.totalResponses === 0" class="empty-state">
        Ще немає жодної відповіді на цю форму.
      </section>

      <template v-else>
        <section class="cards-grid">
          <QuestionOverviewCard
            v-for="q in analytics.questions"
            :key="q.id"
            :question="q"
            :total-responses="analytics.totalResponses"
            @open-detail="openDetail"
          />
        </section>

        <section class="paths-section">
          <h2 class="section-title">Шляхи проходження</h2>
          <p class="section-hint">
            Популярність гілок серед завершених відповідей. Це не funnel-аналітика з відсотком
            незавершених — незакінчені проходження зараз ніде не зберігаються.
          </p>

          <div v-if="pathsLoading" class="state-msg">Завантаження шляхів...</div>
          <div v-else-if="pathsError" class="state-msg state-msg--error">{{ pathsError }}</div>
          <PathsDiagram
            v-else-if="paths"
            :nodes="paths.nodes"
            :edges="paths.edges"
            :total-responses="paths.totalResponses"
          />
        </section>
      </template>
    </template>

    <QuestionDetailPanel
      v-if="activeQuestionId"
      :data="detail"
      :is-loading="detailLoading"
      :error="detailError"
      @close="closeDetail"
    />
  </div>
</template>

<style scoped>
.analytics-root {
  min-height: 100vh;
  background: #f8fafc;
  padding: 32px 24px 64px;
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    sans-serif;
}
.header {
  max-width: 960px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.page-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin: 2px 0 0;
}
.total-badge {
  background: #eef2ff;
  color: #4f46e5;
  font-size: 13px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 999px;
}
.state-msg {
  max-width: 960px;
  margin: 40px auto;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}
.state-msg--error {
  color: #dc2626;
}
.empty-state {
  max-width: 960px;
  margin: 60px auto;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}
.cards-grid {
  max-width: 960px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.paths-section {
  max-width: 960px;
  margin: 40px auto 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 28px;
}
.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px;
}
.section-hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 0 0 20px;
}
</style>
