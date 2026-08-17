import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionStepper from "./QuestionStepper";
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

describe("QuestionStepper - покрокова навігація з умовним branching", () => {
  it("показує лише перше питання спочатку, з коректним лічильником кроку", () => {
    const questions = [
      q({ id: "q1", order: 0, text: "Перше питання" }),
      q({ id: "q2", order: 1, text: "Друге питання" }),
    ];
    render(<QuestionStepper formTitle="Тест" questions={questions} onSubmit={vi.fn()} />);

    expect(screen.getByText("Перше питання")).toBeInTheDocument();
    expect(screen.queryByText("Друге питання")).not.toBeInTheDocument();
    expect(screen.getByText("Питання 1")).toBeInTheDocument();
  });

  it("не пускає далі без заповнення required-поля поточного кроку", async () => {
    const user = userEvent.setup();
    const questions = [q({ id: "q1", order: 0, text: "Обов'язкове", required: true })];
    render(<QuestionStepper formTitle="Тест" questions={questions} onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Далі →" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("обов'язковим");
    expect(screen.getByText("Обов'язкове")).toBeInTheDocument(); // все ще на першому кроці
  });

  it("пропускає приховане умовою питання при переході Далі", async () => {
    const user = userEvent.setup();
    const questions = [
      q({
        id: "q1",
        order: 0,
        text: "Тригер",
        type: "CHOICE_SINGLE",
        options: [
          { id: "yes", text: "Так", isDefault: false },
          { id: "no", text: "Ні", isDefault: false },
        ],
      }),
      q({
        id: "q2",
        order: 1,
        text: "Приховане питання",
        condition: {
          logic: "AND",
          rules: [{ questionId: "q1", operator: "equals", value: "yes" }],
        },
      }),
      q({ id: "q3", order: 2, text: "Третє питання" }),
    ];
    render(<QuestionStepper formTitle="Тест" questions={questions} onSubmit={vi.fn()} />);

    await user.click(screen.getByLabelText("Ні"));
    await user.click(screen.getByRole("button", { name: "Далі →" }));

    // Одразу перейшли на q3, минаючи приховане q2
    expect(screen.getByText("Третє питання")).toBeInTheDocument();
    expect(screen.queryByText("Приховане питання")).not.toBeInTheDocument();
  });

  it("Назад повертає на попередній крок", async () => {
    const user = userEvent.setup();
    const questions = [
      q({ id: "q1", order: 0, text: "Перше" }),
      q({ id: "q2", order: 1, text: "Друге" }),
    ];
    render(<QuestionStepper formTitle="Тест" questions={questions} onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Далі →" }));
    expect(screen.getByText("Друге")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "← Назад" }));
    expect(screen.getByText("Перше")).toBeInTheDocument();
  });

  it("динамічно перераховує гілку при зміні відповіді після повернення назад", async () => {
    const user = userEvent.setup();
    const questions = [
      q({
        id: "q1",
        order: 0,
        text: "Тригер",
        type: "CHOICE_SINGLE",
        options: [
          { id: "yes", text: "Так", isDefault: false },
          { id: "no", text: "Ні", isDefault: false },
        ],
      }),
      q({
        id: "q2",
        order: 1,
        text: "Умовне питання",
        condition: {
          logic: "AND",
          rules: [{ questionId: "q1", operator: "equals", value: "yes" }],
        },
      }),
    ];
    render(<QuestionStepper formTitle="Тест" questions={questions} onSubmit={vi.fn()} />);

    // Спершу "Так" -> умовне питання з'являється, доходимо до review
    await user.click(screen.getByLabelText("Так"));
    await user.click(screen.getByRole("button", { name: "Далі →" }));
    expect(screen.getByText("Умовне питання")).toBeInTheDocument();

    // Повертаємось і міняємо на "Ні"
    await user.click(screen.getByRole("button", { name: "← Назад" }));
    await user.click(screen.getByLabelText("Ні"));
    await user.click(screen.getByRole("button", { name: "Далі →" }));

    // Тепер має бути review-екран одразу, без "Умовне питання" в path
    expect(screen.getByText("Готово перевірити відповіді?")).toBeInTheDocument();
    expect(screen.queryByText("Умовне питання")).not.toBeInTheDocument();
  });

  it("доходить до review-екрана і сабмітить очищені відповіді", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const questions = [q({ id: "q1", order: 0, text: "Ім'я" })];
    render(<QuestionStepper formTitle="Тест" questions={questions} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Ім'я/), "Олександр");
    await user.click(screen.getByRole("button", { name: "Далі →" }));

    expect(screen.getByText("Готово перевірити відповіді?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Надіслати відповіді" }));

    expect(onSubmit).toHaveBeenCalledWith({ q1: "Олександр" });
  });
});
