# 🦄🐴 Superpony

**Процессная дисциплина Superpowers × ленивый минимализм сеньора Ponytail — слиты в одно дерево скилов для Claude Code.**

> Тщательно в рассуждениях. Минимально в изменениях. Лучший код — тот, что ты не написал, но всё равно спланировал, проверил и отревьюил как сеньор.

Два родителя, два вопроса:

- [`obra/superpowers`](https://github.com/obra/superpowers) — **КАК работать**: brainstorm → plan → execute → test → review → finish, субагенты, TDD, верификация, stop-when-blocked.
- [`DietrichGebert/ponytail`](https://github.com/DietrichGebert/ponytail) — **СКОЛЬКО строить**: YAGNI, stdlib/native-first, кратчайший рабочий diff, никаких спекулятивных абстракций.

Они отвечают на разные вопросы, поэтому не конфликтуют. Superpony связывает их так, что строгость и бережливость усиливают друг друга.

| По отдельности | Слабое место | Фикс Superpony |
|---|---|---|
| Superpowers | дисциплина, но склонность к over-engineering (скаффолдинг, абстракции, большие diff'ы) | лестница Ponytail ограничивает footprint на каждой фазе |
| Ponytail | минимализм, но без дисциплины (нет плана, нет verification-гейта, дрейф scope) | конвейер Superpowers добавляет plan → test → review → finish |

## Единое правило решения

Для любой задачи, до того как трогать код:

1. **Process-gate (Superpowers):** тривиально (rename, однострочный фикс, формат) → просто сделай, оставь один check если логика неочевидна. Нетривиально → полный конвейер, без пропуска фаз.
2. **Scope-gate (лестница Ponytail):** остановись на первой ступени, которая держит —
   `YAGNI → stdlib → native/framework feature → installed dep → one line → minimal custom code`.

Каноничная политика: [`.claude/skills/superpony/SKILL.md`](.claude/skills/superpony/SKILL.md).

## Установка

Superpony — это **проектные файлы, не плагин.** Копируемый юнит — директория `.claude/`.

```sh
cp -r .claude /path/to/your/project/
```

Хук `SessionStart` активирует его со следующей сессии — инжектит корневую политику + skill-бутстрап и показывает `[SUPERPONY]` в статуслайне. Без marketplace, без `plugin.json`. Скилы вызываются без префикса (bare-name), поэтому кросс-ссылки остаются без префиксов.

Нужен `node` в PATH (без него хуки молча no-op).

> Предостережение: если в целевом проекте уже есть `.claude/settings.json` или одноимённые скилы, `cp -r` их перезатрёт. Сливай вручную, не затирай.

## Режимы и команды

Интенсивность регулирует, насколько агрессивно минимизировать и насколько терсно отвечать. **Процессная дисциплина действует всегда.** По умолчанию `full`. Переопредели дефолт через `SUPERPONY_DEFAULT_MODE`.

| Режим | Поведение — только про scope |
|---|---|
| `lite` | Строй что просили; назови более ленивую альтернативу одной строкой. |
| `full` | Лестница в силе, кратчайший diff, кратчайшее объяснение. По умолчанию. |
| `ultra` | YAGNI-экстремист; выдай однострочник и оспорь остаток требования в том же ответе. |

Переключение: `/superpony lite|full|ultra`. Выключение: `/superpony off`, `stop superpony` или `normal mode`.

### Кросс-модельный конвейер (явные гейты)

Пишешь на Claude, ревьюишь и реализуешь на Gemini, финальное ревью — обратно на Claude. Каждый гейт ручной — следующий шаг запускаешь ты:

```
/superpony-spec  "feature"   # 1. спека         Claude · brainstorming
/superpony-check <spec>      # 2. ревью          Gemini · agy-review-plan
/superpony-plan              # 3. план           Claude · writing-plans
/superpony-check <plan>      # 4. ревью          Gemini · agy-review-plan
/superpony-build <plan>      # 5. реализация     Gemini · agy-execute-plan
/superpony-review            # 6. ревью          Claude · two-pass
```

Gemini-плечи переиспользуют твои скилы `agy-review-plan` / `agy-execute-plan` (нужен CLI `agy`). Хочешь только Claude? Пропусти `-build` — план исполнится прямо в сессии (executing-plans / subagent-driven-development).

### Все команды

| Команда | Что делает |
|---|---|
| `/superpony [mode]` | Активировать / переключить интенсивность (`lite\|full\|ultra\|off`). |
| `/superpony-spec [topic]` | Написать дизайн-спеку (Claude · brainstorming). |
| `/superpony-plan [spec]` | Превратить одобренную спеку в bite-sized план (Claude · writing-plans). |
| `/superpony-check <path>` | Независимое ревью спеки/плана на Gemini (agy-review-plan). |
| `/superpony-build <plan>` | Реализовать одобренный план на Gemini (agy-execute-plan). |
| `/superpony-review` | Two-pass ревью кода в Claude: корректность, затем over-engineering, финал `net: -N lines possible`. |
| `/superpony-audit` | Аудит существующего кода на over-engineering и удаляемую сложность. |
| `/superpony-debt` | Список `ponytail:`-шорткатов как ledger долга с путями апгрейда. |
| `/superpony-help` | Объяснить superpony: что это, режимы, команды, конвейер. |

## Структура

```
superpony/
├─ .claude/                      # ← копируемый юнит
│  ├─ skills/                    # единственный source of truth (слитое дерево)
│  │  ├─ superpony/              # корневой оркестратор — каноничная политика
│  │  ├─ writing-plans/          # + 🐴 ponytail overlay
│  │  ├─ executing-plans/        # + 🐴 ponytail overlay
│  │  ├─ requesting-code-review/ # + 🐴 ponytail overlay
│  │  ├─ test-driven-development/# + 🐴 ponytail overlay
│  │  ├─ ponytail*/              # скилы минимизации ponytail
│  │  └─ ...                     # остальные скилы superpowers
│  ├─ hooks/                     # node + bash: lib, activate, mode-tracker, statusline
│  ├─ commands/                  # слэш-команды /superpony*
│  └─ settings.json              # хуки SessionStart + UserPromptSubmit, statusLine
├─ docs/                         # дизайн-спека + merge matrix
└─ eval/                         # promptfoo-харнес (superpony vs каждый родитель)
```

## Как разрешены конфликты

Каноничная политика живёт **только** в корневом скиле. Overlay'и добавляют scope-кап на footprint-критичных фазах и несут локальный кап, чтобы он выживал при прямом/субагентном входе; они не повторяют всю политику.

| Напряжение | Разрешение |
|---|---|
| «вызови скил до ЛЮБОГО ответа» vs тривиальный путь | superpony инжектится каждую сессию → это удовлетворяет skill-check; тривиальной задаче не нужен ещё один скил. |
| «исчерпывающий план» vs «наименьшее жизнеспособное изменение» | Исчерпывающий = *полный и однозначный*, не *большой*. Минимальный план, точный код. |
| «дроби на focused-файлы» vs «правки в 1 файл» (внутри `writing-plans`) | Новый файл только когда текущая структура не вмещает изменение; «меньше файлов» — тай-брейкер внутри нужного изменения, не лицензия плодить. |
| «скаффолди тесты» vs «YAGNI на тестах» | Один runnable check — GREEN-минимум; без fixtures/фреймворков пока не попросят; mandated-check не удалять. |
| «код первым, удали объяснение» vs процессные артефакты | Skill-анонсы, планы, review-отчёты, per-phase заметки обязательны — не «незапрошенная проза». Терсно в прозе, полно в процессе. |
| префиксы неймспейсов | Все ссылки bare-name; реклама `/ponytail*` переписана на `/superpony*`. |

Полная справка: [`docs/merge-matrix.md`](docs/merge-matrix.md).

## Eval

`promptfoo`-харнес сравнивает superpony vs только-superpowers vs только-ponytail (одна модель, разные system-промпты) на одинаковых coding-задачах, оценивая `process`, `brevity` (LOC) и `minimalism`. Плюс ручной acceptance-тест ([`eval/acceptance/react-todo-list.md`](eval/acceptance/react-todo-list.md)): brainstorming должен авто-триггериться, затем минимальная реализация.

```sh
export ANTHROPIC_API_KEY=sk-ant-...
npm run eval        # или: npx --yes promptfoo@latest eval -c eval/promptfooconfig.yaml
```

Детали: [`eval/README.md`](eval/README.md).

## Лицензия

MIT. Оба родителя — MIT.
