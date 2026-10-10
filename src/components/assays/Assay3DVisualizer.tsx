// src/components/assays/Assay3DVisualizer.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { AssayType } from '../../types/assays.ts';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  Play,
  Pause,
  Box,
  Layers,
  Dna,
  Zap,
  Crosshair,
  Eye,
  Compass,
  MousePointerClick,
  CheckCircle,
} from 'lucide-react';

export interface Subsystem3DComponent {
  id: string;
  name: string;
  subsystem: string;
  role: string;
  kinetics: string;
  clinicalRelevance: string;
  cameraZ?: number;
  rotationX?: number;
  rotationY?: number;
}

export const ASSAY_3D_COMPONENTS: Record<AssayType, Subsystem3DComponent[]> = {
  pcr: [
    {
      id: 'taq',
      name: 'Taq Polymerase Subunit',
      subsystem: 'Enzyme Catalysis',
      role: 'Thermostable DNA polymerase from Thermus aquaticus. Synthesizes 5\'->3\' nascent complementary strand.',
      kinetics: 'Extension rate ~1,000 bp/min at 72°C optimal catalytic temperature.',
      clinicalRelevance: 'Enables exponential doubling of target exon amplicon across 35 thermal cycles.',
      cameraZ: 14,
      rotationX: 0.2,
      rotationY: 0.4,
    },
    {
      id: 'helix',
      name: 'DNA Double Helix Template',
      subsystem: 'Nucleic Acid Substrate',
      role: 'Target genomic DNA template undergoing cyclical strand melting and renaturation.',
      kinetics: 'Denaturation at 95°C breaks inter-strand hydrogen bonds in <30 seconds.',
      clinicalRelevance: 'Provides patient target sequence containing candidate germline variant.',
      cameraZ: 16,
      rotationX: 0,
      rotationY: 0,
    },
    {
      id: 'primers',
      name: 'Synthetic Oligo Primers',
      subsystem: 'Sequence Specificity',
      role: 'Forward and reverse oligonucleotides (18-24 nt) hybridizing with single-base specificity.',
      kinetics: 'Annealing at 58.5°C with high hybridization stringency.',
      clinicalRelevance: 'Selectively enriches target exon without unspecific genomic amplification.',
      cameraZ: 14,
      rotationX: -0.2,
      rotationY: 0.6,
    },
    {
      id: 'dntp',
      name: 'Free dNTP Substrates',
      subsystem: 'Reaction Matrix',
      role: 'Equimolar pool of dATP, dCTP, dGTP, and dTTP supplying building blocks and energy.',
      kinetics: 'High affinity for catalytic active site with Mg2+ cofactor coordination.',
      clinicalRelevance: 'Ensures processive chain extension without premature polymerase drop-off.',
      cameraZ: 18,
      rotationX: 0.4,
      rotationY: -0.3,
    },
  ],
  sanger: [
    {
      id: 'capillary',
      name: 'Fused Silica Capillary',
      subsystem: 'Separation Matrix',
      role: '50 µm inner diameter capillary filled with POP-7 linear polyacrylamide separation polymer.',
      kinetics: 'High-voltage electric field (15 kV) induces electrokinetic migration.',
      clinicalRelevance: 'Resolves migrating DNA fragments down to single-nucleotide differences.',
      cameraZ: 15,
      rotationX: 0.1,
      rotationY: 0.3,
    },
    {
      id: 'ddntp',
      name: 'Dye-Terminator ddNTPs',
      subsystem: 'Fluorophore Chemistry',
      role: 'Dideoxynucleotides lacking 3\'-OH group labeled with BigDye Terminator fluorophores.',
      kinetics: 'Competitive incorporation halts polymerase extension at exact base positions.',
      clinicalRelevance: 'Four distinct emission spectra (FAM, HEX, NED, ROX) resolve A, C, G, T bases.',
      cameraZ: 14,
      rotationX: -0.2,
      rotationY: 0.5,
    },
    {
      id: 'laser',
      name: 'Argon-Ion Laser Detector',
      subsystem: 'Optical Detection',
      role: '488 nm excitation laser scanning the capillary optical detection window.',
      kinetics: 'CCD camera collects multi-wavelength fluorescence emission signals at 60 Hz.',
      clinicalRelevance: 'Produces 4-color electropherogram trace confirming variant peak morphology.',
      cameraZ: 16,
      rotationX: 0.3,
      rotationY: -0.2,
    },
    {
      id: 'fragments',
      name: 'Migrating DNA Fragments',
      subsystem: 'Electrophoretic Flow',
      role: 'Negatively charged single-stranded DNA fragments migrating toward positive anode.',
      kinetics: 'Migration velocity inversely proportional to logarithm of fragment length.',
      clinicalRelevance: 'Confirms heterozygous double peak at the candidate variant coordinate.',
      cameraZ: 17,
      rotationX: 0,
      rotationY: 0,
    },
  ],
  ngs: [
    {
      id: 'flowcell',
      name: 'Illumina Flow Cell Surface',
      subsystem: 'Microfluidic Substrate',
      role: 'Patterned optical glass flow cell coated with a dense lawn of P5 and P7 capture oligos.',
      kinetics: 'Microfluidic pumps deliver alternating reagents at laminar flow velocities.',
      clinicalRelevance: 'Supports simultaneous sequencing of billions of individual genomic fragments.',
      cameraZ: 16,
      rotationX: 0.4,
      rotationY: 0.2,
    },
    {
      id: 'cluster',
      name: 'Clonal Bridge Clusters',
      subsystem: 'Signal Amplification',
      role: 'Isothermal bridge amplification colonies generating ~1,000 identical template copies.',
      kinetics: 'Synchronous base incorporation provides sufficient optical intensity per cluster.',
      clinicalRelevance: 'Yields high read depth (150x+) to reliably determine variant allele frequency (VAF).',
      cameraZ: 14,
      rotationX: 0.1,
      rotationY: 0.4,
    },
    {
      id: 'terminators',
      name: 'Reversible Dye Terminators',
      subsystem: 'Sequencing Chemistry',
      role: 'Fluorescently labeled 3\'-O-azidomethyl-dNTPs terminating extension after single base.',
      kinetics: 'Cleavage step removes fluorophore and regenerates 3\'-OH group per cycle.',
      clinicalRelevance: 'Eliminates homopolymer run errors prevalent in earlier sequencing platforms.',
      cameraZ: 15,
      rotationX: -0.2,
      rotationY: 0.5,
    },
    {
      id: 'optics',
      name: 'TIRF Microscopic Imaging',
      subsystem: 'Optics & Registration',
      role: 'Total internal reflection fluorescence microscopy imaging flow cell tiles.',
      kinetics: 'High-speed CMOS cameras record tile images across 4 excitation laser lines.',
      clinicalRelevance: 'Generates base call FASTQ files with high Phred scores (>Q30 in >85% of bases).',
      cameraZ: 18,
      rotationX: 0.3,
      rotationY: -0.4,
    },
  ],
  wes: [
    {
      id: 'beads',
      name: 'Streptavidin Magnetic Beads',
      subsystem: 'Solid-Phase Capture',
      role: '1 µm superparamagnetic iron oxide beads coated with tetrameric streptavidin.',
      kinetics: 'Femtomolar binding affinity (Kd ~ 10^-14 M) for biotinylated capture hybrids.',
      clinicalRelevance: 'Physically isolates captured coding exons from non-coding genomic bulk.',
      cameraZ: 15,
      rotationX: 0.2,
      rotationY: 0.3,
    },
    {
      id: 'baits',
      name: 'Biotinylated cRNA Baits',
      subsystem: 'Hybridization Probes',
      role: '120-mer synthetic RNA oligonucleotides complementary to 214,000 CCDS coding exons.',
      kinetics: 'Liquid-phase hybridization at 65°C for 16-24 hours achieves >98% on-target rate.',
      clinicalRelevance: 'Enriches all protein-coding regions representing ~1.5% of the human genome.',
      cameraZ: 14,
      rotationX: -0.3,
      rotationY: 0.4,
    },
    {
      id: 'exon',
      name: 'Captured Exon cDNA',
      subsystem: 'Enriched Target',
      role: 'Fragmented genomic DNA specifically bound to complementary exome bait oligos.',
      kinetics: 'Non-hybridized intronic and intergenic DNA fragments are washed to waste.',
      clinicalRelevance: 'Captures target gene exons with uniform depth for diagnostic screening.',
      cameraZ: 16,
      rotationX: 0,
      rotationY: 0,
    },
    {
      id: 'magnet',
      name: 'Neodymium Magnetic Field',
      subsystem: 'Pull-Down Separation',
      role: 'External rare-earth magnet immobilizing paramagnetic beads against reaction walls.',
      kinetics: 'Bead pellet formation in <60 seconds during stringency buffer washes.',
      clinicalRelevance: 'Achieves high clean-up purity with minimal loss of target library DNA.',
      cameraZ: 18,
      rotationX: 0.4,
      rotationY: -0.2,
    },
  ],
  wgs: [
    {
      id: 'chromatin',
      name: 'Unspooling Chromatin Fiber',
      subsystem: 'Native Genome Structure',
      role: '10 nm nucleosomal chromatin unspooling for unbiased whole-genome library preparation.',
      kinetics: 'Direct enzymatic fragmentation preserving native GC distribution.',
      clinicalRelevance: 'Captures non-coding promoters, deep intronic variants, and structural junctions.',
      cameraZ: 16,
      rotationX: 0.2,
      rotationY: 0.4,
    },
    {
      id: 'histone',
      name: 'Histone Octamer Core',
      subsystem: 'Epigenomic Scaffold',
      role: 'Octameric protein spool (H2A, H2B, H3, H4) around which 147 bp of genomic DNA wraps.',
      kinetics: 'Histone removal during proteinase K digestion releases high molecular weight DNA.',
      clinicalRelevance: 'Ensures uniform extraction across heterochromatin and euchromatin.',
      cameraZ: 14,
      rotationX: -0.2,
      rotationY: 0.3,
    },
    {
      id: 'breakpoint',
      name: 'Structural Variant Breakpoint',
      subsystem: 'Cytogenomic Junction',
      role: 'Genomic locus where copy number variations, translocations, or inversions occur.',
      kinetics: 'Split-read and discordant paired-end algorithms detect breakends at 1 bp resolution.',
      clinicalRelevance: 'Discovers cryptic structural rearrangements missed by standard exome panels.',
      cameraZ: 15,
      rotationX: 0.3,
      rotationY: -0.3,
    },
    {
      id: 'genome',
      name: 'Uniform Native Genome',
      subsystem: 'Unbiased Representation',
      role: 'PCR-free library sequencing maintaining true stoichiometric allele ratios.',
      kinetics: 'Uniform 30x coverage across 3.2 Gb human reference genome.',
      clinicalRelevance: 'Gold standard for comprehensive single-test genomic characterization.',
      cameraZ: 18,
      rotationX: 0,
      rotationY: 0,
    },
  ],
  microarray: [
    {
      id: 'substrate',
      name: 'Silanized Glass Substrate',
      subsystem: 'Microarray Matrix',
      role: 'Precision microscope slide with covalently attached functional amino-silane groups.',
      kinetics: 'Robotic contact printing pins deposit microscopic oligo probe droplets.',
      clinicalRelevance: 'Hosts thousands of defined gene targets in an addressable Cartesian grid.',
      cameraZ: 16,
      rotationX: 0.5,
      rotationY: 0.2,
    },
    {
      id: 'spot',
      name: 'Hybridized Oligo Probe Spot',
      subsystem: 'Molecular Hybridization',
      role: 'Microscopic spot containing millions of identical 60-mer oligonucleotide probes.',
      kinetics: 'Competitive hybridization between patient cDNA and reference cDNA pools.',
      clinicalRelevance: 'Measures transcript abundance or genomic copy number via dual-color ratios.',
      cameraZ: 14,
      rotationX: 0.3,
      rotationY: 0.3,
    },
    {
      id: 'cy3',
      name: 'Cy3 Green Fluorophore',
      subsystem: 'Reference Control Channel',
      role: 'Cyanine 3 fluorophore excited at 532 nm labeling normal reference control sample.',
      kinetics: 'Emits intense green light (570 nm) calibrated for baseline normalization.',
      clinicalRelevance: 'Provides internal diploid reference baseline for expression calculations.',
      cameraZ: 15,
      rotationX: -0.2,
      rotationY: 0.4,
    },
    {
      id: 'cy5',
      name: 'Cy5 Red Fluorophore',
      subsystem: 'Patient Test Channel',
      role: 'Cyanine 5 fluorophore excited at 635 nm labeling patient test sample.',
      kinetics: 'Emits far-red light (670 nm); intensity directly reflects patient copy number.',
      clinicalRelevance: 'Cy5:Cy3 fluorescence ratio determines overexpression or genomic duplication.',
      cameraZ: 15,
      rotationX: 0.2,
      rotationY: -0.4,
    },
  ],
  cma: [
    {
      id: 'cytoband',
      name: 'Chromosomal Cytoband Bar',
      subsystem: 'Cytogenetic Ideogram',
      role: '3D coordinate bar representing target chromosome p-arm and q-arm cytobands.',
      kinetics: 'Directly mapped to NCBI GRCh38 genomic coordinates at sub-microscopic scale.',
      clinicalRelevance: 'Aligns copy number variations with known disease-associated cytobands.',
      cameraZ: 16,
      rotationX: 0.3,
      rotationY: 0.2,
    },
    {
      id: 'baseline',
      name: 'Diploid Baseline Probes',
      subsystem: 'Normal Autosomal Reference',
      role: 'Oligo-SNP probes displaying normalized log2 ratio ~0.0 representing 2 copies.',
      kinetics: 'Statistical smoothing filters remove probe hybridization noise.',
      clinicalRelevance: 'Confirms genomic regions unaffected by aneuploidy or microdeletions.',
      cameraZ: 14,
      rotationX: 0,
      rotationY: 0,
    },
    {
      id: 'trench',
      name: 'Microdeletion Trench',
      subsystem: 'Pathogenic CNV Locus',
      role: 'Focal depression along probe track indicating log2 copy number drop (< -0.5).',
      kinetics: 'Probe signal drops to 50% intensity reflecting single-copy heterozygous loss.',
      clinicalRelevance: 'Diagnoses microdeletion syndromes (e.g. 17q21.31 Koolen-de Vries or DiGeorge).',
      cameraZ: 14,
      rotationX: -0.3,
      rotationY: 0.4,
    },
    {
      id: 'baf',
      name: 'BAF Allele Indicator Nodes',
      subsystem: 'Allelic Frequency Analysis',
      role: 'B-allele frequency nodes tracking allelic balance (0.0 AA, 0.5 AB, 1.0 BB).',
      kinetics: 'Split loss of heterozygous band at 0.5 confirms deletion or uniparental disomy.',
      clinicalRelevance: 'Distinguishes genuine copy number loss from copy-neutral loss of heterozygosity (LOH).',
      cameraZ: 16,
      rotationX: 0.4,
      rotationY: -0.3,
    },
  ],
  genotyping: [
    {
      id: 'proband',
      name: 'Patient Proband Sphere',
      subsystem: 'Patient Sample Call',
      role: 'Pulsating purple spherical node plotting patient\'s exact Cartesian dye coordinates.',
      kinetics: 'Coordinate computed from normalized VIC (Allele 1) and FAM (Allele 2) intensities.',
      clinicalRelevance: 'Unambiguously assigns patient genotype with >99.8% confidence score.',
      cameraZ: 14,
      rotationX: 0.2,
      rotationY: 0.3,
    },
    {
      id: 'aa',
      name: 'Homozygous Ref Cluster (AA)',
      subsystem: 'Allele 1 Reference Centroid',
      role: 'Sky-blue Gaussian point-cloud cluster representing reference allele homozygotes.',
      kinetics: 'Dominant VIC fluorescence along the X-axis with zero FAM emission.',
      clinicalRelevance: 'Defines normal reference control distribution for the tested SNP marker.',
      cameraZ: 15,
      rotationX: -0.2,
      rotationY: 0.4,
    },
    {
      id: 'ab',
      name: 'Heterozygous Cluster (AB)',
      subsystem: 'Dual-Allele Centroid',
      role: 'Emerald-green diagonal cluster representing heterozygous carriers.',
      kinetics: 'Equimolar VIC and FAM probe cleavage producing 1:1 dual fluorescence.',
      clinicalRelevance: 'Confirms heterozygous carrier status matching Sanger and NGS calls.',
      cameraZ: 14,
      rotationX: 0,
      rotationY: 0,
    },
    {
      id: 'bb',
      name: 'Homozygous Alt Cluster (BB)',
      subsystem: 'Allele 2 Variant Centroid',
      role: 'Rose-red vertical cluster representing homozygous mutant controls.',
      kinetics: 'Dominant FAM fluorescence along the Y-axis with zero VIC emission.',
      clinicalRelevance: 'Identifies patients with two copies of the pathogenic risk allele.',
      cameraZ: 15,
      rotationX: 0.3,
      rotationY: -0.3,
    },
  ],
  karyotyping: [
    {
      id: 'chromatid',
      name: 'Sister Chromatid Arms',
      subsystem: 'Mitotic Chromosome Architecture',
      role: 'Duplicated metaphase chromosome arms condensed with condensin and cohesin complexes.',
      kinetics: 'Spindle checkpoint arrest at metaphase maximizes chromosome compaction.',
      clinicalRelevance: 'Allows optical inspection of constitutional ploidy and structural anomalies.',
      cameraZ: 15,
      rotationX: 0.2,
      rotationY: 0.3,
    },
    {
      id: 'centromere',
      name: 'Primary Centromeric Constriction',
      subsystem: 'Kinetochore Core',
      role: 'Heterochromatic constriction containing alphoid satellite tandem repeat DNA.',
      kinetics: 'Assembles mitotic kinetochore plates directing chromosome segregation.',
      clinicalRelevance: 'Defines p-arm (short) and q-arm (long) ratio for ISCN chromosome indexing.',
      cameraZ: 13,
      rotationX: 0,
      rotationY: 0,
    },
    {
      id: 'gpos',
      name: 'G-Positive Bands (Dark Bands)',
      subsystem: 'Heterochromatin Banding',
      role: 'AT-rich, late-replicating heterochromatin absorbing Giemsa stain heavily.',
      kinetics: 'Giemsa dye intercalates preferentially into trypsin-denatured AT regions.',
      clinicalRelevance: 'Produces characteristic 550-band landmark pattern for chromosome identification.',
      cameraZ: 14,
      rotationX: -0.2,
      rotationY: 0.4,
    },
    {
      id: 'gneg',
      name: 'G-Negative Bands (Light Bands)',
      subsystem: 'Euchromatin Banding',
      role: 'GC-rich, early-replicating transcriptionally active euchromatin.',
      kinetics: 'High concentration of CpG islands and protein-coding genes.',
      clinicalRelevance: 'Houses critical disease genes including target clinical variant locus.',
      cameraZ: 14,
      rotationX: 0.3,
      rotationY: -0.3,
    },
  ],
};

interface Assay3DVisualizerProps {
  assayType: AssayType;
  targetGene?: string;
  variantInput?: string;
  isPlaying: boolean;
  speed: number;
}

export const Assay3DVisualizer: React.FC<Assay3DVisualizerProps> = ({
  assayType,
  targetGene = 'BRCA1',
  variantInput = 'c.5266dupC',
  isPlaying,
  speed,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Zoom management
  const [currentZoom, setCurrentZoom] = useState<number>(18);

  // Interactive 3D Component Inspection State
  const [selectedComponent, setSelectedComponent] = useState<Subsystem3DComponent | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Auto-initialize selected component when assay type changes
  useEffect(() => {
    const comps = ASSAY_3D_COMPONENTS[assayType] || [];
    if (comps.length > 0) {
      setSelectedComponent(comps[0]);
    }
  }, [assayType]);

  const handleZoom = useCallback((delta: number) => {
    if (!cameraRef.current) return;
    const newDist = Math.max(6, Math.min(36, cameraRef.current.position.z + delta));
    cameraRef.current.position.z = newDist;
    setCurrentZoom(newDist);
  }, []);

  const handleResetCamera = useCallback(() => {
    if (!cameraRef.current || !groupRef.current) return;
    cameraRef.current.position.set(0, 0, 18);
    groupRef.current.rotation.set(0, 0, 0);
    setCurrentZoom(18);
  }, []);

  const handleSetCameraAngle = (view: 'iso' | 'front' | 'top') => {
    if (!cameraRef.current || !groupRef.current) return;
    if (view === 'iso') {
      cameraRef.current.position.set(0, 0, 18);
      groupRef.current.rotation.set(0.2, 0.4, 0);
    } else if (view === 'front') {
      cameraRef.current.position.set(0, 0, 16);
      groupRef.current.rotation.set(0, 0, 0);
    } else if (view === 'top') {
      cameraRef.current.position.set(0, 0, 20);
      groupRef.current.rotation.set(Math.PI / 2.2, 0, 0);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    // 1. Scene & Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712); // slate-950

    // Add subtle background particle stars / molecular mist
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 120;
    const starCoords = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starCoords[i] = (Math.random() - 0.5) * 50;
      starCoords[i + 1] = (Math.random() - 0.5) * 50;
      starCoords[i + 2] = (Math.random() - 0.5) * 40 - 10;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.15,
      transparent: true,
      opacity: 0.35,
    });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, currentZoom);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting Suite
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x2dd4bf, 2.0); // Teal key light
    dirLight1.position.set(12, 16, 12);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x818cf8, 1.5); // Indigo fill light
    dirLight2.position.set(-12, -12, -10);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xf43f5e, 1.2, 25); // Magenta rim accent
    pointLight.position.set(0, 8, 8);
    scene.add(pointLight);

    // 5. Assay Master Group
    const assayGroup = new THREE.Group();
    groupRef.current = assayGroup;
    scene.add(assayGroup);

    // Custom animation hooks per assay
    const animUpdaters: ((tick: number) => void)[] = [];

    // =========================================================================
    // MODEL 1: PCR (Polymerase Chain Reaction 3D Double Helix & Taq Polymerase)
    // =========================================================================
    if (assayType === 'pcr') {
      const numRungs = 26;
      const rungSpacing = 0.52;
      const radius = 2.4;
      const helixGroup = new THREE.Group();
      assayGroup.add(helixGroup);

      const rungs: THREE.Mesh[] = [];

      for (let i = 0; i < numRungs; i++) {
        const y = (i - numRungs / 2) * rungSpacing;
        const angle = i * 0.44;

        // Strand 1 Backbone Sphere (Teal)
        const s1 = new THREE.Mesh(
          new THREE.SphereGeometry(0.24, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0x14b8a6, roughness: 0.2, metalness: 0.1 })
        );
        s1.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        helixGroup.add(s1);

        // Strand 2 Backbone Sphere (Sky Blue)
        const s2 = new THREE.Mesh(
          new THREE.SphereGeometry(0.24, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.2, metalness: 0.1 })
        );
        s2.position.set(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius);
        helixGroup.add(s2);

        // Base-pair ladder rung
        const rungColors = [0x10b981, 0xf43f5e, 0x0ea5e9, 0xfbbf24]; // A, T, C, G
        const rung = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.09, radius * 2, 12),
          new THREE.MeshStandardMaterial({
            color: rungColors[i % rungColors.length],
            roughness: 0.3,
            emissive: rungColors[i % rungColors.length],
            emissiveIntensity: 0.3,
          })
        );
        rung.position.set(0, y, 0);
        rung.rotation.z = Math.PI / 2;
        rung.rotation.y = angle;
        helixGroup.add(rung);
        rungs.push(rung);
      }

      // Forward Primer (Glowing Cyan Oligo)
      const fwdPrimer = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 3.2, 16),
        new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x06b6d4,
          emissiveIntensity: 0.9,
          roughness: 0.1,
        })
      );
      fwdPrimer.position.set(2.4, -4.5, 0);
      helixGroup.add(fwdPrimer);

      // Reverse Primer (Glowing Magenta Oligo)
      const revPrimer = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 3.2, 16),
        new THREE.MeshStandardMaterial({
          color: 0xd946ef,
          emissive: 0xd946ef,
          emissiveIntensity: 0.9,
          roughness: 0.1,
        })
      );
      revPrimer.position.set(-2.4, 4.5, 0);
      helixGroup.add(revPrimer);

      // Catalytic Taq Polymerase Enzyme
      const taqCore = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 32, 32),
        new THREE.MeshPhysicalMaterial({
          color: 0x10b981,
          transmission: 0.6,
          opacity: 0.85,
          transparent: true,
          roughness: 0.2,
          emissive: 0x059669,
          emissiveIntensity: 0.5,
        })
      );
      taqCore.position.set(0, 1.2, 0);
      assayGroup.add(taqCore);

      // Synthesized daughter dNTP particles
      const particleGroup = new THREE.Group();
      assayGroup.add(particleGroup);
      for (let p = 0; p < 18; p++) {
        const dntp = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 12, 12),
          new THREE.MeshStandardMaterial({
            color: p % 2 === 0 ? 0x5eead4 : 0xf472b6,
            emissive: p % 2 === 0 ? 0x5eead4 : 0xf472b6,
            emissiveIntensity: 0.8,
          })
        );
        dntp.position.set(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 6
        );
        particleGroup.add(dntp);
      }

      animUpdaters.push((t) => {
        taqCore.position.y = Math.sin(t * 0.04) * 2.5;
        particleGroup.rotation.y += 0.01;
      });
    }

    // =========================================================================
    // MODEL 2: SANGER (Capillary Electrophoresis Tube & Laser Fluorescence)
    // =========================================================================
    else if (assayType === 'sanger') {
      // Silica Capillary Column
      const tubeGeo = new THREE.CylinderGeometry(0.85, 0.85, 15, 32, 1, true);
      const tubeMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35,
        roughness: 0.05,
        transmission: 0.95,
        metalness: 0.1,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      assayGroup.add(tube);

      // Upper & Lower Electrode Ring Caps
      const capMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
      const topCap = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.15, 16, 32), capMat);
      topCap.rotation.x = Math.PI / 2;
      topCap.position.set(0, 7.5, 0);
      assayGroup.add(topCap);

      const botCap = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.15, 16, 32), capMat);
      botCap.rotation.x = Math.PI / 2;
      botCap.position.set(0, -7.5, 0);
      assayGroup.add(botCap);

      // Migrating Fluorophore ddNTP Fragments (A: green, C: blue, G: silver, T: red)
      const colors = [0x10b981, 0x0ea5e9, 0xf1f5f9, 0xf43f5e];
      const frags: THREE.Mesh[] = [];
      const fragCount = 36;

      for (let i = 0; i < fragCount; i++) {
        const c = colors[i % colors.length];
        const frag = new THREE.Mesh(
          new THREE.SphereGeometry(0.24, 16, 16),
          new THREE.MeshStandardMaterial({
            color: c,
            emissive: c,
            emissiveIntensity: 0.9,
            roughness: 0.2,
          })
        );
        frag.position.set(
          (Math.random() - 0.5) * 0.6,
          (i / fragCount) * 14 - 7,
          (Math.random() - 0.5) * 0.6
        );
        assayGroup.add(frag);
        frags.push(frag);
      }

      // Argon Laser Excitation Beam Ring
      const laserRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.6, 0.1, 16, 64),
        new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xf59e0b,
          emissiveIntensity: 1.2,
        })
      );
      laserRing.rotation.x = Math.PI / 2;
      laserRing.position.set(0, 0, 0);
      assayGroup.add(laserRing);

      // Optical Photodiode Detector Sensor Box
      const detector = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 1.2, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 })
      );
      detector.position.set(2.2, 0, 0);
      assayGroup.add(detector);

      // Pulsing laser emitter ray
      const rayGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8);
      const rayMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const ray = new THREE.Mesh(rayGeo, rayMat);
      ray.rotation.z = Math.PI / 2;
      ray.position.set(1.1, 0, 0);
      assayGroup.add(ray);

      animUpdaters.push((t) => {
        frags.forEach((f, idx) => {
          f.position.y -= 0.04 * speed;
          if (f.position.y < -7.2) {
            f.position.y = 7.2;
          }
        });
        laserRing.scale.setScalar(1 + Math.sin(t * 0.1) * 0.05);
      });
    }

    // =========================================================================
    // MODEL 3: NGS PANEL (Illumina Flow Cell & SBS Bridge Clusters)
    // =========================================================================
    else if (assayType === 'ngs') {
      // Flow Cell Quartz Base Slide
      const flowBase = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.4, 12),
        new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.2, metalness: 0.3 })
      );
      assayGroup.add(flowBase);

      // Microfluidic Fluidic Channel Lanes
      for (let l = -4.5; l <= 4.5; l += 3.0) {
        const laneDivider = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.6, 12),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
        );
        laneDivider.position.set(l, 0.3, 0);
        assayGroup.add(laneDivider);
      }

      // DNA Clonal Polonies / Clusters
      const clusterColors = [0x10b981, 0x0ea5e9, 0xf59e0b, 0xf43f5e];
      const clusters: THREE.Mesh[] = [];

      for (let x = -5; x <= 5; x += 1.3) {
        for (let z = -5; z <= 5; z += 1.3) {
          const col = clusterColors[Math.floor(Math.random() * clusterColors.length)];
          const cluster = new THREE.Mesh(
            new THREE.ConeGeometry(0.4, 1.4, 16),
            new THREE.MeshStandardMaterial({
              color: col,
              emissive: col,
              emissiveIntensity: 0.7,
              roughness: 0.3,
            })
          );
          cluster.position.set(x + (Math.random() - 0.5) * 0.3, 0.9, z + (Math.random() - 0.5) * 0.3);
          assayGroup.add(cluster);
          clusters.push(cluster);
        }
      }

      // Motorized Scanning Objective Optical Bar
      const scanBar = new THREE.Mesh(
        new THREE.BoxGeometry(12.4, 0.3, 0.8),
        new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x06b6d4,
          emissiveIntensity: 0.8,
        })
      );
      scanBar.position.set(0, 2.2, 0);
      assayGroup.add(scanBar);

      // Scanning Laser Fan Projection
      const fanGeo = new THREE.PlaneGeometry(12.4, 1.4);
      const fanMat = new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      });
      const laserFan = new THREE.Mesh(fanGeo, fanMat);
      laserFan.position.set(0, 1.5, 0);
      laserFan.rotation.x = Math.PI / 4;
      assayGroup.add(laserFan);

      animUpdaters.push((t) => {
        const scanZ = Math.sin(t * 0.03 * speed) * 5;
        scanBar.position.z = scanZ;
        laserFan.position.z = scanZ;
      });
    }

    // =========================================================================
    // MODEL 4: WES (Target-Enrichment Streptavidin Magnetic Beads & Exome Baits)
    // =========================================================================
    else if (assayType === 'wes') {
      const wesGroup = new THREE.Group();
      assayGroup.add(wesGroup);

      // 3 Magnetic Beads (Streptavidin Paramagnetic Spheres)
      const beadPositions = [
        new THREE.Vector3(-3.2, 0.5, 0),
        new THREE.Vector3(3.2, 0.5, 0),
        new THREE.Vector3(0, -2.5, 1.5),
      ];

      beadPositions.forEach((pos, bIdx) => {
        const bead = new THREE.Mesh(
          new THREE.SphereGeometry(1.8, 32, 32),
          new THREE.MeshStandardMaterial({
            color: 0x78350f, // Bronze-brown iron oxide
            metalness: 0.85,
            roughness: 0.25,
          })
        );
        bead.position.copy(pos);
        wesGroup.add(bead);

        // Biotinylated RNA/DNA Exome Baits radiating outward
        for (let a = 0; a < 14; a++) {
          const theta = (a / 14) * Math.PI * 2;
          const phi = (a % 5) * 0.6;
          const baitDir = new THREE.Vector3(
            Math.cos(theta) * Math.cos(phi),
            Math.sin(phi),
            Math.sin(theta) * Math.cos(phi)
          ).normalize();

          // Bait Probe (Teal)
          const bait = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8),
            new THREE.MeshStandardMaterial({
              color: 0x14b8a6,
              emissive: 0x14b8a6,
              emissiveIntensity: 0.5,
            })
          );
          bait.position.copy(pos).add(baitDir.clone().multiplyScalar(2.2));
          bait.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), baitDir);
          wesGroup.add(bait);

          // Captured Target Exon Fragment (Purple)
          const exon = new THREE.Mesh(
            new THREE.SphereGeometry(0.22, 12, 12),
            new THREE.MeshStandardMaterial({
              color: 0xc084fc,
              emissive: 0xa855f7,
              emissiveIntensity: 0.8,
            })
          );
          exon.position.copy(pos).add(baitDir.clone().multiplyScalar(3.1));
          wesGroup.add(exon);
        }
      });

      // Free Non-Target Genomic DNA floating uncaptured (Discarded Supernatant)
      for (let n = 0; n < 24; n++) {
        const nonTarget = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 1.8, 6),
          new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 })
        );
        nonTarget.position.set(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 8
        );
        nonTarget.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        wesGroup.add(nonTarget);
      }

      animUpdaters.push((t) => {
        wesGroup.rotation.y += 0.006 * speed;
      });
    }

    // =========================================================================
    // MODEL 5: WGS (Whole Genome 3.2 Gb Chromatin Loop & SV Breakpoints)
    // =========================================================================
    else if (assayType === 'wgs') {
      const wgsGroup = new THREE.Group();
      assayGroup.add(wgsGroup);

      // Nucleosome Histone Octamer Barrels (Beads on a String)
      const numNucleosomes = 10;
      for (let i = 0; i < numNucleosomes; i++) {
        const angle = (i / numNucleosomes) * Math.PI * 2;
        const radius = 4.2;

        const histone = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 0.8, 0.7, 16),
          new THREE.MeshStandardMaterial({
            color: 0x6366f1, // Indigo histone core
            roughness: 0.3,
            metalness: 0.1,
          })
        );
        histone.position.set(Math.cos(angle) * radius, Math.sin(angle) * 1.5, Math.sin(angle) * radius);
        histone.rotation.x = Math.PI / 4;
        wgsGroup.add(histone);

        // Wrapping DNA double strand coil around nucleosome
        const coil = new THREE.Mesh(
          new THREE.TorusGeometry(1.05, 0.12, 12, 32),
          new THREE.MeshStandardMaterial({ color: 0x2dd4bf, emissive: 0x14b8a6, emissiveIntensity: 0.4 })
        );
        coil.position.copy(histone.position);
        coil.rotation.copy(histone.rotation);
        wgsGroup.add(coil);
      }

      // Connecting linker DNA filaments between nucleosomes
      const linkerCurve = new THREE.CatmullRomCurve3(
        Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return new THREE.Vector3(Math.cos(a) * 4.2, Math.sin(a) * 1.5, Math.sin(a) * 4.2);
        }),
        true
      );
      const linkerGeo = new THREE.TubeGeometry(linkerCurve, 64, 0.1, 8, true);
      const linkerMat = new THREE.MeshStandardMaterial({ color: 0x2dd4bf });
      const linkerMesh = new THREE.Mesh(linkerGeo, linkerMat);
      wgsGroup.add(linkerMesh);

      // Structural Variant (SV) Genomic Breakpoint Junction Beacon
      const svBeacon = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.2, 0),
        new THREE.MeshStandardMaterial({
          color: 0xf43f5e,
          emissive: 0xf43f5e,
          emissiveIntensity: 1.2,
          roughness: 0.1,
        })
      );
      svBeacon.position.set(0, 2.5, 0);
      wgsGroup.add(svBeacon);

      // Pulsing Breakpoint Rings
      const ring1 = new THREE.Mesh(
        new THREE.RingGeometry(1.4, 1.6, 32),
        new THREE.MeshBasicMaterial({ color: 0xfb7185, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
      );
      ring1.position.copy(svBeacon.position);
      wgsGroup.add(ring1);

      animUpdaters.push((t) => {
        wgsGroup.rotation.y += 0.008 * speed;
        svBeacon.rotation.y += 0.03;
        svBeacon.rotation.x += 0.02;
        ring1.scale.setScalar(1 + Math.sin(t * 0.1) * 0.2);
      });
    }

    // =========================================================================
    // MODEL 6: DNA MICROARRAY (Fluorescent cDNA Hybridization Glass Slide)
    // =========================================================================
    else if (assayType === 'microarray') {
      // Glass Microarray Slide
      const slide = new THREE.Mesh(
        new THREE.BoxGeometry(11, 0.35, 8.5),
        new THREE.MeshPhysicalMaterial({
          color: 0x090d16,
          roughness: 0.1,
          transmission: 0.8,
          transparent: true,
          opacity: 0.9,
        })
      );
      assayGroup.add(slide);

      // 7x5 Spot Grid
      for (let x = -4.5; x <= 4.5; x += 1.5) {
        for (let z = -3.2; z <= 3.2; z += 1.6) {
          const ratioVal = Math.sin(x * 1.5) + Math.cos(z * 1.2);
          const spotCol = ratioVal < -0.4 ? 0x10b981 : ratioVal > 0.4 ? 0xf43f5e : 0xfbbf24;
          const height = 0.3 + Math.abs(ratioVal) * 0.5;

          const spot = new THREE.Mesh(
            new THREE.CylinderGeometry(0.42, 0.42, height, 20),
            new THREE.MeshStandardMaterial({
              color: spotCol,
              emissive: spotCol,
              emissiveIntensity: 0.7,
              roughness: 0.2,
            })
          );
          spot.position.set(x, height / 2 + 0.18, z);
          assayGroup.add(spot);
        }
      }

      // Dual Confocal Laser Scanning Beams (532 nm Green + 635 nm Red)
      const greenLaser = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 8.5, 8),
        new THREE.MeshBasicMaterial({ color: 0x22c55e })
      );
      greenLaser.rotation.x = Math.PI / 2;
      greenLaser.position.set(-1.5, 1.2, 0);
      assayGroup.add(greenLaser);

      const redLaser = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 8.5, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      redLaser.rotation.x = Math.PI / 2;
      redLaser.position.set(1.5, 1.2, 0);
      assayGroup.add(redLaser);

      animUpdaters.push((t) => {
        const sweep = Math.sin(t * 0.04 * speed) * 4;
        greenLaser.position.x = sweep - 0.4;
        redLaser.position.x = sweep + 0.4;
      });
    }

    // =========================================================================
    // MODEL 7: CMA (Chromosomal Microarray / aCGH Deletion & Duplication Profile)
    // =========================================================================
    else if (assayType === 'cma') {
      const cmaGroup = new THREE.Group();
      assayGroup.add(cmaGroup);

      // Chromosome Cytoband Backbone Track
      const chrTrack = new THREE.Mesh(
        new THREE.BoxGeometry(13, 0.5, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
      );
      chrTrack.position.set(0, 0, 0);
      cmaGroup.add(chrTrack);

      // Centromere Constriction
      const centromereDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.65, 1.6, 24),
        new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xbe123c, emissiveIntensity: 0.6 })
      );
      centromereDisc.rotation.x = Math.PI / 2;
      centromereDisc.position.set(-1.2, 0, 0);
      cmaGroup.add(centromereDisc);

      // 20 CMA Probes along chromosome:
      // - Normal probes at baseline y = 0
      // - Deletion trench at y = -2.2 (Red)
      // - Duplication terrace at y = +2.0 (Green)
      for (let i = 0; i < 22; i++) {
        const xPos = (i / 22) * 12 - 6;
        let yPos = 0;
        let pCol = 0x2dd4bf; // Normal

        // Deletion Region (e.g. 17q21.31 microdeletion)
        if (i >= 6 && i <= 10) {
          yPos = -2.2;
          pCol = 0xf43f5e;
        }
        // Duplication Region
        else if (i >= 16 && i <= 19) {
          yPos = 2.0;
          pCol = 0x10b981;
        }

        const probe = new THREE.Mesh(
          new THREE.SphereGeometry(0.24, 16, 16),
          new THREE.MeshStandardMaterial({
            color: pCol,
            emissive: pCol,
            emissiveIntensity: 0.8,
          })
        );
        probe.position.set(xPos, yPos + 0.6, 0);
        cmaGroup.add(probe);

        // Guide line connecting probe to chromosome track
        const lineGeo = new THREE.CylinderGeometry(0.04, 0.04, Math.abs(yPos) + 0.2, 8);
        const lineMat = new THREE.MeshStandardMaterial({ color: pCol, opacity: 0.7, transparent: true });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.position.set(xPos, yPos / 2 + 0.3, 0);
        cmaGroup.add(line);
      }

      // Deletion Warning Bracket Banner
      const delBox = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.15, 1.8),
        new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.5 })
      );
      delBox.position.set(-2.0, -2.2, 0);
      cmaGroup.add(delBox);

      animUpdaters.push((t) => {
        cmaGroup.rotation.y += 0.007 * speed;
      });
    }

    // =========================================================================
    // MODEL 8: GENOTYPING / SNP (Cartesian Allelic Discrimination Spatial Clouds)
    // =========================================================================
    else if (assayType === 'genotyping') {
      const genoGroup = new THREE.Group();
      assayGroup.add(genoGroup);

      // Coordinate Axes (X: VIC/Allele 1, Y: FAM/Allele 2, Z: Intensity)
      const axisMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
      const xAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 10, 8), axisMat);
      xAxis.rotation.z = Math.PI / 2;
      xAxis.position.set(0, -3.5, 0);
      genoGroup.add(xAxis);

      const yAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 10, 8), axisMat);
      yAxis.position.set(-3.5, 0, 0);
      genoGroup.add(yAxis);

      // Cluster 1: AA Homozygous Ref (Sky Blue cloud)
      for (let i = 0; i < 24; i++) {
        const pt = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.4 })
        );
        pt.position.set(
          2.5 + (Math.random() - 0.5) * 1.8,
          -2.2 + (Math.random() - 0.5) * 1.6,
          (Math.random() - 0.5) * 1.5
        );
        genoGroup.add(pt);
      }

      // Cluster 2: AB Heterozygous (Emerald Green cloud)
      for (let i = 0; i < 24; i++) {
        const pt = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x059669, emissiveIntensity: 0.4 })
        );
        pt.position.set(
          (Math.random() - 0.5) * 1.8,
          0.8 + (Math.random() - 0.5) * 1.6,
          (Math.random() - 0.5) * 1.5
        );
        genoGroup.add(pt);
      }

      // Cluster 3: BB Homozygous Alt (Rose Red cloud)
      for (let i = 0; i < 24; i++) {
        const pt = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xbe123c, emissiveIntensity: 0.4 })
        );
        pt.position.set(
          -2.2 + (Math.random() - 0.5) * 1.8,
          2.5 + (Math.random() - 0.5) * 1.6,
          (Math.random() - 0.5) * 1.5
        );
        genoGroup.add(pt);
      }

      // Proband Child Patient Call Orb (Glowing Purple)
      const probandOrb = new THREE.Mesh(
        new THREE.SphereGeometry(0.48, 24, 24),
        new THREE.MeshStandardMaterial({
          color: 0xc084fc,
          emissive: 0x9333ea,
          emissiveIntensity: 1.2,
        })
      );
      probandOrb.position.set(0.1, 0.8, 0);
      genoGroup.add(probandOrb);

      // Mother (Gold) and Father (Cyan) markers
      const motherOrb = new THREE.Mesh(
        new THREE.SphereGeometry(0.36, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 0.9 })
      );
      motherOrb.position.set(2.4, -2.1, 0);
      genoGroup.add(motherOrb);

      const fatherOrb = new THREE.Mesh(
        new THREE.SphereGeometry(0.36, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.9 })
      );
      fatherOrb.position.set(2.6, -2.3, 0.4);
      genoGroup.add(fatherOrb);

      animUpdaters.push((t) => {
        genoGroup.rotation.y += 0.007 * speed;
        probandOrb.scale.setScalar(1 + Math.sin(t * 0.08) * 0.15);
      });
    }

    // =========================================================================
    // MODEL 9: KARYOTYPING (Metaphase G-Banded Sister Chromatids & Centromere)
    // =========================================================================
    else if (assayType === 'karyotyping') {
      const karyoGroup = new THREE.Group();
      assayGroup.add(karyoGroup);

      // Sister Chromatid Arm Geometry: Left & Right Chromatids
      const pArmHeight = 3.6; // Short p-arm
      const qArmHeight = 5.4; // Long q-arm

      const createChromatidArm = (xOffset: number, isP: boolean) => {
        const height = isP ? pArmHeight : qArmHeight;
        const armGroup = new THREE.Group();
        const numBands = isP ? 4 : 6;
        const bandH = height / numBands;

        for (let b = 0; b < numBands; b++) {
          // G-pos (dark Giemsa) vs G-neg (light euchromatin)
          const isDark = b % 2 === 0;
          const bandMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.55, 0.55, bandH, 20),
            new THREE.MeshStandardMaterial({
              color: isDark ? 0x0f172a : 0x2dd4bf,
              roughness: 0.3,
              metalness: 0.1,
            })
          );
          bandMesh.position.y = (b - numBands / 2 + 0.5) * bandH;
          armGroup.add(bandMesh);
        }

        const yBase = isP ? height / 2 + 0.5 : -height / 2 - 0.5;
        armGroup.position.set(xOffset, yBase, 0);
        return armGroup;
      };

      // Left Chromatid (p + q)
      karyoGroup.add(createChromatidArm(-0.7, true));
      karyoGroup.add(createChromatidArm(-0.7, false));

      // Right Chromatid (p + q)
      karyoGroup.add(createChromatidArm(0.7, true));
      karyoGroup.add(createChromatidArm(0.7, false));

      // Primary Centromere Constriction (Ruby Red)
      const centromere = new THREE.Mesh(
        new THREE.SphereGeometry(0.85, 24, 24),
        new THREE.MeshStandardMaterial({
          color: 0xf43f5e,
          emissive: 0xbe123c,
          emissiveIntensity: 0.6,
        })
      );
      centromere.position.set(0, 0, 0);
      karyoGroup.add(centromere);

      // Telomeric Protective End Caps (Glowing Blue Spheres at all 4 tips)
      const telomerePositions = [
        [-0.7, pArmHeight + 0.6, 0],
        [0.7, pArmHeight + 0.6, 0],
        [-0.7, -qArmHeight - 0.6, 0],
        [0.7, -qArmHeight - 0.6, 0],
      ];
      telomerePositions.forEach(([x, y, z]) => {
        const telo = new THREE.Mesh(
          new THREE.SphereGeometry(0.32, 16, 16),
          new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x0ea5e9,
            emissiveIntensity: 0.9,
          })
        );
        telo.position.set(x, y, z);
        karyoGroup.add(telo);
      });

      // Metaphase Spindle Alignment Ring
      const spindleRing = new THREE.Mesh(
        new THREE.TorusGeometry(3.2, 0.08, 16, 64),
        new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.5 })
      );
      spindleRing.rotation.x = Math.PI / 2;
      karyoGroup.add(spindleRing);

      animUpdaters.push((t) => {
        karyoGroup.rotation.y += 0.007 * speed;
      });
    }

    // 6. Interactive Mouse Orbit & Click Controls (Drag to rotate, Click to inspect)
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let startMouse = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
      startMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !assayGroup) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      assayGroup.rotation.y += dx * 0.01;
      assayGroup.rotation.x += dy * 0.01;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = (e: MouseEvent) => {
      isDragging = false;
      const dist = Math.hypot(e.clientX - startMouse.x, e.clientY - startMouse.y);
      if (dist < 6 && dom) {
        // It's a click, not a drag! Raycast into 3D scene
        const rect = dom.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
        const hits = raycaster.intersectObjects(assayGroup.children, true);
        if (hits.length > 0) {
          // Cycle to next component or pick first
          const comps = ASSAY_3D_COMPONENTS[assayType] || [];
          setSelectedComponent((prev) => {
            const nextIdx = prev ? (comps.findIndex((c) => c.id === prev.id) + 1) % comps.length : 0;
            return comps[nextIdx] || comps[0];
          });
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleZoom(e.deltaY * 0.015);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // 7. Master Render & Animation Loop
    let tick = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      tick += 1;

      if (isPlaying && autoRotate) {
        assayGroup.rotation.y += 0.005 * speed;
        animUpdaters.forEach((update) => update(tick));
      } else if (isPlaying) {
        animUpdaters.forEach((update) => update(tick));
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      renderer.dispose();
      if (container) container.innerHTML = '';
    };
  }, [assayType, isPlaying, speed, handleZoom, autoRotate]);

  return (
    <div
      className={`relative w-full ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none' : 'h-[440px] rounded-2xl'
      } bg-slate-950 overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between transition-all`}
    >
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing select-none" />

      {/* Floating 3D Scientific HUD & Spec Banner (Top-Left) */}
      <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 text-xs font-mono text-slate-200 flex items-center gap-2.5 shadow-lg">
        <Sparkles className="w-4 h-4 text-teal-400" />
        <div>
          <span className="font-extrabold text-teal-300 uppercase tracking-wide">{assayType}</span>
          <span className="text-slate-500 mx-1.5">•</span>
          <span className="text-slate-300 font-semibold">{targetGene}</span>
          <span className="text-slate-500 mx-1.5">•</span>
          <span className="text-teal-400 font-mono text-[11px]">{variantInput}</span>
        </div>
      </div>

      {/* Clickable 3D Subsystem Component Chips (Top Strip) */}
      <div className="absolute top-12 left-3 right-3 flex items-center gap-1.5 overflow-x-auto py-1 px-1 z-10 scrollbar-none">
        <span className="text-[9px] font-mono text-teal-400 bg-slate-950/90 px-2 py-0.5 rounded border border-slate-800 shrink-0 flex items-center gap-1">
          <MousePointerClick className="w-3 h-3 text-teal-400" />
          <span>Click Component:</span>
        </span>
        {ASSAY_3D_COMPONENTS[assayType]?.map((comp) => {
          const isSelected = selectedComponent?.id === comp.id;
          return (
            <button
              key={comp.id}
              type="button"
              onClick={() => {
                setSelectedComponent(comp);
                if (cameraRef.current && groupRef.current) {
                  if (comp.cameraZ) cameraRef.current.position.z = comp.cameraZ;
                  if (comp.rotationX !== undefined) groupRef.current.rotation.x = comp.rotationX;
                  if (comp.rotationY !== undefined) groupRef.current.rotation.y = comp.rotationY;
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono whitespace-nowrap transition-all border shrink-0 ${
                isSelected
                  ? 'bg-teal-500/20 border-teal-400 text-teal-200 font-bold ring-1 ring-teal-400 shadow'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title={`Focus on ${comp.name}`}
            >
              {comp.name}
            </button>
          );
        })}
      </div>

      {/* Interactive Controls Overlay (Top-Right) */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-700 shadow-lg">
        {/* Camera Angles */}
        <div className="flex items-center gap-1 pr-1 border-r border-slate-700">
          <button
            type="button"
            onClick={() => handleSetCameraAngle('iso')}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition-colors"
            title="Isometric Camera Angle"
          >
            ISO
          </button>
          <button
            type="button"
            onClick={() => handleSetCameraAngle('front')}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition-colors"
            title="Frontal Orthogonal View"
          >
            FRONT
          </button>
          <button
            type="button"
            onClick={() => handleSetCameraAngle('top')}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition-colors"
            title="Top-Down Axial View"
          >
            TOP
          </button>
        </div>

        {/* Auto-Rotate Toggle */}
        <button
          type="button"
          onClick={() => setAutoRotate((prev) => !prev)}
          className={`p-1.5 rounded-lg transition-colors ${
            autoRotate ? 'text-teal-300 bg-teal-500/10' : 'text-slate-500 hover:text-slate-300'
          }`}
          title={autoRotate ? 'Pause 3D Auto-Rotation' : 'Resume 3D Auto-Rotation'}
        >
          <Compass className="w-4 h-4" />
        </button>

        {/* Zoom In */}
        <button
          type="button"
          onClick={() => handleZoom(-2.5)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={() => handleZoom(2.5)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Reset Camera */}
        <button
          type="button"
          onClick={handleResetCamera}
          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition-colors"
          title="Reset Camera Orientation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={() => setIsFullscreen((prev) => !prev)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Floating 3D Structural Component Inspector HUD (Bottom-Left) */}
      {selectedComponent && (
        <div className="absolute bottom-12 left-3 max-w-sm sm:max-w-md bg-slate-900/95 backdrop-blur-md border border-teal-500/50 rounded-xl p-3.5 shadow-2xl z-10 text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-teal-400" />
              <span className="font-bold text-slate-100">{selectedComponent.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                {selectedComponent.subsystem}
              </span>
              <button
                type="button"
                onClick={() => setSelectedComponent(null)}
                className="text-slate-500 hover:text-slate-300 px-1"
                title="Dismiss Inspector"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="text-[11px] text-slate-300 leading-relaxed">
            {selectedComponent.role}
          </div>
          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-[10px] font-mono text-teal-300 flex justify-between">
            <span>Kinetics: {selectedComponent.kinetics}</span>
          </div>
          <p className="text-[10px] text-slate-400">
            <strong className="text-teal-400">Clinical Relevance: </strong>
            {selectedComponent.clinicalRelevance}
          </p>
        </div>
      )}

      {/* Orbit & Physics Guide Badge (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-mono flex items-center gap-2 pointer-events-none">
        <Info className="w-3.5 h-3.5 text-teal-400" />
        <span>Click 3D mesh or top chips to inspect • Drag mouse to orbit • Scroll to zoom</span>
      </div>

      {/* Assay Modality Physics HUD (Bottom-Right) */}
      <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] text-teal-300 font-mono flex items-center gap-1.5 pointer-events-none">
        <Zap className="w-3.5 h-3.5 text-teal-400" />
        <span>
          {assayType === 'pcr' && '95°C Denaturation • Taq Polymerase 72°C Extension'}
          {assayType === 'sanger' && 'Four-Color ddNTP Terminators • Capillary Electrophoresis'}
          {assayType === 'ngs' && 'Illumina SBS • Reversible Terminators • Flow Cell Clusters'}
          {assayType === 'wes' && 'Streptavidin Paramagnetic Beads • Biotinylated Baits'}
          {assayType === 'wgs' && '3.2 Gb Whole Genome • Histone Octamers • SV Breakpoints'}
          {assayType === 'microarray' && '532 nm (Cy3) / 635 nm (Cy5) Dual Confocal Laser Scanner'}
          {assayType === 'cma' && 'Oligo-SNP Copy Number Baseline • Microdeletion Trench'}
          {assayType === 'genotyping' && 'Cartesian VIC / FAM Allele Discrimination Spheres'}
          {assayType === 'karyotyping' && 'Metaphase Sister Chromatids • Giemsa G-Banding'}
        </span>
      </div>
    </div>
  );
};
