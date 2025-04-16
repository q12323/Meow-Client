export class ItemUtils {

    /**
     * getSkyblockItemID() in BloomCore by UnclaimedBloom6
     * @param {*} item 
     * @returns 
     */
    static getSkyblockItemID(item) {
        const MCItemStack = Java.type("net.minecraft.item.ItemStack")
        if (item instanceof MCItemStack) item = new Item(item)
        if (!(item instanceof Item)) return null

        const extraAttributes = item.getNBT()?.getCompoundTag("tag")?.getCompoundTag("ExtraAttributes")
        const itemID = extraAttributes?.getString("id") ?? null
        
        if (itemID !== "ENCHANTED_BOOK") return itemID
        
        // Enchanted books are a pain in the ass
        const enchantments = extraAttributes.getCompoundTag("enchantments")
        const enchants = [...enchantments.getKeySet()]
        if (!enchants.length) return null

        const enchantment = enchants[0]
        const level = enchantments.getInteger(enchants[0])

        return `ENCHANTMENT_${enchantment.toUpperCase()}_${level}`
        
    }

    static getItemUUID(item) {
        // return item?.getNBT()?.getCompoundTag("tag")?.getCompoundTag("ExtraAttributes")?.getString("uuid");
        try {
            const uuid = String(item?.getNBT()?.getCompoundTag("tag")?.getCompoundTag("ExtraAttributes")?.getString("uuid"));
            if (uuid.length < 1 || uuid === undefined || uuid === null) return null;
            return uuid
        } catch (error) {
            return null;
        }
    }

    static getHeldItem() {
        return Player.getHeldItem();
    }
}