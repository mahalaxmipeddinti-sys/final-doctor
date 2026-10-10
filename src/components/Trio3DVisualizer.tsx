// src/components/Trio3DVisualizer.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Box,
  Layers,
  Dna,
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
} from 'lucide-react';

import { TrioZygosity } from '../types/genomics.ts';

export interface Trio3DMemberData {
  relationship: 'child' | 'mother' | 'father';
  label: string;
  sampleId: string;
  geneSymbol: string;
  variantInput: string;
  zygosity: TrioZygosity;
  isAffected: boolean;
  vaf?: number;
}

export interface Trio3DVisualizerProps {
  child: Trio3DMemberData;
  mother: Trio3DMemberData;
  father: Trio3DMemberData;
  geneSymbol: string;
  variantHgvs: string;
  inheritanceCall: string;
  pathogenicityVerdict: 'PATHOGENIC_DE_NOVO' | 'INHERITED_PATHOGENIC' | 'CARRIER_STATE' | 'NORMAL_VARIANT_BENIGN' | 'NORMAL_WILDTYPE';
  verdictDescription: string;
}

export const Trio3DVisualizer: React.FC<Trio3DVisualizerProps> = ({
  child,
  mother,
  father,
  geneSymbol,
  variantHgvs,
  inheritanceCall,
  pathogenicityVerdict,
  verdictDescription,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<'child' | 'mother' | 'father' | null>(null);

  // Helper colors
  const getColorForMember = useCallback((member: Trio3DMemberData) => {
    if (member.zygosity === 'HOMOZYGOUS_ALT' || (member.relationship === 'child' && (pathogenicityVerdict === 'PATHOGENIC_DE_NOVO' || member.isAffected))) {
      return 0xf43f5e; // Rose Red
    }
    if (member.zygosity === 'HETEROZYGOUS') {
      return 0xf59e0b; // Amber
    }
    if (member.relationship === 'mother') return 0xc084fc; // Purple
    if (member.relationship === 'father') return 0x38bdf8; // Sky Blue
    return 0x10b981; // Emerald Green
  }, [pathogenicityVerdict]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Slate 950

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xc084fc, 1.5);
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xf43f5e, 2, 30);
    pointLight.position.set(0, -2, 5);
    scene.add(pointLight);

    // 3. Grid background & particles
    const gridHelper = new THREE.GridHelper(30, 30, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -6;
    scene.add(gridHelper);

    // Background floating stars/particles
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      particlePos[i] = (Math.random() - 0.5) * 40;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4,
    });
    const starField = new THREE.Points(particleGeo, particleMat);
    scene.add(starField);

    // 4. Node Coordinates
    const posFather = new THREE.Vector3(-4.5, 3.2, 0);
    const posMother = new THREE.Vector3(4.5, 3.2, 0);
    const posChild = new THREE.Vector3(0, -3.2, 0);

    const memberPosMap = {
      father: posFather,
      mother: posMother,
      child: posChild,
    };

    // Helper: Create a 3D Node with Spinning DNA Double Helix
    const createFamilyNode = (member: Trio3DMemberData, pos: THREE.Vector3) => {
      const group = new THREE.Group();
      group.position.copy(pos);

      const mainColor = getColorForMember(member);

      // Outer Glow Orb
      const sphereGeo = new THREE.SphereGeometry(1.2, 32, 32);
      const sphereMat = new THREE.MeshPhongMaterial({
        color: mainColor,
        emissive: mainColor,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.85,
        wireframe: false,
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      group.add(sphereMesh);

      // Outer Wireframe Ring
      const ringGeo = new THREE.TorusGeometry(1.6, 0.04, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({
        color: mainColor,
        transparent: true,
        opacity: 0.6,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 3;
      group.add(ringMesh);

      // Inner Spinning Mini DNA Double Helix
      const dnaGroup = new THREE.Group();
      const helixRadius = 0.5;
      const helixHeight = 1.8;
      const rungs = 12;

      for (let i = 0; i < rungs; i++) {
        const t = (i / rungs) * Math.PI * 2;
        const y = (i / rungs - 0.5) * helixHeight;

        const x1 = Math.cos(t) * helixRadius;
        const z1 = Math.sin(t) * helixRadius;

        const x2 = Math.cos(t + Math.PI) * helixRadius;
        const z2 = Math.sin(t + Math.PI) * helixRadius;

        // Base 1 sphere
        const b1Geo = new THREE.SphereGeometry(0.1, 8, 8);
        const b1Mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const b1Mesh = new THREE.Mesh(b1Geo, b1Mat);
        b1Mesh.position.set(x1, y, z1);
        dnaGroup.add(b1Mesh);

        // Base 2 sphere
        const b2Geo = new THREE.SphereGeometry(0.1, 8, 8);
        const b2Mat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
        const b2Mesh = new THREE.Mesh(b2Geo, b2Mat);
        b2Mesh.position.set(x2, y, z2);
        dnaGroup.add(b2Mesh);

        // Connecting Rung Cylinder
        const rungDistance = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
        const rungGeo = new THREE.CylinderGeometry(0.02, 0.02, rungDistance, 8);
        const rungMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.7 });
        const rungMesh = new THREE.Mesh(rungGeo, rungMat);
        rungMesh.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
        rungMesh.rotation.z = Math.PI / 2;
        rungMesh.rotation.y = -t;
        dnaGroup.add(rungMesh);
      }

      group.add(dnaGroup);
      scene.add(group);

      return { group, ringMesh, dnaGroup };
    };

    const nodeFather = createFamilyNode(father, posFather);
    const nodeMother = createFamilyNode(mother, posMother);
    const nodeChild = createFamilyNode(child, posChild);

    // 5. 3D Transmission Beams (Father -> Child, Mother -> Child)
    const createTransmissionBeam = (startPos: THREE.Vector3, endPos: THREE.Vector3, beamColor: number) => {
      const midControl = new THREE.Vector3(
        (startPos.x + endPos.x) / 2 + (startPos.x < 0 ? -1.2 : 1.2),
        (startPos.y + endPos.y) / 2,
        2
      );

      const curve = new THREE.CatmullRomCurve3([startPos, midControl, endPos]);

      // Tube Geometry for Transmission Path
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.08, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: beamColor,
        transparent: true,
        opacity: 0.45,
        wireframe: false,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tubeMesh);

      // Flowing Transmission Particles
      const pCount = 30;
      const pGeo = new THREE.BufferGeometry();
      const pPositions = new Float32Array(pCount * 3);

      for (let i = 0; i < pCount; i++) {
        const u = i / pCount;
        const pt = curve.getPoint(u);
        pPositions[i * 3] = pt.x;
        pPositions[i * 3 + 1] = pt.y;
        pPositions[i * 3 + 2] = pt.z;
      }

      pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      const pMat = new THREE.PointsMaterial({
        size: 0.25,
        color: beamColor,
        transparent: true,
        opacity: 0.9,
      });

      const pSystem = new THREE.Points(pGeo, pMat);
      scene.add(pSystem);

      return { tubeMesh, pSystem, curve, pCount };
    };

    const fatherBeamColor = father.zygosity === 'HETEROZYGOUS' ? 0xf59e0b : father.zygosity === 'HOMOZYGOUS_ALT' ? 0xf43f5e : 0x38bdf8;
    const motherBeamColor = mother.zygosity === 'HETEROZYGOUS' ? 0xf59e0b : mother.zygosity === 'HOMOZYGOUS_ALT' ? 0xf43f5e : 0xc084fc;

    const beamFather = createTransmissionBeam(posFather, posChild, fatherBeamColor);
    const beamMother = createTransmissionBeam(posMother, posChild, motherBeamColor);

    // 6. Interaction & Mouse Dragging / Rotation
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotationY = 0;
    let targetRotationX = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;

      targetRotationY += deltaX * 0.005;
      targetRotationX += deltaY * 0.005;

      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Rotate DNA double helices inside nodes
      nodeFather.dnaGroup.rotation.y = elapsedTime * 1.5;
      nodeMother.dnaGroup.rotation.y = elapsedTime * 1.5;
      nodeChild.dnaGroup.rotation.y = elapsedTime * 1.8;

      nodeFather.ringMesh.rotation.z = elapsedTime * 0.8;
      nodeMother.ringMesh.rotation.z = elapsedTime * -0.8;
      nodeChild.ringMesh.rotation.z = elapsedTime * 1.0;

      // Pulse child ring if De Novo or affected
      if (pathogenicityVerdict === 'PATHOGENIC_DE_NOVO' || child.isAffected) {
        const scale = 1 + Math.sin(elapsedTime * 4) * 0.12;
        nodeChild.group.scale.set(scale, scale, scale);
      }

      // Animate Transmission Particles along Curves
      if (isPlaying) {
        const speed = 0.4;
        [beamFather, beamMother].forEach((beam) => {
          const positions = beam.pSystem.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < beam.pCount; i++) {
            let u = ((i / beam.pCount) + (elapsedTime * speed)) % 1.0;
            const pt = beam.curve.getPoint(u);
            positions[i * 3] = pt.x;
            positions[i * 3 + 1] = pt.y;
            positions[i * 3 + 2] = pt.z;
          }
          beam.pSystem.geometry.attributes.position.needsUpdate = true;
        });
      }

      // Scene auto-rotation
      if (autoRotate && !isMouseDown) {
        targetRotationY += 0.003;
      }

      scene.rotation.y = targetRotationY;
      scene.rotation.x = Math.max(-0.5, Math.min(0.5, targetRotationX));

      // Starfield gentle movement
      starField.rotation.y = elapsedTime * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      domElem.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [child, mother, father, pathogenicityVerdict, getColorForMember, isPlaying, autoRotate]);

  return (
    <div
      className={`relative w-full ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none' : 'h-[460px] rounded-2xl'
      } bg-slate-950 overflow-hidden border border-slate-800 shadow-2xl transition-all duration-300`}
    >
      {/* ThreeJS WebGL Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left HUD: Family Gene & Verdict Banner */}
      <div className="absolute top-4 left-4 z-10 max-w-sm pointer-events-none space-y-1.5">
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-xl shadow-xl">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 text-[10px] font-mono font-bold uppercase">
              3D Spatial Trio Pedigree
            </span>
            <span className="text-xs font-bold text-slate-100 font-mono">
              {geneSymbol} ({variantHgvs})
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                Mendelian Call:
              </span>
              <span className="text-xs font-bold text-teal-300 font-mono block">
                {inheritanceCall}
              </span>
            </div>

            <div
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center space-x-1 ${
                pathogenicityVerdict === 'PATHOGENIC_DE_NOVO'
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                  : pathogenicityVerdict === 'INHERITED_PATHOGENIC'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                  : pathogenicityVerdict === 'CARRIER_STATE'
                  ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>
                {pathogenicityVerdict === 'PATHOGENIC_DE_NOVO'
                  ? 'De Novo Pathogenic'
                  : pathogenicityVerdict === 'INHERITED_PATHOGENIC'
                  ? 'Inherited Pathogenic'
                  : pathogenicityVerdict === 'CARRIER_STATE'
                  ? 'Carrier Status'
                  : 'Normal Variant / Benign'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Member Badges over 3D Nodes */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
        {/* Top Row: Father & Mother */}
        <div className="flex items-center justify-between px-8">
          {/* Father Badge */}
          <div className="bg-slate-900/90 backdrop-blur border border-sky-500/40 p-2.5 rounded-xl shadow-lg pointer-events-auto text-center space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
              FATHER ({father.sampleId})
            </span>
            <span className="text-xs font-mono font-bold text-slate-200 block">
              Zygosity: {father.zygosity === 'HOMOZYGOUS_REF_WILDTYPE' ? '0/0 (Wildtype)' : father.zygosity === 'HETEROZYGOUS' ? '0/1 (Het Carrier)' : '1/1 (Hom Alt)'}
            </span>
            <span
              className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium ${
                father.isAffected ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {father.isAffected ? 'Affected' : 'Unaffected'}
            </span>
          </div>

          {/* Mother Badge */}
          <div className="bg-slate-900/90 backdrop-blur border border-purple-500/40 p-2.5 rounded-xl shadow-lg pointer-events-auto text-center space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
              MOTHER ({mother.sampleId})
            </span>
            <span className="text-xs font-mono font-bold text-slate-200 block">
              Zygosity: {mother.zygosity === 'HOMOZYGOUS_REF_WILDTYPE' ? '0/0 (Wildtype)' : mother.zygosity === 'HETEROZYGOUS' ? '0/1 (Het Carrier)' : '1/1 (Hom Alt)'}
            </span>
            <span
              className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium ${
                mother.isAffected ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {mother.isAffected ? 'Affected' : 'Unaffected'}
            </span>
          </div>
        </div>

        {/* Bottom Row: Child (Proband) */}
        <div className="flex justify-center pb-2">
          <div className="bg-slate-900/95 backdrop-blur border border-teal-500/60 p-3 rounded-xl shadow-xl pointer-events-auto text-center space-y-1 max-w-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center justify-center space-x-1">
              <Dna className="h-3 w-3 text-teal-400" />
              <span>PROBAND / CHILD ({child.sampleId})</span>
            </span>
            <span className="text-xs font-mono font-bold text-slate-100 block">
              Genotype: {child.zygosity === 'HETEROZYGOUS' ? '0/1 (Het)' : child.zygosity === 'HOMOZYGOUS_ALT' ? '1/1 (Hom Alt)' : '0/0 (Wildtype)'}
            </span>
            <div className="text-[11px] text-slate-300 leading-tight">
              {verdictDescription}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Right HUD Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center space-x-2 bg-slate-900/90 backdrop-blur p-1.5 rounded-xl border border-slate-800 shadow-xl">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-teal-300 transition-colors"
          title={isPlaying ? 'Pause Particle Stream' : 'Play Particle Stream'}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
            autoRotate ? 'text-teal-400 bg-teal-950/50' : 'text-slate-400'
          }`}
          title="Toggle Auto Orbit"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-teal-300 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};
