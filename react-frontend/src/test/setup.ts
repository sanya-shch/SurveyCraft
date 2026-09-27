import "@testing-library/jest-dom/vitest";
import { beforeAll } from "vitest";
import i18n from "../i18n";

if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// Тести перевіряють конкретний видимий текст - фіксуємо мову явно, щоб не залежати від navigator.language середовища,
// в якому запускається vitest (jsdom за замовчуванням віддає "en-US", а наявні тести очікують українські підписи кнопок).
beforeAll(async () => {
  await i18n.changeLanguage("uk");
});
