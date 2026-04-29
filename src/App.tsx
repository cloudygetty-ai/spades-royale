import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Suit = '♠' | '♥' | '♦' | '♣'
type Rank = '2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'|'A'
type CardT = { suit: Suit; rank: Rank; id: string }
type Seat = 0 | 1 | 2 | 3
type Bid = number | 'nil'
type Phase = 'lobby' | 'bidding' | 'playing' | 'trick_end' | 'round_end' | 'game_over'

interface Player {
  seat: Seat; name: string; hand: CardT[]
  bid: Bid | null; tricks: number; isHuman: boolean; avatar: string
}
interface TrickCard { card: CardT; seat: Seat }
interface RoundScore {
  round: number
  ns: { bid: number; got: number; bags: number; pts: number }
  ew: { bid: number; got: number; bags: number; pts: number }
  nsTotal: number; ewTotal: number
}
interface GameState {
  phase: Phase; players: Player[]; currentTrick: TrickCard[]
  trickWinner: Seat | null; leadSeat: Seat; currentSeat: Seat
  spadesBroken: boolean; nsScore: number; ewScore: number
  history: RoundScore[]; round: number; message: string; renegAlert: string | null
}

// ─── Engine ───────────────────────────────────────────────────────────────────
const RANKS: Rank[] = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']
const SUITS: Suit[] = ['♣','♦','♥','♠']
const RANK_VAL: Record<string,number> = Object.fromEntries(RANKS.map((r,i)=>[r,i]))
const WIN_SCORE = 500
const NAMES = ['You','West','North','East']
const AVATARS = ['🫵','🤙','✊','👊']

function buildDeck(): CardT[] {
  return SUITS.flatMap(s => RANKS.map(r => ({ suit: s, rank: r, id: `${r}${s}` })))
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]] }
  return a
}
function cardVal(c: CardT) { return RANK_VAL[c.rank]*4+SUITS.indexOf(c.suit) }
function trickWinnerFn(trick: TrickCard[], lead: Suit): Seat {
  const spades = trick.filter(tc=>tc.card.suit==='♠')
  const led = trick.filter(tc=>tc.card.suit===lead)
  const cands = spades.length>0 ? spades : led
  return cands.reduce((b,tc)=>cardVal(tc.card)>cardVal(b.card)?tc:b).seat
}
function getLegal(hand: CardT[], lead: Suit|null, broken: boolean): CardT[] {
  return hand.filter(c => {
    if (!lead) return c.suit!=='♠' || broken || hand.every(x=>x.suit==='♠')
    const hasSuit = hand.some(x=>x.suit===lead)
    return hasSuit ? c.suit===lead : true
  })
}
function aiPick(_hand: CardT[], legal: CardT[], trick: TrickCard[], lead: Suit|null): CardT {
  if (!lead) {
    const nonSpade = legal.filter(c=>c.suit!=='♠')
    return nonSpade.length ? nonSpade[Math.floor(nonSpade.length/2)] : legal[0]
  }
  const winning = legal.filter(c => {
    const sim=[...trick,{card:c,seat:99 as Seat}]
    return (trickWinnerFn(sim,lead) as number)===99
  })
  if (winning.length) return winning[0]
  return [...legal].sort((a,b)=>cardVal(a)-cardVal(b))[0]
}
function dealPlayers(): Player[] {
  const deck = shuffle(buildDeck())
  return NAMES.map((name,i) => ({
    seat: i as Seat, name, avatar: AVATARS[i], isHuman: i===0, bid: null, tricks: 0,
    hand: deck.slice(i*13,i*13+13).sort((a,b)=>{
      if(a.suit!==b.suit) return SUITS.indexOf(b.suit)-SUITS.indexOf(a.suit)
      return RANK_VAL[b.rank]-RANK_VAL[a.rank]
    })
  }))
}
function initGame(): GameState {
  return {
    phase:'lobby', players:dealPlayers(), currentTrick:[], trickWinner:null,
    leadSeat:0, currentSeat:0, spadesBroken:false, nsScore:0, ewScore:0,
    history:[], round:1, message:'Welcome to the cookout.', renegAlert:null
  }
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  bg:'#0a0a0c', felt:'#0d2b1a', feltLight:'#0f3a20',
  panel:'#111118', border:'#2a2a3a', gold:'#c8a050', goldLight:'#e8c070',
  goldDim:'#7a5f28', emerald:'#1db87a', crimson:'#c0392b',
  text:'#e8e4dc', muted:'#6a6878', red:'#e05050',
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Cinzel:wght@600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0a0a0c;font-family:'Cormorant Garamond',serif}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes ember{0%,100%{opacity:.5;box-shadow:0 0 8px #ff6b2b}50%{opacity:1;box-shadow:0 0 18px #ff6b2b,0 0 32px rgba(255,107,43,.5)}}
  @keyframes smokeUp{0%{transform:translateY(0)scale(1);opacity:.4}100%{transform:translateY(-60px)scale(3);opacity:0}}
  @keyframes dealIn{from{transform:translateY(40px)rotate(-5deg);opacity:0}to{transform:none;opacity:1}}
  @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
  @keyframes popIn{from{transform:scale(.8);opacity:0}to{transform:scale(1);opacity:1}}
  @keyframes goldRain{to{transform:translateY(110vh)rotate(720deg);opacity:0}}
`

// ─── Playing Card ─────────────────────────────────────────────────────────────
function Card({ card, selected, onClick, small, faceDown, dim }: {
  card?: CardT; selected?: boolean; onClick?: ()=>void
  small?: boolean; faceDown?: boolean; dim?: boolean
}) {
  const red = card?.suit==='♥'||card?.suit==='♦'
  const w=small?46:70, h=small?64:98, fs=small?12:17
  const [hover, setHover] = useState(false)

  if (faceDown) return (
    <div style={{width:w,height:h,borderRadius:8,background:'linear-gradient(135deg,#1a1a28,#0e0e18)',
      border:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      <span style={{fontSize:small?14:22,opacity:.3}}>♠</span>
    </div>
  )
  if (!card) return null

  return (
    <div
      onClick={!dim?onClick:undefined}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      style={{
        width:w, height:h, borderRadius:8, background:'#f5f0e8',
        border:`2px solid ${selected?T.gold:hover&&!dim?'#aaa':'#ddd'}`,
        boxShadow: selected
          ? `0 -12px 0 -2px ${T.gold},0 6px 24px rgba(200,160,80,.4)`
          : hover&&!dim?'0 4px 16px rgba(0,0,0,.5)':'0 2px 8px rgba(0,0,0,.3)',
        transform: selected?'translateY(-14px)':hover&&!dim?'translateY(-4px)':'none',
        transition:'all .15s ease', cursor:!dim?'pointer':'default',
        opacity:dim?.45:1, flexShrink:0, position:'relative',
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      }}
    >
      <div style={{position:'absolute',top:4,left:6,fontFamily:"'DM Mono'",fontSize:fs-3,
        color:red?T.crimson:'#1a1a2e',fontWeight:700,lineHeight:1}}>{card.rank}</div>
      <div style={{fontSize:small?18:26,lineHeight:1,color:red?T.crimson:'#1a1a2e'}}>{card.suit}</div>
      <div style={{position:'absolute',bottom:4,right:6,fontFamily:"'DM Mono'",fontSize:fs-3,
        color:red?T.crimson:'#1a1a2e',fontWeight:700,transform:'rotate(180deg)',lineHeight:1}}>{card.rank}</div>
    </div>
  )
}

// ─── Lobby ────────────────────────────────────────────────────────────────────
function Lobby({ onStart }: { onStart:()=>void }) {
  return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',padding:24,position:'relative',overflow:'hidden'}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{position:'absolute',bottom:0,left:'50%',transform:'translateX(-50%)',
        width:700,height:200,background:'radial-gradient(ellipse,rgba(255,90,20,.06) 0%,transparent 70%)',pointerEvents:'none'}}/>
      {[0,1,2,3].map(i=>(
        <div key={i} style={{position:'absolute',bottom:'28%',left:`${12+i*22}%`,
          width:3+i,height:50,background:'rgba(255,180,80,.07)',borderRadius:'50%',
          filter:'blur(6px)',animation:`smokeUp ${2.5+i*.6}s ${i*.4}s ease-out infinite`,pointerEvents:'none'}}/>
      ))}
      <div style={{textAlign:'center',animation:'dealIn .6s ease forwards',marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14,marginBottom:6}}>
          <div style={{width:10,height:10,borderRadius:'50%',background:'#ff6b2b',animation:'ember 1.8s infinite'}}/>
          <h1 style={{fontFamily:"'Permanent Marker'",fontSize:window.innerWidth<500?32:46,color:'#fff',
            textShadow:'2px 2px 0 #b83020,5px 5px 0 rgba(0,0,0,.5),0 0 30px rgba(255,130,30,.25)',
            transform:'rotate(-1.5deg)',display:'inline-block'}}>Don't Reneg On Me</h1>
        </div>
        <p style={{fontFamily:"'Cormorant Garamond'",fontStyle:'italic',fontSize:20,color:T.muted}}>Say Less, Play More.</p>
      </div>

      <div style={{display:'flex',gap:-8,marginBottom:44,animation:'float 3s ease-in-out infinite'}}>
        {[{r:'A',s:'♠'},{r:'K',s:'♥'},{r:'Q',s:'♦'},{r:'J',s:'♣'},{r:'10',s:'♠'}].map((c,i)=>(
          <div key={i} style={{transform:`rotate(${(i-2)*9}deg) translateY(${Math.abs(i-2)*5}px)`,
            marginLeft:i>0?-18:0,zIndex:5-Math.abs(i-2)}}>
            <Card card={{suit:c.s as Suit,rank:c.r as Rank,id:c.r+c.s}} small/>
          </div>
        ))}
      </div>

      <button onClick={onStart} style={{
        background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,border:'none',borderRadius:14,
        padding:'18px 64px',fontFamily:"'Cinzel'",fontSize:18,fontWeight:700,
        color:'#0a0a0c',letterSpacing:3,cursor:'pointer',
        boxShadow:`0 4px 32px rgba(200,160,80,.4)`,animation:'slideUp .6s .3s ease both',
        transition:'transform .15s ease',
      }}
        onMouseOver={e=>(e.currentTarget.style.transform='scale(1.05)')}
        onMouseOut={e=>(e.currentTarget.style.transform='scale(1)')}>
        DEAL ME IN
      </button>

      <div style={{marginTop:28,display:'flex',gap:24,flexWrap:'wrap',justifyContent:'center',
        animation:'slideUp .6s .5s ease both',fontFamily:"'DM Mono'",fontSize:11,color:T.muted}}>
        {['4 Players','13 Tricks','Score to 500','Strict Reneg Rules'].map(t=>(
          <span key={t} style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{color:T.gold}}>✦</span>{t}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Bidding ──────────────────────────────────────────────────────────────────
function Bidding({ gs, onBid }: { gs:GameState; onBid:(b:Bid)=>void }) {
  const you = gs.players[0]
  return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',padding:'20px 16px'}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{fontFamily:"'Permanent Marker'",fontSize:28,color:'#fff',
        textShadow:'2px 2px 0 #b83020',transform:'rotate(-1deg)',marginBottom:4}}>Don't Reneg On Me</div>
      <div style={{fontFamily:"'DM Mono'",fontSize:10,color:T.muted,marginBottom:24,letterSpacing:2}}>
        ROUND {gs.round} — BIDDING
      </div>

      <div style={{display:'flex',gap:24,marginBottom:24}}>
        {[{l:'US (N/S)',v:gs.nsScore,c:T.emerald},{l:'THEM (E/W)',v:gs.ewScore,c:T.crimson}].map(s=>(
          <div key={s.l} style={{textAlign:'center'}}>
            <div style={{fontFamily:"'DM Mono'",fontSize:10,color:T.muted,letterSpacing:1}}>{s.l}</div>
            <div style={{fontFamily:"'Cinzel'",fontSize:26,color:s.c,fontWeight:700}}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:12,marginBottom:24,flexWrap:'wrap',justifyContent:'center'}}>
        {gs.players.slice(1).map(p=>(
          <div key={p.seat} style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:10,
            padding:'10px 16px',textAlign:'center',minWidth:76}}>
            <div style={{fontSize:22,marginBottom:4}}>{p.avatar}</div>
            <div style={{fontFamily:"'Cinzel'",fontSize:12,color:T.text}}>{p.name}</div>
            <div style={{fontFamily:"'DM Mono'",fontSize:14,color:T.gold,marginTop:4}}>
              {p.bid===null?'...':p.bid==='nil'?'NIL':p.bid}
            </div>
          </div>
        ))}
      </div>

      <div style={{background:T.felt,borderRadius:14,padding:'14px 10px',marginBottom:20,
        maxWidth:520,width:'100%',border:`1px solid #1a3d28`}}>
        <div style={{fontFamily:"'DM Mono'",fontSize:10,color:T.muted,marginBottom:10,textAlign:'center',letterSpacing:1}}>YOUR HAND</div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap',justifyContent:'center'}}>
          {you.hand.map(c=><Card key={c.id} card={c} small/>)}
        </div>
      </div>

      {you.bid===null ? (
        <div>
          <div style={{fontFamily:"'Cinzel'",fontSize:14,color:T.text,textAlign:'center',marginBottom:12}}>
            What's your bid?
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',maxWidth:380}}>
            {(['nil',1,2,3,4,5,6,7,8,9,10,11,12,13] as Bid[]).map(b=>(
              <button key={String(b)} onClick={()=>onBid(b)} style={{
                width:b==='nil'?80:50,height:46,
                background:b==='nil'?'rgba(192,57,43,.12)':T.panel,
                border:`1px solid ${b==='nil'?T.crimson:T.border}`,
                borderRadius:8,fontFamily:"'Cinzel'",fontSize:15,fontWeight:700,
                color:b==='nil'?T.crimson:T.gold,cursor:'pointer',transition:'all .15s',
              }}
                onMouseOver={e=>(e.currentTarget.style.borderColor=T.gold)}
                onMouseOut={e=>(e.currentTarget.style.borderColor=b==='nil'?T.crimson:T.border)}>
                {b==='nil'?'NIL':b}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{fontFamily:"'Cinzel'",fontSize:16,color:T.emerald}}>
          Bid: <strong>{you.bid==='nil'?'NIL':you.bid}</strong> — Waiting...
        </div>
      )}
    </div>
  )
}

// ─── Opponent Seat ────────────────────────────────────────────────────────────
function Opponent({ player, active, cardCount, compact }:{player:Player;active:boolean;cardCount:number;compact?:boolean}) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
      <div style={{
        background:active?'rgba(200,160,80,.12)':T.panel,
        border:`1px solid ${active?T.gold:T.border}`,
        borderRadius:10,padding:compact?'6px 12px':'8px 14px',textAlign:'center',
        boxShadow:active?`0 0 16px rgba(200,160,80,.2)`:'none',transition:'all .2s',minWidth:72,
      }}>
        <div style={{fontSize:18}}>{player.avatar}</div>
        <div style={{fontFamily:"'Cinzel'",fontSize:11,color:active?T.gold:T.text}}>{player.name}</div>
        <div style={{fontFamily:"'DM Mono'",fontSize:10,color:T.muted,marginTop:2}}>
          {player.bid!==null?`${player.bid==='nil'?'NIL':player.bid}b`:'-'} · {player.tricks}✓
        </div>
      </div>
      <div style={{display:'flex'}}>
        {Array.from({length:Math.min(cardCount,6)}).map((_,i)=>(
          <div key={i} style={{marginLeft:i>0?-30:0}}>
            <Card faceDown small/>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Game Table ───────────────────────────────────────────────────────────────
function Table({ gs, onPlay }:{ gs:GameState; onPlay:(c:CardT)=>void }) {
  const [selected, setSelected] = useState<string|null>(null)
  const you=gs.players[0], west=gs.players[1], north=gs.players[2], east=gs.players[3]
  // unused
  const actuallyYourTurn = gs.currentSeat===0 && gs.phase==='playing'
  const lead = gs.currentTrick.length>0?gs.currentTrick[0].card.suit:null
  const legal = getLegal(you.hand, lead, gs.spadesBroken)

  const handlePlay = (card: CardT) => {
    if (!actuallyYourTurn) return
    if (!legal.some(c=>c.id===card.id)) return
    setSelected(null)
    onPlay(card)
  }

  const handleCardClick = (card: CardT) => {
    if (!actuallyYourTurn) return
    if (!legal.some(c=>c.id===card.id)) return
    if (selected===card.id) { handlePlay(card); return }
    setSelected(card.id)
  }

  return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'space-between',padding:'10px 12px 14px',
      fontFamily:"'Cormorant Garamond'"}}>
      <style>{GLOBAL_CSS}</style>

      {/* HUD */}
      <div style={{width:'100%',maxWidth:640,display:'flex',justifyContent:'space-between',
        alignItems:'center',background:T.panel,borderRadius:10,padding:'8px 14px',
        border:`1px solid ${T.border}`}}>
        <div style={{fontFamily:"'Permanent Marker'",fontSize:17,color:'#fff',
          textShadow:'1px 1px 0 #b83020',transform:'rotate(-1deg)'}}>DROM</div>
        <div style={{display:'flex',gap:18}}>
          {[{l:'US',v:gs.nsScore,c:T.emerald},{l:'THEM',v:gs.ewScore,c:T.crimson}].map(s=>(
            <div key={s.l} style={{textAlign:'center'}}>
              <div style={{fontFamily:"'DM Mono'",fontSize:9,color:T.muted,letterSpacing:1}}>{s.l}</div>
              <div style={{fontFamily:"'Cinzel'",fontSize:20,color:s.c,fontWeight:700}}>{s.v}</div>
            </div>
          ))}
        </div>
        <div style={{fontFamily:"'DM Mono'",fontSize:10,color:T.muted}}>
          R{gs.round} {gs.spadesBroken?'· ♠ BROKEN':''}
        </div>
      </div>

      {/* Reneg alert */}
      {gs.renegAlert&&(
        <div style={{background:'rgba(192,57,43,.9)',border:`2px solid ${T.crimson}`,borderRadius:10,
          padding:'10px 24px',fontFamily:"'Cinzel'",fontSize:14,color:'#fff',
          animation:'shake .5s ease',textAlign:'center'}}>⚠️ {gs.renegAlert}</div>
      )}

      {/* Status */}
      <div style={{fontFamily:"'Cinzel'",fontSize:13,
        color:actuallyYourTurn?T.gold:T.muted,textAlign:'center',minHeight:18}}>
        {gs.message}
        {actuallyYourTurn&&!selected&&' — tap a card to select, tap again to play'}
        {actuallyYourTurn&&selected&&' — tap again to play or pick another card'}
      </div>

      {/* North */}
      <Opponent player={north} active={gs.currentSeat===2} cardCount={north.hand.length}/>

      {/* Middle row */}
      <div style={{width:'100%',maxWidth:640,display:'flex',alignItems:'center',justifyContent:'space-between',gap:6}}>
        <Opponent player={west} active={gs.currentSeat===1} cardCount={west.hand.length} compact/>

        {/* Felt */}
        <div style={{flex:1,minHeight:170,maxHeight:200,
          background:`radial-gradient(ellipse at center,${T.feltLight} 0%,${T.felt} 60%,#0a1f10 100%)`,
          borderRadius:18,border:`2px solid #1a3d28`,
          display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'1fr 1fr',gap:4,
          padding:10,position:'relative',
          boxShadow:'inset 0 0 40px rgba(0,0,0,.4)'}}>
          {([2,1,3,0] as Seat[]).map(seat=>{
            const tc=gs.currentTrick.find(t=>t.seat===seat)
            const isWinner=gs.trickWinner===seat
            return (
              <div key={seat} style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
                {tc?(
                  <div style={{transform:isWinner?'scale(1.12)':'scale(1)',
                    boxShadow:isWinner?`0 0 20px ${T.gold}`:'none',borderRadius:8,transition:'all .3s'}}>
                    <Card card={tc.card} small/>
                  </div>
                ):(
                  <div style={{width:46,height:64,borderRadius:8,border:'1px dashed rgba(255,255,255,.07)'}}/>
                )}
              </div>
            )
          })}
        </div>

        <Opponent player={east} active={gs.currentSeat===3} cardCount={east.hand.length} compact/>
      </div>

      {/* Your hand */}
      <div style={{width:'100%',maxWidth:640}}>
        <div style={{background:T.felt,borderRadius:14,padding:'12px 8px',border:`1px solid #1a3d28`}}>
          <div style={{display:'flex',gap:4,justifyContent:'center',flexWrap:'wrap',alignItems:'flex-end'}}>
            {you.hand.map(card=>{
              const isLegal=legal.some(c=>c.id===card.id)
              const isSel=selected===card.id
              return (
                <Card key={card.id} card={card} small
                  selected={isSel}
                  dim={actuallyYourTurn?!isLegal:false}
                  onClick={()=>handleCardClick(card)}/>
              )
            })}
          </div>
          {!actuallyYourTurn&&(
            <div style={{textAlign:'center',fontFamily:"'DM Mono'",fontSize:10,color:T.muted,marginTop:8}}>
              {gs.players[gs.currentSeat].name}'s turn...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Round End ────────────────────────────────────────────────────────────────
function RoundEnd({ gs, onNext }:{ gs:GameState; onNext:()=>void }) {
  const last = gs.history[gs.history.length-1]
  if (!last) return null
  const win = gs.phase==='game_over'
  return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',padding:24}}>
      <style>{GLOBAL_CSS}</style>
      {win&&(
        <div style={{fontFamily:"'Cinzel'",fontSize:26,color:gs.nsScore>=WIN_SCORE?T.gold:T.crimson,
          marginBottom:12,animation:'popIn .4s ease',textAlign:'center'}}>
          {gs.nsScore>=WIN_SCORE?'🏆 Y\'ALL WON':'💀 THEY GOT YOU'}
        </div>
      )}
      <h2 style={{fontFamily:"'Permanent Marker'",fontSize:28,color:'#fff',
        textShadow:'2px 2px 0 #b83020',transform:'rotate(-1.5deg)',marginBottom:24}}>
        Round {last.round} Done
      </h2>
      <div style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:14,
        overflow:'hidden',width:'100%',maxWidth:420,marginBottom:28}}>
        <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr 1fr',background:T.felt}}>
          {['','US (N/S)','THEM (E/W)'].map(h=>(
            <div key={h} style={{fontFamily:"'DM Mono'",fontSize:10,color:T.muted,
              padding:'10px 14px',letterSpacing:1,textTransform:'uppercase'}}>{h}</div>
          ))}
        </div>
        {[
          {label:'Bid',ns:last.ns.bid,ew:last.ew.bid},
          {label:'Got',ns:last.ns.got,ew:last.ew.got},
          {label:'Bags',ns:last.ns.bags,ew:last.ew.bags},
          {label:'Points',ns:last.ns.pts,ew:last.ew.pts,hl:true},
          {label:'Total',ns:last.nsTotal,ew:last.ewTotal,bold:true},
        ].map(row=>(
          <div key={row.label} style={{display:'grid',gridTemplateColumns:'1.2fr 1fr 1fr',
            borderTop:`1px solid ${T.border}`}}>
            <div style={{fontFamily:"'DM Mono'",fontSize:11,color:T.muted,padding:'10px 14px'}}>{row.label}</div>
            {[row.ns,row.ew].map((v,i)=>(
              <div key={i} style={{fontFamily:"'Cinzel'",
                fontSize:row.bold?18:14,
                color:row.hl?(Number(v)>0?T.emerald:T.crimson):T.text,
                fontWeight:row.bold?700:400,padding:'10px 14px'}}>
                {Number(v)>0?'+':''}{v}
              </div>
            ))}
          </div>
        ))}
      </div>
      <button onClick={onNext} style={{
        background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,
        border:'none',borderRadius:10,padding:'14px 48px',
        fontFamily:"'Cinzel'",fontSize:15,fontWeight:700,color:'#0a0a0c',
        cursor:'pointer',letterSpacing:2,boxShadow:`0 4px 20px rgba(200,160,80,.3)`,
        transition:'transform .15s',
      }}
        onMouseOver={e=>(e.currentTarget.style.transform='scale(1.05)')}
        onMouseOut={e=>(e.currentTarget.style.transform='scale(1)')}>
        {win?'RUN IT BACK':'NEXT ROUND'}
      </button>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [gs, setGs] = useState<GameState>(initGame())
  const timer = useRef<number>(0)

  // AI bidding
  useEffect(()=>{
    if (gs.phase!=='bidding') return
    const nextAI = gs.players.find(p=>!p.isHuman&&p.bid===null)
    if (!nextAI) return
    timer.current = window.setTimeout(()=>{
      setGs(prev=>{
        const players = prev.players.map(p=>{
          if (p.seat!==nextAI.seat) return p
          const spades = p.hand.filter(c=>c.suit==='♠').length
          return {...p, bid:Math.max(1,Math.round(spades*.85)) as Bid}
        })
        const allBid = players.every(p=>p.bid!==null)
        return {...prev,players,phase:allBid?'playing':'bidding',
          message:allBid?'All bids in. You lead.':prev.message}
      })
    }, 500+Math.random()*500)
    return ()=>clearTimeout(timer.current)
  },[gs.phase, gs.players])

  // AI playing
  useEffect(()=>{
    if (gs.phase!=='playing'||gs.currentSeat===0) return
    const ai = gs.players[gs.currentSeat]
    timer.current = window.setTimeout(()=>{
      const lead = gs.currentTrick.length>0?gs.currentTrick[0].card.suit:null
      const legal = getLegal(ai.hand,lead,gs.spadesBroken)
      const card = aiPick(ai.hand,legal,gs.currentTrick,lead)
      doPlay(card,gs.currentSeat)
    }, 600+Math.random()*600)
    return ()=>clearTimeout(timer.current)
  },[gs.phase,gs.currentSeat])

  // Auto-advance trick
  useEffect(()=>{
    if (gs.phase!=='trick_end') return
    const winner=gs.trickWinner!
    timer.current = window.setTimeout(()=>{
      setGs(prev=>({...prev,phase:'playing',currentTrick:[],trickWinner:null,
        leadSeat:winner,currentSeat:winner,message:`${prev.players[winner].name} leads.`}))
    },1200)
    return ()=>clearTimeout(timer.current)
  },[gs.phase])

  const doPlay = useCallback((card:CardT, seat:Seat)=>{
    setGs(prev=>{
      if (prev.phase!=='playing') return prev
      const player=prev.players[seat]
      const lead=prev.currentTrick.length>0?prev.currentTrick[0].card.suit:null
      const legal=getLegal(player.hand,lead,prev.spadesBroken)
      if (!legal.some(c=>c.id===card.id)) {
        return {...prev,renegAlert:`RENEG! ${player.name} must follow suit!`}
      }
      const newTrick=[...prev.currentTrick,{card,seat}]
      const newHand=player.hand.filter(c=>c.id!==card.id)
      const broken=prev.spadesBroken||card.suit==='♠'
      const players=prev.players.map(p=>p.seat===seat?{...p,hand:newHand}:p)

      if (newTrick.length<4) {
        const next=((seat+1)%4) as Seat
        return {...prev,players,currentTrick:newTrick,spadesBroken:broken,
          currentSeat:next,renegAlert:null,message:`${prev.players[next].name}'s turn`}
      }

      // Trick complete
      const leadSuit=newTrick[0].card.suit
      const winner=trickWinnerFn(newTrick,leadSuit)
      const p2=players.map(p=>p.seat===winner?{...p,tricks:p.tricks+1}:p)
      const done=p2[0].hand.length===0

      if (!done) {
        return {...prev,players:p2,currentTrick:newTrick,trickWinner:winner,
          phase:'trick_end',spadesBroken:broken,renegAlert:null,
          message:`${p2[winner].name} takes the trick!`}
      }

      // Score
      const nsTricks=p2[0].tricks+p2[2].tricks
      const ewTricks=p2[1].tricks+p2[3].tricks
      const nsBid=(p2[0].bid==='nil'?0:Number(p2[0].bid))+(p2[2].bid==='nil'?0:Number(p2[2].bid))
      const ewBid=(p2[1].bid==='nil'?0:Number(p2[1].bid))+(p2[3].bid==='nil'?0:Number(p2[3].bid))
      const nsBags=Math.max(0,nsTricks-nsBid)
      const ewBags=Math.max(0,ewTricks-ewBid)
      const nsRnd=nsTricks>=nsBid?nsBid*10+nsBags-(nsBags>=10?100:0):-(nsBid*10)
      const ewRnd=ewTricks>=ewBid?ewBid*10+ewBags-(ewBags>=10?100:0):-(ewBid*10)
      const nilB=(p:Player)=>p.bid==='nil'?(p.tricks===0?100:-100):0
      const nsNil=nilB(p2[0])+nilB(p2[2]), ewNil=nilB(p2[1])+nilB(p2[3])
      const newNs=prev.nsScore+nsRnd+nsNil, newEw=prev.ewScore+ewRnd+ewNil
      const record:RoundScore={round:prev.round,
        ns:{bid:nsBid,got:nsTricks,bags:nsBags,pts:nsRnd+nsNil},
        ew:{bid:ewBid,got:ewTricks,bags:ewBags,pts:ewRnd+ewNil},
        nsTotal:newNs,ewTotal:newEw}

      return {...prev,players:p2,currentTrick:newTrick,trickWinner:winner,
        phase:newNs>=WIN_SCORE||newEw>=WIN_SCORE?'game_over':'round_end',
        nsScore:newNs,ewScore:newEw,history:[...prev.history,record],
        message:`${p2[winner].name} takes the last trick!`,renegAlert:null}
    })
  },[])

  const startGame=()=>setGs(prev=>({...prev,phase:'bidding',message:'Place your bid.'}))
  const placeBid=(bid:Bid)=>setGs(prev=>{
    const players=prev.players.map(p=>p.seat===0?{...p,bid}:p)
    const allBid=players.every(p=>p.bid!==null)
    return {...prev,players,phase:allBid?'playing':'bidding',
      message:allBid?'All bids in. You lead.':'Waiting for others...'}
  })
  const nextRound=()=>setGs(prev=>({
    ...initGame(),phase:'bidding',
    nsScore:prev.phase==='game_over'?0:prev.nsScore,
    ewScore:prev.phase==='game_over'?0:prev.ewScore,
    history:prev.phase==='game_over'?[]:prev.history,
    round:prev.phase==='game_over'?1:prev.round+1,
    message:'New round. Place your bid.',
  }))

  if (gs.phase==='lobby') return <Lobby onStart={startGame}/>
  if (gs.phase==='bidding') return <Bidding gs={gs} onBid={placeBid}/>
  if (gs.phase==='round_end'||gs.phase==='game_over') return <RoundEnd gs={gs} onNext={nextRound}/>
  return <Table gs={gs} onPlay={c=>doPlay(c,0)}/>
}
