const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const net = require("net");

const isDev = process.env.NODE_ENV === "development";
const BASE_PORT = 3000;

let nextServer = null;

function getFreePort(start) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(start, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on("error", () => getFreePort(start + 1).then(resolve).catch(reject));
  });
}

function waitForPort(port, retries = 60, delay = 500) {
  return new Promise((resolve, reject) => {
    function attempt() {
      const socket = net.createConnection({ port, host: "127.0.0.1" });
      socket.on("connect", () => { socket.destroy(); resolve(); });
      socket.on("error", () => {
        if (--retries <= 0) { reject(new Error(`Port ${port} timed out`)); return; }
        setTimeout(attempt, delay);
      });
    }
    attempt();
  });
}

async function startNextServer(port) {
  // When packaged by electron-builder, __dirname is inside the asar.
  // The standalone server is placed next to the app.asar in resources.
  const standaloneDir = app.isPackaged
    ? path.join(process.resourcesPath, "app.asar.unpacked", ".next", "standalone")
    : path.join(__dirname, "..", ".next", "standalone");

  const serverScript = path.join(standaloneDir, "server.js");

  const env = {
    ...process.env,
    PORT: String(port),
    NODE_ENV: "production",
    HOSTNAME: "127.0.0.1",
  };

  nextServer = spawn(process.execPath, [serverScript], {
    env,
    cwd: standaloneDir,
    stdio: "pipe",
  });

  nextServer.stdout.on("data", (d) => process.stdout.write(d));
  nextServer.stderr.on("data", (d) => process.stderr.write(d));
  nextServer.on("error", (err) => console.error("Server error:", err));

  await waitForPort(port);
}

async function createWindow() {
  let port = BASE_PORT;

  if (!isDev) {
    port = await getFreePort(BASE_PORT);
    await startNextServer(port);
  }

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "TierForge",
    backgroundColor: "#0f0f13",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  win.loadURL(`http://127.0.0.1:${port}`);

  if (isDev) win.webContents.openDevTools({ mode: "detach" });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) shell.openExternal(url);
    return { action: "deny" };
  });

  win.on("closed", () => {
    if (nextServer) { nextServer.kill(); nextServer = null; }
  });
}

app.whenReady().then(() => {
  createWindow().catch(console.error);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow().catch(console.error);
  });
});

app.on("window-all-closed", () => {
  if (nextServer) { nextServer.kill(); nextServer = null; }
  if (process.platform !== "darwin") app.quit();
});
