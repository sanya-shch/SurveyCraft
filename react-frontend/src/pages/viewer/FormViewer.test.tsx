import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FormViewer from "./FormViewer";
import type { Question } from "../../types/formBuilder";

const q = (overrides: Partial<Question>): Question => ({
  id: "q",
  type: "TEXT",
  text: "",
  required: false,
  order: 0,
  options: [],
  config: null,
  ...overrides,
});

describe("FormViewer - умовна видимість (інтеграційний тест через реальний UI)", () => {
  it("приховує питання з умовою, поки тригер не виконано, і показує після", async () => {
    const user = userEvent.setup();
    const questions = [
      q({
        id: "q1",
        order: 0,
        text: "Ви їли піцу сьогодні?",
        type: "CHOICE_SINGLE",
        options: [
          { id: "yes", text: "Так", isDefault: false },
          { id: "no", text: "Ні", isDefault: false },
        ],
      }),
      q({
        id: "q2",
        order: 1,
        text: "Яку піцу?",
        condition: {
          logic: "AND",
          rules: [{ questionId: "q1", operator: "equals", value: "yes" }],
        },
      }),
    ];

    render(<FormViewer formTitle="Тест" questions={questions} onSubmit={vi.fn()} />);

    // Умовне питання спочатку не в DOM взагалі (не просто visually hidden)
    expect(screen.queryByText("Яку піцу?")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Так"));

    expect(screen.getByText("Яку піцу?")).toBeInTheDocument();

    // Повертаємось назад до "Ні" - умовне питання знову ховається
    await user.click(screen.getByLabelText("Ні"));
    expect(screen.queryByText("Яку піцу?")).not.toBeInTheDocument();
  });

  it("не блокує сабміт required-полем, яке приховане умовою", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const questions = [
      q({
        id: "q1",
        order: 0,
        text: "Показати наступне?",
        type: "CHOICE_SINGLE",
        options: [
          { id: "yes", text: "Так", isDefault: false },
          { id: "no", text: "Ні", isDefault: false },
        ],
      }),
      q({
        id: "q2",
        order: 1,
        text: "Обов'язкове приховане",
        required: true,
        condition: {
          logic: "AND",
          rules: [{ questionId: "q1", operator: "equals", value: "yes" }],
        },
      }),
    ];

    render(<FormViewer formTitle="Тест" questions={questions} onSubmit={onSubmit} />);

    await user.click(screen.getByLabelText("Ні")); // q2 лишається прихованим
    await user.click(screen.getByRole("button", { name: "Надіслати відповіді" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    // q2 не потрапляє у відповідь взагалі - воно приховане
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("q2");
  });

  it("показує помилку валідації (role=alert) для видимого required-поля", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const questions = [q({ id: "q1", order: 0, text: "Обов'язкове поле", required: true })];

    render(<FormViewer formTitle="Тест" questions={questions} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Надіслати відповіді" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("обов'язковим");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("успішний сабміт передає лише відповіді на видимі питання", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const questions = [q({ id: "q1", order: 0, text: "Ім'я", required: true })];

    render(<FormViewer formTitle="Тест" questions={questions} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Ім'я/), "Олександр");
    await user.click(screen.getByRole("button", { name: "Надіслати відповіді" }));

    expect(onSubmit).toHaveBeenCalledWith({ q1: "Олександр" });
  });
});
