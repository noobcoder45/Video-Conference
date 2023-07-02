
//canvas stuff
let canvas = document.getElementById('canvas');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let context = canvas.getContext('2d');

let mouseX;
let mouseY;

window.onmousemove = (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    console.log({ mouseX, mouseY });
}