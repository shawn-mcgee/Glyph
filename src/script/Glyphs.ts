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