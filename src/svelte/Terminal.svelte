<script lang='ts'>
    import { onDestroy, onMount } from 'svelte'
    import { dataset_dev } from 'svelte/internal';
    import * as GLYPH from '../script/Glyph'

    /** Configurable location of source atlas, expected to be a path or url string. */
    export let glyph_src   : string = GLYPH.SRC
    /** Configurable  width of all symbols on the source atlas in pixels, expected to be a positive, non-zero integer.*/
    export let glyph_src_w : number = GLYPH.SRC_W
    /** Configurable height of all symbols on the source atlas in pixels, expected to be a positive, non-zero integer.*/
    export let glyph_src_h : number = GLYPH.SRC_H
    /** Configurable  width of all symbols on the canvas in pixels, expected to be a positive, non-zero integer.*/
    export let glyph_dst_w : number = 32
    /** Configurable height of all symbols on the canvas in pixels, expected to be a positive, non-zero integer.*/
    export let glyph_dst_h : number = 32
    /** Used for locating symbols within the source atlas.*/
    export let glyph_src_table = GLYPH.SRC_TABLE

    export let rows : number;
    export let cols : number;

    let _canvas
    let _glyphs
    let _cursor

    let _buffer

    let _context : CanvasRenderingContext2D

    onMount(async () => {
        _buffer = [ ]
        for(let i = 0; i < rows * cols; i ++)
            _buffer.push({ })

        _cursor = 0

        _glyphs = await new Promise<HTMLImageElement>(resolve => {
            const image : HTMLImageElement = new Image();
            image.addEventListener('load', () => {
                resolve(image)
            })
            image.src = glyph_src
        })

        _context = _canvas.getContext('2d')
        _canvas.width  = cols * glyph_dst_w
        _canvas.height = rows * glyph_dst_h
        _context.imageSmoothingEnabled = false

        window.addEventListener   ('keydown', _onKeyDown)

        paint({i0:22, j0:22}, [
            {glyph:'w'}, {glyph:'a'}, {glyph:'l'}, {glyph:'l'}, {glyph:'a'}, {glyph:' '},
            {glyph:'w'}, {glyph:'a'}, {glyph:'l'}, {glyph:'l'}, {glyph:'a'}, {glyph:' '},
            {glyph:'b'}, {glyph:'i'}, {glyph:'n'}, {glyph:'g'}, {glyph:' '},
            {glyph:'b'}, {glyph:'a'}, {glyph:'n'}, {glyph:'g'}, {glyph:' '},
        ])
    })

    onDestroy(() => {
        window.removeEventListener('keydown', _onKeyDown)
    })

    export const CLEAR_BUFFER : number = 0x1
    export const WRITE_BUFFER : number = 0x2

    export const CLEAR_SCREEN : number = 0x4
    export const PAINT_SCREEN : number = 0x8
    
    export const CLEAR : number = CLEAR_BUFFER | CLEAR_SCREEN

    // screen region
    export const _WHERE_I0 : number = -1
    export const _WHERE_J0 : number = -1
    export const _WHERE_I1 : number = -1
    export const _WHERE_J1 : number = -1
    // buffer region
    export const _WHERE_B0 : number = -1
    export const _WHERE_B1 : number = -1
    export const _WHERE = {
        // screen region
        i0 : _WHERE_I0, j0 : _WHERE_J0,
        i1 : _WHERE_I1, j1 : _WHERE_J1,
        // buffer region
        b0 : _WHERE_B0, b1 : _WHERE_B1
    }

    export function write(where:any = { }, buffer:any[] = [     ]) {
        update(CLEAR_BUFFER | WRITE_BUFFER, where, buffer)
    }

    export function paint(where:any = { }, buffer:any[] = _buffer) {
        update(CLEAR_SCREEN | PAINT_SCREEN, where, buffer)
    }

    export function update(how : number, where : any, buffer : Array<any>) {
        where = { ..._WHERE, ...where }

        if(
            where.i0 < 0 && where.j0 < 0 &&
            where.i1 < 0 && where.j1 < 0
        ) {
            const
                b0 = where.b0 < 0 ? _cursor        : Math.min(where.b0, _buffer.length),
                b1 = where.b1 < 0 ? _buffer.length : Math.min(where.b1, _buffer.length),
                n = b1 - b0;

            for(let i = 0; i < n; i ++)
                _update(how, b0 + i, i < buffer.length ? buffer[i] : { })

        } else {
            const
                i0 = where.i0 < 0 ? Math.floor(_cursor / cols) : Math.min(where.i0, rows),
                j0 = where.i0 < 0 ? Math.floor(_cursor % cols) : Math.min(where.j0, cols),
                i1 = where.i1 < 0 ? rows : Math.min(Math.max(where.i1, i0), rows),
                j1 = where.j1 < 0 ? cols : Math.min(Math.max(where.j1, j0), cols),

                w = j1 - j0,
                h = i1 - i0,
                n = w * h;

                for(let i = 0; i < n; i ++) {
                    const
                        _i =  Math.floor(i / w) + i0,
                        _j =  Math.floor(i % w) + j0
                    _update(how, _i * cols + _j, i < buffer.length ? buffer[i] : { })
                }
        }
    }

    function _update(how, cursor, symbol) {
        if(how & CLEAR_BUFFER)
            _buffer[cursor] = {    }
        if(how & WRITE_BUFFER)
            _buffer[cursor] = symbol

        const
            i = Math.floor(cursor / cols),
            j = Math.floor(cursor % cols),
            glyph_dst_x : number = j * glyph_dst_w,
            glyph_dst_y : number = i * glyph_dst_h;
        if(how & CLEAR_SCREEN)
            _context.clearRect(
                glyph_dst_x, glyph_dst_y,
                glyph_dst_w, glyph_dst_h
            )

        // symbol has a
        if(how & PAINT_SCREEN) {
            const 
                glyph = symbol['glyph'],
                color = symbol['color'],
                src = glyph_src_table[glyph]
            if(!src) return;
            const
                glyph_src_x : number = src.x * glyph_src_w,
                glyph_src_y : number = src.y * glyph_src_h;

            _context.drawImage(
                _glyphs, 
                glyph_src_x, glyph_src_y, glyph_src_w, glyph_src_h,
                glyph_dst_x, glyph_dst_y, glyph_dst_w, glyph_dst_h
            )
            if(color) {
                _context.save()                

                _context.beginPath()
                _context.rect(
                    glyph_dst_x, glyph_dst_y,
                    glyph_dst_w, glyph_dst_h
                )
                _context.clip()

                _context.globalCompositeOperation='source-in'
                _context.fillStyle=`${color}`
                _context.fillRect(
                    glyph_dst_x, glyph_dst_y,
                    glyph_dst_w, glyph_dst_h
                )
                _context.globalCompositeOperation='source-over'

                _context.restore()
            }
        }
    }

    const NUMBER    : string = '0123456789'
    const LOWERCASE : string = 'abcdefghijklmnopqrstuvwxyz'
    const UPPERCASE : string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const WHITESPACE: string = ' '

    function _isNumber(n : string) : boolean {
        return NUMBER.includes(n)
    }

    function _isLetter(l : string) : boolean {
        return (
            LOWERCASE.includes(l) ||
            UPPERCASE.includes(l) );
    }

    function _isWhitespace(w : string) : boolean {
        return WHITESPACE.includes(w);
    }

    function _onKeyDown(event) {
        if(
            event.ctrlKey ||
            event.altKey
        ) return;
        if(
            _isLetter(event.key) ||
            _isNumber(event.key) ||
            _isWhitespace(event.key)
        ) {
            update(WRITE_BUFFER, {b0: _cursor ++}, [{glyph: event.key, color:'#f88'}])
            paint({b0:0})
        } else if(event.key === 'Backspace'){
            if(_cursor > 0)
                update(CLEAR_BUFFER | CLEAR_SCREEN, { b0: -- _cursor}, [ ])
        }
    }
</script>

<canvas bind:this={_canvas}/>

<style>
    canvas {
        image-rendering: crisp-edges;
    }
</style>

