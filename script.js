/* SCROLL */
const reveals = document.querySelectorAll(".reveal");

function revealOnScroll() {
  const windowHeight = window.innerHeight;

  reveals.forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < windowHeight - 100) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
revealOnScroll();

/* FONDO PRO */
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let stars = [];
let meteors = [];
let animationFrameId;

/* RESIZE DINÁMICO */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // regenerar estrellas según tamaño de pantalla
  stars = [];
  const STAR_COUNT = window.innerWidth < 768 ? 150 : 300;

  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5,
      speed: Math.random() * 0.4
    });
  }
}

window.addEventListener("resize", resize);
resize();

/* METEOROS */
function createMeteor() {
  meteors.push({
    x: Math.random() * canvas.width,
    y: 0,
    length: Math.random() * 80 + 50,
    speed: Math.random() * 8 + 4,
    opacity: 1
  });
}

let meteorInterval;

if (!reduceMotion.matches) {
  meteorInterval = setInterval(createMeteor, 2000);
}

/* ANIMACIÓN */
function animate() {
  if (reduceMotion.matches) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // estrellas
  ctx.fillStyle = "white";
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();

    s.y += s.speed;
    s.x += s.speed * 1.5;

    if (s.y > canvas.height || s.x > canvas.width) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  });

  // meteoros
  meteors.forEach((m, i) => {
    ctx.strokeStyle = `rgba(255,255,255,${m.opacity})`;
    ctx.beginPath();
    ctx.moveTo(m.x, m.y);
    ctx.lineTo(m.x + m.length, m.y + m.length / 2);
    ctx.stroke();

    m.x += m.speed;
    m.y += m.speed / 2;
    m.opacity -= 0.02;

    if (m.opacity <= 0) meteors.splice(i, 1);
  });

  animationFrameId = requestAnimationFrame(animate);
}

if (!reduceMotion.matches) {
  animate();
}

reduceMotion.addEventListener("change", event => {
  if (event.matches) {
    clearInterval(meteorInterval);
    cancelAnimationFrame(animationFrameId);
    meteors = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  meteorInterval = setInterval(createMeteor, 2000);
  animate();
});
