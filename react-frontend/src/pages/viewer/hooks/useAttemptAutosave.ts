import { useEffect, useRef } from "react";
import { saveFormAttempt } from "../../../api/publicFormApi";
import type { FormAnswers } from "../../../types/formViewer";

const AUTOSAVE_DEBOUNCE_MS = 1200;

/**
 * Debounced autosave "чернетки" проходження форми - записує прогрес
 * респондента, навіть якщо він так і не надішле форму, щоб funnel-
 * аналітика (backend: buildFormFunnel) бачила реальні покинуті
 * проходження, а не лише завершені сабміти.
 *
 * Викликається і з FormViewer, і з QuestionStepper (кожен володіє власним
 * `answers`-станом) - тому це самостійний хук, а не піднятий у
 * PublicFormPage стан.
 *
 * Autosave - best-effort: неуспіх мовчазно ігнорується (не переривати
 * респондента заради втраченого funnel-знімку), і початковий (навіть
 * порожній) стан теж зберігається після debounce-паузи - саме це фіксує
 * "дійшов хоча б до першого питання" для респондента, який побачив форму
 * й одразу пішов, нічого не ввівши.
 *
 * Свідоме обмеження цієї реалізації: немає sendBeacon-скидання на
 * beforeunload/pagehide, тож останні кілька секунд перед закриттям вкладки
 * можуть не встигнути потрапити в чернетку, якщо респондент пішов
 * швидше за debounce-паузу. Періодичний autosave все одно дає реальні,
 * значущі funnel-дані - це свідомий, а не випадковий компроміс обсягу.
 */
export function useAttemptAutosave(
  shareId: string | undefined,
  sessionKey: string,
  answers: FormAnswers,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    if (!shareId) return;

    const serialized = JSON.stringify(answers);
    if (serialized === lastSavedRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      lastSavedRef.current = serialized;
      saveFormAttempt(shareId, sessionKey, answers).catch(() => {
        // мовчазний невдача(коментар вище)
      });
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [shareId, sessionKey, answers]);
}
