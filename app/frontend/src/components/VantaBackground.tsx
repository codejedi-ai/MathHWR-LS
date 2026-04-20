import { useEffect, useRef, useState } from 'preact/hooks';

// Import Vanta.js effects
declare global {
  interface Window {
    VANTA: {
      WAVES: (options: any) => any;
      FOG: (options: any) => any;
      CLOUDS: (options: any) => any;
      BIRDS: (options: any) => any;
      NET: (options: any) => any;
      TOPOLOGY: (options: any) => any;
      HALO: (options: any) => any;
    };
  }
}

export default function VantaBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const vantaEffectRef = useRef<any>(null);
  const [currentEffect, setCurrentEffect] = useState('WAVES');

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !window.VANTA) return;

    // Clean up previous effect
    if (vantaEffectRef.current) {
      vantaEffectRef.current.destroy();
    }

    // Create Vanta.js effect based on current selection
    const createEffect = () => {
      const commonOptions = {
        el: container,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00
      };

      switch (currentEffect) {
        case 'WAVES':
          return window.VANTA.WAVES({
            ...commonOptions,
            color: 0x001122,
            shininess: 50.00,
            waveHeight: 20.00,
            waveSpeed: 0.75,
            zoom: 0.75
          });
        case 'FOG':
          return window.VANTA.FOG({
            ...commonOptions,
            highlightColor: 0x00ffff,
            midtoneColor: 0x001122,
            lowlightColor: 0x000011,
            baseColor: 0x000022,
            blurFactor: 0.6,
            speed: 1.0,
            zoom: 0.8
          });
        case 'CLOUDS':
          return window.VANTA.CLOUDS({
            ...commonOptions,
            skyColor: 0x000011,
            cloudColor: 0x001122,
            cloudShadowColor: 0x000022,
            sunColor: 0x00ffff,
            sunGlareColor: 0x0088ff,
            sunlightColor: 0x004488
          });
        case 'NET':
          return window.VANTA.NET({
            ...commonOptions,
            color: 0x00ffff,
            backgroundColor: 0x000011,
            points: 15.00,
            maxDistance: 25.00,
            spacing: 18.00
          });
        case 'TOPOLOGY':
          return window.VANTA.TOPOLOGY({
            ...commonOptions,
            color: 0x00ffff,
            backgroundColor: 0x000011,
            color2: 0x0088ff
          });
        case 'HALO':
          return window.VANTA.HALO({
            ...commonOptions,
            baseColor: 0x001122,
            backgroundColor: 0x000011,
            amplitudeFactor: 0.5,
            xOffset: 0.0,
            yOffset: 0.0,
            size: 1.0
          });
        default:
          return window.VANTA.WAVES({
            ...commonOptions,
            color: 0x001122,
            shininess: 50.00,
            waveHeight: 20.00,
            waveSpeed: 0.75,
            zoom: 0.75
          });
      }
    };

    vantaEffectRef.current = createEffect();

    return () => {
      if (vantaEffectRef.current) {
        vantaEffectRef.current.destroy();
      }
    };
  }, [currentEffect]);

  // Cycle through effects every 30 seconds
  useEffect(() => {
    const effects = ['WAVES', 'FOG', 'CLOUDS', 'NET', 'TOPOLOGY', 'HALO'];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % effects.length;
      setCurrentEffect(effects[currentIndex]);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1
      }}
    />
  );
}
