const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
let router = express.Router();
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  makeCacheableSignalKeyStore,
  Browsers,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");
const { upload } = require("./mega");

function removeFile(FilePath) {
  if (!fs.existsSync(FilePath)) return false;
  fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get("/", async (req, res) => {
  let num = req.query.number;
  async function RobinPair() {
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    try {
      let RobinPairWeb = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(
            state.keys,
            pino({ level: "fatal" }).child({ level: "fatal" })
          ),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }).child({ level: "fatal" }),
        browser: Browsers.macOS("Safari"),
      });

      if (!RobinPairWeb.authState.creds.registered) {
        await delay(1500);
        num = num.replace(/[^0-9]/g, "");
        const code = await RobinPairWeb.requestPairingCode(num);
        if (!res.headersSent) {
          await res.send({ code });
        }
      }

      RobinPairWeb.ev.on("creds.update", saveCreds);
      RobinPairWeb.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect } = s;
        if (connection === "open") {
          try {
            await delay(10000);
            const sessionPrabath = fs.readFileSync("./session/creds.json");

            const auth_path = "./session/";
            const user_jid = jidNormalizedUser(RobinPairWeb.user.id);

            function randomMegaId(length = 6, numberLength = 4) {
              const characters =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
              let result = "";
              for (let i = 0; i < length; i++) {
                result += characters.charAt(
                  Math.floor(Math.random() * characters.length)
                );
              }
              const number = Math.floor(
                Math.random() * Math.pow(10, numberLength)
              );
              return `${result}${number}`;
            }

            const mega_url = await upload(
              fs.createReadStream(auth_path + "creds.json"),
              `${randomMegaId()}.json`
            );

            const string_session = mega_url.replace(
              "https://mega.nz/file/",
              ""
            );

            const sid = `*DARK WOLF [The POWERFUL WA BOT]*\n\n👉 ${string_session} 👈\n\n*Hello  do not do any shit with this*`;
            const mg = `🛑 *Do not share this code to anyone* 🛑`;
            const dt = await RobinPairWeb.sendMessage(user_jid, {
              image: {
                url: "data:image/jpeg;base64,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",
              },
              caption: sid,
            });
            const msg = await RobinPairWeb.sendMessage(user_jid, {
              text: string_session,
            });
            const msg1 = await RobinPairWeb.sendMessage(user_jid, { text: mg });
          } catch (e) {
            exec("pm2 restart prabath");
          }

          await delay(100);
          return await removeFile("./session");
          process.exit(0);
        } else if (
          connection === "close" &&
          lastDisconnect &&
          lastDisconnect.error &&
          lastDisconnect.error.output.statusCode !== 401
        ) {
          await delay(10000);
          RobinPair();
        }
      });
    } catch (err) {
      exec("pm2 restart Robin-md");
      console.log("service restarted");
      RobinPair();
      await removeFile("./session");
      if (!res.headersSent) {
        await res.send({ code: "Service Unavailable" });
      }
    }
  }
  return await RobinPair();
});

process.on("uncaughtException", function (err) {
  console.log("Caught exception: " + err);
  exec("pm2 restart Robin");
});

module.exports = router;
