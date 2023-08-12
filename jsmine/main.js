class FieldItem {
  #type // "wall" | "safe" | "bomb" | "bomb-explode"
  #x
  #y

  constructor(type, x, y) {
    this.#type = type
    this.#x = x
    this.#y = y
  }

  get isBomb() { return ["bomb", "bomb-explode"].includes(this.#type) }
  get invisible() { return ["wall"].includes(this.#type) }
  get type() { return this.#type }
  get x() { return this.#x }
  get y() { return this.#y }
  get icon() {
    switch (this.#type) {
      case "bomb": return "💩"
      case "bomb-explode": return "💥"
      case "safe": {
        const icons = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"]
        return icons[countNeighbors(this.#x, this.#y)]
      }
      case "wall": {
        // 上下の壁
        if ([0, game.height+1].includes(this.#y)) return ""
        // 左の壁
        if (this.#x === 0) return ""
        // 右の壁
        if (this.#x === game.width+1) return "\n"
      }
    }
  }

  set type(t) { this.#type = t }
}

class MaskItem {
  #type // "sleep" | "awake" | "open" | "flag"

  constructor(type) {
    this.#type = type
  }

  get isOpen() { return ["open"].includes(this.#type) }
  get isFlag() { return ["flag"].includes(this.#type) }
  get type() { return this.#type }
  get icon() {
    switch (this.#type) {
      case "sleep": return "😴"
      case "awake": return "😲"
      case "flag": return "👀"
      case "open": return null
      case "secret": return "😎"
    }
  }

  set type(t) { this.#type = t }
}

const game = {
  width: 16,
  height: 8,
  bombRate: 0.2,
  isGameOver: false,
}


const field = Array((game.width + 2)*(game.height + 2)).fill(null).map(
  (_, i) => {
    const [x, y] = xy(i)
    if ([0, game.width+1].includes(x) || [0, game.height+1].includes(y)) {
      return new FieldItem("wall", x, y)
    }
    return new FieldItem(bernoulli(game.bombRate) ? "bomb" : "safe", x, y)
  }
)

const mask = Array((game.width + 2)*(game.height + 2)).fill(null).map(
  (_, idx) => {
    const [x, y] = xy(idx)
    return new MaskItem("sleep")
  }
)

function index(x, y) { return x + y*(game.width + 2) }
function xy(i) {
  return [i % (game.width + 2), Math.floor(i / (game.width + 2))]
}
function inbound(x, y) {
  return 1 <= x && x <= game.width && 1 <= y && y <= game.height
}
function bernoulli(p) { return Math.random() < p }

function* neighbors(x, y) {
  for (const dx of [-1, 0, 1]) {
    for (const dy of [-1, 0, 1]) {
      if (dx === 0 && dy === 0) continue
      yield field[index(x + dx, y + dy)]
    }
  }
}

function icon(fItem, mItem) {
  if (fItem.invisible) return fItem.icon
  if (mItem.isOpen) return fItem.icon
  return mItem.icon
}

function look() {
  view = Array(field.length).fill(null).map(
    (_, idx) => icon(field[idx], mask[idx])
  ).join("")
  console.log(view)
}

function countNeighbors(x, y) {
  return Array.from(neighbors(x, y)).filter(
    (neighbor) => neighbor.isBomb
  ).length
}

function open(x, y) {
  const i = index(x, y)
  const f = field[i]
  const m = mask[i]
  if (f.invisible) return { message: null }
  if (m.isOpen) return { message: `🤔既に開いているなあ: open ${x} ${y}`}
  if (m.isFlag) return { message: `👀そこは危なそうだな: open ${x} ${y}`}
  
  if (f.isBomb) {
    f.type = "bomb-explode"
    field.forEach(
      (f, i) => {
        if (f.isBomb) {
          mask[i].type = "open"
        }
      }
    )
    for (const neighbor of neighbors(x, y)) {
      const m = mask[index(neighbor.x, neighbor.y)]
      if (m.isOpen) continue
      m.type = "awake"
    }
    game.isGameOver = true
    return { message: `✨open ${x} ${y}`, error: "😭えーん！踏んでしまった！" }
  }

  m.type   = "open"
  // 近傍に爆弾がないときはすべての近傍を自動的に開く
  if (countNeighbors(x, y) === 0) {
    for (const neighbor of neighbors(x, y)) {
      open(neighbor.x, neighbor.y)
    }
  }
  return { message: `✨open ${x} ${y}` }
}

function flag(x, y) {
  const m = mask[index(x, y)]
  if (m.isOpen) return { message: `🤔既に開いているなあ: flag ${x} ${y}`}
  
  m.type = m.type === "flag" ? "sleep" : "flag"
  return { message: `👀flag ${x} ${y}`}
}

function jji1nu() {
  const xys = [
    [2,1], [2,3], [2,4], [2,5], [2,6], [2,7], [1,7],
    [4,1], [4,3], [4,4], [4,5],
    [9,3], [8,3], [7,3], [6,3], [6,4], [6,5], [7,5], [8,4], [8,5], [8,6], [8,7],
    [7,7], [6,7],
    [10,5],
    [12,1], [12,3], [12,4], [12,5], [12,6], [12,7], [11,7],
    [14,3], [14,4], [14,5], [14,6], [14,7], [15,3], [16,3], [16,4], [16,5],
    [15,5],
  ]
  xys.forEach(([x,y]) => mask[index(x, y)].type = "secret")
  look()
}
function encode(text) {
  return Array.from(text).map(
    (c, i) => String.fromCharCode(c.charCodeAt(0) + i)
  ).join("")
}
function decode(text) {
  return Array.from(text).map(
    (c, i) => String.fromCharCode(c.charCodeAt(0) - i)
  ).join("")
}

function isWin() {
  return field.every(
    (fItem, idx) => {
      if (fItem.invisible) return true
      const mItem = mask[idx]
      return fItem.isBomb || mItem.isOpen
    }
  )
}


function parseCommand(input) {
  const [method, x, y] = input.split(" ")
  return { method, x: Number(x), y: Number(y) }
}

function main() {
  const sendButton = document.getElementById("send")
  const input = document.getElementById("input")
  function commandInput() {
    const inputValue = input.value
    const { method, x, y } = parseCommand(inputValue)
    input.value = ""
    input.focus()
    
    if (["r", "retry"].includes(method)) {
      location.reload()
    }
    
    if (game.isGameOver) {
      console.log("💩リトライするにはページをリロードしてください。")
      return
    }
  
    if (inbound(x, y)) {
      switch (method) {
        case "o": case "open": {
          const { error, message } = open(x, y)
          console.log(message)
          look()
          if (error) {
            throw Error(error)
          }
          return
        }
        case "f": case "flag": {
          const { message } = flag(x, y)
          console.log(message)
          look()
          return
        }
      }
    }

    if (encode(method) === "jji1nu") {
      console.log(`👍${encode("Nhab\x1D")}`)
      jji1nu()
      return
    }

    console.log("🤔知らないコマンドだな:", inputValue)
  }
  sendButton.addEventListener("click", () => {
    commandInput()
    if (isWin()) {
      game.isGameOver = true
      win()
      console.log("😎You win!")
    }
  })
  input.addEventListener("keypress", (ev) => {
    if (ev.key !== "Enter") return
    commandInput()
    if (isWin()) {
      game.isGameOver = true
      win()
      console.log("😎You win!")
    }
  })

  input.focus()
  console.log("Console Sweeper")
  look()
}

window.addEventListener("load", main)

function formatTime(timeMs) {
  const f = Math.floor
  const msec = String(timeMs % 1000).padStart(3, "0")
  const sec  = String(f(timeMs / 1000) % 60).padStart(2, "0")
  const min  = String(f(f(timeMs / 1000) / 60) % 60).padStart(2, "0")
  const hour = String(f(f(f(timeMs / 1000) / 60) / 60))
  return `${hour}:${min}:${sec}.${msec}`
}

window.addEventListener("load", () => {
  const time = document.getElementById("time")
  const start = Date.now()
  function tick() {
    time.innerText = formatTime(Date.now() - start)
    if (game.isGameOver) return
    requestAnimationFrame(tick)
  }
  tick()
})