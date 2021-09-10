import Konva from "konva"
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
  imgEl = document.getElementById("imageElement"),
  filInput = document.getElementById("imageInput"),
  imgObj

mainLayer.imageSmoothingEnabled(false)

mainLayer.add(group)
stage.add(mainLayer)

// --- register canvas events 

const
  register = (evName, fn) => window.addEventListener(evName, fn),
  getScale = () => group.scale().x,
  addScale = (ds) => setScale(getScale() + ds),
  setScale = (s) => group.scale({ x: s, y: s }),
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
register("z+", () => addScale(+1))
register("z-", () => addScale(-1))

filInput.onchange = (e) => {
  let url = window.URL.createObjectURL(e.target.files[0])
  Konva.Image.fromURL(url, (img) => {
    imgObj = img
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


group.on("mousedown", (ke) => {
  isDraging = true
  clickOrDrag(ke)
})
group.on("mousemove", (ke) => {
  isDraging && clickOrDrag(ke)

  let pp = realCoordinate(getCoordinate(ke)) // pointer position
  document.getElementById("footer").innerHTML = `(${pp.x}, ${pp.y})`
})
group.on("mouseup", (ke) => isDraging = false)


register("wheel", ev => {
  moveCanvas(ev.deltaX, ev.deltaY)
})

register("keydown", ev => {
  if (ev.key === "ArrowUp")
    moveCanvas(0, +MOVE_SPEED)
  else if (ev.key === "ArrowDown")
    moveCanvas(0, -MOVE_SPEED)
  else if (ev.key === "ArrowLeft")
    moveCanvas(+MOVE_SPEED, 0)
  else if (ev.key === "ArrowRight")
    moveCanvas(-MOVE_SPEED, 0)
})
