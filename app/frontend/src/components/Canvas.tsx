import React, { useRef, useEffect, useState } from "react";
import { useInstruction } from '../emulator/InstructionContext';
import { workerManager } from '../utils/workerManager';
import { Event } from "../types/Event";
import { PageEntity as Paper } from "../types/PageEntity";
import { PageEntityFactory } from "../types/PageEntityFactory";
// Instruction programming (Scratch-style)
import { deletionManager } from "../utils/deletionManager";

interface CanvasProps {
  screenWidth: number;
}

export default function Canvas({ screenWidth }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { program } = useInstruction();
  const [events, setEvents] = useState<Event[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Scratch-style instruction programming state
  interface InstructionBlock {
    id: string;
    type: 'add' | 'sub' | 'mult' | 'multu' | 'div' | 'divu' | 'mfhi' | 'mflo' | 'slt' | 'sltu' | 'lw' | 'sw' | 'beq' | 'bne' | 'lis' | 'jr' | 'jalr';
    x: number;
    y: number;
    params: { [key: string]: string };
  }
  interface CommandTemplate {
    type: InstructionBlock['type'];
    name: string;
    params: string[];
    description: string;
  }
  const commandTemplates: CommandTemplate[] = [
    { type: 'add', name: 'ADD', params: ['rd', 'rs', 'rt'], description: 'Add two registers' },
    { type: 'sub', name: 'SUB', params: ['rd', 'rs', 'rt'], description: 'Subtract two registers' },
    { type: 'mult', name: 'MULT', params: ['rs', 'rt'], description: 'Multiply (signed) stores HI:LO' },
    { type: 'multu', name: 'MULTU', params: ['rs', 'rt'], description: 'Multiply (unsigned) stores HI:LO' },
    { type: 'div', name: 'DIV', params: ['rs', 'rt'], description: 'Divide (signed) LO=quot HI=rem' },
    { type: 'divu', name: 'DIVU', params: ['rs', 'rt'], description: 'Divide (unsigned) LO=quot HI=rem' },
    { type: 'mfhi', name: 'MFHI', params: ['rd'], description: 'Move from HI to rd' },
    { type: 'mflo', name: 'MFLO', params: ['rd'], description: 'Move from LO to rd' },
    { type: 'slt', name: 'SLT', params: ['rd', 'rs', 'rt'], description: 'Set rd=1 if rs<rt (signed)' },
    { type: 'sltu', name: 'SLTU', params: ['rd', 'rs', 'rt'], description: 'Set rd=1 if rs<rt (unsigned)' },
    { type: 'lw', name: 'LW', params: ['rt', 'rs', 'offset'], description: 'Load word' },
    { type: 'sw', name: 'SW', params: ['rt', 'rs', 'offset'], description: 'Store word' },
    { type: 'beq', name: 'BEQ', params: ['rs', 'rt', 'offset'], description: 'Branch if equal' },
    { type: 'bne', name: 'BNE', params: ['rs', 'rt', 'offset'], description: 'Branch if not equal' },
    { type: 'lis', name: 'LIS', params: ['rd', 'immediate'], description: 'Load immediate' },
    { type: 'jr', name: 'JR', params: ['rs'], description: 'Jump register' },
    { type: 'jalr', name: 'JALR', params: ['rs'], description: 'Jump and link register' }
  ];
  const [instructionBlocks, setInstructionBlocks] = useState<InstructionBlock[]>([]);
  const [showInstructionBuilder, setShowInstructionBuilder] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CommandTemplate | null>(null);
  const [builderParams, setBuilderParams] = useState<{ [key: string]: string }>({});
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [scale, setScale] = useState(1);
  // Multi-touch/pinch state
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const isPinchingRef = useRef(false);
  const pinchStartDistanceRef = useRef(0);
  const pinchStartScaleRef = useRef(1);
  const pinchStartMidRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pinchStartPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [isDraggingPaper, setIsDraggingPaper] = useState(false);
  const [draggedPaperIndex, setDraggedPaperIndex] = useState(-1);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredButtonIndex, setHoveredButtonIndex] = useState(-1);
  const [isHoveringPaper, setIsHoveringPaper] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletionStatus, setDeletionStatus] = useState<{ status: string; queueSize: number } | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Load events from worker
  useEffect(() => {
    // Load instructions from worker and map to synthetic papers
    (async () => {
      try {
        const instr = await workerManager.fetchInstructions();
        // Convert to synthetic events/papers
        const now = new Date();
        const syntheticEvents: any[] = instr.map((inst, idx) => ({
          id: `inst-${inst.id}`,
          title: `L${idx + 1}: ${inst.hexCode}`,
          description: inst.assembly,
          link: '',
          x: 50 + (idx % 3) * 260,
          y: 50 + Math.floor(idx / 3) * 90,
          color: '#E6F3FF',
          buttonColor: '#0066ff',
          time: '',
          createdAt: now
        }));
        setEvents(syntheticEvents);
        setPapers(syntheticEvents.map(e => PageEntityFactory.create(e)));
      } catch (e) {
        console.error('Failed to load instructions:', e);
      }
    })();
  }, []);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const loadedEvents = await workerManager.fetchEvents();
        setEvents(prev => prev.length ? prev : loadedEvents);
        setPapers(prev => prev.length ? prev : loadedEvents.map(event => PageEntityFactory.create(event)));
      } catch (error) {
        console.error('Failed to load events:', error);
        // Fallback to empty state
        setEvents([]);
        setPapers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();

    // Cleanup workers on unmount
    return () => {
      workerManager.destroy();
      deletionManager.destroy();
    };
  }, []);

  // Monitor deletion status with callbacks
  useEffect(() => {
    const handleDeletionUpdate = (response: any) => {
      if (response.type === 'BATCH_DELETION_SUCCESS' || response.type === 'STATUS_UPDATE') {
        if (response.payload) {
          setDeletionStatus({
            status: response.payload.status || 'idle',
            queueSize: response.payload.queueSize || 0
          });
        }
      }
    };

    // Add callback for real-time updates
    deletionManager.addCallback(handleDeletionUpdate);

    // Get initial status
    const getInitialStatus = async () => {
      if (deletionManager.isAvailable()) {
        try {
          const status = await deletionManager.getStatus();
          if (status) {
            setDeletionStatus(status);
          }
        } catch (error) {
          // Silently handle timeout errors
          if (error instanceof Error && !error.message.includes('timeout')) {
            console.error('Failed to get initial deletion status:', error);
          }
        }
      }
    };

    getInitialStatus();

    return () => {
      deletionManager.removeCallback(handleDeletionUpdate);
    };
  }, []);

  // Setup canvas and animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match container (with small margin)
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth - 4;
      canvas.height = window.innerHeight - 4;
    };
    
    updateCanvasSize();

    // Center world origin (0,0) at the screen center on initial load
    if (panOffset.x === 0 && panOffset.y === 0) {
      setPanOffset({ x: canvas.width / 2, y: canvas.height / 2 });
    }

    // Draw function to continuously update the canvas
    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Save context for panning
      ctx.save();
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(scale, scale);
      
      // Draw white bulletin board background (infinite)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(-10000, -10000, 20000, 20000); // Cover entire infinite area
      
      // Add infinite grid pattern across entire canvas
      ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
      ctx.lineWidth = 1;
      const gridSize = 50;
      
      // Draw vertical lines across entire infinite area
      for (let x = -10000; x < 10000; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, -10000);
        ctx.lineTo(x, 10000);
        ctx.stroke();
      }
      
      // Draw horizontal lines across entire infinite area
      for (let y = -10000; y < 10000; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-10000, y);
        ctx.lineTo(10000, y);
        ctx.stroke();
      }

      // Draw all papers (instruction cards rendered via PageEntity/PageEntityFactory)
      papers.forEach((paper) => paper.draw(ctx));

      
      // Restore context
      ctx.restore();

      requestAnimationFrame(draw);
    };

    // Start the draw loop
    const animationId = requestAnimationFrame(draw);

    // Event handlers for panning, dragging events, and clicking
    const handleMouseDown = (e: MouseEvent) => {
      if (isPinchingRef.current) return; // ignore presses during pinch
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const adjustedMouseX = (mouseX - panOffset.x) / scale;
      const adjustedMouseY = (mouseY - panOffset.y) / scale;

      // Enable legacy paper interactions for Visual Programmer (drag/move/delete if enabled)
      let clickedOnEvent = false;
      for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        const paper = papers[i];
        const adjustedMouseX = (mouseX - panOffset.x) / scale;
        const adjustedMouseY = (mouseY - panOffset.y) / scale;
        const isClickOnPaper = paper.hitTest(adjustedMouseX, adjustedMouseY);
        const isClickOnPushPin = paper.isClickOnPushPin(adjustedMouseX, adjustedMouseY);
        const isClickOnLinkButton = paper.isClickOnLinkButton(adjustedMouseX, adjustedMouseY);
        if (isClickOnPaper || isClickOnPushPin || isClickOnLinkButton) {
          if (isDeleteMode) {
            deleteEvent(i);
            clickedOnEvent = true;
            break;
          } else if (isClickOnLinkButton && event.link) {
            window.open(event.link, '_blank');
            clickedOnEvent = true;
            break;
          } else {
            setIsDraggingPaper(true);
            setDraggedPaperIndex(i);
            setDragOffset({ x: adjustedMouseX - event.x, y: adjustedMouseY - event.y });
            clickedOnEvent = true;
            break;
          }
        }
      }
      
      // If not clicking on an event, start panning (instructions are static for now)
      if (!clickedOnEvent) {
        setIsPanning(true);
        setLastPanPoint({ x: mouseX, y: mouseY });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      if (isPinchingRef.current) return; // pinch gesture manages its own movement

      if (isPanning) {
        const deltaX = mouseX - lastPanPoint.x;
        const deltaY = mouseY - lastPanPoint.y;
        
        setPanOffset(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
        
        setLastPanPoint({ x: mouseX, y: mouseY });
      } else if (isDraggingPaper && draggedPaperIndex >= 0) {
        const adjustedMouseX = (mouseX - panOffset.x) / scale;
        const adjustedMouseY = (mouseY - panOffset.y) / scale;
        
        const newX = adjustedMouseX - dragOffset.x;
        const newY = adjustedMouseY - dragOffset.y;
        
        setEvents(prev => prev.map((event, i) => 
          i === draggedPaperIndex ? { ...event, x: newX, y: newY } : event
        ));
        setPapers(prev => prev.map((paper, i) => 
          i === draggedPaperIndex ? PageEntityFactory.create({ ...events[draggedPaperIndex], x: newX, y: newY }) : paper
        ));
      } else {
        // Check for paper and button hover
        const adjustedMouseX = (mouseX - panOffset.x) / scale;
        const adjustedMouseY = (mouseY - panOffset.y) / scale;
        
        // Paper hover
        let paperHover = false;
        for (let i = 0; i < papers.length; i++) {
          const paper = papers[i];
          if (paper.hitTest(adjustedMouseX, adjustedMouseY) || paper.isClickOnPushPin(adjustedMouseX, adjustedMouseY)) {
            paperHover = true;
            break;
          }
        }
        setIsHoveringPaper(paperHover);

        // Link button hover
        let foundHover = false;
        for (let i = 0; i < papers.length; i++) {
          const paper = papers[i];
          if (paper.isClickOnLinkButton(adjustedMouseX, adjustedMouseY)) {
            if (hoveredButtonIndex !== i) {
              setHoveredButtonIndex(i);
              // Update paper hover state
              setPapers(prev => prev.map((p, idx) => {
                if (idx === i) {
                  p.isHoveringButton = true;
                } else {
                  p.isHoveringButton = false;
                }
                return p;
              }));
            }
            foundHover = true;
          break;
          }
        }
        
        if (!foundHover && hoveredButtonIndex !== -1) {
          setHoveredButtonIndex(-1);
          // Clear all hover states
          setPapers(prev => prev.map(paper => {
            paper.isHoveringButton = false;
            return paper;
          }));
        }
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      
      // If we were dragging a paper, update its coordinates in the database
      if (isDraggingPaper && draggedPaperIndex >= 0) {
        const latest = events[draggedPaperIndex];
        if (latest) {
          const { id, title, x, y } = latest;
          // First exit drag state immediately
          setIsDraggingPaper(false);
          setDraggedPaperIndex(-1);
          // Fire-and-forget backend update (do not await)
          workerManager.updateEvent(id, { x, y })
            .then(() => console.log(`✅ Enqueued coordinate update for paper "${title}" (${id}) to (${x}, ${y})`))
            .catch((error) => console.error('Failed to update event coordinates:', error));
          return;
        }
      }
      
      setIsDraggingPaper(false);
      setDraggedPaperIndex(-1);
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    // Pointer support for touch devices
    const handlePointerDown = (e: PointerEvent) => {
      // Track pointers for pinch
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      // Prevent browser gestures
      if (e.cancelable) e.preventDefault();
      if (activePointersRef.current.size === 2) {
        // Begin pinch
        const pts = Array.from(activePointersRef.current.values());
        const dx = pts[1].x - pts[0].x;
        const dy = pts[1].y - pts[0].y;
        const dist = Math.hypot(dx, dy);
        pinchStartDistanceRef.current = dist || 1;
        pinchStartScaleRef.current = scale;
        const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        pinchStartMidRef.current = mid;
        pinchStartPanRef.current = { ...panOffset };
        isPinchingRef.current = true;
        // cancel any dragging
        setIsDraggingPaper(false);
        setDraggedPaperIndex(-1);
        setIsPanning(false);
      } else if (activePointersRef.current.size === 1) {
        // Single pointer behaves like mouse down
        handleMouseDown(e as unknown as MouseEvent);
      }
    };
    canvas.addEventListener("pointerdown", handlePointerDown, { passive: false } as any);
    const handlePointerMove = (e: PointerEvent) => {
      if (!activePointersRef.current.has(e.pointerId)) return;
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (isPinchingRef.current && activePointersRef.current.size >= 2) {
        const pts = Array.from(activePointersRef.current.values());
        // Scale: distance change between two fingers
        const dx = pts[1].x - pts[0].x;
        const dy = pts[1].y - pts[0].y;
        const dist = Math.hypot(dx, dy) || 1;
        const rect = canvas.getBoundingClientRect();
        // Midpoint for anchoring
        const mid = { x: (pts[0].x + pts[1].x) / 2 - rect.left, y: (pts[0].y + pts[1].y) / 2 - rect.top };
        const startMid = { x: pinchStartMidRef.current.x - rect.left, y: pinchStartMidRef.current.y - rect.top };
        const s0 = pinchStartScaleRef.current;
        const s1 = Math.min(3, Math.max(0.25, s0 * (dist / pinchStartDistanceRef.current)));
        // Keep world point under the original midpoint fixed
        const worldX = (startMid.x - pinchStartPanRef.current.x) / s0;
        const worldY = (startMid.y - pinchStartPanRef.current.y) / s0;
        let newPanX = mid.x - worldX * s1;
        let newPanY = mid.y - worldY * s1;
        // Also allow panning while pinching by moving midpoint
        const midDx = mid.x - startMid.x;
        const midDy = mid.y - startMid.y;
        newPanX += midDx;
        newPanY += midDy;
        setScale(s1);
        setPanOffset({ x: newPanX, y: newPanY });
        e.preventDefault();
      }
    };
    window.addEventListener("pointermove", handlePointerMove as any, { passive: false } as any);
    const endPointer = (e: PointerEvent) => {
      activePointersRef.current.delete(e.pointerId);
      if (activePointersRef.current.size < 2) {
        isPinchingRef.current = false;
      }
    };
    window.addEventListener("pointerup", endPointer as any);
    window.addEventListener("pointercancel", endPointer as any);
    // Use window-level listeners to ensure drag end is captured even outside the canvas
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", handleMouseUp);
    // Pointer API fallbacks to guarantee release
    window.addEventListener("pointermove", handleMouseMove as any);
    window.addEventListener("pointerup", handleMouseUp as any);
    window.addEventListener("pointercancel", handleMouseUp as any);
    // End drag on tab switch or window blur
    const handleVisibility = () => handleMouseUp();
    window.addEventListener("blur", handleMouseUp);
    document.addEventListener("visibilitychange", handleVisibility);
    const handleWheel = (e: WheelEvent) => {
      // Zoom towards mouse position
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldXBefore = (mouseX - panOffset.x) / scale;
      const worldYBefore = (mouseY - panOffset.y) / scale;

      const delta = -Math.sign(e.deltaY) * 0.1; // zoom step
      const newScale = Math.min(3, Math.max(0.25, scale + delta));
      if (newScale === scale) return;

      // Adjust panOffset so the point under the cursor stays under the cursor
      const newPanX = mouseX - worldXBefore * newScale;
      const newPanY = mouseY - worldYBefore * newScale;

      setScale(newScale);
      setPanOffset({ x: newPanX, y: newPanY });
      // Prevent page scroll/zoom outside canvas
      if (e.cancelable) e.preventDefault();
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false } as any);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", handleMouseUp);
      window.removeEventListener("pointermove", handleMouseMove as any);
      window.removeEventListener("pointerup", handleMouseUp as any);
      window.removeEventListener("pointercancel", handleMouseUp as any);
      window.removeEventListener("pointermove", handlePointerMove as any);
      window.removeEventListener("pointerup", endPointer as any);
      window.removeEventListener("pointercancel", endPointer as any);
      window.removeEventListener("blur", handleMouseUp);
      document.removeEventListener("visibilitychange", handleVisibility);
      canvas.removeEventListener("wheel", handleWheel as any);
      canvas.removeEventListener("pointerdown", handlePointerDown as any);
    };
  }, [events, papers, panOffset, isPanning, isDraggingPaper, draggedPaperIndex, dragOffset, scale]);

  // Convert program instructions to synthetic papers using PageEntity/PageEntityFactory
  useEffect(() => {
    const now = new Date();
    const syntheticEvents: any[] = program.map((inst, idx) => ({
      id: `inst-${inst.id}`,
      title: `L${idx + 1}: ${inst.hexCode}`,
      description: inst.assembly,
      link: '',
      x: 50 + (idx % 3) * 260,
      y: 50 + Math.floor(idx / 3) * 90,
      color: '#E6F3FF',
      buttonColor: '#0066ff',
      time: '',
      createdAt: now
    }));
    setEvents(syntheticEvents);
    setPapers(syntheticEvents.map(e => PageEntityFactory.create(e)));
  }, [program]);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      // Update canvas size on resize
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth - 4;
        canvas.height = window.innerHeight - (window.innerWidth < 768 ? 60 : 70);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper function to get paper color based on day of week
  const getPaperColorByDay = (date: Date): string => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayColors = [
      "#FFE4E1", // Sunday - Light Pink
      "#E6F3FF", // Monday - Light Blue
      "#F0FFF0", // Tuesday - Light Green
      "#FFF8DC", // Wednesday - Light Yellow
      "#F5F5DC", // Thursday - Beige
      "#F0E6FF", // Friday - Light Purple
      "#FFE4B5"  // Saturday - Moccasin
    ];
    return dayColors[dayOfWeek];
  };

  const addInstructionBlock = () => {
    if (!selectedTemplate) return;
    // Place near center
    const x = ((window.innerWidth / 2) - panOffset.x) / scale - 75;
    const y = ((window.innerHeight / 2) - panOffset.y) / scale - 30 + instructionBlocks.length * 70;
    const newBlock: InstructionBlock = {
      id: `inst-${Date.now()}`,
      type: selectedTemplate.type,
      x,
      y,
      params: builderParams
    };
    setInstructionBlocks(prev => [...prev, newBlock]);
    setShowInstructionBuilder(false);
    setSelectedTemplate(null);
    setBuilderParams({});
  };

  const deleteEvent = async (index: number) => {
    try {
      const eventToDelete = events[index];
      if (eventToDelete) {
        console.log(`🗑️ Deleting paper: "${eventToDelete.title}"`);
        // Remove from UI immediately for better UX
        setEvents(prev => prev.filter((_, i) => i !== index));
        setPapers(prev => prev.filter((_, i) => i !== index));
        
        // Queue for database deletion
        const deletionSuccess = await deletionManager.deleteEvent(eventToDelete.id);
        if (!deletionSuccess) {
          console.warn(`⚠️ Failed to queue paper "${eventToDelete.title}" for database deletion`);
        } else {
          console.log(`✅ Paper "${eventToDelete.title}" queued for database deletion`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to delete event:', error);
    }
  };

  return (
    <div style={{ 
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      display: "flex",
      zIndex: 1
    }}>
      {/* Collapsible Sidebar with Instruction Builder */}
      <div style={{
        width: isSidebarCollapsed ? "60px" : "250px",
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(10px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.1)",
        padding: isSidebarCollapsed ? "20px 10px" : "20px",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        transition: "width 0.3s ease, padding 0.3s ease",
        overflow: "hidden"
      }}>
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{
            width: "40px",
            height: "40px",
            background: "rgba(0, 255, 255, 0.2)",
            border: "1px solid rgba(0, 255, 255, 0.5)",
            borderRadius: "6px",
            color: "#00ffff",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            alignSelf: "flex-start"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0, 255, 255, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0, 255, 255, 0.2)";
          }}
        >
          {isSidebarCollapsed ? "▶" : "◀"}
        </button>

        {!isSidebarCollapsed && (
          <>
            <h3 style={{ color: "#00ffff", margin: "0 0 10px 0", fontSize: "18px", fontWeight: "bold" }}>
              Visual Programmer
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {commandTemplates.map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedTemplate(cmd); setBuilderParams({}); setShowInstructionBuilder(true); }}
                  style={{
                    padding: '10px',
                    background: 'rgba(0, 102, 255, 0.9)',
                    border: '1px solid rgba(0, 255, 255, 0.5)',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cmd.name}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setIsDeleteMode(!isDeleteMode)}
              style={{
                padding: '12px 16px',
                background: isDeleteMode ? 'rgba(255, 0, 0, 0.9)' : 'rgba(100, 100, 100, 0.9)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDeleteMode ? 'rgba(255, 0, 0, 1)' : 'rgba(100, 100, 100, 1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDeleteMode ? 'rgba(255, 0, 0, 0.9)' : 'rgba(100, 100, 100, 0.9)';
              }}
            >
              {isDeleteMode ? 'Exit Delete Mode' : 'Delete Mode'}
            </button>

            {/* Canvas Info */}
            <div style={{
              marginTop: "20px",
              padding: "15px",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}>
              <h4 style={{ color: "#00ffff", margin: "0 0 10px 0", fontSize: "14px" }}>
                Canvas Info
              </h4>
              <div style={{ color: "#ccc", fontSize: "12px", lineHeight: "1.4" }}>
                <div>Papers: {papers.length}</div>
                <div>Scale: {scale.toFixed(2)}x</div>
                <div>Position: ({panOffset.x.toFixed(0)}, {panOffset.y.toFixed(0)})</div>
              </div>
            </div>

            {/* Tips */}
            <div style={{
              marginTop: "10px",
              padding: "15px",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}>
              <h4 style={{ color: "#00ffff", margin: "0 0 10px 0", fontSize: "14px" }}>How to Use</h4>
              <div style={{ color: "#ccc", fontSize: "11px", lineHeight: "1.4" }}>
                <div>• Click a command to add an instruction block</div>
                <div>• Drag blocks around the canvas</div>
                <div>• Mouse wheel to zoom</div>
                <div>• Click + drag to pan</div>
                <div>• Two fingers to zoom/pan on mobile</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Canvas Area */}
      <div style={{ flex: 1, position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={window.innerWidth - (isSidebarCollapsed ? 64 : 254)}
          height={window.innerHeight - (screenWidth < 768 ? 60 : 70)}
          style={{
            display: "block",
            width: "calc(100% - 4px)",
            height: "calc(100% - 4px)",
            margin: "2px",
            cursor: (isDraggingPaper || isPanning) ? "grabbing" : (isHoveringPaper ? "grab" : "default"),
            touchAction: "none"
          }}
        />
      </div>

      {isLoading && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "20px",
          borderRadius: "8px",
          fontSize: "18px",
          zIndex: 1000
        }}>
          Loading events...
        </div>
      )}

      {/* Deletion Status Indicator */}
      {deletionStatus && deletionStatus.queueSize > 0 && (
        <div style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          background: deletionStatus.status === 'processing' ? "#ff9800" : "#4caf50",
          color: "white",
          padding: "8px 12px",
          borderRadius: "4px",
          fontSize: "12px",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "5px"
        }}>
          <span>🗑️</span>
          <span>
            {deletionStatus.status === 'processing' 
              ? `Deleting ${deletionStatus.queueSize} events...` 
              : `${deletionStatus.queueSize} events queued for deletion`}
          </span>
        </div>
      )}

      {/* Instruction builder modal is handled inline via sidebar buttons in this version */}
    </div>
  );
}
