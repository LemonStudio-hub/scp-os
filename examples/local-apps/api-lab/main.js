const logEl = document.querySelector("#log")
const titleInput = document.querySelector("#titleInput")
const noteInput = document.querySelector("#noteInput")

function writeLog(message, value) {
  const suffix = value === undefined ? "" : `\n${JSON.stringify(value, null, 2)}`
  logEl.textContent = `${new Date().toLocaleTimeString()}  ${message}${suffix}`
}

async function run(label, action) {
  try {
    const result = await action()
    writeLog(`${label}: ok`, result)
  } catch (error) {
    writeLog(`${label}: failed`, {
      message: error.message,
      code: error.code,
      permission: error.permission,
      api: error.api,
    })
  }
}

document.querySelector("#setTitleButton").addEventListener("click", () => {
  void run("window.setTitle", () => window.scp.window.setTitle(titleInput.value))
})

document.querySelector("#resizeSmallButton").addEventListener("click", () => {
  void run("window.resize", () => window.scp.window.resize(640, 460))
})

document.querySelector("#resizeLargeButton").addEventListener("click", () => {
  void run("window.resize", () => window.scp.window.resize(900, 620))
})

document.querySelectorAll("[data-cursor]").forEach((button) => {
  button.addEventListener("click", () => {
    void run("ui.setCursor", () => window.scp.ui.setCursor(button.dataset.cursor))
  })
})

document.querySelector("#resetCursorButton").addEventListener("click", () => {
  void run("ui.resetCursor", () => window.scp.ui.resetCursor())
})

document.querySelector("#readThemeButton").addEventListener("click", () => {
  void run("theme.getCurrent", () => window.scp.theme.getCurrent())
})

document.querySelectorAll("[data-accent]").forEach((button) => {
  button.addEventListener("click", () => {
    void run("theme.setAccent", () => window.scp.theme.setAccent(button.dataset.accent))
  })
})

document.querySelector("#resetAccentButton").addEventListener("click", () => {
  void run("theme.resetAccent", () => window.scp.theme.resetAccent())
})

document.querySelector("#saveNoteButton").addEventListener("click", () => {
  void run("storage.set", () => window.scp.storage.set("note", noteInput.value))
})

document.querySelector("#loadNoteButton").addEventListener("click", () => {
  void run("storage.get", async () => {
    const note = await window.scp.storage.get("note")
    noteInput.value = note || ""
    return { note }
  })
})

document.querySelector("#notifyButton").addEventListener("click", () => {
  void run("notify", () => window.scp.notify("API Lab notification test"))
})
