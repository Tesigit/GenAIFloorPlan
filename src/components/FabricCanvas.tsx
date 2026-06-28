import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { Plan, Room } from '../types/plan';

interface FabricCanvasProps {
    plan: Plan;
    width: number;
    height: number;
    plotWidth?: number;
    plotLength?: number;
}

/* ─── Colour palette (Elite Dark Blueprint) ──── */
const ROOM_COLORS: Record<string, { fill: string; text: string }> = {
    bedroom: { fill: 'rgba(30, 64, 175, 0.3)', text: '#93c5fd' }, // Indigo with light blue text
    master: { fill: 'rgba(30, 58, 138, 0.4)', text: '#bfdbfe' },
    kitchen: { fill: 'rgba(180, 83, 9, 0.25)', text: '#fcd34d' },
    bathroom: { fill: 'rgba(88, 28, 135, 0.3)', text: '#d8b4fe' },
    toilet: { fill: 'rgba(88, 28, 135, 0.3)', text: '#d8b4fe' },
    living: { fill: 'rgba(22, 101, 52, 0.25)', text: '#86efac' },
    dining: { fill: 'rgba(154, 52, 18, 0.25)', text: '#fdba74' },
    balcony: { fill: 'rgba(157, 23, 77, 0.25)', text: '#f9a8d4' },
    hallway: { fill: 'rgba(51, 65, 85, 0.3)', text: '#cbd5e1' },
    corridor: { fill: 'rgba(51, 65, 85, 0.3)', text: '#cbd5e1' },
    pooja: { fill: 'rgba(133, 77, 14, 0.3)', text: '#fef08a' },
    study: { fill: 'rgba(7, 89, 133, 0.3)', text: '#7dd3fc' },
    store: { fill: 'rgba(55, 65, 81, 0.3)', text: '#9ca3af' },
    deck: { fill: 'rgba(31, 41, 55, 0.3)', text: '#d1d5db' },
    garden: { fill: 'rgba(21, 128, 61, 0.25)', text: '#bbf7d0' },
    stair: { fill: 'rgba(30, 41, 59, 0.5)', text: '#38bdf8' },
    lift: { fill: 'rgba(15, 23, 42, 0.5)', text: '#38bdf8' },
};

function getColor(label: string) {
    const lower = label.toLowerCase();
    for (const [key, val] of Object.entries(ROOM_COLORS)) {
        if (lower.includes(key)) return val;
    }
    return { fill: 'rgba(30, 41, 59, 0.3)', text: '#cbd5e1' };
}

const WALL_THICK = 2.5;
const OUTER_WALL = 5;
const WALL_COLOR = '#38bdf8'; // Electric Cyan for walls (Blueprint)
const BG = 'transparent';
const DOOR_COLOR = '#0ea5e9';
const FURNITURE_COLOR = '#64748b';
const FIXTURE_COLOR = '#94a3b8';

/* ─── Detect shared edges between rooms ──────────── */
interface SharedEdge {
    x: number; y: number;
    length: number;
    orientation: 'h' | 'v'; // horizontal or vertical
    room1: number;
    room2: number;
}

function findSharedEdges(rooms: Room[]): SharedEdge[] {
    const edges: SharedEdge[] = [];
    const EPS = 0.15;

    for (let i = 0; i < rooms.length; i++) {
        for (let j = i + 1; j < rooms.length; j++) {
            const a = rooms[i], b = rooms[j];
            if (!a.p1 || !a.p2 || !b.p1 || !b.p2) continue;

            // Check vertical shared wall (a.right == b.left or a.left == b.right)
            if (Math.abs(a.p2.x - b.p1.x) < EPS || Math.abs(a.p1.x - b.p2.x) < EPS) {
                const x = Math.abs(a.p2.x - b.p1.x) < EPS ? a.p2.x : a.p1.x;
                const yStart = Math.max(a.p1.y, b.p1.y);
                const yEnd = Math.min(a.p2.y, b.p2.y);
                if (yEnd - yStart > 0.5) {
                    edges.push({ x, y: yStart, length: yEnd - yStart, orientation: 'v', room1: i, room2: j });
                }
            }
            // Check horizontal shared wall (a.bottom == b.top or a.top == b.bottom)
            if (Math.abs(a.p2.y - b.p1.y) < EPS || Math.abs(a.p1.y - b.p2.y) < EPS) {
                const y = Math.abs(a.p2.y - b.p1.y) < EPS ? a.p2.y : a.p1.y;
                const xStart = Math.max(a.p1.x, b.p1.x);
                const xEnd = Math.min(a.p2.x, b.p2.x);
                if (xEnd - xStart > 0.5) {
                    edges.push({ x: xStart, y, length: xEnd - xStart, orientation: 'h', room1: i, room2: j });
                }
            }
        }
    }
    return edges;
}

/* ─── Should this pair of rooms have a door? ─────── */
function shouldHaveDoor(r1: Room, r2: Room): boolean {
    const t1 = getRoomType(r1);
    const t2 = getRoomType(r2);
    const l1 = r1.label.toLowerCase();
    const l2 = r2.label.toLowerCase();

    // Specific rules for Master Bath mapping
    if (l1 === 'master bath') {
        if (!l2.includes('master')) return false; // Master bath ONLY opens to Master bedroom
    }
    if (l2 === 'master bath') {
        if (!l1.includes('master')) return false;
    }

    // specific rules for Walk-in Closet
    if (l1.includes('closet') || l1.includes('walk')) {
        if (!t2.includes('bedroom') && !l2.includes('master')) return false;
    }
    if (l2.includes('closet') || l2.includes('walk')) {
        if (!t1.includes('bedroom') && !l1.includes('master')) return false;
    }

    // Guest bathrooms or Bathroom 2 should NOT connect to any bedroom (they connect to living/dining)
    if (l1.includes('bathroom') && !l1.includes('master') && t2 === 'bedroom') return false;
    if (l2.includes('bathroom') && !l2.includes('master') && t1 === 'bedroom') return false;

    // Types that should NEVER have doors between them
    const noDoorTypes = new Set(['garden', 'corridor', 'hallway']);
    if (noDoorTypes.has(t1) || noDoorTypes.has(t2)) return false;

    // Specific rules for Entry Foyer / Front Balcony mapping
    if (l1 === 'entry foyer' || l1 === 'front balcony') {
        if (l2 !== 'living room' && l2 !== 'dining area') return false;
    }
    if (l2 === 'entry foyer' || l2 === 'front balcony') {
        if (l1 !== 'living room' && l1 !== 'dining area') return false;
    }

    // Specific pairs that should NOT have doors
    const skipPairs = new Set([
        'bedroom-bedroom',     // bedrooms don't interconnect
        'bathroom-kitchen',    // no direct access
        'kitchen-bathroom',
        'balcony-bathroom',
        'bathroom-balcony',
        'kitchen-kitchen',
        'bathroom-bathroom',
    ]);
    if (skipPairs.has(`${t1}-${t2}`)) return false;

    // Explicitly ALLOW Master Bedroom to connect to Living Room or Dining Area if needed,
    // though the above logic doesn't block it, the door logic in FabricCanvas might miss it if
    // intersection spans are too small. We will enforce general door rules.
    return true;
}

function getRoomType(r: Room): string {
    const lower = r.label.toLowerCase();
    if (lower.includes('bathroom') || lower.includes('toilet') || lower.includes('bath')) return 'bathroom';
    if (lower.includes('master') || lower.includes('bedroom')) return 'bedroom';
    if (lower.includes('kitchen')) return 'kitchen';
    if (lower.includes('living')) return 'living';
    if (lower.includes('balcony')) return 'balcony';
    if (lower.includes('hallway') || lower.includes('corridor')) return 'hallway';
    if (lower.includes('dining')) return 'dining';
    if (lower.includes('stair')) return 'stair';
    if (lower.includes('lift') || lower.includes('elevator')) return 'lift';
    return 'other';
}

const FabricCanvas: React.FC<FabricCanvasProps> = ({ plan, width, height, plotWidth, plotLength }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<any>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = new fabric.Canvas(canvasRef.current, {
            width, height, backgroundColor: BG, selection: false,
        });
        fabricCanvasRef.current = canvas;
        return () => { canvas.dispose(); fabricCanvasRef.current = null; };
    }, [width, height]);

    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !plan?.rooms?.length) return;

        const SHEET_BG = 'transparent'; // Outer background
        const PAPER_BG = '#0b1325';     // Dark navy blueprint paper

        canvas.clear();
        canvas.setBackgroundColor(SHEET_BG, canvas.renderAll.bind(canvas));

        // 1. Determine Plot Dimensions
        const pW = plotWidth || 10;
        const pH = plotLength || 10;

        // 2. Calculate Scale
        const padding = 60;
        const scale = Math.min((width - padding * 2) / pW, (height - padding * 2) / pH);

        const pxW = pW * scale;
        const pxH = pH * scale;
        const ox = (width - pxW) / 2;
        const oy = (height - pxH) / 2;

        // 3. Draw Global Blueprint Grid
        const gridColor = 'rgba(56, 189, 248, 0.05)';
        const majorGridColor = 'rgba(56, 189, 248, 0.15)';

        for (let x = ox % scale; x < width; x += scale) {
            const isMajor = Math.abs((x - ox) % (scale * 5)) < 1;
            canvas.add(new fabric.Line([x, 0, x, height], {
                stroke: isMajor ? majorGridColor : gridColor, strokeWidth: 0.5, selectable: false,
            }));
        }
        for (let y = oy % scale; y < height; y += scale) {
            const isMajor = Math.abs((y - oy) % (scale * 5)) < 1;
            canvas.add(new fabric.Line([0, y, width, y], {
                stroke: isMajor ? majorGridColor : gridColor, strokeWidth: 0.5, selectable: false,
            }));
        }

        // 4. Draw the 'Paper' base
        const paperPad = 40;
        canvas.add(new fabric.Rect({
            left: ox - paperPad, top: oy - paperPad, width: pxW + paperPad * 2, height: pxH + paperPad * 2,
            fill: PAPER_BG, shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.6)', blur: 25, offsetX: 0, offsetY: 12 }),
            selectable: false, rx: 8, ry: 8
        }));

        // 5. Draw Title
        canvas.add(new fabric.Text(`${pW}m × ${pH}m Plot Layout`, {
            left: width / 2, top: 15, fontSize: 11, fill: '#38bdf8', // Cyan text for dark theme
            fontFamily: 'Inter, system-ui, sans-serif', fontWeight: '700',
            originX: 'center', selectable: false,
        }));

        // 6. Draw Rooms
        // We use minX, minY from plan if rooms are not perfectly aligned to 0,0
        let minX = Infinity, minY = Infinity;
        const rooms = plan.rooms || [];
        rooms.forEach(r => {
            if (!r.p1 || !r.p2) return;
            minX = Math.min(minX, r.p1.x, r.p2.x);
            minY = Math.min(minY, r.p1.y, r.p2.y);
        });
        if (minX === Infinity) minX = 0;
        if (minY === Infinity) minY = 0;

        // ── Room fills (Elegant schematic zones) ──
        rooms.forEach(room => {
            if (!room.p1 || !room.p2) return;
            const rx = (room.p1.x - minX) * scale + ox;
            const ry = (room.p1.y - minY) * scale + oy;
            const rw = (room.p2.x - room.p1.x) * scale;
            const rh = (room.p2.y - room.p1.y) * scale;
            const { fill } = getColor(room.label);

            // Base fill
            canvas.add(new fabric.Rect({
                left: rx, top: ry, width: rw, height: rh,
                fill, stroke: 'transparent', selectable: false,
            }));

            // Subtle internal border for definition
            canvas.add(new fabric.Rect({
                left: rx + 1.5, top: ry + 1.5, width: rw - 3, height: rh - 3,
                fill: 'transparent', stroke: 'rgba(0,0,0,0.03)', strokeWidth: 1,
                selectable: false,
            }));
        });

        // ── Draw walls ──
        const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
        plan.rooms.forEach(room => {
            if (!room.p1 || !room.p2) return;
            const x1 = (room.p1.x - minX) * scale + ox;
            const y1 = (room.p1.y - minY) * scale + oy;
            const x2 = (room.p2.x - minX) * scale + ox;
            const y2 = (room.p2.y - minY) * scale + oy;
            edges.push(
                { x1, y1, x2: x2, y2: y1 },
                { x1, y1: y2, x2: x2, y2: y2 },
                { x1, y1, x2: x1, y2: y2 },
                { x1: x2, y1, x2: x2, y2: y2 },
            );
        });

        edges.forEach(e => {
            const isOuter =
                (Math.abs(e.x1 - ox) < 2 && Math.abs(e.x2 - ox) < 2) ||
                (Math.abs(e.x1 - (ox + pxW)) < 2 && Math.abs(e.x2 - (ox + pxW)) < 2) ||
                (Math.abs(e.y1 - oy) < 2 && Math.abs(e.y2 - oy) < 2) ||
                (Math.abs(e.y1 - (oy + pxH)) < 2 && Math.abs(e.y2 - (oy + pxH)) < 2);

            canvas.add(new fabric.Line([e.x1, e.y1, e.x2, e.y2], {
                stroke: WALL_COLOR, strokeWidth: isOuter ? OUTER_WALL : WALL_THICK,
                selectable: false,
            }));
        });

        // ── Doors & Openings ──
        const shared = findSharedEdges(rooms);
        shared.forEach(se => {
            if (!shouldHaveDoor(rooms[se.room1], rooms[se.room2])) return;

            const doorSize = Math.min(0.8 * se.length, 0.9) * scale; // ~0.9m door
            if (doorSize < 5) return;

            if (se.orientation === 'v') {
                const wallX = (se.x - minX) * scale + ox;
                const midY = (se.y - minY) * scale + oy + (se.length * scale) / 2;

                canvas.add(new fabric.Rect({
                    left: wallX - WALL_THICK, top: midY - doorSize / 2,
                    width: WALL_THICK * 2, height: doorSize,
                    fill: PAPER_BG, stroke: 'transparent',
                    selectable: false,
                }));
                const arcPath = `M ${wallX} ${midY - doorSize / 2} A ${doorSize} ${doorSize} 0 0 1 ${wallX + doorSize} ${midY - doorSize / 2}`;
                canvas.add(new fabric.Path(arcPath, {
                    fill: 'transparent', stroke: DOOR_COLOR,
                    strokeWidth: 1.2, strokeDashArray: [2, 1],
                    selectable: false,
                }));
                canvas.add(new fabric.Line(
                    [wallX, midY - doorSize / 2, wallX + doorSize, midY - doorSize / 2],
                    { stroke: DOOR_COLOR, strokeWidth: 1.2, selectable: false }
                ));
            } else {
                const wallY = (se.y - minY) * scale + oy;
                const midX = (se.x - minX) * scale + ox + (se.length * scale) / 2;

                canvas.add(new fabric.Rect({
                    left: midX - doorSize / 2, top: wallY - WALL_THICK,
                    width: doorSize, height: WALL_THICK * 2,
                    fill: PAPER_BG, stroke: 'transparent',
                    selectable: false,
                }));
                const arcPath = `M ${midX - doorSize / 2} ${wallY} A ${doorSize} ${doorSize} 0 0 0 ${midX - doorSize / 2} ${wallY + doorSize}`;
                canvas.add(new fabric.Path(arcPath, {
                    fill: 'transparent', stroke: DOOR_COLOR,
                    strokeWidth: 1.2, strokeDashArray: [2, 1],
                    selectable: false,
                }));
                canvas.add(new fabric.Line(
                    [midX - doorSize / 2, wallY, midX - doorSize / 2, wallY + doorSize],
                    { stroke: DOOR_COLOR, strokeWidth: 1.2, selectable: false }
                ));
            }
        });

        // ── Main Entrance (Refined Marker with Directional Inputs) ──
        const livingRoom = rooms.find(r => getRoomType(r) === 'living') || rooms[0];
        if (livingRoom?.p1 && livingRoom?.p2) {
            const entranceDoorSize = 1.0 * scale;
            const lrx1 = (livingRoom.p1.x - minX) * scale + ox;
            const lry1 = (livingRoom.p1.y - minY) * scale + oy;
            const lrx2 = (livingRoom.p2.x - minX) * scale + ox;
            const lry2 = (livingRoom.p2.y - minY) * scale + oy;

            // Simple logic:
            // "East" or "Right" -> Right Wall // "West" or "Left" -> Left Wall
            // "South" or "Bottom" -> Bottom Wall // "North" or "Top" -> Top Wall
            // Default based on orientation (Wide vs Deep)
            let isTop = Math.abs(livingRoom.p1.y - minY) < 0.1;
            let isLeft = Math.abs(livingRoom.p1.x - minX) < 0.1;
            let isBottom = Math.abs(livingRoom.p2.y - (minY + pH)) < 0.1;
            let isRight = Math.abs(livingRoom.p2.x - (minX + pW)) < 0.1;

            const pr = (plan as any).prompt?.toLowerCase() || "";
            if (pr.includes('east facing') || pr.includes('east door')) { isRight = true; isTop = false; isLeft = false; isBottom = false; }
            else if (pr.includes('west facing') || pr.includes('west door')) { isLeft = true; isTop = false; isRight = false; isBottom = false; }
            else if (pr.includes('south facing') || pr.includes('south door')) { isBottom = true; isTop = false; isRight = false; isLeft = false; }
            else if (pr.includes('north facing') || pr.includes('north door')) { isTop = true; isBottom = false; isRight = false; isLeft = false; }

            let doorX: number, doorY: number, isHorizontalDoor: boolean;

            if (isTop) { doorX = lrx1 + (lrx2 - lrx1) * 0.3; doorY = lry1; isHorizontalDoor = true; }
            else if (isBottom) { doorX = lrx1 + (lrx2 - lrx1) * 0.3; doorY = lry2; isHorizontalDoor = true; }
            else if (isRight) { doorX = lrx2; doorY = lry1 + (lry2 - lry1) * 0.3; isHorizontalDoor = false; }
            else if (isLeft) { doorX = lrx1; doorY = lry1 + (lry2 - lry1) * 0.3; isHorizontalDoor = false; }
            else { doorX = lrx1 + (lrx2 - lrx1) * 0.3; doorY = lry1; isHorizontalDoor = true; }

            const doorColor = '#10b981'; // Emerald Entry

            if (isHorizontalDoor) {
                // Top or Bottom Wall Door
                const yOffset = doorY === lry1 ? -OUTER_WALL : -OUTER_WALL;

                canvas.add(new fabric.Rect({ left: doorX - 2, top: doorY + yOffset, width: entranceDoorSize + 4, height: OUTER_WALL * 2, fill: PAPER_BG, stroke: 'transparent', selectable: false }));
                const arcPath = `M ${doorX} ${doorY} A ${entranceDoorSize} ${entranceDoorSize} 0 0 0 ${doorX + entranceDoorSize} ${doorY}`;
                canvas.add(new fabric.Path(arcPath, { fill: 'rgba(16,185,129,0.03)', stroke: doorColor, strokeWidth: 1, selectable: false }));
                canvas.add(new fabric.Line([doorX, doorY, doorX, doorY + (doorY === lry1 ? -entranceDoorSize : entranceDoorSize)], { stroke: doorColor, strokeWidth: 1.5, selectable: false }));
                canvas.add(new fabric.Text('MAIN ENTRY', { left: doorX + entranceDoorSize / 2, top: doorY + (doorY === lry1 ? -14 : 14), fontSize: 7, fill: doorColor, fontWeight: '800', fontFamily: 'Inter, system-ui, sans-serif', tracking: 1, originX: 'center', selectable: false }));
            } else {
                // Left or Right Wall Door
                const xOffset = doorX === lrx1 ? -OUTER_WALL : -OUTER_WALL;

                canvas.add(new fabric.Rect({ left: doorX + xOffset, top: doorY - 2, width: OUTER_WALL * 2, height: entranceDoorSize + 4, fill: PAPER_BG, stroke: 'transparent', selectable: false }));
                const arcPath = `M ${doorX} ${doorY} A ${entranceDoorSize} ${entranceDoorSize} 0 0 1 ${doorX} ${doorY + entranceDoorSize}`;
                canvas.add(new fabric.Path(arcPath, { fill: 'rgba(16,185,129,0.03)', stroke: doorColor, strokeWidth: 1, selectable: false }));
                canvas.add(new fabric.Line([doorX, doorY, doorX + (doorX === lrx1 ? -entranceDoorSize : entranceDoorSize), doorY], { stroke: doorColor, strokeWidth: 1.5, selectable: false }));
                canvas.add(new fabric.Text('MAIN ENTRY', { left: doorX + (doorX === lrx1 ? -14 : 14), top: doorY + entranceDoorSize / 2, fontSize: 7, fill: doorColor, fontWeight: '800', fontFamily: 'Inter, system-ui, sans-serif', tracking: 1, originX: 'center', angle: -90, selectable: false }));
            }
        }

        // ── Furniture symbols ──
        rooms.forEach(room => {
            if (!room.p1 || !room.p2) return;
            const rx = (room.p1.x - minX) * scale + ox;
            const ry = (room.p1.y - minY) * scale + oy;
            const rw = (room.p2.x - room.p1.x) * scale;
            const rh = (room.p2.y - room.p1.y) * scale;
            const type = getRoomType(room);
            if (rw < 20 || rh < 20) return;

            if (type === 'bedroom') drawBed(canvas, rx, ry, rw, rh);
            else if (type === 'bathroom') drawBathroom(canvas, rx, ry, rw, rh);
            else if (type === 'kitchen') drawKitchen(canvas, rx, ry, rw, rh);
            else if (type === 'living') drawSofa(canvas, rx, ry, rw, rh);
            else if (type === 'dining') drawDiningTable(canvas, rx, ry, rw, rh);
            else if (type === 'stair') drawStaircase(canvas, rx, ry, rw, rh);
            else if (type === 'lift') drawLift(canvas, rx, ry, rw, rh);
        });

        // ── Labels (High-End Typography) ──
        rooms.forEach(room => {
            if (!room.p1 || !room.p2) return;
            const rx = (room.p1.x - minX) * scale + ox;
            const ry = (room.p1.y - minY) * scale + oy;
            const rw = (room.p2.x - room.p1.x) * scale;
            const rh = (room.p2.y - room.p1.y) * scale;
            const { text: textColor } = getColor(room.label);

            let label = room.label.toUpperCase();
            if (rw < 60) {
                if (label.includes('BEDROOM')) label = 'BED';
                else if (label.includes('BATHROOM')) label = 'BATH';
            }

            const fontSize = Math.max(7, Math.min(10, Math.min(rw, rh) / 9));
            canvas.add(new fabric.Text(label, {
                left: rx + rw / 2, top: ry + rh / 2 - (rw > 50 ? 5 : 0),
                fontSize, fill: textColor, fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: '700', originX: 'center', originY: 'center', selectable: false,
                charSpacing: 80,
            }));

            if (rw > 50 && rh > 40) {
                const dim = `${(room.p2.x - room.p1.x).toFixed(1)} × ${(room.p2.y - room.p1.y).toFixed(1)}m`;
                canvas.add(new fabric.Text(dim, {
                    left: rx + rw / 2, top: ry + rh / 2 + fontSize * 1.1,
                    fontSize: Math.max(5, fontSize - 2), fill: textColor, opacity: 0.7,
                    fontFamily: 'Inter, system-ui, sans-serif', originX: 'center', originY: 'center', selectable: false,
                    fontWeight: '600',
                }));
            }
        });

        // ── Dimension lines (Professional Architectural Ticks) ──
        const dimColor = 'rgba(0, 0, 0, 0.3)';
        const tickSize = 4;

        // Top Dimension
        canvas.add(new fabric.Line([ox, oy - 20, ox + pxW, oy - 20], { stroke: dimColor, strokeWidth: 0.5, selectable: false }));
        // Ticks
        canvas.add(new fabric.Line([ox - tickSize, oy - 20 + tickSize, ox + tickSize, oy - 20 - tickSize], { stroke: dimColor, strokeWidth: 1, selectable: false }));
        canvas.add(new fabric.Line([ox + pxW - tickSize, oy - 20 + tickSize, ox + pxW + tickSize, oy - 20 - tickSize], { stroke: dimColor, strokeWidth: 1, selectable: false }));
        canvas.add(new fabric.Text(`${pW.toFixed(1)}m`, { left: ox + pxW / 2, top: oy - 35, fontSize: 10, fill: 'rgba(0, 0, 0, 0.5)', originX: 'center', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: '700', selectable: false }));

        // Left Dimension
        canvas.add(new fabric.Line([ox - 20, oy, ox - 20, oy + pxH], { stroke: dimColor, strokeWidth: 0.5, selectable: false }));
        // Ticks
        canvas.add(new fabric.Line([ox - 20 - tickSize, oy + tickSize, ox - 20 + tickSize, oy - tickSize], { stroke: dimColor, strokeWidth: 1, selectable: false }));
        canvas.add(new fabric.Line([ox - 20 - tickSize, oy + pxH + tickSize, ox - 20 + tickSize, oy + pxH - tickSize], { stroke: dimColor, strokeWidth: 1, selectable: false }));
        canvas.add(new fabric.Text(`${pH.toFixed(1)}m`, { left: ox - 35, top: oy + pxH / 2, fontSize: 10, fill: 'rgba(0, 0, 0, 0.5)', originX: 'center', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: '700', angle: -90, selectable: false }));

        canvas.renderAll();
    }, [plan, width, height, plotWidth, plotLength]);

    return <canvas ref={canvasRef} />;
};

/* ════════════════════════════════════════════════════
   Furniture drawing helpers  
   ════════════════════════════════════════════════════ */

function drawStaircase(canvas: any, rx: number, ry: number, rw: number, rh: number) {
    const isVertical = rh > rw;
    const steps = Math.floor((isVertical ? rh : rw) / 10);
    const stepSize = (isVertical ? rh : rw) / steps;
    
    // Draw staircase boundary
    canvas.add(new fabric.Rect({
        left: rx + 2, top: ry + 2, width: rw - 4, height: rh - 4,
        fill: 'transparent', stroke: '#64748b', strokeWidth: 1.5, selectable: false
    }));

    // Draw individual steps
    for (let i = 1; i < steps; i++) {
        if (isVertical) {
            canvas.add(new fabric.Line(
                [rx + 2, ry + i * stepSize, rx + rw - 2, ry + i * stepSize],
                { stroke: '#94a3b8', strokeWidth: 1, selectable: false }
            ));
        } else {
            canvas.add(new fabric.Line(
                [rx + i * stepSize, ry + 2, rx + i * stepSize, ry + rh - 2],
                { stroke: '#94a3b8', strokeWidth: 1, selectable: false }
            ));
        }
    }
    
    // Draw central directional arrow
    const arrColor = '#1e293b';
    const midX = rx + rw / 2;
    const midY = ry + rh / 2;
    if (isVertical) {
        canvas.add(new fabric.Line([midX, ry + rh * 0.8, midX, ry + rh * 0.2], { stroke: arrColor, strokeWidth: 1.5, selectable: false }));
        canvas.add(new fabric.Line([midX, ry + rh * 0.2, midX - 3, ry + rh * 0.2 + 4], { stroke: arrColor, strokeWidth: 1.5, selectable: false }));
        canvas.add(new fabric.Line([midX, ry + rh * 0.2, midX + 3, ry + rh * 0.2 + 4], { stroke: arrColor, strokeWidth: 1.5, selectable: false }));
    } else {
        canvas.add(new fabric.Line([rx + rw * 0.2, midY, rx + rw * 0.8, midY], { stroke: arrColor, strokeWidth: 1.5, selectable: false }));
        canvas.add(new fabric.Line([rx + rw * 0.8, midY, rx + rw * 0.8 - 4, midY - 3], { stroke: arrColor, strokeWidth: 1.5, selectable: false }));
        canvas.add(new fabric.Line([rx + rw * 0.8, midY, rx + rw * 0.8 - 4, midY + 3], { stroke: arrColor, strokeWidth: 1.5, selectable: false }));
    }
}

function drawLift(canvas: any, rx: number, ry: number, rw: number, rh: number) {
    const pad = 3;
    const lx = rx + pad;
    const ly = ry + pad;
    const lw = rw - pad * 2;
    const lh = rh - pad * 2;

    // Outer Lift Shaft Box
    canvas.add(new fabric.Rect({
        left: lx, top: ly, width: lw, height: lh,
        fill: '#f8fafc', stroke: '#1e293b', strokeWidth: 2, selectable: false
    }));

    // Inner cross (X) typical for shafts
    canvas.add(new fabric.Line([lx, ly, lx + lw, ly + lh], { stroke: '#94a3b8', strokeWidth: 1, selectable: false }));
    canvas.add(new fabric.Line([lx + lw, ly, lx, ly + lh], { stroke: '#94a3b8', strokeWidth: 1, selectable: false }));
}

function drawBed(canvas: any, rx: number, ry: number, rw: number, rh: number) {
    const bedW = rw * 0.7;
    const bedH = rh * 0.7;
    const bx = rx + (rw - bedW) / 2;
    const by = ry + (rh - bedH) / 2;

    // Headboard
    canvas.add(new fabric.Rect({
        left: bx, top: by, width: bedW, height: bedH * 0.1,
        fill: 'transparent', stroke: FURNITURE_COLOR, strokeWidth: 1.2,
        rx: 1, ry: 1, selectable: false,
    }));
    // Base frame
    canvas.add(new fabric.Rect({
        left: bx, top: by + bedH * 0.1, width: bedW, height: bedH * 0.9,
        fill: 'transparent', stroke: FURNITURE_COLOR, strokeWidth: 1,
        rx: 1, ry: 1, selectable: false,
    }));
    // Pillows
    const pW = bedW * 0.4;
    const pH = bedH * 0.2;
    [bx + bedW * 0.05, bx + bedW * 0.55].forEach(px => {
        canvas.add(new fabric.Rect({
            left: px, top: by + bedH * 0.15, width: pW, height: pH,
            fill: 'transparent', stroke: FURNITURE_COLOR, strokeWidth: 0.8,
            rx: 2, ry: 2, selectable: false,
        }));
    });
}

function drawBathroom(canvas: any, rx: number, ry: number, rw: number, rh: number) {
    const s = Math.min(rw, rh);
    const pad = s * 0.1;

    // Washbasin
    const ww = s * 0.3, wh = s * 0.2;
    canvas.add(new fabric.Rect({
        left: rx + pad, top: ry + rh - wh - pad, width: ww, height: wh,
        fill: 'transparent', stroke: FIXTURE_COLOR, strokeWidth: 1,
        rx: 3, ry: 3, selectable: false,
    }));
    canvas.add(new fabric.Circle({
        left: rx + pad + ww / 2 - 2, top: ry + rh - wh - pad + 3, radius: 1,
        fill: FIXTURE_COLOR, selectable: false
    }));

    // Commode
    const cw = s * 0.22, ch = s * 0.4;
    const cx = rx + rw - cw - pad;
    const cy = ry + rh - ch - pad;
    canvas.add(new fabric.Rect({
        left: cx, top: cy, width: cw, height: ch * 0.4,
        fill: 'transparent', stroke: FIXTURE_COLOR, strokeWidth: 1,
        rx: 1, selectable: false
    }));
    canvas.add(new fabric.Rect({
        left: cx + 2, top: cy + ch * 0.4, width: cw - 4, height: ch * 0.6,
        fill: 'transparent', stroke: FIXTURE_COLOR, strokeWidth: 1,
        rx: 8, ry: 8, selectable: false
    }));
}

function drawKitchen(canvas: any, rx: number, ry: number, rw: number, rh: number) {
    // L-shaped counter along two edges
    const cw = rw * 0.15;
    const ch = rh * 0.15;

    // Bottom counter
    canvas.add(new fabric.Rect({
        left: rx + 4, top: ry + rh - ch - 4, width: rw - 8, height: ch,
        fill: 'transparent', stroke: FURNITURE_COLOR, strokeWidth: 1.5,
        selectable: false,
    }));
    // Right counter (shorter)
    canvas.add(new fabric.Rect({
        left: rx + rw - cw - 4, top: ry + rh * 0.35, width: cw, height: rh * 0.35,
        fill: 'transparent', stroke: FURNITURE_COLOR, strokeWidth: 1.5,
        selectable: false,
    }));

    // Sink (circle in counter)
    const sinkR = Math.min(ch, cw) * 0.3;
    canvas.add(new fabric.Circle({
        left: rx + rw * 0.35 - sinkR, top: ry + rh - ch - 4 + (ch - sinkR * 2) / 2,
        radius: sinkR,
        fill: 'transparent', stroke: FIXTURE_COLOR, strokeWidth: 1,
        selectable: false,
    }));

    // Stove (4 small circles)
    const stoveX = rx + rw * 0.65;
    const stoveY = ry + rh - ch - 4 + ch / 2;
    const br = sinkR * 0.4;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => {
        canvas.add(new fabric.Circle({
            left: stoveX + dx * br * 1.3 - br, top: stoveY + dy * br * 1.3 - br,
            radius: br,
            fill: 'transparent', stroke: FIXTURE_COLOR, strokeWidth: 0.8,
            selectable: false,
        }));
    });
}

function drawSofa(canvas: any, rx: number, ry: number, rw: number, rh: number) {
    // Place TV on Left Wall (Moved strictly towards bottom corners, clear of Main Entry doors)
    const tvH = Math.min(rh * 0.4, 120);
    const tvW = Math.min(rw * 0.08, 15);
    const tvX = rx + 5;
    const tvY = ry + rh - tvH - 25; // 25px offset from the bottom-left wall

    // TV Cupboard
    canvas.add(new fabric.Rect({
        left: tvX, top: tvY, width: tvW, height: tvH,
        fill: 'transparent', stroke: FIXTURE_COLOR, strokeWidth: 1.5, selectable: false,
    }));
    // TV Screen
    canvas.add(new fabric.Rect({
        left: tvX + 2, top: tvY + tvH * 0.1, width: tvW * 0.6, height: tvH * 0.8,
        fill: FIXTURE_COLOR, opacity: 0.5, strokeWidth: 0, selectable: false,
    }));

    // Sofa facing Left Wall
    const sh = Math.min(rh * 0.5, 140);
    const sw = Math.min(rw * 0.18, 40);

    // Position sofa perfectly distant from TV, aligned with bottom axis
    const sx = tvX + tvW + Math.min(rw * 0.25, 100);
    const sy = ry + rh - sh - 25; // Matching vertical alignment with TV

    // Sofa back (right side)
    canvas.add(new fabric.Rect({
        left: sx + sw * 0.65, top: sy, width: sw * 0.35, height: sh,
        fill: 'transparent', stroke: FURNITURE_COLOR, strokeWidth: 1.5, rx: 2, ry: 2, selectable: false,
    }));
    // Sofa seat
    canvas.add(new fabric.Rect({
        left: sx, top: sy + 4, width: sw * 0.65, height: sh - 8,
        fill: 'transparent', stroke: FURNITURE_COLOR, strokeWidth: 1.5, rx: 2, ry: 2, selectable: false,
    }));
    // Armrests
    canvas.add(new fabric.Rect({
        left: sx, top: sy - sw * 0.22, width: sw, height: sw * 0.22,
        fill: 'transparent', stroke: FURNITURE_COLOR, strokeWidth: 1, rx: 2, ry: 2, selectable: false,
    }));
    canvas.add(new fabric.Rect({
        left: sx, top: sy + sh, width: sw, height: sw * 0.22,
        fill: 'transparent', stroke: FURNITURE_COLOR, strokeWidth: 1, rx: 2, ry: 2, selectable: false,
    }));

    // Coffee table
    const th = sh * 0.45;
    const tw = sw * 0.8;
    canvas.add(new fabric.Rect({
        left: sx - tw - 12, top: ry + (rh - th) / 2, width: tw, height: th,
        fill: 'transparent', stroke: FURNITURE_COLOR, strokeWidth: 1, rx: 1, ry: 1, selectable: false,
    }));
}

function drawDiningTable(canvas: any, rx: number, ry: number, rw: number, rh: number) {
    // Table in center
    const tw = rw * 0.4;
    const th = rh * 0.35;
    const tx = rx + (rw - tw) / 2;
    const ty = ry + (rh - th) / 2;

    canvas.add(new fabric.Rect({
        left: tx, top: ty, width: tw, height: th,
        fill: 'transparent', stroke: FURNITURE_COLOR, strokeWidth: 1.5,
        rx: 2, ry: 2, selectable: false,
    }));

    // Chairs (small circles around table)
    const chairR = Math.min(tw, th) * 0.1;
    const positions = [
        [tx + tw / 2, ty - chairR * 2],           // top center
        [tx + tw / 2, ty + th + chairR * 2],       // bottom center
        [tx - chairR * 2, ty + th / 2],            // left center
        [tx + tw + chairR * 2, ty + th / 2],       // right center
    ];
    positions.forEach(([cx, cy]) => {
        canvas.add(new fabric.Circle({
            left: cx - chairR, top: cy - chairR, radius: chairR,
            fill: 'transparent', stroke: FURNITURE_COLOR, strokeWidth: 1,
            selectable: false,
        }));
    });

    // Washbasin for dining area (corner)
    const wbW = Math.min(rw * 0.15, 20);
    const wbH = Math.min(rh * 0.15, 20);
    const wbX = rx + rw - wbW - 4;
    const wbY = ry + 4;
    canvas.add(new fabric.Rect({
        left: wbX, top: wbY, width: wbW, height: wbH,
        fill: 'transparent', stroke: FIXTURE_COLOR, strokeWidth: 1,
        rx: 3, ry: 3, selectable: false,
    }));
    canvas.add(new fabric.Circle({
        left: wbX + wbW / 2 - 2, top: wbY + Math.min(4, wbH / 2) - 1, radius: 1.5,
        fill: FIXTURE_COLOR, selectable: false
    }));
}

export default FabricCanvas;
