<script lang='ts'>
  import Terminal, { CLEAR, WRITE, PAINT} from './svelte/Terminal.svelte'

  let _terminal : Terminal

  function _onReady() {
    // _terminal.cursor(22, 22)
    // _terminal.update(
    //   CLEAR | WRITE | PAINT, { }, [
    //     {glyph:"H", color:'red'},
    //     {glyph:"E", color:'orange'},
    //     {glyph:"L", color:'yellow'},
    //     {glyph:"L", color:'green'},
    //     {glyph:"O", color:'blue'},
    //     {glyph:" "},
    //     {glyph:"W", color:'red'},
    //     {glyph:"O", color:'orange'},
    //     {glyph:"R", color:'yellow'},
    //     {glyph:"L", color:'green'},
    //     {glyph:"D", color:'blue'},
    //   ]
    // )

    _terminal.cursor(22, 26)
    _terminal.paint({}, _terminal.s2g("Hello World"))
  }
</script>

<Terminal rows={32} cols={32} bind:this={_terminal} on:ready={_onReady}/>

