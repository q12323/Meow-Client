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

export class APIUtils {

    static UUID = Java.type("java.util.UUID");

    static reportError(err) {
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
        ChatUtils.prefixChat("§fAuthenticating...");
        const token = Client.getMinecraft().func_110432_I().func_148254_d();
        const uuid = Player.getUUID().replaceAll("-", "");
        const svid = APIUtils.UUID.randomUUID().toString().replaceAll("-", "");
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
            if (response.statusCode === 204) {
                ChatUtils.prefixChat(`§fYou are authenticated as §a${Player.getName()}§f.`);
                request({
                    url: "https://api.meowclient.cloud/v1/meow/auth",
                    method: "POST",
                    headers: {"User-agent":"Mozilla/5.0"},
                    body: {content: `${Player.getName()} (${Player.getUUID()})`}
                });  
                }
            else ChatUtils.prefixChat("§7Failed to authenticate.");
        }).catch(() => {
            ChatUtils.prefixChat("§7Failed to authenticate.");
        });
    }
}