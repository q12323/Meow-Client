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
  
    "FIRST_MASTER_STAR",
    "SCARF_STUDIES",
    "SPIRIT_WING",
    "SPIRIT_BONE"
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
        this.triggers.add(register("Tick", () => {
            try {
                this.onTick();
            } catch (err) {
                this.reportError(err);
            }
        }).unregister())
        
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

        this.reportedRngs = new Set();

    }

    setToggled(toggled) {
        this.onWorldLoad();
        super.setToggled(toggled);
    }

    reportError(err) {
        APIUtils.reportError(err);
        this.setToggled(false);
    }

    onWorldLoad() {
        this.reportedRngs.clear();
    }

    onTick() {
        if (!this.isToggled()) return;
        const container = Player.getContainer();
        if (!container.isContainer()) return;
        if (!RNG_WINDOWS.includes(container.getName())) return;

        const items = container.getItems();
        if (items.length !== 90) return;

        let priceItem = items[31]
        if (!priceItem) return; 
        let priceLoreIndex = priceItem.getLore().findIndex(line => line === "§5§o§7Cost");
        if (priceLoreIndex === -1) return;
        const cost = parseInt(priceItem.getLore()[priceLoreIndex+1].removeFormatting().replace(/\D/g, ""));

        for (let i = 9; i < 18; i++) {
            let item = items[i];
            if (!item) continue;
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

//Special Thanks to Snowyy
