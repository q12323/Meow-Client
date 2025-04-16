import { PropertyInteger } from "../../property/properties/PropertyInteger";
import { PropertyNumber } from "../../property/properties/PropertyNumber";
import { McUtils } from "../../utils/McUtils";
import { RoomUtils } from "../../utils/RoomUtils";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { Module } from "../Module";

const S22PacketMultiBlockChange = Java.type("net.minecraft.network.play.server.S22PacketMultiBlockChange");
const S23PacketBlockChange = Java.type("net.minecraft.network.play.server.S23PacketBlockChange");
const BlockAir = Java.type("net.minecraft.block.BlockAir");
const EntityItemFrame = Java.type("net.minecraft.entity.item.EntityItemFrame")

// chatgpt skidded skytils
class TicTacToe {

    constructor() {
        this.board = Array(9).fill(null); // 3x3 보드 (1D 배열)
    }

    get availableMoves() {
        return this.board.map((val, idx) => (val === null ? idx : null)).filter(val => val !== null);
    }

    isGameOver() {
        return this.getWinner() !== null || this.availableMoves.length === 0;
    }

    getWinner() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // 가로
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // 세로
            [0, 4, 8], [2, 4, 6]  // 대각선
        ];

        for (let d of winPatterns) {
            let [a, b, c] = d
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return this.board[a]; // 승리한 플레이어 ('X' 또는 'O')
            }
        }
        return null; // 승자가 없음
    }

    makeMove(index, player) {
        if (!this.board[index]) {
            this.board[index] = player;
            return true;
        }
        return false;
    }

    clone() {
        const newBoard = new TicTacToe();
        newBoard.board = [...this.board];
        return newBoard;
    }
}

// **Alpha-Beta Pruning 알고리즘 적용**
function alphaBeta(board, depth, alpha, beta, maximizingPlayer, player) {
    const opponent = player === 'X' ? 'O' : 'X';

    if (board.isGameOver() || depth === 0) {
        return evaluateBoard(board, player, depth);
    }

    let bestMove = -1;
    let bestScore = maximizingPlayer ? -Infinity : Infinity;

    for (let move of board.availableMoves) {
        let newBoard = board.clone();
        newBoard.makeMove(move, maximizingPlayer ? player : opponent);
        let score = alphaBeta(newBoard, depth - 1, alpha, beta, !maximizingPlayer, player);

        if (maximizingPlayer) {
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
            alpha = Math.max(alpha, score);
        } else {
            if (score < bestScore) {
                bestScore = score;
                bestMove = move;
            }
            beta = Math.min(beta, score);
        }

        if (alpha >= beta) break; // 가지치기 (Pruning)
    }

    return depth === 10 ? bestMove : bestScore; // 최상위 호출에서 최적의 수 반환
}

// **보드 평가 함수**
function evaluateBoard(board, player, depth) {
    const winner = board.getWinner();
    if (winner === player) return 10 - depth;  // 빠른 승리 선호
    if (winner) return depth - 10;             // 늦은 패배 선호
    return 0;                                  // 무승부
}

// **AI의 최적의 수 선택**
function getBestMove(board, player) {
    return alphaBeta(board, 10, -Infinity, Infinity, true, player);
}

const buttons = [
    new BlockPos(8, 72, 17), new BlockPos(8, 72, 16), new BlockPos(8, 72, 15),
    new BlockPos(8, 71, 17), new BlockPos(8, 71, 16), new BlockPos(8, 71, 15),
    new BlockPos(8, 70, 17), new BlockPos(8, 70, 16), new BlockPos(8, 70, 15)
].map(p => p.toMCBlock());

export class TicTacToeModule extends Module {

    static range = new PropertyNumber("range", 4, 1, 8);
    static delay = new PropertyInteger("delay", 100, 50, 10000);

    constructor() {
        super("TicTacToe", false, 0, false);
        
        this.lastClick = Date.now();
        
        this.onBlock = register("PacketReceived", (packet, event) => {
            const isAir = packet.func_180728_a().func_177230_c() instanceof BlockAir;
            if (!isAir) return;
            const pos = RoomUtils.getRelativeBlockPos(packet.func_179827_b());
            const index = buttons.findIndex(p => pos.equals(p));
            if (index === -1) return;
            this.onBlock.unregister();
            this.onBlocks.unregister();
            let [game, turn] = this.getGame();
            game.makeMove(index, "X");
            turn = "O";
            new Thread(() => {
                this.clickBest(game, turn);
            }).start();
        
        }).setFilteredClass(S23PacketBlockChange).unregister()
        
        this.onBlocks = register("PacketReceived", (packet, event) => {
            const blocks = packet.func_179844_a();
            for (let block of blocks) {
                let isAir = block.func_180088_c().func_177230_c() instanceof BlockAir;
                if (!isAir) continue;
                let pos = RoomUtils.getRelativeBlockPos(block.func_180090_a());
                let index = buttons.findIndex(p => pos.equals(p));
                if (index === -1) continue;
                this.onBlock.unregister();
                this.onBlocks.unregister();
                let [game, turn] = this.getGame();
                game.makeMove(index, "X");
                turn = "O";
                new Thread(() => {
                    start.clickBest(game, turn);
                }).start();
                break;
            }
        }).setFilteredClass(S22PacketMultiBlockChange).unregister();

        this.triggers.add(register("Tick", () => this.onTick()).unregister());

    }

    setToggled(toggled) {
        this.onBlock.unregister();
        this.onBlocks.unregister();
        super.setToggled(toggled);
    }

    onTick() {
        return;
        if (!this.isToggled()) return;
        if (!SkyblockUtils.isInSkyblock()) return;
        if (RoomUtils.getCurrentRoomName() !== "Tic Tac Toe") return;

        let [game, turn] = this.getGame();
        if (game.board.every(v => v === null)) return;
        if (game.isGameOver()) return;

        new Thread(() => {
            if (turn !== "O") {
                for (let move of game.availableMoves) {
                    let newBoard = game.clone();
                    newBoard.makeMove(move, "O");
                    if (newBoard.getWinner() === "O") {
                        game.makeMove(move, "X");
                        turn = "O"
                        break;
                    }
                }
                if (turn !== "O") {
                    this.onBlock.register();
                    this.onBlocks.register();
                    return;
                }
            }
            this.onBlock.unregister();
            this.onBlocks.unregister();
            this.clickBest(game, turn);
        }).start()
    }
    
    getGame() {
        const itemFrames = World.getAllEntitiesOfType(EntityItemFrame);
        const game = new TicTacToe();
        const world = World.getWorld();
        let x = 0;
        let o = 0;
        for (let entity of itemFrames) {
            let coords = RoomUtils.getRelativeBlockPos(new BlockPos(Math.floor(entity.getX()), Math.floor(entity.getY()), Math.floor(entity.getZ())).toMCBlock());
            let itemStack = entity.getEntity()?.func_82335_i();
            if (!itemStack) continue;
            let color = itemStack?.func_77973_b()?.func_77873_a(itemStack, world)?.field_76198_e?.[8256];
            let index = buttons.findIndex((c) => coords.equals(c))
            if (index === -1) continue;
            if (color === 114) {
                game.makeMove(index, "X");
                x++;
            } else if (color === 33) {
                game.makeMove(index, "O");
                o++;
            }
        }
        const turn = x > o ? "O" : "X";
        return [game, turn];
    }
    
    clickBest(game, turn) {
        if (Date.now() - this.lastClick < TicTacToeModule.delay.getValue()) return;
        const bestMove = getBestMove(game, turn);
        if (bestMove > 8 || bestMove < 0) return;
        const blockPos = RoomUtils.getRealBlockPos(buttons[bestMove]);
        const eyePos = Player.asPlayerMP().getEyePosition(1)
        const mop = McUtils.getClosesetMOPOnBlock(eyePos, blockPos, World.getWorld());
        if (!mop) return;
        if (McUtils.getDistance3D(eyePos, mop.field_72307_f) > TicTacToeModule.range.getValue()) return;
        const real = Client.getMinecraft().field_71476_x
        Client.getMinecraft().field_71476_x = mop;
        this.lastClick = Date.now();
        this.rightClick();
        Client.getMinecraft().field_71476_x = real;
    }

    rightClick() {
        const rightClickMethod = Client.getMinecraft().getClass().getDeclaredMethod("func_147121_ag", null)
        rightClickMethod.setAccessible(true);
        rightClickMethod.invoke(Client.getMinecraft(), null);
    }
}