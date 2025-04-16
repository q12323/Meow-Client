export const KeyBindingUtils = new class {

    lastClick = 0;

    gameSettings = Client.getSettings().getSettings();

    leftClick = this.gameSettings.field_74312_F;

    rightClick = this.gameSettings.field_74313_G;

    KeyBinding = Java.type("net.minecraft.client.settings.KeyBinding");

    

    getKeyCode(keyName) {
        return Keyboard.getKeyIndex(keyName);
    }

    getKeyName(keyCode) {
        return Keyboard.getKeyName(keyCode);
    }

    isKeyDown(keyCode) {
        return Keyboard.isKeyDown(keyCode);
    }

    setHotbarState(index, state) {
        this.setKeyState(this.gameSettings.field_151456_ac[index].func_151463_i(), state);
    }

    pressHotbar(index) {
        // tick
        this.KeyBinding.func_74507_a(this.gameSettings.field_151456_ac[index].func_151463_i());
    }

    setLeftClick(state) {
        this.setKeyState(this.leftClick.func_151463_i(), state)
    }

    isLeftClickDown() {
        return this.leftClick.func_151470_d();
    }
    
    setRightClick(state) {
        this.setKeyState(this.rightClick.func_151463_i(), state);
    }

    setKeyState(keyCode, state) {
        this.KeyBinding.func_74510_a(keyCode, state);
        if (state) {
            this.KeyBinding.func_74507_a(keyCode);
        }

    }
}