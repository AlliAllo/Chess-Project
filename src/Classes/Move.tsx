import { kMaxLength } from "buffer";
import { ChessBoard } from "./ChessBoard";
import { Piece } from "./ChessBoard";



export type Move = [number, number]


/*
export class Move {
    private x: number
    private y: number
    

    constructor(x: number, y: number){
        this.x = x
        this.y= y

    }
    // Return notation for specific move. Example: e4.
    getNotation(): string{
        let notation: string
        notation = String.fromCharCode(97 + (this.x))+(8-this.y)
    
        return notation
    } 
}
*/