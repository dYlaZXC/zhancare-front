"use client";

import { useState, useEffect, useRef } from "react";
import { Flame, MapPin } from "lucide-react";
import { phoneEntryToString } from "@/utils/phoneFormat";
import { STAGES, MAP_TILES, STAGE_COLOR_MAP } from "../constants/pipelineConstants";
import type { Clinic } from "../types/pipelineTypes";

export function PipelineMapView({ clinics, loading, fullHeight, topOffset = 16 }: { clinics: Clinic[]; loading: boolean; fullHeight?: boolean; topOffset?: number }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapRef2 = useRef<any>(null);
  const clusterRef = useRef<any>(null);
  const heatRef = useRef<any>(null);
  const baseTileRef = useRef<any>(null);
  const lblTileRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapType, setMapType] = useState("dark");
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    if (mapRef2.current || !mapRef.current) return;
    let alive = true;
    (async () => {
      const Lmod = await import("leaflet");
      // @ts-ignore — no types for leaflet.heat
      await import("leaflet.heat").catch(() => {});
      await import("leaflet.markercluster").catch(() => {});
      if (!alive || !mapRef.current) return;
      const L = (Lmod.default ?? Lmod) as any;
      const map = L.map(mapRef.current, { center: [41.2995, 69.2401], zoom: 11, zoomControl: false });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      baseTileRef.current = L.tileLayer(MAP_TILES.dark.url, { attribution: MAP_TILES.dark.attr, maxZoom: 19, subdomains: "abcd" }).addTo(map);
      await new Promise<void>(r => setTimeout(r, 100));
      if (!alive) return;
      map.invalidateSize();
      heatRef.current = (L as any).heatLayer([], { radius: 28, blur: 20, maxZoom: 17, max: 1.0, minOpacity: 0.01, gradient: { 0.2: "lime", 0.5: "yellow", 0.75: "orange", 1.0: "red" } }).addTo(map);
      clusterRef.current = (L as any).markerClusterGroup({
        maxClusterRadius: 60, spiderfyOnMaxZoom: true, showCoverageOnHover: false,
        iconCreateFunction: (cluster: any) => {
          const n = cluster.getChildCount();
          const sz = n < 10 ? 38 : n < 50 ? 46 : n < 200 ? 54 : 62;
          return L.divIcon({ html: `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:linear-gradient(135deg,#1e3a8a,#3b82f6);border:3px solid white;box-shadow:0 4px 16px rgba(59,130,246,0.45);display:flex;align-items:center;justify-content:center;font-size:${n<100?13:11}px;font-weight:800;color:white">${n}</div>`, className: "", iconSize: [sz, sz], iconAnchor: [sz/2, sz/2] });
        },
      });
      map.addLayer(clusterRef.current);
      mapRef2.current = { map, L };
      setMapReady(true);

      // Invalidate map size whenever the container resizes (sidebar toggle, window resize)
      const ro = new ResizeObserver(() => {
        if (mapRef2.current) {
          mapRef2.current.map.invalidateSize({ animate: false });
        }
      });
      if (mapRef.current) ro.observe(mapRef.current);
      (mapRef2.current as any)._ro = ro;
    })();
    return () => {
      alive = false;
      if (mapRef2.current) {
        (mapRef2.current as any)._ro?.disconnect();
        mapRef2.current.map.remove();
        mapRef2.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef2.current) return;
    const { map, L } = mapRef2.current;
    if (baseTileRef.current) map.removeLayer(baseTileRef.current);
    if (lblTileRef.current) { map.removeLayer(lblTileRef.current); lblTileRef.current = null; }
    const tile = mapType === "satellite" ? MAP_TILES.satellite : mapType === "light" ? MAP_TILES.light : MAP_TILES.dark;
    baseTileRef.current = L.tileLayer(tile.url, { attribution: tile.attr, maxZoom: 19, subdomains: "abcd" }).addTo(map);
  }, [mapType, mapReady]);

  useEffect(() => {
    if (!mapReady || !heatRef.current || !mapRef2.current) return;
    const { map } = mapRef2.current;
    if (showHeatmap) {
      const pts = clinics.filter(c => c.latitude && c.longitude).map(c => [c.latitude!, c.longitude!, c.priority === "A" ? 1.0 : c.priority === "B" ? 0.65 : 0.35]);
      heatRef.current.setLatLngs(pts);
      if (map.hasLayer(clusterRef.current)) map.removeLayer(clusterRef.current);
    } else {
      heatRef.current.setLatLngs([]);
      if (!map.hasLayer(clusterRef.current)) map.addLayer(clusterRef.current);
    }
  }, [mapReady, clinics, showHeatmap]);

  useEffect(() => {
    if (!mapReady || !mapRef2.current) return;
    const { map, L } = mapRef2.current;
    clusterRef.current.clearLayers();
    const geo = clinics.filter(c => c.latitude && c.longitude);
    const markers = geo.map(c => {
      const sc = STAGE_COLOR_MAP[c.pipeline_stage] ?? "#64748b";
      const stageName = STAGES.find(s => s.key === c.pipeline_stage)?.label ?? c.pipeline_stage;
      const prBg = c.priority === "A" ? "#fee2e2" : c.priority === "B" ? "#fef3c7" : "#f1f5f9";
      const prTxt = c.priority === "A" ? "#dc2626" : c.priority === "B" ? "#d97706" : "#64748b";

      // Card-style marker: initials + clinic name + stage label + priority badge
      const initials = c.name.split(/\s+/).slice(0, 2).map((w: string) => w[0] ?? "").join("").toUpperCase();
      const shortName = c.name.length > 15 ? c.name.slice(0, 14) + "…" : c.name;
      const cardW = 158;
      const cardH = 52;

      const html = `
        <div style="position:relative;transform:translate(-50%,-100%);cursor:pointer;">
          <div style="
            background:linear-gradient(135deg,${sc}f5,${sc});
            border-radius:14px;
            padding:6px 8px 6px 6px;
            display:flex;align-items:center;gap:7px;
            border:2.5px solid rgba(255,255,255,0.88);
            box-shadow:0 6px 20px rgba(0,0,0,0.22),0 2px 6px rgba(0,0,0,0.14),inset 0 1px 0 rgba(255,255,255,0.28);
            width:${cardW}px;
          ">
            <div style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.2);border:1.5px solid rgba(255,255,255,0.42);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:white;flex-shrink:0;font-family:system-ui,sans-serif;">${initials}</div>
            <div style="flex:1;min-width:0;overflow:hidden;">
              <div style="font-size:11px;font-weight:800;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:system-ui,sans-serif;line-height:1.3;">${shortName}</div>
              <div style="font-size:9px;font-weight:600;color:rgba(255,255,255,0.68);font-family:system-ui,sans-serif;white-space:nowrap;margin-top:1px;">${stageName}</div>
            </div>
            ${c.priority ? `<div style="width:19px;height:19px;border-radius:50%;background:rgba(255,255,255,0.22);border:1.5px solid rgba(255,255,255,0.48);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:white;flex-shrink:0;font-family:system-ui,sans-serif;">${c.priority}</div>` : ""}
          </div>
          <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid ${sc};margin:0 auto;"></div>
        </div>`;

      const icon = L.divIcon({ html, className: "", iconSize: [cardW, cardH], iconAnchor: [cardW / 2, cardH] });
      const marker = L.marker([c.latitude!, c.longitude!], { icon });
      marker.bindPopup(`<div style="min-width:220px;font-family:system-ui"><div style="font-size:14px;font-weight:700;color:#0f172a;padding-bottom:6px;border-bottom:1px solid #f1f5f9;margin-bottom:6px">${c.name}</div><div style="font-size:12px;line-height:1.9;color:#475569">${c.district_name ? `<div>📍 <b>${c.district_name}</b></div>` : ""}${c.description ? `<div style="color:#64748b;margin-top:2px">${c.description.slice(0,120)}${c.description.length>120?"…":""}</div>` : ""}${c.phones?.[0] ? `<div>📞 ${phoneEntryToString(c.phones[0])}</div>` : ""}${c.instagram ? `<div>📸 <a href="${c.instagram}" target="_blank" style="color:#e1306c;font-weight:600">Instagram</a></div>` : ""}<div style="margin-top:8px;display:flex;gap:5px;flex-wrap:wrap"><span style="padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;background:${sc}22;color:${sc};border:1px solid ${sc}44">${stageName}</span>${c.priority ? `<span style="padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;background:${prBg};color:${prTxt}">Приоритет ${c.priority}</span>` : ""}</div></div></div>`);
      return marker;
    });
    clusterRef.current.addLayers(markers);
    if (markers.length > 0) { const group = L.featureGroup(markers); map.fitBounds(group.getBounds().pad(0.1), { maxZoom: 14 }); }
  }, [mapReady, clinics]);

  const withCoords = clinics.filter(c => c.latitude).length;

  return (
    <div className={`relative overflow-hidden ${fullHeight ? "w-full h-full" : "rounded-2xl shadow-xl border border-gray-200/60"}`} style={fullHeight ? undefined : { height: "calc(100vh - 260px)", minHeight: 540 }}>
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
        <div className="flex overflow-hidden rounded-xl shadow-lg border border-white/50 bg-white/90 backdrop-blur-md">
          {[{ key:"dark",label:"Тёмная"},{key:"light",label:"Светлая"},{key:"satellite",label:"Спутник"}].map(({key,label})=>(
            <button key={key} onClick={()=>setMapType(key)} className={`px-3 py-1.5 text-xs font-semibold transition-all ${mapType===key?"bg-blue-600 text-white":"text-gray-600 hover:bg-gray-100"}`}>{label}</button>
          ))}
        </div>
        <button onClick={()=>setShowHeatmap(v=>!v)} className={`mt-6 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg border transition-all backdrop-blur-md ${showHeatmap?"bg-blue-600 text-white border-blue-700":"bg-white/90 text-gray-600 border-white/50 hover:bg-white"}`}>
          {showHeatmap?<Flame className="w-3.5 h-3.5"/>:<MapPin className="w-3.5 h-3.5"/>}
          {showHeatmap?"Тепловая карта":"Маркеры"}
        </button>
      </div>
      <div className="absolute bottom-6 left-4 z-[1000] bg-white/92 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 px-4 py-3 max-w-[240px]">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Этапы воронки</p>
        <div className="grid grid-cols-1 gap-y-1.5">
          {STAGES.map(s=>(
            <div key={s.key} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:s.color}}/>
              <span className="text-[11px] text-gray-600 leading-none">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-2">
          {loading?<><div className="w-3 h-3 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"/><span className="text-[11px] text-blue-500">Загрузка...</span></>
            :<span className="text-[11px] text-gray-500 font-semibold">{withCoords} точек на карте</span>}
        </div>
      </div>
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-lg border border-white/50 text-[11px]">
        <span className="text-gray-500 font-medium">Приоритет:</span>
        {[["A","#ef4444"],["B","#f97316"],["C","#94a3b8"]].map(([p,c])=>(
          <span key={p} className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{background:c}}/><span className="font-bold text-gray-700">{p}</span></span>
        ))}
      </div>
    </div>
  );
}
