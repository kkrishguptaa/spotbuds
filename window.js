gsap.registerPlugin(Draggable);

document.addEventListener("DOMContentLoaded", () => {
  const windows = document.querySelectorAll(".window");

  const config = (win) => {
    return {
      bounds: {
        minX: window.innerWidth * -0.2,
        maxX: window.innerWidth * 0.8,
        minY: window.innerHeight * -0.2,
        maxY: window.innerHeight * 0.8,
      },
      dragResistance: 0.5,
      edgeResistance: 1,
      trigger: win.querySelector(".window-titlebar"),
    };
  };

  windows.forEach((win) => {
    new Draggable(win, config(win));
  });
});
