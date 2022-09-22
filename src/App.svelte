<script lang='ts'>
  import Terminal from './svelte/Terminal.svelte'
  import { CLEAR, WRITE, PAINT} from './svelte/Terminal.svelte'

  let _terminal : Terminal

  function _onReady() {
    _terminal.update(
      CLEAR | WRITE | PAINT, { }, [
        {glyph:"H", color:'red'},
        {glyph:"E", color:'orange'},
        {glyph:"L", color:'yellow'},
        {glyph:"L", color:'green'},
        {glyph:"O", color:'blue'},
        {glyph:" "},
        {glyph:"W", color:'red'},
        {glyph:"O", color:'orange'},
        {glyph:"R", color:'yellow'},
        {glyph:"L", color:'green'},
        {glyph:"D", color:'blue'},
      ]
    )
  }
</script>

<Terminal rows={32} cols={32} bind:this={_terminal} on:ready={_onReady}/>

