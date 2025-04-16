export class Routes {
    // static routes = new Set();
    static routes = {};
    
    static get() {
        return Routes.routes;
    }

    /**
     * get routes in room
     * im shit at naming fr
     * @param {string} room room name
     * @returns routes set
     */
    static getRoom(room) {
        return Routes.get()[room];
    }

    static clear() {
        Routes.routes = {};
    }

    static clearRoom(room) {
        Routes.get()[room] = new Set();
    }

    static add(route) {
        // const routes = Routes.get();
        const room = route.room;
        if (!Routes.getRoom(room)) Routes.clearRoom(room);
        return Routes.getRoom(room).add(route);
    }

    static delete(route) {
        const roomRoutes = Routes.getRoom(route.room);
        return roomRoutes ? roomRoutes.delete(route) : false;
    }

    static has(route) {
        const roomRoutes = Routes.getRoom(route.room);
        return roomRoutes? roomRoutes.has(route) : false;
    }
}
