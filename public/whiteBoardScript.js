const canvas = document.getElementById('canvas');

if(canvas){
    canvas.width = 0.98 * window.innerWidth;
    canvas.height = 0.98 * window.innerHeight;
}

var io = io.connect()

let context;

if(canvas)
    context = canvas.getContext('2d');

let mouseX;
let mouseY;

let mouseDown = false;

window.onmousedown = (e) => {
    context.moveTo(mouseX, mouseY)
    io.emit('mouseDown', { x: mouseX, y: mouseY })
    mouseDown = true
}
window.onmouseup = (e) => {
    mouseDown = false
}

io.on('onDraw', ({ x, y }) => {
    context.lineTo(x, y)
    context.stroke()
})

io.on('onDown', ({ x, y }) => {
    context.moveTo(x, y)
})

window.onmousemove = (e) => {
    mouseX = e.clientX
    mouseY = e.clientY
    if (mouseDown) {
        io.emit('draw', { x: mouseX, y: mouseY })
        context.lineTo(mouseX, mouseY)
        context.stroke()
    }

}