import { Module } from "../Module";
import { request } from "requestV2";
import { ChatUtils } from "../../utils/ChatUtils";
import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { APIUtils } from "../../utils/APIUtils";
import { ItemUtils } from "../../utils/ItemUtils";

let guiRender = false
let data = null

const S30PacketWindowItems = Java.type("net.minecraft.network.play.server.S30PacketWindowItems");
const S2DPacketOpenWindow = Java.type("net.minecraft.network.play.server.S2DPacketOpenWindow");
const S2EPacketCloseWindow = Java.type("net.minecraft.network.play.server.S2EPacketCloseWindow");
const C0DPacketCloseWindow = Java.type("net.minecraft.network.play.client.C0DPacketCloseWindow");

let Handle = new Sound({
    source: "handledrop.ogg",
    category: "player",
    stream: true
  });

const itemList = [
    "FIFTH_MASTER_STAR",
    "IMPLOSION_SCROLL",
    "SHADOW_WARP_SCROLL",
    "WITHER_SHIELD_SCROLL",
    "MASTER_SKULL_TIER_5",
    "DARK_CLAYMORE",
    "DYE_NECRON",
    "NECRON_HANDLE",
  
    "FOURTH_MASTER_STAR",
    "GIANTS_SWORD",
    
    "THIRD_MASTER_STAR",
    "SHADOW_FURY",
  
    "SECOND_MASTER_STAR",
    "SPIRIT_WING",
    "SPIRIT_BONE",
    
    "FIRST_MASTER_STAR",
    "SCARF_STUDIES"
]

const RNG_WINDOWS = [
    "Bedrock Chest",
    "Obsidian Chest"
];
  
export class RareDropModule extends Module {

    static GuildChatFlex = new PropertyBoolean("guild-chat", true);
    static PartyChatFlex = new PropertyBoolean("party-chat", true);
    

    constructor() {
        super("RareDrop", false, 0, false);
        
        this.triggers.add(register("WorldLoad", () => this.onWorldLoad()).unregister());
        this.triggers.add(register("PacketReceived", () => this.onClose()).setFilteredClass(C0DPacketCloseWindow).unregister());
        this.triggers.add(register("PacketReceived", () => this.onClose()).setFilteredClass(S2EPacketCloseWindow).unregister());
        this.triggers.add(register("PacketReceived", (packet) => this.onWindowOpen(packet)).setFilteredClass(S2DPacketOpenWindow).unregister());
        this.triggers.add(register("PacketReceived", (packet) => {
            try {
                this.onItems(packet)
            } catch (err) {
                this.reportError(err);
            }
        }).setFilteredClass(S30PacketWindowItems).unregister())
        
        request({
            url: "https://api.meowclient.cloud/v1/meow/rng",
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        }).then(Response => {
            data = JSON.parse(Response);
        }).catch(err => {
            this.reportError(err);
        });

        this.currentWindowId = -1;
        this.reportedRngs = new Set();

    }

    setToggled(toggled) {
        this.onclose();
        super.setToggled(toggled);
    }

    reportError(err) {
        APIUtils.reportError(err);
    }

    onWorldLoad() {
        this.reportedRngs.clear();
    }

    onWindowOpen(packet) {
        if (packet.func_148902_e() !== "minecraft:chest" || !RNG_WINDOWS.includes(ChatLib.removeFormatting(packet.func_179840_c().func_150254_d()))) {
            this.onclose();
            return;
        }
        this.currentWindowId = packet.func_148901_c();
    }

    onClose() {
        this.currentWindowId = -1;
    }

    onItems(packet) {
        if (this.currentWindowId === packet.func_148911_c()) return;
        const items = packet.func_148910_d();

        let priceItem = items[31]
        if (!priceItem) return; 
        priceItem = new Item(priceItem);
        let priceLoreIndex = priceItem.getLore().findIndex(line => line === "§5§o§7Cost");
        if (priceLoreIndex === -1) return;
        const cost = parseInt(priceItem.getLore()[index+1].removeFormatting().replace(/\D/g, ""));
        for (let item of items) {
            if (!item) continue;
            item = new Item(item); // convert to ct item to use unobfuscated methods
            let itemId = ItemUtils.getSkyblockItemID(item);
            if (!itemId) continue;
            if (this.reportedRngs.has(itemId)) continue;
            if (!itemList.includes(itemId)) continue;
            this.reportedRngs.add(itemId);
            this.rng(itemId, item.getName(), cost);
            break;
        }
    }

    rng(item, name, cost) {
        guiRender = false
        
        if (data[item]['Price'] - cost < 0){
            ChatUtils.prefixChat("§6" + name + " §4-" + this.kFormatter((data[item]['Price']-cost)*-1)) 
        } else {
            Client.showTitle("§6" + name, "§a+" + this.kFormatter(data[item]['Price']-cost), 5, 50, 5)
            Client.showTitle("§6" + name, "§a+" + this.kFormatter(data[item]['Price']-cost), 5, 50, 5)
            ChatUtils.prefixChat("§6" + name + " §a+" + this.kFormatter(data[item]['Price']-cost)) 
        }
        
        let formatted = this.kFormatter(data[item]['Price']-cost);
        formatted = (formatted.startsWith("-") ? "" : "+") + formatted;
        const message = `${name.removeFormatting()}: ${formatted}`;
        
        if (RareDropModule.PartyChatFlex.getValue()) {
            ChatLib.command(`pc ${message}`);
            
        }

        if (RareDropModule.GuildChatFlex.getValue()) {
            setTimeout(() => {
                ChatLib.command(`gc ${message}`);
            }, 300);
        }
    
        if (name.includes("Necron's Handle")) {
            Client.scheduleTask(() => {Handle.play()});
        } else {
            World.playSound("note.pling", 50, 1.22);
            setTimeout(() => { World.playSound("note.pling", 50, 1.13) }, 120);
            setTimeout(() => { World.playSound("note.pling", 50, 1.29) }, 240);
            setTimeout(() => { World.playSound("note.pling", 50, 1.60) }, 400);
        }   
    }

    kFormatter(num) {
        const kmbt = ["", "K", "M", "B"];
        let i = 0;
        let tictactoe;
        for (; i < kmbt.length; i++) {
            tictactoe = Math.floor(num / (1000 ** i));
            if (Math.abs(tictactoe) < 1000) break;
        }
        return `${tictactoe}${kmbt[i]}`;
    }


}

//Special Thanks to Trimonu 