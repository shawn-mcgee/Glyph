<script lang='ts'>
    import { onDestroy, onMount } from 'svelte'
    import * as GLYPH from '../script/Glyph'

    export let glyph_src   : string = 'src/assets/kenney_nl_1bit_monochrome_transparent_packed.png'
    export let glyph_src_w : number = 16
    export let glyph_src_h : number = 16
    export let glyph_dst_w : number = 32
    export let glyph_dst_h : number = 32

    export let rows : number;
    export let cols : number;

    let _canvas
    let _glyphs

    let _context

    let _state : Array<string> = [ ]

    onMount(async () => {
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
        draw()
    })

    onDestroy(() => {
        window.removeEventListener('keydown', _onKeyDown)
    })

    export function draw() {
        _context.clearRect(
            0, 0,
            _canvas.width ,
            _canvas.height
        )

        let 
            x : number = 0,
            y : number = 0;
        _state.forEach(g => {            
            let   where
            if(! (where = GLYPH.LOOKUP[g])) return;

            const
                glyph_src_x : number = where.x * glyph_src_w,
                glyph_src_y : number = where.y * glyph_src_h,
                glyph_dst_x : number =       x * glyph_dst_w,
                glyph_dst_y : number =       y * glyph_dst_h
            _context.drawImage(
                _glyphs, 
                glyph_src_x, glyph_src_y, glyph_src_w, glyph_src_h,
                glyph_dst_x, glyph_dst_y, glyph_dst_w, glyph_dst_h
            )
            if(++ x >= cols) {
                x =0
                y ++
            }
        })
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
        console.log(event.key)
        if(
            _isLetter(event.key) ||
            _isNumber(event.key) ||
            _isWhitespace(event.key)
        )
            _state.push(event.key)
        else if(event.key === 'Backspace')
            _state.pop()

        draw()
    }
</script>

<canvas bind:this={_canvas}/>

