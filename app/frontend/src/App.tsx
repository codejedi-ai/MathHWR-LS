
import React, { useState, useEffect } from "react";
import Navbar from "./components/navbar/Navbar";
import Canvas from "./components/Canvas";

interface AppProps {
  onNavigate?: (path: string) => void;
}

export default function App({ onNavigate }: AppProps) {
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);

    // Handle window resize for responsive design
    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{ 
            margin: 0, 
            padding: 0, 
            overflow: "auto",
            boxSizing: "border-box",
            minHeight: '100vh'
        }}>
            <Navbar screenWidth={screenWidth} />
            <Canvas screenWidth={screenWidth} />
        </div>
    );
}