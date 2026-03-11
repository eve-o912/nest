'use client'
import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export function AgentPanel() {
  const { user } = usePrivy()
  const userId = user?.id
  const walletAddress = user?.wallet?.address

  const [tab, setTab] = useState<'setup' | 'activity'>('setup')
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [rules, setRules] = useState({
    autopilot: false,
    scheduledDay: 'Monday',
    scheduledAmount: 50,
    monthlyBudget: 200,
    streakProtection: true,
    idleSweepDays: 3,
    enabled: false,
  })

  useEffect(() => {
    if (!userId) return
    fetch(`/api/agent/rules?userId=${userId}`)
      .then(r => r.json())
      .then(data => { if (data) setRules(r => ({ ...r, ...data })) })
    fetchLogs()
  }, [userId])

  async function fetchLogs() {
    if (!userId) return
    const res = await fetch(`/api/agent/logs?userId=${userId}`)
    const data = await res.json()
    setLogs(data)
  }

  async function saveRules() {
    setSaving(true)
    await fetch('/api/agent/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, walletAddress, ...rules }),
    })
    setSaving(false)
  }

  async function runNow() {
    setRunning(true)
    await fetch('/api/agent/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    await fetchLogs()
    setRunning(false)
  }

  const toolIcon: Record<string, string> = {
    deposit_to_goal: '💸',
    sweep_idle_usdc: '🧹',
    protect_streak: '🔥',
    send_notification: '🔔',
    notify: '🔔',
    error: '⚠️',
  }

  return (
    <div style={{ background:'var(--bg2)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22 }}>🤖</span>
          <div>
            <div style={{ fontWeight:600, fontSize:15 }}>Nest Agent</div>
            <div style={{ fontSize:12, color:'var(--dim)' }}>
              {rules.enabled ? (rules.autopilot ? '🟢 Autopilot active' : '🟡 Notify only') : '⚫ Disabled'}
            </div>
          </div>
        </div>
        {/* Master enable toggle */}
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
          <span style={{ fontSize:12, color:'var(--dim)' }}>Enable</span>
          <div
            onClick={() => setRules(r => ({ ...r, enabled: !r.enabled }))}
            style={{
              width:40, height:22, borderRadius:11, cursor:'pointer', transition:'background 0.2s',
              background: rules.enabled ? 'var(--lime)' : 'rgba(255,255,255,0.1)',
              position:'relative'
            }}
          >
            <div style={{
              width:16, height:16, borderRadius:'50%', background:'#fff',
              position:'absolute', top:3, transition:'left 0.2s',
              left: rules.enabled ? 20 : 3
            }} />
          </div>
        </label>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {(['setup','activity'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex:1, padding:'12px 0', background:'none', border:'none', cursor:'pointer',
            fontSize:13, fontWeight: tab===t ? 600 : 400,
            color: tab===t ? 'var(--lime)' : 'var(--dim)',
            borderBottom: tab===t ? '2px solid var(--lime)' : '2px solid transparent',
          }}>
            {t === 'setup' ? '⚙️ Setup' : '📋 Activity'}
          </button>
        ))}
      </div>

      <div style={{ padding:24 }}>
        {tab === 'setup' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Autopilot mode */}
            <div style={{ background:'rgba(198,241,53,0.05)', border:'1px solid rgba(198,241,53,0.15)', borderRadius:12, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:14 }}>Mode</div>
                  <div style={{ fontSize:12, color:'var(--dim)' }}>
                    {rules.autopilot ? 'Agent executes real transactions' : 'Agent only sends you alerts'}
                  </div>
                </div>
                <div style={{ display:'flex', gap:0, borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)' }}>
                  {(['Notify','Autopilot'] as const).map(m => (
                    <button key={m} onClick={() => setRules(r => ({ ...r, autopilot: m === 'Autopilot' }))}
                      style={{
                        padding:'7px 14px', border:'none', cursor:'pointer', fontSize:12, fontWeight:500,
                        background: (m === 'Autopilot') === rules.autopilot ? 'var(--lime)' : 'transparent',
                        color: (m === 'Autopilot') === rules.autopilot ? '#000' : 'var(--dim)',
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scheduled deposit */}
            <div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>💸 Scheduled Deposit</div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:13, color:'var(--dim)' }}>Every</span>
                <select value={rules.scheduledDay}
                  onChange={e => setRules(r => ({ ...r, scheduledDay: e.target.value }))}
                  style={{ background:'var(--bg3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', color:'#fff', fontSize:13 }}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
                <span style={{ fontSize:13, color:'var(--dim)' }}>deposit</span>
                <div style={{ display:'flex', alignItems:'center', background:'var(--bg3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px' }}>
                  <span style={{ color:'var(--dim)', marginRight:4 }}>$</span>
                  <input type="number" value={rules.scheduledAmount} min={1}
                    onChange={e => setRules(r => ({ ...r, scheduledAmount: Number(e.target.value) }))}
                    style={{ background:'none', border:'none', color:'#fff', width:60, fontSize:13, outline:'none' }} />
                </div>
              </div>
            </div>

            {/* Monthly budget */}
            <div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>🔒 Monthly Budget Cap</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13, color:'var(--dim)' }}>Never spend more than</span>
                <div style={{ display:'flex', alignItems:'center', background:'var(--bg3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px' }}>
                  <span style={{ color:'var(--dim)', marginRight:4 }}>$</span>
                  <input type="number" value={rules.monthlyBudget} min={1}
                    onChange={e => setRules(r => ({ ...r, monthlyBudget: Number(e.target.value) }))}
                    style={{ background:'none', border:'none', color:'#fff', width:70, fontSize:13, outline:'none' }} />
                </div>
                <span style={{ fontSize:13, color:'var(--dim)' }}>/ month</span>
              </div>
            </div>

            {/* Streak protection */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>🔥 Streak Guardian</div>
                <div style={{ fontSize:12, color:'var(--dim)' }}>Auto-deposit $1 to protect weekly streak</div>
              </div>
              <div onClick={() => setRules(r => ({ ...r, streakProtection: !r.streakProtection }))}
                style={{ width:40, height:22, borderRadius:11, cursor:'pointer', transition:'background 0.2s',
                  background: rules.streakProtection ? 'var(--lime)' : 'rgba(255,255,255,0.1)', position:'relative' }}>
                <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff',
                  position:'absolute', top:3, transition:'left 0.2s', left: rules.streakProtection ? 20 : 3 }} />
              </div>
            </div>

            {/* Idle sweep */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>🧹 Idle USDC Sweep</div>
                <div style={{ fontSize:12, color:'var(--dim)' }}>Sweep uninvested USDC after</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <input type="number" value={rules.idleSweepDays} min={1} max={30}
                  onChange={e => setRules(r => ({ ...r, idleSweepDays: Number(e.target.value) }))}
                  style={{ background:'var(--bg3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8,
                    padding:'6px 10px', color:'#fff', width:50, fontSize:13, textAlign:'center', outline:'none' }} />
                <span style={{ fontSize:12, color:'var(--dim)' }}>days</span>
              </div>
            </div>

            {/* Save */}
            <button onClick={saveRules} disabled={saving}
              style={{ background:'var(--lime)', color:'#000', border:'none', borderRadius:10,
                padding:'13px 0', fontWeight:700, fontSize:14, cursor:'pointer', marginTop:4 }}>
              {saving ? 'Saving…' : 'Save Agent Rules →'}
            </button>
          </div>
        )}

        {tab === 'activity' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div style={{ fontSize:13, color:'var(--dim)' }}>Last 30 actions</div>
              <button onClick={runNow} disabled={running}
                style={{ background:'rgba(198,241,53,0.1)', border:'1px solid rgba(198,241,53,0.3)',
                  color:'var(--lime)', borderRadius:8, padding:'8px 16px', fontSize:12,
                  fontWeight:600, cursor:'pointer' }}>
                {running ? '⟳ Running…' : '▶ Run Agent Now'}
              </button>
            </div>

            {logs.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--dim)', fontSize:14 }}>
                No agent activity yet. Save your rules and click "Run Agent Now".
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {logs.map((log, i) => {
                  const result = log.result as any
                  const isSuccess = result?.success
                  const isSkipped = result?.skipped
                  return (
                    <div key={i} style={{
                      background:'var(--bg3)', borderRadius:10, padding:'12px 14px',
                      border: `1px solid ${isSuccess && !isSkipped ? 'rgba(198,241,53,0.15)' : isSkipped ? 'rgba(245,166,35,0.15)' : 'rgba(255,92,92,0.15)'}`,
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                          <span style={{ fontSize:18 }}>{toolIcon[log.tool_name] ?? '🤖'}</span>
                          <div>
                            <div style={{ fontSize:13, fontWeight:500 }}>
                              {log.reason || result?.skip_reason || result?.error || log.tool_name}
                            </div>
                            {result?.amount_usdc && (
                              <div style={{ fontSize:12, color:'var(--lime)', marginTop:2 }}>
                                ${result.amount_usdc.toFixed(2)} USDC
                              </div>
                            )}
                            {result?.tx_hash && (
                              <a href={result.basescan_url} target="_blank" rel="noopener"
                                style={{ fontSize:11, color:'var(--blue)', marginTop:4, display:'block' }}>
                                ✓ {result.tx_hash.slice(0,10)}…{result.tx_hash.slice(-6)} · View on Basescan ↗
                              </a>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize:11, color:'var(--faint)', whiteSpace:'nowrap', marginLeft:8 }}>
                          {new Date(log.executed_at).toLocaleString('en-US', {
                            month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
