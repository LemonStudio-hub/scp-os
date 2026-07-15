const addressForm = document.querySelector("#addressForm")
const addressInput = document.querySelector("#addressInput")
const startForm = document.querySelector("#startForm")
const startInput = document.querySelector("#startInput")
const startPage = document.querySelector("#startPage")
const pageFrame = document.querySelector("#pageFrame")
const statusBar = document.querySelector("#statusBar")
const backButton = document.querySelector("#backButton")
const forwardButton = document.querySelector("#forwardButton")
const reloadButton = document.querySelector("#reloadButton")
const homeButton = document.querySelector("#homeButton")

const DEFAULT_HOME = "https://www.wikipedia.org/"
const SEARCH_URL = "https://www.bing.com/search?q="

let historyStack = []
let historyIndex = -1

function setStatus(message) {
  statusBar.textContent = message
}

function normalizeTarget(value) {
  const raw = value.trim()
  if (!raw) return ""
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return raw
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(raw)) return `https://${raw}`
  return `${SEARCH_URL}${encodeURIComponent(raw)}`
}

function updateNavigationButtons() {
  backButton.disabled = historyIndex <= 0
  forwardButton.disabled = historyIndex >= historyStack.length - 1
}

async function saveLastUrl(url) {
  try {
    await window.scp?.storage?.set("lastUrl", url)
  } catch {
    setStatus("Storage unavailable")
  }
}

function showStartPage() {
  pageFrame.classList.remove("is-visible")
  startPage.classList.remove("is-hidden")
  addressInput.value = ""
  setStatus("Ready")
  updateNavigationButtons()
}

function openUrl(url, options = {}) {
  const target = normalizeTarget(url)
  if (!target) return

  if (!options.fromHistory) {
    historyStack = historyStack.slice(0, historyIndex + 1)
    historyStack.push(target)
    historyIndex = historyStack.length - 1
  }

  addressInput.value = target
  startInput.value = target
  startPage.classList.add("is-hidden")
  pageFrame.classList.add("is-visible")
  pageFrame.src = target
  setStatus(`Loading ${target}`)
  updateNavigationButtons()
  void saveLastUrl(target)
}

function goBack() {
  if (historyIndex <= 0) return
  historyIndex -= 1
  openUrl(historyStack[historyIndex], { fromHistory: true })
}

function goForward() {
  if (historyIndex >= historyStack.length - 1) return
  historyIndex += 1
  openUrl(historyStack[historyIndex], { fromHistory: true })
}

function reload() {
  if (!pageFrame.src) return
  pageFrame.src = pageFrame.src
  setStatus(`Reloading ${addressInput.value}`)
}

addressForm.addEventListener("submit", (event) => {
  event.preventDefault()
  openUrl(addressInput.value)
})

startForm.addEventListener("submit", (event) => {
  event.preventDefault()
  openUrl(startInput.value)
})

document.querySelectorAll("[data-url]").forEach((button) => {
  button.addEventListener("click", () => openUrl(button.dataset.url || ""))
})

backButton.addEventListener("click", goBack)
forwardButton.addEventListener("click", goForward)
reloadButton.addEventListener("click", reload)
homeButton.addEventListener("click", showStartPage)

pageFrame.addEventListener("load", () => {
  setStatus(`Opened ${addressInput.value}`)
})

async function restore() {
  updateNavigationButtons()
  try {
    const lastUrl = await window.scp?.storage?.get("lastUrl")
    if (lastUrl) {
      openUrl(lastUrl)
      return
    }
  } catch {
    setStatus("Storage unavailable")
  }
  startInput.value = DEFAULT_HOME
}

void restore()
