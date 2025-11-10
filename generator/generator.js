import { encodePuzzle, decodePuzzle } from "../scripts/puzzle.js";

document.addEventListener("DOMContentLoaded", () => {
  const widthInput = document.getElementById("width");
  const heightInput = document.getElementById("height");
  const autofillSelect = document.getElementById("autofill");
  const applyButton = document.getElementById("apply");
  const preview = document.getElementById("preview");
  const payloadField = document.getElementById("payload");
  const urlField = document.getElementById("url");
  const copyButton = document.getElementById("copy");
  const copyStatus = document.getElementById("copy-status");
  const validationMessage = document.getElementById("validation");

  let gridWidth = clamp(Number(widthInput.value), 2, 8);
  let gridHeight = clamp(Number(heightInput.value), 2, 8);

  const initialFromUrl = readFromUrl();
  let initialValues = null;

  if (initialFromUrl) {
    gridWidth = initialFromUrl.width;
    gridHeight = initialFromUrl.height;
    widthInput.value = gridWidth.toString();
    heightInput.value = gridHeight.toString();
    initialValues = initialFromUrl.tiles.map((value) =>
      value === 0 ? "" : value.toString(),
    );
  }

  buildGrid(initialValues ?? createSequenceValues(gridWidth, gridHeight));
  updateResult();

  applyButton.addEventListener("click", () => {
    gridWidth = clamp(Number(widthInput.value), 2, 8);
    gridHeight = clamp(Number(heightInput.value), 2, 8);
    widthInput.value = gridWidth.toString();
    heightInput.value = gridHeight.toString();

    const mode = autofillSelect.value;
    if (mode === "clear") {
      buildGrid(Array(gridWidth * gridHeight).fill(""));
    } else {
      buildGrid(createSequenceValues(gridWidth, gridHeight));
    }

    updateResult();
  });

  copyButton.addEventListener("click", async () => {
    if (!urlField.value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(urlField.value);
      copyStatus.textContent = "Ссылка скопирована";
    } catch (error) {
      console.warn("Не удалось скопировать", error);
      copyStatus.textContent = "Скопируйте ссылку вручную";
    }

    setTimeout(() => {
      copyStatus.textContent = "";
    }, 2500);
  });

  function buildGrid(values) {
    preview.innerHTML = "";
    preview.style.gridTemplateColumns = `repeat(${gridWidth}, minmax(48px, 1fr))`;
    preview.style.setProperty("--columns", gridWidth);

    const total = gridWidth * gridHeight;
    const cells = Array.from(
      { length: total },
      (_, index) => values?.[index] ?? "",
    );

    cells.forEach((value, index) => {
      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "numeric";
      input.pattern = "[0-9]*";
      input.maxLength = 3;
      input.placeholder = "0";
      input.value = value;
      input.dataset.index = index.toString();

      input.addEventListener("input", () => {
        copyStatus.textContent = "";
        updateResult();
      });

      preview.appendChild(input);
    });
  }

  function updateResult() {
    const { tiles, error } = collectTiles();

    if (error) {
      validationMessage.textContent = error;
      payloadField.value = "";
      urlField.value = "";
      return;
    }

    validationMessage.textContent = "";
    const payload = encodePuzzle({
      width: gridWidth,
      height: gridHeight,
      tiles,
    });
    const targetUrl = buildTargetUrl(payload);
    payloadField.value = payload;
    urlField.value = targetUrl;
  }

  function collectTiles() {
    const inputs = Array.from(preview.querySelectorAll("input"));
    if (inputs.length !== gridWidth * gridHeight) {
      return { tiles: [], error: "Поле не готово" };
    }

    const tiles = inputs.map((input) => {
      const trimmed = input.value.trim();
      if (trimmed === "") {
        return 0;
      }
      const number = Number.parseInt(trimmed, 10);
      return Number.isNaN(number) ? NaN : number;
    });

    if (tiles.some((value) => Number.isNaN(value))) {
      return {
        tiles: [],
        error: "Используйте только числа или оставляйте клетку пустой",
      };
    }

    const zeroCount = tiles.filter((value) => value === 0).length;
    if (zeroCount !== 1) {
      return { tiles: [], error: "Должна быть ровно одна пустая клетка" };
    }

    const expectedNumbers = Array.from(
      { length: tiles.length - 1 },
      (_, i) => i + 1,
    );
    const providedNumbers = tiles.filter((value) => value !== 0);

    expectedNumbers.sort((a, b) => a - b);
    providedNumbers.sort((a, b) => a - b);

    if (expectedNumbers.length !== providedNumbers.length) {
      return { tiles: [], error: "Заполните все клетки числами от 1 до N-1" };
    }

    for (let i = 0; i < expectedNumbers.length; i += 1) {
      if (expectedNumbers[i] !== providedNumbers[i]) {
        return {
          tiles: [],
          error: "Используйте каждое число от 1 до N-1 по одному разу",
        };
      }
    }

    return { tiles, error: null };
  }

  function createSequenceValues(width, height) {
    const total = width * height;
    return Array.from({ length: total }, (_, index) => {
      if (index === total - 1) return "";
      return (index + 1).toString();
    });
  }

  function buildTargetUrl(payload) {
    const baseUrl = new URL("../", window.location.href);
    baseUrl.search = "";
    baseUrl.hash = "";
    const href = baseUrl.href.endsWith("/") ? baseUrl.href : `${baseUrl.href}/`;
    return `${href}?p=${payload}`;
  }

  function readFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const payload = params.get("p");
    if (!payload) return null;

    try {
      return decodePuzzle(payload);
    } catch (error) {
      console.warn("Не удалось прочитать p", error);
      return null;
    }
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
});
