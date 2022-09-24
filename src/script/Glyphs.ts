import _ from 'lodash'

export async function load(url) {
    const glyphs = await fetch(url)
        .then(data => data.json())
        .then(json =>      json  )

    glyphs.atlas = await new Promise<HTMLImageElement>(resolve => {
        const atlas : HTMLImageElement = new Image()
        atlas.onload = () => resolve(atlas)
        atlas.src = glyphs.path_to_atlas
    })

    return glyphs
}

export function merge(lookup, glyphs) {
    for(let glyph in glyphs.table) {
        lookup.table[glyph] = {
            atlas: lookup.atlas.length,
            x : glyphs.table[glyph][0],
            y : glyphs.table[glyph][1],
            w : glyphs.w,
            h : glyphs.h,
        }
    }
    lookup.atlas.push(glyphs.atlas)
}

export function s2g(lookup, s) {
    return _.reduce([...s], (b, g) => {
        g = g.toUpperCase()
        if(lookup.table[g])
            b.push({glyph: g, flip: true, color:'#f88'})
        return b
    }, [ ])
}