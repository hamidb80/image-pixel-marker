import Konva from "konva"
import fileDownload from 'js-file-download'
import hotkeys from 'hotkeys-js'
import "./styles.css"

const
  STROKE_WIDTH = 0.1,
  MOVE_SPEED = 10,
  PEN = 0,
  ERASER = 1

// --- app states
let
  isDraging = false,
  coloredCellsMap = {}, // [y][x]
  selectedTool = PEN

// --- init canvas
let
  stage = new Konva.Stage({
    container: "container",
    width: window.innerWidth - 100,
    height: window.innerHeight
  }),
  mainLayer = new Konva.Layer(),
  group = new Konva.Group(),
  filInput = document.getElementById("imageInput")

mainLayer.imageSmoothingEnabled(false)

mainLayer.add(group)
stage.add(mainLayer)

// --- register canvas events 

const
  register = (evName, fn) => window.addEventListener(evName, fn),
  getScale = () => group.scale().x,
  addScale = (ds) => setScale(getScale() + ds),
  setScale = (s) => {
    group.scale({ x: s, y: s })
    document.getElementById("scale").innerHTML = s
  },
  moveCanvas = (deltaX, deltaY) => {
    group.x(group.x() + deltaX)
    group.y(group.y() + deltaY)
  },

  getCoordinate = (konvaEvent) => ({ x: konvaEvent.evt.offsetX, y: konvaEvent.evt.offsetY }),
  realCoordinate = ({ x, y }) => ({
    x: Math.floor((x - group.x()) / getScale()),
    y: Math.floor((y - group.y()) / getScale())
  }),
  checkPoint = ({ x, y }) => coloredCellsMap[y] && coloredCellsMap[y][x],
  addPoint = ({ x, y }, rect) => {
    if (!coloredCellsMap[y])
      coloredCellsMap[y] = []

    coloredCellsMap[y][x] = rect
  }


register("pen", () => selectedTool = PEN)
register("eraser", () => selectedTool = ERASER)
register("imageSelect", () => filInput.click())
register("wheel", ev => {
  if (!ev.ctrlKey) // scale
    moveCanvas(-ev.deltaX, -ev.deltaY)
})
register("clear", () => {
  for (const row_i in coloredCellsMap) {
    for (const col_i in coloredCellsMap[row_i]) {
      coloredCellsMap[row_i][col_i].destroy()
      delete coloredCellsMap[row_i][col_i]
    }
  }
})
register("save", () => {
  let listOfPoints = []
  for (const row_i in coloredCellsMap)
    for (const col_i in coloredCellsMap[row_i])
      listOfPoints.push([col_i, row_i,].map(n => Number(n))) // [x, y]

  fileDownload(
    JSON.stringify({ points: listOfPoints }),
    'points.json'
  )
})
hotkeys("up,down,left,right", (ev, handler) => {
  let move = []

  if (handler.key === "up")
    move = [0, +MOVE_SPEED]
  else if (handler.key === "down")
    move = [0, -MOVE_SPEED]
  else if (handler.key === "left")
    move = [+MOVE_SPEED, 0]
  else if (handler.key === "right")
    move = [-MOVE_SPEED, 0]

  if (move.length == 2)
    moveCanvas(...move)
})
register("z+", () => addScale(+1))
register("z-", () => addScale(-1))
hotkeys("ctrl;=, ctrl;-", { splitKey: ';' }, (ev, handler) => {
  ev.preventDefault()
  addScale(handler.key.endsWith('=') ? +1 : -1)
})
filInput.onchange = (e) => {
  document.title = e.target.files[0].name

  let url = window.URL.createObjectURL(e.target.files[0])
  Konva.Image.fromURL(url, (img) => {
    group.add(img)

    const
      commonLineProps = {
        fill: "transparent",
        stroke: "rgba(0,0,0,0.4)",
        strokeWidth: STROKE_WIDTH,
      },
      vline = { points: [0, 0, 0, img.height()] },
      hline = { points: [0, 0, img.width(), 0] }

    for (let y = 0; y <= img.height(); y++)
      group.add(new Konva.Line({
        y,
        ...hline,
        ...commonLineProps
      }))

    for (let x = 0; x <= img.width(); x++)
      group.add(new Konva.Line({
        x,
        ...vline,
        ...commonLineProps
      }))

    mainLayer.draw()
  })
}


function clickOrDrag(konvaEvent) {
  let position = realCoordinate(getCoordinate(konvaEvent))

  if (selectedTool === PEN) {
    // only draw a new one if there was no rect there
    if (checkPoint(position)) return

    let cell = new Konva.Rect({
      x: position.x,
      y: position.y,
      fill: "red",
      width: 1,
      height: 1,
    })
    group.add(cell)
    addPoint(position, cell)
  }
  else if (selectedTool === ERASER) {
    if (checkPoint(position)) {
      coloredCellsMap[position.y][position.x].destroy()
      delete coloredCellsMap[position.y][position.x]
    }
  }
}
stage.on("mousedown", (ke) => {
  isDraging = true
  clickOrDrag(ke)
})
stage.on("mousemove", (ke) => {
  isDraging && clickOrDrag(ke)

  let pp = realCoordinate(getCoordinate(ke)) // pointer position
  document.getElementById("position").innerHTML = `(${pp.x}, ${pp.y})`
})
stage.on("mouseup", (ke) => isDraging = false)
