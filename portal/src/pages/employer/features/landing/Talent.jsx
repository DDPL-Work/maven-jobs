import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiArrowRight, FiZap, FiTrendingUp, FiBarChart2,
    FiUsers, FiTarget, FiShield, FiChevronDown,
    FiMapPin, FiDollarSign, FiActivity, FiLayers,
    FiCheckCircle, FiPlay
} from 'react-icons/fi';
import mavenLogo from '../../../../../assets/maven-logo-BdiSsfJk.svg';
import EmployerFooter from '../../../../components/EmployerFooter';
import LandingEmployeeHeader from '../../../../components/employer/LandingEmployeeHeader';

/* ─── Orb Canvas ──────────────────────────────────────────── */
function TalentOrb() {
    const canvasRef = useRef(null);
    useEffect(() => {
        const C = canvasRef.current;
        if (!C) return;
        const ctx = C.getContext('2d');
        const W = C.width = 520, H = C.height = 520;
        const CX = W / 2, CY = H / 2, R = 130;
        let frame = 0, rY = 0, rX = 0.18;
        const st = { glow: 0.6, ring: 0, pulse: 0.4 };

        // Simple lerp animation
        let glowDir = 1, pulseDir = 1;

        const LATS = 13, LONS = 22;
        function makeSphere() {
            const pts = [];
            for (let i = 0; i <= LATS; i++) {
                const row = [];
                for (let j = 0; j <= LONS; j++) {
                    const phi = (i / LATS) * Math.PI;
                    const th = (j / LONS) * Math.PI * 2;
                    row.push([Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)]);
                }
                pts.push(row);
            }
            return pts;
        }
        const sphere = makeSphere();
        function rot([x, y, z], rx, ry) {
            const x1 = x * Math.cos(ry) + z * Math.sin(ry);
            const z1 = -x * Math.sin(ry) + z * Math.cos(ry);
            const y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
            const z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
            return [x1, y2, z2];
        }

        const DATA_NODES = [
            [0.6, 0.5, 0.62], [-0.7, 0.4, 0.59], [0.3, -0.7, 0.65],
            [-0.4, -0.55, 0.73], [0.8, -0.3, 0.52], [-0.2, 0.85, 0.49],
            [0.5, 0.3, -0.82], [-0.6, -0.4, -0.7]
        ];
        const NODE_LABELS = ['700Cr+', '2.5Cr+', 'AI', 'Live', 'Smart', 'Fast', 'Deep', 'Real'];
        const scaleV = { v: 0 };
        const scaleTarget = { v: 1 };
        let scaleActual = 0;

        function drawFrame() {
            frame++;
            if (scaleActual < 1) scaleActual = Math.min(1, scaleActual + 0.018);

            // animate glow
            st.glow += 0.012 * glowDir;
            if (st.glow > 1 || st.glow < 0.4) glowDir *= -1;
            st.pulse += 0.018 * pulseDir;
            if (st.pulse > 1 || st.pulse < 0.3) pulseDir *= -1;
            st.ring += 0.008;
            rY += 0.006;

            ctx.clearRect(0, 0, W, H);
            ctx.save();
            ctx.translate(CX, CY);
            ctx.scale(scaleActual, scaleActual);

            // outer halo
            const haR = R + 40 + st.glow * 22;
            const halo = ctx.createRadialGradient(0, 0, R * 0.5, 0, 0, haR);
            halo.addColorStop(0, `rgba(0,35,102,${0.12 * st.glow})`);
            halo.addColorStop(0.4, `rgba(16,185,129,${0.07 * st.glow})`);
            halo.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath(); ctx.arc(0, 0, haR, 0, Math.PI * 2);
            ctx.fillStyle = halo; ctx.fill();

            // sphere body
            const bg = ctx.createRadialGradient(-R * 0.28, -R * 0.28, R * 0.04, 0, 0, R);
            bg.addColorStop(0, 'rgba(120,180,255,0.24)');
            bg.addColorStop(0.2, 'rgba(20,70,200,0.82)');
            bg.addColorStop(0.55, 'rgba(0,35,102,0.96)');
            bg.addColorStop(1, 'rgba(0,8,28,1)');
            ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
            ctx.fillStyle = bg; ctx.fill();

            // wireframe
            sphere.forEach((row, ri) => {
                const isGreen = ri % 3 === 0;
                for (let j = 0; j < row.length - 1; j++) {
                    const [ax, ay, az] = rot(row[j], rX, rY);
                    const [bx, by, bz] = rot(row[j + 1], rX, rY);
                    if (az < -0.05 && bz < -0.05) continue;
                    const d = ((az + bz) / 2 + 1) / 2;
                    ctx.beginPath();
                    ctx.moveTo(ax * R, ay * R); ctx.lineTo(bx * R, by * R);
                    ctx.strokeStyle = isGreen ? `rgba(16,185,129,${d * 0.38})` : `rgba(80,148,255,${d * 0.3})`;
                    ctx.lineWidth = 0.6; ctx.stroke();
                }
            });
            // col lines
            for (let j = 0; j <= LONS; j++) {
                for (let i = 0; i < LATS; i++) {
                    const phi1 = (i / LATS) * Math.PI, phi2 = ((i + 1) / LATS) * Math.PI;
                    const th = (j / LONS) * Math.PI * 2;
                    const p1 = [Math.sin(phi1) * Math.cos(th), Math.cos(phi1), Math.sin(phi1) * Math.sin(th)];
                    const p2 = [Math.sin(phi2) * Math.cos(th), Math.cos(phi2), Math.sin(phi2) * Math.sin(th)];
                    const [ax, ay, az] = rot(p1, rX, rY);
                    const [bx, by, bz] = rot(p2, rX, rY);
                    if (az < -0.05 && bz < -0.05) continue;
                    const d = ((az + bz) / 2 + 1) / 2;
                    ctx.beginPath();
                    ctx.moveTo(ax * R, ay * R); ctx.lineTo(bx * R, by * R);
                    ctx.strokeStyle = `rgba(40,100,220,${d * 0.22})`;
                    ctx.lineWidth = 0.4; ctx.stroke();
                }
            }

            // inner glow
            const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.5);
            cg.addColorStop(0, `rgba(16,185,129,${0.25 * st.pulse})`);
            cg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath(); ctx.arc(0, 0, R * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = cg; ctx.fill();

            // rim light
            const rim = ctx.createRadialGradient(0, 0, R * 0.76, 0, 0, R);
            rim.addColorStop(0, 'rgba(0,0,0,0)');
            rim.addColorStop(1, `rgba(16,185,129,${0.24 * st.glow})`);
            ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
            ctx.fillStyle = rim; ctx.fill();

            // specular
            const spec = ctx.createRadialGradient(-R * 0.28, -R * 0.30, 0, -R * 0.22, -R * 0.24, R * 0.44);
            spec.addColorStop(0, 'rgba(255,255,255,0.28)');
            spec.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
            ctx.fillStyle = spec; ctx.fill();

            // orbital rings
            ctx.save(); ctx.rotate(st.ring * 0.18);
            ctx.beginPath(); ctx.ellipse(0, 0, R * 1.28, R * 0.16, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0,35,102,${0.6 * st.glow})`; ctx.lineWidth = 2; ctx.stroke();
            ctx.strokeStyle = `rgba(0,35,102,${0.12})`; ctx.lineWidth = 7; ctx.stroke();
            ctx.restore();

            ctx.save(); ctx.rotate(-st.ring * 0.13 + 1.1);
            ctx.beginPath(); ctx.ellipse(0, 0, R * 1.18, R * 0.21, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(16,185,129,${0.55 * st.pulse})`; ctx.lineWidth = 1.6; ctx.stroke();
            ctx.strokeStyle = `rgba(16,185,129,${0.1})`; ctx.lineWidth = 5; ctx.stroke();
            ctx.restore();

            ctx.save(); ctx.rotate(st.ring * 0.09 + 2.1); ctx.setLineDash([4, 8]);
            ctx.beginPath(); ctx.ellipse(0, 0, R * 1.44, R * 0.12, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(37,99,235,${0.26 * st.glow})`; ctx.lineWidth = 1; ctx.stroke();
            ctx.setLineDash([]); ctx.restore();

            // data nodes
            DATA_NODES.forEach(([nx, ny, nz], i) => {
                const nm = Math.sqrt(nx * nx + ny * ny + nz * nz);
                const [rx2, ry2, rz2] = rot([nx / nm, ny / nm, nz / nm], rX, rY);
                if (rz2 < 0) return;
                const d = (rz2 + 1) / 2;
                const sx = rx2 * R, sy = ry2 * R;
                const pulse = 0.5 + 0.5 * Math.sin(frame * 0.04 + i * 1.1);
                const nr = 2.8 + d * 2.2 + pulse * 1.2;
                const isBlue = i % 3 !== 0;
                const color = isBlue ? '0,35,102' : '16,185,129';
                const ng = ctx.createRadialGradient(sx, sy, 0, sx, sy, nr * 3.5);
                ng.addColorStop(0, `rgba(${color},${d * 0.55})`);
                ng.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath(); ctx.arc(sx, sy, nr * 3.5, 0, Math.PI * 2);
                ctx.fillStyle = ng; ctx.fill();
                ctx.beginPath(); ctx.arc(sx, sy, nr, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${d * 0.85})`; ctx.fill();
                // label
                if (d > 0.6) {
                    ctx.font = `bold ${Math.round(9 + d * 3)}px 'DM Sans',sans-serif`;
                    ctx.fillStyle = `rgba(255,255,255,${(d - 0.6) * 1.5})`;
                    ctx.textAlign = 'center';
                    ctx.fillText(NODE_LABELS[i], sx, sy - nr - 5);
                }
            });

            ctx.restore();
            requestAnimationFrame(drawFrame);
        }
        drawFrame();
    }, []);
    return <canvas ref={canvasRef} style={{ display: 'block', width: 460, height: 460, maxWidth: '100%' }} />;
}

/* ─── Mini Chart ──────────────────────────────────────────── */
function MiniLineChart({ color = '#10b981', data = [30, 45, 38, 60, 55, 72, 68, 85] }) {
    const max = Math.max(...data), min = Math.min(...data);
    const W = 120, H = 40;
    const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * W, y: H - ((v - min) / (max - min)) * (H - 6) - 3 }));
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    return (
        <svg width={W} height={H} style={{ display: 'block' }}>
            <defs>
                <linearGradient id={`g${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`${path} L${W},${H} L0,${H} Z`} fill={`url(#g${color.replace('#', '')})`} />
            <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3" fill={color} />
        </svg>
    );
}

/* ─── Floating Stats Card ─────────────────────────────────── */
function StatCard({ icon, label, value, change, color, bg, delay = 0 }) {
    return (
        <div style={{ background: '#fff', borderRadius: 18, padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 8px 28px rgba(0,35,102,.07)', animation: `floatIn .7s ease ${delay}s both`, minWidth: 170 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 100, background: '#ecfdf5', fontSize: 10, fontWeight: 800, color: '#059669' }}>↑ {change}</div>
            </div>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: 3 }}>{value}</div>
            <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>{label}</div>
        </div>
    );
}

/* ─── Data ────────────────────────────────────────────────── */
const CLIENTS = ['Adobe', 'Goldman Sachs', 'EY', 'PwC', 'Adani', 'Zomato', 'Royal Enfield', 'Tata Motors', 'Deloitte', 'HDFC', 'Infosys', 'Wipro'];

const FEATURES = [
    { icon: <FiUsers size={20} />, title: 'Comprehensive Talent Intelligence', desc: 'Analyze insights of target talent pool customized as per your unique requirement — helping you plan talent efficiently with 700Cr+ data points.', color: '#002366', bg: '#EEF2FF' },
    { icon: <FiBarChart2 size={20} />, title: 'Advanced Competitive Intelligence', desc: 'Benchmark your talent strategy against peers — enabling smarter hiring decisions and a stronger market advantage over competitors.', color: '#10b981', bg: '#ecfdf5' },
    { icon: <FiDollarSign size={20} />, title: 'Deeper Salary Insights', desc: 'Understand how market salaries shift across designation, departments, and location — so you always offer the right compensation.', color: '#6366f1', bg: '#EEF2FF' },
];

const MARKET_CARDS = [
    { title: 'Know where preferred talent is located', desc: 'Analyze how talent is distributed across locations, companies, industries & more.', icon: <FiMapPin size={18} />, color: '#002366', bg: '#EEF2FF', chart: [30, 42, 38, 55, 50, 66, 62, 78] },
    { title: 'Dynamic compensation analytics', desc: 'Uncover compensation insights across various combinations of industry, roles, institutes and more.', icon: <FiDollarSign size={18} />, color: '#10b981', bg: '#ecfdf5', chart: [25, 35, 48, 42, 58, 54, 70, 76] },
    { title: 'Custom-built insights', desc: 'Generate tailored insights using relevant filters and analyze data across eight key dimensions.', icon: <FiLayers size={18} />, color: '#6366f1', bg: '#f5f3ff', chart: [20, 38, 32, 50, 46, 62, 58, 80] },
];

const COMPETITIVE = [
    { title: 'Benchmark talent with competitors', desc: 'Compare your talent with competitors across compensation, workforce structure, diversity & more.', icon: <FiTarget size={18} />, color: '#002366' },
    { title: 'Track talent movement', desc: 'Track talent inflow and outflow to know where talent is coming from and moving to — across your org & competitors.', icon: <FiActivity size={18} />, color: '#10b981' },
    { title: 'Analyze workforce quality', desc: 'Benchmark your talent pedigree, longevity, and experience against competitors for effective workforce-quality evaluation.', icon: <FiTrendingUp size={18} />, color: '#6366f1' },
];

const FAQS = [
    { q: 'What is MavenJobs Talent Pulse? How can I benefit from it?', a: 'Talent Pulse is an AI-powered real-time talent intelligence platform built on insights from 700Cr+ actions by 2.5Cr+ active candidates yearly. It helps talent leaders make smarter hiring decisions, benchmark against competitors, and understand compensation trends — all in one place.' },
    { q: 'How is Talent Pulse relevant to me as a Talent Planner or TA lead?', a: 'For TA leads, Talent Pulse provides live talent availability data, salary benchmarks, competitor hiring patterns, and geographic talent distribution — giving you the intelligence to hire faster, negotiate better, and build smarter teams.' },
    { q: 'Which insights can I expect out-of-the-box?', a: 'Out-of-the-box you get: talent supply & demand by role/location, compensation benchmarks by seniority & industry, competitor workforce analysis, talent movement tracking, diversity metrics, and custom filter-based deep-dives across 8 key dimensions.' },
    { q: 'What is unique about Talent Pulse compared to other tools?', a: "Talent Pulse is unique because it's built on India's largest active candidate dataset — 2.5Cr+ real actions monthly. This means insights reflect what's actually happening in the market right now, not historical surveys or static databases." },
    { q: 'Is Talent Pulse customizable for my specific industry and roles?', a: 'Yes. Talent Pulse supports custom filter combinations across industry, role, seniority, geography, company size, and more — letting you generate highly specific insights tailored to your exact hiring mandates.' },
];

const STATS_LIVE = [
    { icon: <FiUsers size={16} />, label: 'Active Candidates', value: '2.5Cr+', change: '12% MoM', color: '#002366', bg: '#EEF2FF' },
    { icon: <FiActivity size={16} />, label: 'Actions Tracked', value: '700Cr+', change: '8% MoM', color: '#10b981', bg: '#ecfdf5' },
    { icon: <FiBarChart2 size={16} />, label: 'Data Dimensions', value: '8+', change: 'Always Live', color: '#6366f1', bg: '#f5f3ff' },
];

/* ─── Talent Intelligence Core ────────────────────────────── */
function TalentIntelligenceCore() {
    const canvasRef = useRef(null);
    useEffect(() => {
        const C = canvasRef.current;
        if (!C) return;
        const ctx = C.getContext('2d');
        const W = C.width = 560, H = C.height = 560;
        const CX = W / 2, CY = H / 2;
        let frame = 0;

        const numNodes = 120;
        const nodes = Array.from({ length: numNodes }, (_, i) => ({
            angle: Math.random() * Math.PI * 2,
            radius: 80 + Math.random() * 120,
            y: (Math.random() - 0.5) * 280,
            speed: (Math.random() > 0.5 ? 1 : -1) * (0.002 + Math.random() * 0.006),
            size: Math.random() * 2 + 1,
            color: Math.random() > 0.7 ? '#3b82f6' : (Math.random() > 0.4 ? '#10b981' : '#60a5fa'),
            pulse: Math.random() * Math.PI * 2
        }));

        function draw() {
            frame++;
            ctx.clearRect(0, 0, W, H);

            ctx.save();
            ctx.translate(CX, CY + 140);
            ctx.scale(1, 0.25);
            ctx.lineWidth = 1;
            for (let r = 40; r <= 240; r += 40) {
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(16,185,129,${(240 - r) / 240 * 0.3})`;
                ctx.stroke();
            }
            ctx.beginPath();
            ctx.moveTo(-260, 0); ctx.lineTo(260, 0);
            ctx.moveTo(0, -260); ctx.lineTo(0, 260);
            ctx.strokeStyle = 'rgba(16,185,129,0.15)';
            ctx.stroke();
            ctx.restore();

            const coreGlow = ctx.createRadialGradient(CX, CY - 20, 0, CX, CY - 20, 100);
            coreGlow.addColorStop(0, 'rgba(16,185,129,0.15)');
            coreGlow.addColorStop(0.5, 'rgba(37,99,235,0.1)');
            coreGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = coreGlow;
            ctx.beginPath(); ctx.arc(CX, CY - 20, 100, 0, Math.PI * 2); ctx.fill();

            ctx.save();
            ctx.translate(CX, CY - 20 + Math.sin(frame * 0.03) * 10);
            ctx.rotate(frame * 0.005);
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = i * Math.PI / 3;
                ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * 45, Math.sin(a) * 45);
            }
            ctx.closePath();
            ctx.strokeStyle = 'rgba(16,185,129,0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = 'rgba(5, 14, 36, 0.8)';
            ctx.fill();

            ctx.rotate(-frame * 0.01);
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = i * Math.PI / 3;
                ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * 25, Math.sin(a) * 25);
            }
            ctx.closePath();
            ctx.strokeStyle = 'rgba(59,130,246,0.9)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#fff'; ctx.fill();
            ctx.restore();

            nodes.forEach(n => {
                n.angle += n.speed;
                n.pulse += 0.05;
                n.x = Math.cos(n.angle) * n.radius;
                n.z = Math.sin(n.angle) * n.radius;
            });
            nodes.sort((a, b) => a.z - b.z);

            ctx.lineWidth = 0.5;
            for (let i = Math.floor(nodes.length / 2); i < nodes.length; i += 2) {
                const n1 = nodes[i];
                const s1 = (n1.z + 300) / 600;
                for (let j = i + 1; j < nodes.length; j += 3) {
                    const n2 = nodes[j];
                    const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y, n1.z - n2.z);
                    if (dist < 60) {
                        ctx.beginPath();
                        ctx.moveTo(CX + n1.x, CY + n1.y + Math.sin(n1.pulse) * 10);
                        ctx.lineTo(CX + n2.x, CY + n2.y + Math.sin(n2.pulse) * 10);
                        ctx.strokeStyle = `rgba(59,130,246,${(60 - dist) / 60 * 0.3 * s1})`;
                        ctx.stroke();
                    }
                }
            }

            nodes.forEach(n => {
                const scale = (n.z + 300) / 600;
                const px = CX + n.x;
                const py = CY + n.y + Math.sin(n.pulse) * 10;

                ctx.beginPath();
                ctx.arc(px, py, n.size * scale * 2, 0, Math.PI * 2);
                ctx.fillStyle = n.color;
                ctx.globalAlpha = Math.max(0.1, scale * 0.9);
                ctx.fill();

                if (n.y > 0 && Math.sin(n.pulse) > 0.8) {
                    const dropY = CY + 140 + n.z * 0.25;
                    if (py < dropY) {
                        ctx.beginPath();
                        ctx.moveTo(px, py);
                        ctx.lineTo(px, dropY);
                        const grad = ctx.createLinearGradient(0, py, 0, dropY);
                        grad.addColorStop(0, n.color);
                        grad.addColorStop(1, 'rgba(0,0,0,0)');
                        ctx.strokeStyle = grad;
                        ctx.lineWidth = Math.max(0.5, 1.5 * scale);
                        ctx.stroke();
                    }
                }
            });
            ctx.globalAlpha = 1;
            requestAnimationFrame(draw);
        }
        draw();
    }, []);
    return <canvas ref={canvasRef} style={{ display: 'block', width: 560, height: 560, maxWidth: '100%', margin: '0 auto' }} />;
}

/* ─── Main ────────────────────────────────────────────────── */
export default function Talent() {
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', company: '', phone: '' });

    useEffect(() => {
        window.scrollTo(0, 0);
        const fn = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    return (
        <div style={{ background: '#050e24', fontFamily: "'DM Sans',system-ui,sans-serif", color: '#1e293b', overflowX: 'hidden' }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--navy:#002366;--green:#10b981;--gd:#0da371;--fd:'Bricolage Grotesque',sans-serif}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes floatIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes ping{75%,100%{transform:scale(2);opacity:0}}
        @keyframes orbit{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
        @keyframes counterOrbit{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(-360deg)}}
        .feature-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:22px;padding:36px 32px;transition:all .28s cubic-bezier(.4,0,.2,1);}
        .feature-card:hover{transform:translateY(-6px);box-shadow:0 20px 48px rgba(0,35,102,.09);border-color:rgba(0,35,102,.18);}
        .market-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:20px;overflow:hidden;transition:all .28s;}
        .market-card:hover{transform:translateY(-5px);box-shadow:0 18px 44px rgba(0,35,102,.09);border-color:rgba(0,35,102,.15);}
        .comp-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:20px;padding:32px;transition:all .28s;}
        .comp-card:hover{transform:translateY(-5px);box-shadow:0 16px 40px rgba(0,35,102,.08);border-color:rgba(0,35,102,.15);}
        .cta-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;background:#10b981;color:#fff;font-weight:800;font-size:14px;border-radius:100px;border:none;cursor:pointer;font-family:var(--fd);letter-spacing:.02em;text-decoration:none;box-shadow:0 8px 24px rgba(16,185,129,.35);transition:all .25s;}
        .cta-btn:hover{background:#0da371;transform:translateY(-2px);box-shadow:0 14px 32px rgba(16,185,129,.45);}
        .cta-btn-outline{display:inline-flex;align-items:center;gap:8px;padding:13px 28px;background:rgba(255,255,255,.08);color:#fff;font-weight:800;font-size:14px;border-radius:100px;border:1.5px solid rgba(255,255,255,.22);cursor:pointer;font-family:var(--fd);text-decoration:none;transition:all .25s;backdrop-filter:blur(8px);}
        .cta-btn-outline:hover{background:rgba(255,255,255,.15);}
        .sf-field{width:100%;padding:12px 16px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;outline:none;font-size:14px;font-weight:500;color:#0f172a;font-family:'DM Sans',sans-serif;transition:border-color .2s,background .2s;}
        .sf-field:focus{border-color:rgba(0,35,102,.3);background:#fff;}
        .sf-field::placeholder{color:#94a3b8;}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:8px}
      `}</style>

            {/* ── FIXED HEADER WRAPPER ── */}
            <LandingEmployeeHeader />

            {/* ── HERO ── */}
            <section style={{ background: 'linear-gradient(135deg,#050e24 0%,#002366 58%,#1a0a4a 100%)', minHeight: '94vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: '102px 44px 0' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: .05, backgroundImage: 'radial-gradient(#fff 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
                <div style={{ position: 'absolute', top: '-15%', right: '-8%', width: 620, height: 620, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,.22) 0%,transparent 65%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-18%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,.16) 0%,transparent 65%)', pointerEvents: 'none' }} />

                <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', position: 'relative', zIndex: 2, padding: '80px 0' }}>
                    {/* Left */}
                    <div style={{ animation: 'fadeUp .85s ease both' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.28)', color: '#6ee7b7', fontSize: 10.5, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: 100, marginBottom: 26, fontFamily: 'var(--fd)', backdropFilter: 'blur(8px)' }}>
                            <div style={{ position: 'relative' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} /><div style={{ position: 'absolute', inset: -1, borderRadius: '50%', background: '#10b981', animation: 'ping 1.5s infinite' }} /></div>
                            Naukri Talent Pulse · Live
                        </div>

                        <h1 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(34px,5vw,60px)', fontWeight: 800, color: '#fff', lineHeight: 1.06, letterSpacing: '-0.04em', marginBottom: 20 }}>
                            AI-Powered<br />
                            <span style={{ color: '#10b981' }}>real-time talent</span><br />
                            intelligence.
                        </h1>

                        <p style={{ fontSize: 16.5, color: 'rgba(255,255,255,.56)', lineHeight: 1.8, marginBottom: 14, maxWidth: 460 }}>
                            Smarter hiring decisions — powered by instant insights from
                        </p>
                        <div style={{ display: 'flex', gap: 20, marginBottom: 36 }}>
                            {[{ v: '700Cr+', l: 'Actions tracked yearly' }, { v: '2.5Cr+', l: 'Active candidates' }].map((s, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, backdropFilter: 'blur(8px)' }}>
                                    <span style={{ fontFamily: 'var(--fd)', fontSize: 20, fontWeight: 800, color: '#fff' }}>{s.v}</span>
                                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', fontWeight: 600, lineHeight: 1.3 }}>{s.l}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 48 }}>
                            <a href="#demo" className="cta-btn">Request a Call Back <FiArrowRight size={15} /></a>
                            <a href="#features" className="cta-btn-outline"><FiPlay size={14} /> Watch Demo</a>
                        </div>

                        {/* Live stat cards */}
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {STATS_LIVE.map((s, i) => <StatCard key={i} {...s} delay={0.6 + i * 0.1} />)}
                        </div>
                    </div>

                    {/* Right — Intelligence Core */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', animation: 'floatIn 1s ease .3s both' }}>
                        <TalentIntelligenceCore />
                        {/* Floating Data Panels in Orbit */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 560, height: 560, animation: 'orbit 45s linear infinite', pointerEvents: 'none', zIndex: 10 }}>
                            {[
                                { title: 'Talent Density', value: 'High', trend: 'Bglr, Pune' },
                                { title: 'Time-to-Hire', value: '24 Days', trend: '-3 Days' },
                                { title: 'Skill Supply', value: '1.2M', trend: 'Active' },
                                { title: 'Competitor Attrition', value: '18.2%', trend: '-2.1%' },
                                { title: 'Market Demand', value: 'High', trend: 'IT/SaaS' },
                                { title: 'Salary Trends', value: '₹14L - 22L', trend: '+12.5%' },
                            ].map((panel, i) => {
                                const angle = (i * 60 - 30) * (Math.PI / 180); // Offset by 30deg to match hexagon corners visually
                                const radius = 210; // More compact orbit radius
                                const left = `calc(50% + ${Math.cos(angle) * radius}px)`;
                                const top = `calc(50% + ${Math.sin(angle) * radius}px)`;

                                return (
                                    <div key={i} style={{
                                        position: 'absolute', top, left,
                                        background: 'rgba(20, 30, 50, 0.7)', backdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px',
                                        boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                                        animation: `counterOrbit 45s linear infinite`,
                                        color: '#fff', minWidth: 150,
                                        pointerEvents: 'auto'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'uppercase' }}>{panel.title}</div>
                                        </div>
                                        <div style={{ fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{panel.value}</div>
                                        <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>{panel.trend}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CLIENTS MARQUEE ── */}
            <div style={{ background: '#fff', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '20px 0', overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 0 }}>
                    {[0, 1].map(k => (
                        <div key={k} style={{ display: 'flex', gap: 60, alignItems: 'center', animation: 'marquee 24s linear infinite', flexShrink: 0, paddingRight: 60 }}>
                            {CLIENTS.map((c, i) => <span key={i} style={{ fontSize: 13, fontWeight: 800, color: '#cbd5e1', letterSpacing: '.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', fontFamily: 'var(--fd)' }}>{c}</span>)}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── FEATURES ── */}
            <section id="features" style={{ background: '#fff', padding: '96px 44px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#10b981', marginBottom: 12, fontFamily: 'var(--fd)' }}>✦ Core Capabilities</div>
                        <h2 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 12 }}>What makes Talent Pulse different?</h2>
                        <div style={{ width: 44, height: 3, background: 'linear-gradient(90deg,#002366,#10b981)', borderRadius: 3, margin: '0 auto 16px' }} />
                        <p style={{ fontSize: 16, color: '#64748b', maxWidth: 560, margin: '0 auto', lineHeight: 1.75 }}>Our 200+ domain experts powered by real-time AI insights from India's largest active candidate dataset.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 26 }}>
                        {FEATURES.map((f, i) => (
                            <div key={i} className="feature-card">
                                <div style={{ width: 50, height: 50, borderRadius: 15, background: f.bg, border: `1px solid ${f.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, marginBottom: 22 }}>{f.icon}</div>
                                <h3 style={{ fontFamily: 'var(--fd)', fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>{f.title}</h3>
                                <p style={{ fontSize: 14.5, color: '#64748b', lineHeight: 1.72 }}>{f.desc}</p>
                                <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: f.color }}>
                                    Learn more <FiArrowRight size={13} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MARKET INSIGHTS ── */}
            <section id="market-insights" style={{ background: 'linear-gradient(135deg,#f0f4fb,#e8f0fe)', padding: '96px 44px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#10b981', marginBottom: 12, fontFamily: 'var(--fd)' }}>✦ Talent Market Insights</div>
                        <h2 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 12 }}>Optimise hiring with market-ready insights</h2>
                        <div style={{ width: 44, height: 3, background: 'linear-gradient(90deg,#002366,#10b981)', borderRadius: 3, margin: '0 auto' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginBottom: 48 }}>
                        {MARKET_CARDS.map((m, i) => (
                            <div key={i} className="market-card">
                                {/* Mock chart area */}
                                <div style={{ height: 160, background: `linear-gradient(135deg,${m.bg},${m.bg}88)`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '20px 20px 0', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 12, left: 16, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 100, background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,.08)', fontSize: 10, fontWeight: 800, color: m.color }}>
                                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: m.color }} /> Live Data
                                    </div>
                                    {/* Mock bar chart */}
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 90, paddingTop: 20 }}>
                                        {[55, 72, 48, 88, 64, 78, 92, 70].map((h, j) => (
                                            <div key={j} style={{ width: 14, height: `${h}%`, borderRadius: '4px 4px 0 0', background: j === 6 ? m.color : `${m.color}44`, transition: 'height .3s' }} />
                                        ))}
                                    </div>
                                    <MiniLineChart color={m.color} data={m.chart} />
                                </div>
                                <div style={{ padding: '22px 24px' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 22, padding: '0 10px', borderRadius: 100, background: m.bg, color: m.color, fontSize: 10, fontWeight: 800, marginBottom: 12, border: `1px solid ${m.color}22` }}>{m.icon} {['Location Intel', 'Comp Analytics', 'Custom Filters'][i]}</div>
                                    <h3 style={{ fontFamily: 'var(--fd)', fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{m.title}</h3>
                                    <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.68 }}>{m.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <a href="#demo" className="cta-btn">Request a Demo <FiArrowRight size={15} /></a>
                    </div>
                </div>
            </section>

            {/* ── COMPETITIVE INTEL ── */}
            <section id="competitive-intel" style={{ background: '#fff', padding: '96px 44px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#10b981', marginBottom: 12, fontFamily: 'var(--fd)' }}>✦ Competitive Workforce Insights</div>
                        <h2 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 12 }}>Compare, track, and strengthen your talent strategy</h2>
                        <div style={{ width: 44, height: 3, background: 'linear-gradient(90deg,#002366,#10b981)', borderRadius: 3, margin: '0 auto' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginBottom: 48 }}>
                        {COMPETITIVE.map((c, i) => (
                            <div key={i} className="comp-card">
                                {/* Mock analytics visual */}
                                <div style={{ height: 140, borderRadius: 14, marginBottom: 22, overflow: 'hidden', background: 'linear-gradient(135deg,#f8fafc,#f0f4fb)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    {i === 0 && (
                                        <div style={{ width: '90%' }}>
                                            {[['Competitors', '8%', '12%', '#ef4444'], ['Senior', '16%', '22%', '#f97316'], ['Mid-level', '28%', '34%', '#10b981']].map(([l, v1, v2, col], j) => (
                                                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                    <span style={{ fontSize: 10, color: '#64748b', width: 60, flexShrink: 0 }}>{l}</span>
                                                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#e2e8f0', position: 'relative', overflow: 'hidden' }}>
                                                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: v1, background: '#cbd5e1', borderRadius: 4 }} />
                                                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: v2, background: col, borderRadius: 4, opacity: .6 }} />
                                                    </div>
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: col, width: 24 }}>{v2}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {i === 1 && (
                                        <div style={{ width: '90%', display: 'flex', gap: 8, alignItems: 'flex-end', height: 100 }}>
                                            {[['Co A', 65, '#10b981'], ['Co B', 80, '#002366'], ['Co C', 45, '#f59e0b'], ['Co D', 70, '#6366f1'], ['Mine', 90, '#10b981']].map(([l, h, col], j) => (
                                                <div key={j} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                                    <div style={{ width: '100%', height: h * 0.9, background: col, borderRadius: '4px 4px 0 0', opacity: j === 4 ? 1 : .5 }} />
                                                    <span style={{ fontSize: 8.5, color: '#64748b' }}>{l}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {i === 2 && (
                                        <div style={{ position: 'relative', width: 100, height: 100 }}>
                                            <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                                                <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                                                <circle cx="50" cy="50" r="38" fill="none" stroke="#002366" strokeWidth="8" strokeLinecap="round" strokeDasharray="239" strokeDashoffset="60" />
                                                <circle cx="50" cy="50" r="24" fill="none" stroke="#10b981" strokeWidth="7" strokeLinecap="round" strokeDasharray="151" strokeDashoffset="45" />
                                            </svg>
                                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--fd)', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>87%</div>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 20, padding: '0 10px', borderRadius: 100, background: ['#EEF2FF', '#ecfdf5', '#f5f3ff'][i], color: c.color, fontSize: 10, fontWeight: 800, marginBottom: 12, border: `1px solid ${c.color}22` }}>{c.icon}</div>
                                <h3 style={{ fontFamily: 'var(--fd)', fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>{c.title}</h3>
                                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{c.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <a href="#demo" className="cta-btn">Request a Demo <FiArrowRight size={15} /></a>
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section style={{ background: 'linear-gradient(135deg,#f0f4fb,#e8f0fe)', padding: '96px 44px' }}>
                <div style={{ maxWidth: 860, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#10b981', marginBottom: 12, fontFamily: 'var(--fd)' }}>✦ Got Questions?</div>
                        <h2 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 12 }}>Frequently asked questions</h2>
                        <div style={{ width: 44, height: 3, background: 'linear-gradient(90deg,#002366,#10b981)', borderRadius: 3, margin: '0 auto' }} />
                    </div>
                    <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
                        {FAQS.map((faq, i) => (
                            <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} style={{ width: '100%', padding: '22px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', transition: 'background .2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div style={{ width: 26, height: 26, borderRadius: 8, background: expandedFaq === i ? '#002366' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .25s' }}>
                                            <span style={{ fontFamily: 'var(--fd)', fontSize: 10.5, fontWeight: 800, color: expandedFaq === i ? '#fff' : '#94a3b8' }}>{String(i + 1).padStart(2, '0')}</span>
                                        </div>
                                        <span style={{ fontSize: 15, fontWeight: 700, color: expandedFaq === i ? '#002366' : '#0f172a', transition: 'color .2s' }}>{faq.q}</span>
                                    </div>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: expandedFaq === i ? '#ecfdf5' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: expandedFaq === i ? '#10b981' : '#94a3b8', transform: expandedFaq === i ? 'rotate(180deg)' : 'none', transition: 'all .25s' }}>
                                        <FiChevronDown size={15} />
                                    </div>
                                </button>
                                <div style={{ maxHeight: expandedFaq === i ? 200 : 0, overflow: 'hidden', transition: 'max-height .35s cubic-bezier(.4,0,.2,1)' }}>
                                    <div style={{ padding: '0 30px 22px 70px', fontSize: 14, color: '#475569', lineHeight: 1.8 }}>{faq.a}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── DEMO CTA ── */}
            <section id="demo" style={{ background: '#fff', padding: '96px 44px' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <div style={{ background: 'linear-gradient(135deg,#050e24,#002366)', borderRadius: 32, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                        <div style={{ padding: '60px 52px', position: 'relative' }}>
                            <div style={{ position: 'absolute', inset: 0, opacity: .05, backgroundImage: 'radial-gradient(#fff 1px,transparent 1px)', backgroundSize: '22px 22px' }} />
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: '#6ee7b7', marginBottom: 16, fontFamily: 'var(--fd)' }}>✦ Get Started Today</div>
                                <h2 style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.1 }}>See Talent Pulse in action</h2>
                                <div style={{ width: 44, height: 3, background: 'linear-gradient(90deg,#10b981,#6ee7b7)', borderRadius: 3, marginBottom: 20 }} />
                                {['Real-time talent intelligence dashboard', 'Competitor benchmarking & salary data', 'Custom filters across 8 key dimensions', 'Dedicated onboarding & support team'].map((p, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(16,185,129,.2)', border: '1px solid rgba(16,185,129,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <FiCheckCircle size={11} color="#10b981" />
                                        </div>
                                        <span style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', fontWeight: 500 }}>{p}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ background: '#fff', padding: '52px 44px', borderLeft: '1px solid #f1f5f9' }}>
                            <div style={{ height: 3, background: 'linear-gradient(90deg,#002366,#10b981)', borderRadius: 3, marginBottom: 28 }} />
                            <h3 style={{ fontFamily: 'var(--fd)', fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 22 }}>Book your personalized demo</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
                                    <input className="sf-field" type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                                    <input className="sf-field" type="tel" placeholder="Contact Number" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
                                </div>
                                <input className="sf-field" type="email" placeholder="Work Email Address" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                                <input className="sf-field" type="text" placeholder="Company Name" value={formData.company} onChange={e => setFormData(p => ({ ...p, company: e.target.value }))} />
                                <select className="sf-field" style={{ appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', cursor: 'pointer' }}>
                                    <option value="">Team Size</option>
                                    <option>1–50 employees</option>
                                    <option>51–500 employees</option>
                                    <option>500+ employees</option>
                                </select>
                                <button className="cta-btn" style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: 12 }}>
                                    Book My Demo <FiArrowRight size={15} />
                                </button>
                            </div>
                            <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 12, fontWeight: 600 }}>No spam. Response within 2 business hours.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <EmployerFooter />
        </div>
    );
}