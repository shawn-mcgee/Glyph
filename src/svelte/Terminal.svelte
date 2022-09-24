<script lang='ts' context='module'>
    export const DEFAULT_GLYPHS : string = './kenney_nl_1bit_mono.json'
    // default buffer region
    export const DEFAULT_BUFFER_INDEX_0 : number = -1
    export const DEFAULT_BUFFER_INDEX_1 : number = -1
    // default screen region
    export const DEFAULT_ROW_0 : number = -1
    export const DEFAULT_COL_0 : number = -1
    export const DEFAULT_ROW_1 : number = -1
    export const DEFAULT_COL_1 : number = -1
    // default where region    
    export const DEFAULT_WHERE = {
        // buffer region
        b0 : DEFAULT_BUFFER_INDEX_0,
        b1 : DEFAULT_BUFFER_INDEX_1,
        // screen region
        i0 : DEFAULT_ROW_0, j0 : DEFAULT_COL_0,
        i1 : DEFAULT_ROW_1, j1 : DEFAULT_COL_1,
    }

    // op
    export const CLEAR : number = 0x1
    export const WRITE : number = 0x2
    export const PAINT : number = 0x4
</script>
<script lang='ts'>
    import { createEventDispatcher, onMount } from 'svelte'
    import * as Glyphs from '../script/Glyphs'    

    export let rows    : number;
    export let cols    : number;
    export let glyph_w : number = 32;
    export let glyph_h : number = 32;

    const _dispatch = createEventDispatcher()

    // svelte bind:this={_canvas}
    let _canvas

    let _buffer
    let _cursor
    let _glyphs

    let _context : CanvasRenderingContext2D

    onMount(async () => {
        init_context()
        init_buffer()
        init_cursor()
        init_glyphs()
        use(await Glyphs.load(DEFAULT_GLYPHS))

        _dispatch('ready')
    })

    export function use(glyphs) {
        Glyphs.merge(_glyphs, glyphs)
    }

    export function s2g(s) {
        return Glyphs.s2g(_glyphs, s)
    }

    export function cursor(a ?: number, b ?: number) : number {
        if(a !== undefined && b === undefined)
            _cursor = Math.min(Math.max(a, 0), _buffer.length)
        if(a !== undefined && b !== undefined) {
            a = Math.min(Math.max(a, 0), rows)
            b = Math.min(Math.max(b, 0), cols)
            _cursor = a * cols + b
        }
        return _cursor
    }

    export function write(where:any = { }, buffer:Array<any> = [     ]) {
        update(CLEAR | WRITE, where, buffer)
    }

    export function paint(where:any = { }, buffer:Array<any> = _buffer) {
        update(CLEAR | PAINT, where, buffer)
    }

    export function update(op : number, where : any, buffer : Array<any>) {
        where = { ...DEFAULT_WHERE, ...where }

        if(
            where.i0 < 0 && where.j0 < 0 &&
            where.i1 < 0 && where.j1 < 0
        ) {
            const
                b0 = where.b0 < 0 ? _cursor        : Math.min(where.b0, _buffer.length),
                b1 = where.b1 < 0 ? _buffer.length : Math.min(where.b1, _buffer.length),
                n = b1 - b0;

            for(let i = 0; i < n; i ++)
                _update(op, b0 + i, i < buffer.length ? buffer[i] : { })

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
                    _update(op, _i * cols + _j, i < buffer.length ? buffer[i] : { })
                }
        }
    }

    function init_context() {
        _context = _canvas.getContext('2d')
        _canvas.width  = cols * glyph_w
        _canvas.height = rows * glyph_h
        _context.imageSmoothingEnabled = false
    }

    function init_buffer() {
        _buffer = [ ]
        const n = rows * cols
        for(let i = 0; i < n; i ++)
            _buffer[i] = { }
    }

    function init_cursor() {
        _cursor = 0
    }

    function init_glyphs() {
        _glyphs = {
            atlas: [ ],
            table: { }
        }
    }

    function _update(op, cursor, symbol) {
        if(op & (CLEAR | WRITE))
            _buffer[cursor] = {    }
        if(op &          WRITE )
            _buffer[cursor] = symbol

        const
            i = Math.floor(cursor / cols),
            j = Math.floor(cursor % cols),
            glyph_x : number = j * glyph_w,
            glyph_y : number = i * glyph_h;
        if(op & (CLEAR | PAINT))
            _context.clearRect(
                glyph_x, glyph_y,
                glyph_w, glyph_h
            )

        if(op &          PAINT ) {
            const 
                glyph = symbol['glyph'],
                color = symbol['color'],
                flip  = symbol['flip'],
                flop  = symbol['flop'],
                where = _glyphs.table[glyph];
            // no image for glyph
            if(!where) {
                if(glyph !== undefined) 
                    console.error(`missing glyph '${glyph}'!`);
                return;
            }
            console.log(flop)
            const
                glyph_src_atlas : number = where.atlas,
                glyph_src_w     : number = where.w,
                glyph_src_h     : number = where.h,
                glyph_src_x     : number = where.x * glyph_src_w,
                glyph_src_y     : number = where.y * glyph_src_h

            _context.save()
            _context.translate(
                glyph_x + (flip ? glyph_w : 0),
                glyph_y + (flop ? glyph_h : 0)
            )
            _context.scale(
                flip ? -1 : 1,
                flop ? -1 : 1
            )
            _context.drawImage(
                _glyphs.atlas[glyph_src_atlas],

                glyph_src_x, glyph_src_y, 
                glyph_src_w, glyph_src_h,

                0      , 0      ,
                glyph_w, glyph_h
            )
            _context.restore()
            if(color) {
                _context.save()

                _context.beginPath()
                _context.rect(
                    glyph_x, glyph_y,
                    glyph_w, glyph_h
                )
                _context.clip()

                _context.globalCompositeOperation='source-in'
                _context.fillStyle=color
                _context.fillRect(
                    glyph_x, glyph_y,
                    glyph_w, glyph_h
                )
                _context.globalCompositeOperation='source-over'
                
                _context.restore()
            }
        }
    }
</script>

<canvas bind:this={_canvas}/>

<style>
    canvas {
        image-rendering: crisp-edges;
    }
</style>

