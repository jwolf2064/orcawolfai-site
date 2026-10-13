import { useEffect, useRef } from "react";

export default function MeshC2Dashboard() {
  const iframeRef = useRef(null);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sovereign Mesh C2 Readiness Dashboard</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <style>
        body { background-color: #09090b; color: #e4e4e7; font-family: 'Courier New', Courier, monospace; }
        .grid-bg { 
            background-image: linear-gradient(rgba(39, 39, 42, 0.5) 1px, transparent 1px), 
                              linear-gradient(90deg, rgba(39, 39, 42, 0.5) 1px, transparent 1px); 
            background-size: 30px 30px; 
        }
        .log-stream { max-height: 250px; overflow-y: auto; display: flex; flex-direction: column-reverse; }
        .log-stream::-webkit-scrollbar { width: 6px; }
        .log-stream::-webkit-scrollbar-thumb { background: #3f3f46; }
        .glitch-text { text-shadow: 0 0 5px rgba(34, 197, 94, 0.5); }
    </style>
</head>
<body class="grid-bg min-h-screen p-4 md:p-8 flex flex-col gap-8">

    <!-- Header -->
    <header class="border-b border-zinc-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h1 class="text-3xl md:text-4xl font-bold text-zinc-100 tracking-widest">SOVEREIGN MESH C2</h1>
            <p class="text-sm text-zinc-400 mt-1">NATS JetStream Edge Telemetry | TBI &amp; Blast Exposure Monitoring</p>
        </div>
        <div class="text-left md:text-right">
            <div class="text-xs text-red-500 animate-pulse mb-1">&#9679; LIVE SATCOM LINK SEVERED</div>
            <div class="text-xs text-blue-400">EDGE MESH: AUTONOMOUS</div>
        </div>
    </header>

    <!-- Main Readiness Grid -->
    <main class="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-7xl mx-auto">
        
        <!-- CVN-68 Nimitz -->
        <section class="bg-zinc-900/90 border border-zinc-700 rounded-lg p-6 shadow-2xl">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-amber-500">USS NIMITZ (CVN-68)</h2>
                <div class="text-right">
                    <div class="text-xs text-zinc-400">OVERALL READINESS</div>
                    <div id="cvn68-overall" class="text-3xl font-bold text-green-400 glitch-text">100%</div>
                </div>
            </div>
            <div class="grid grid-cols-12 text-xs text-zinc-500 mb-2 font-bold tracking-wide">
                <div class="col-span-4">LINE OF DUTY</div>
                <div class="col-span-4">CAPACITY</div>
                <div class="col-span-2 text-center">TBI WATCH</div>
                <div class="col-span-2 text-right">STATUS</div>
            </div>
            <div id="cvn68-roles" class="flex flex-col gap-4"></div>
        </section>

        <!-- CVN-71 Theodore Roosevelt -->
        <section class="bg-zinc-900/90 border border-zinc-700 rounded-lg p-6 shadow-2xl">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-blue-500">USS THEODORE ROOSEVELT (CVN-71)</h2>
                <div class="text-right">
                    <div class="text-xs text-zinc-400">OVERALL READINESS</div>
                    <div id="cvn71-overall" class="text-3xl font-bold text-green-400 glitch-text">100%</div>
                </div>
            </div>
            <div class="grid grid-cols-12 text-xs text-zinc-500 mb-2 font-bold tracking-wide">
                <div class="col-span-4">LINE OF DUTY</div>
                <div class="col-span-4">CAPACITY</div>
                <div class="col-span-2 text-center">TBI WATCH</div>
                <div class="col-span-2 text-right">STATUS</div>
            </div>
            <div id="cvn71-roles" class="flex flex-col gap-4"></div>
        </section>

    </main>

    <!-- Event Log -->
    <section class="bg-black/90 border border-zinc-800 rounded-lg p-4 mt-auto w-full max-w-7xl mx-auto">
        <h3 class="text-sm text-zinc-500 mb-2 border-b border-zinc-800 pb-2">NATS JETSTREAM EVENT LOG (JSON)</h3>
        <div id="event-log" class="log-stream text-xs text-zinc-400 font-mono space-y-2">
            <div><span class="text-green-500">[SYS]</span> Edge nodes synchronized. Listening to mesh.triage.*.*</div>
        </div>
    </section>

    <script>
        const roles = ["Pilots", "Navigators", "Medical Personnel", "Firemen", "Weapon Operations", "Deck Flight Crewmen"];
        const carriers = [
            { id: "cvn68", name: "USS NIMITZ" }, 
            { id: "cvn71", name: "USS THEODORE ROOSEVELT" }
        ];
        
        let fleetState = {};
        carriers.forEach(c => {
            fleetState[c.id] = {};
            roles.forEach(r => {
                fleetState[c.id][r] = { total: 100, effective: 100, injured: 0, tbi: 0 };
            });
        });

        function renderRoles() {
            carriers.forEach(c => {
                const container = document.getElementById(c.id + '-roles');
                container.innerHTML = '';
                roles.forEach(r => {
                    const data = fleetState[c.id][r];
                    const percent = ((data.effective / data.total) * 100).toFixed(0);
                    let color = percent > 85 ? 'bg-green-500' : percent > 70 ? 'bg-yellow-500' : 'bg-red-500';
                    let textColor = percent > 85 ? 'text-green-400' : percent > 70 ? 'text-yellow-400' : 'text-red-400';
                    container.innerHTML += '<div class="grid grid-cols-12 items-center gap-4 border-b border-zinc-800/50 pb-2"><div class="col-span-4 text-sm text-zinc-300 truncate font-semibold">' + r + '</div><div class="col-span-4 bg-zinc-800 h-2.5 rounded-full overflow-hidden"><div class="' + color + ' h-full transition-all duration-500" style="width:' + percent + '%"></div></div><div class="col-span-2 text-center text-xs font-bold text-orange-400 bg-orange-900/20 rounded px-1">' + data.tbi + '</div><div class="col-span-2 text-right text-sm font-bold ' + textColor + '">' + percent + '%</div></div>';
                });
            });
        }

        function updateOverall() {
            carriers.forEach(c => {
                let total = 0, effective = 0;
                roles.forEach(r => { total += fleetState[c.id][r].total; effective += fleetState[c.id][r].effective; });
                const percent = ((effective / total) * 100).toFixed(1);
                const el = document.getElementById(c.id + '-overall');
                el.innerText = percent + '%';
                el.className = 'text-3xl font-bold glitch-text ' + (percent > 85 ? 'text-green-400' : percent > 75 ? 'text-yellow-400' : 'text-red-500');
            });
        }

        function logEvent(payload, colorClass) {
            const log = document.getElementById('event-log');
            const time = new Date().toISOString().split('T')[1].slice(0, -1);
            const entry = document.createElement('div');
            entry.innerHTML = '<span class="text-zinc-600">[' + time + ']</span> <span class="' + colorClass + '">' + JSON.stringify(payload) + '</span>';
            log.prepend(entry);
        }

        function generateEvent() {
            const c = carriers[Math.floor(Math.random() * carriers.length)];
            const r = roles[Math.floor(Math.random() * roles.length)];
            const state = fleetState[c.id][r];
            const rand = Math.random();
            let flag, color;
            if (rand < 0.5 && state.effective > 30) {
                const casualties = Math.floor(Math.random() * 4) + 1;
                state.effective -= casualties; state.injured += casualties;
                flag = "MASCAL_IMPACT"; color = "text-red-400";
            } else if (rand >= 0.5 && rand < 0.75 && state.effective > 0) {
                const exposures = Math.floor(Math.random() * 3) + 1;
                state.tbi += exposures;
                flag = "BLAST_EXPOSURE_DETECTED"; color = "text-orange-400";
            } else if (rand >= 0.75 && state.injured > 0) {
                const recovered = Math.floor(Math.random() * 2) + 1;
                const actualRecovered = Math.min(recovered, state.injured);
                state.injured -= actualRecovered; state.effective += actualRecovered;
                flag = "RTD_CLEARED"; color = "text-green-400";
            } else { return; }
            const eventPayload = {
                id: Math.random().toString(36).slice(2,10),
                topic: 'mesh.triage.' + c.id + '.' + r.replace(/\\s+/g,'').toLowerCase() + '.' + flag,
                carrier: c.name, line_of_duty: r, event_flag: flag,
                combat_effective: state.effective, tbi_watch_count: state.tbi
            };
            logEvent(eventPayload, color);
            renderRoles();
            updateOverall();
        }

        renderRoles();
        updateOverall();
        setInterval(generateEvent, 1800);
    <\/script>
</body>
</html>`;

  return (
    <div className="w-full min-h-screen bg-[#09090b] pt-16">
      <iframe
        ref={iframeRef}
        srcDoc={html}
        title="Sovereign Mesh C2 Readiness Dashboard"
        className="w-full border-0"
        style={{ height: "calc(100vh - 64px)", display: "block" }}
        sandbox="allow-scripts"
      />
    </div>
  );
}
