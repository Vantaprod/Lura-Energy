'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const RADIUS = 1.0;
const LAND_SAMPLES = 38000;
const COAST_SAMPLES = 18000;
const FLOAT_PARTICLES = 420;
const PIXEL_RATIO_CAP = 1.75;

const COLOR_LAND = new THREE.Color('#1428A0');
const COLOR_COAST = new THREE.Color('#4A6FE8');
const COLOR_MARKER = new THREE.Color('#F58220');
const COLOR_ATMO = new THREE.Color('#3A65F0');
const COLOR_RIM = new THREE.Color('#F58220');

type CountryFeature = {
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
};

function latLngToXYZ(lat: number, lng: number, r: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return [
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];
}

function makePointTexture(): THREE.Texture {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.25)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export function HolographicGlobe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let disposed = false;
    const cleanup: (() => void)[] = [];
    let width = parent.clientWidth || 500;
    let height = parent.clientHeight || 500;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.18, 3.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_CAP));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);

    const globe = new THREE.Group();
    scene.add(globe);

    (async () => {
      const res = await fetch('/data/countries-110m.json');
      if (!res.ok) throw new Error('Failed to load country data');
      const topology = await res.json();
      if (disposed) return;

      const topojson = await import('topojson-client');
      const geo = topojson.feature(topology, topology.objects.countries) as unknown as {
        features: CountryFeature[];
      };

      const W = 2048;
      const H = 1024;

      const landCanvas = document.createElement('canvas');
      landCanvas.width = W;
      landCanvas.height = H;
      const landCtx = landCanvas.getContext('2d')!;
      landCtx.fillStyle = '#000';
      landCtx.fillRect(0, 0, W, H);
      landCtx.fillStyle = '#fff';

      const coastCanvas = document.createElement('canvas');
      coastCanvas.width = W;
      coastCanvas.height = H;
      const coastCtx = coastCanvas.getContext('2d')!;
      coastCtx.fillStyle = '#000';
      coastCtx.fillRect(0, 0, W, H);
      coastCtx.strokeStyle = '#fff';
      coastCtx.lineWidth = 2.2;
      coastCtx.lineJoin = 'round';
      coastCtx.lineCap = 'round';

      const pathRing = (ring: number[][]): void => {
        landCtx.beginPath();
        coastCtx.beginPath();
        for (let i = 0; i < ring.length; i++) {
          const pt = ring[i];
          const lng = pt[0];
          const lat = pt[1];
          const x = ((lng + 180) / 360) * W;
          const y = ((90 - lat) / 180) * H;
          if (i === 0) {
            landCtx.moveTo(x, y);
            coastCtx.moveTo(x, y);
          } else {
            landCtx.lineTo(x, y);
            coastCtx.lineTo(x, y);
          }
        }
        landCtx.closePath();
        coastCtx.closePath();
      };

      for (const f of geo.features) {
        if (!f.geometry) continue;
        const polys: number[][][][] =
          f.geometry.type === 'Polygon'
            ? [f.geometry.coordinates as number[][][]]
            : (f.geometry.coordinates as number[][][][]);
        for (const poly of polys) {
          for (const ring of poly) {
            pathRing(ring);
            landCtx.fill();
            coastCtx.stroke();
          }
        }
      }

      const landPixels = landCtx.getImageData(0, 0, W, H).data;
      const coastPixels = coastCtx.getImageData(0, 0, W, H).data;

      const isLand = (lat: number, lng: number): boolean => {
        const x = Math.floor(((lng + 180) / 360) * W);
        const y = Math.floor(((90 - lat) / 180) * H);
        if (y < 0 || y >= H) return false;
        const xx = ((x % W) + W) % W;
        return landPixels[(y * W + xx) * 4] > 128;
      };
      const isCoast = (lat: number, lng: number): boolean => {
        const x = Math.floor(((lng + 180) / 360) * W);
        const y = Math.floor(((90 - lat) / 180) * H);
        if (y < 0 || y >= H) return false;
        const xx = ((x % W) + W) % W;
        return coastPixels[(y * W + xx) * 4] > 128;
      };

      const randomSpherePoint = (): { lat: number; lng: number } => {
        const u = Math.random() * 2 - 1;
        const theta = Math.random() * Math.PI * 2;
        return {
          lat: (Math.asin(u) * 180) / Math.PI,
          lng: (theta * 180) / Math.PI - 180,
        };
      };

      const landPositions: number[] = [];
      let attempts = 0;
      const landMaxAttempts = LAND_SAMPLES * 8;
      while (landPositions.length < LAND_SAMPLES * 3 && attempts < landMaxAttempts) {
        attempts++;
        const p = randomSpherePoint();
        if (!isLand(p.lat, p.lng)) continue;
        const [x, y, z] = latLngToXYZ(p.lat, p.lng, RADIUS);
        landPositions.push(x, y, z);
      }

      const coastPositions: number[] = [];
      attempts = 0;
      const coastMaxAttempts = COAST_SAMPLES * 10;
      while (coastPositions.length < COAST_SAMPLES * 3 && attempts < coastMaxAttempts) {
        attempts++;
        const p = randomSpherePoint();
        if (!isCoast(p.lat, p.lng)) continue;
        const [x, y, z] = latLngToXYZ(p.lat, p.lng, RADIUS * 1.001);
        coastPositions.push(x, y, z);
      }

      const markerPositions: number[] = [];
      const NIGERIA = { lat: 9.082, lng: 8.6753 };
      for (let i = 0; i < 70; i++) {
        const lat = NIGERIA.lat + (Math.random() - 0.5) * 1.6;
        const lng = NIGERIA.lng + (Math.random() - 0.5) * 1.6;
        const [x, y, z] = latLngToXYZ(lat, lng, RADIUS * 1.003);
        markerPositions.push(x, y, z);
      }

      const sprite = makePointTexture();

      const landGeo = new THREE.BufferGeometry();
      landGeo.setAttribute('position', new THREE.Float32BufferAttribute(landPositions, 3));
      const landMat = new THREE.PointsMaterial({
        size: 0.013,
        map: sprite,
        color: COLOR_LAND,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      globe.add(new THREE.Points(landGeo, landMat));

      const coastGeo = new THREE.BufferGeometry();
      coastGeo.setAttribute('position', new THREE.Float32BufferAttribute(coastPositions, 3));
      const coastMat = new THREE.PointsMaterial({
        size: 0.022,
        map: sprite,
        color: COLOR_COAST,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      globe.add(new THREE.Points(coastGeo, coastMat));

      const markerGeo = new THREE.BufferGeometry();
      markerGeo.setAttribute('position', new THREE.Float32BufferAttribute(markerPositions, 3));
      const markerMat = new THREE.PointsMaterial({
        size: 0.038,
        map: sprite,
        color: COLOR_MARKER,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      globe.add(new THREE.Points(markerGeo, markerMat));

      const atmoGeo = new THREE.SphereGeometry(RADIUS * 1.15, 64, 64);
      const atmoMat = new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
        uniforms: {
          uColor: { value: COLOR_ATMO },
          uIntensity: { value: 0.95 },
        },
        vertexShader: [
          'varying vec3 vNormal;',
          'varying vec3 vViewDir;',
          'void main() {',
          '  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);',
          '  vNormal = normalize(normalMatrix * normal);',
          '  vViewDir = normalize(-mvPos.xyz);',
          '  gl_Position = projectionMatrix * mvPos;',
          '}',
        ].join('\n'),
        fragmentShader: [
          'varying vec3 vNormal;',
          'varying vec3 vViewDir;',
          'uniform vec3 uColor;',
          'uniform float uIntensity;',
          'void main() {',
          '  float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 3.5);',
          '  gl_FragColor = vec4(uColor, fresnel * uIntensity);',
          '}',
        ].join('\n'),
      });
      globe.add(new THREE.Mesh(atmoGeo, atmoMat));

      const rimGeo = new THREE.SphereGeometry(RADIUS * 1.006, 64, 64);
      const rimMat = new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.FrontSide,
        uniforms: {
          uColor: { value: COLOR_RIM },
          uIntensity: { value: 0.32 },
        },
        vertexShader: [
          'varying vec3 vNormal;',
          'varying vec3 vViewDir;',
          'void main() {',
          '  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);',
          '  vNormal = normalize(normalMatrix * normal);',
          '  vViewDir = normalize(-mvPos.xyz);',
          '  gl_Position = projectionMatrix * mvPos;',
          '}',
        ].join('\n'),
        fragmentShader: [
          'varying vec3 vNormal;',
          'varying vec3 vViewDir;',
          'uniform vec3 uColor;',
          'uniform float uIntensity;',
          'void main() {',
          '  float rim = pow(1.0 - abs(dot(vNormal, vViewDir)), 4.0);',
          '  gl_FragColor = vec4(uColor, rim * uIntensity);',
          '}',
        ].join('\n'),
      });
      globe.add(new THREE.Mesh(rimGeo, rimMat));

      const floatGeo = new THREE.BufferGeometry();
      const floatArr = new Float32Array(FLOAT_PARTICLES * 3);
      for (let i = 0; i < FLOAT_PARTICLES; i++) {
        const r = 1.7 + Math.random() * 1.5;
        const u = Math.random() * 2 - 1;
        const theta = Math.random() * Math.PI * 2;
        const rr = Math.sqrt(1 - u * u);
        floatArr[i * 3] = r * rr * Math.cos(theta);
        floatArr[i * 3 + 1] = r * u;
        floatArr[i * 3 + 2] = r * rr * Math.sin(theta);
      }
      floatGeo.setAttribute('position', new THREE.Float32BufferAttribute(floatArr, 3));
      const floatMat = new THREE.PointsMaterial({
        size: 0.022,
        map: sprite,
        color: COLOR_COAST,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const floatPoints = new THREE.Points(floatGeo, floatMat);
      scene.add(floatPoints);

      const onResize = (): void => {
        width = parent.clientWidth || width;
        height = parent.clientHeight || height;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      window.addEventListener('resize', onResize);

      const clock = new THREE.Clock();
      let raf = 0;
      const tick = (): void => {
        if (disposed) return;
        raf = requestAnimationFrame(tick);
        const t = clock.getElapsedTime();

        globe.rotation.y = t * 0.11;
        const breath = 1 + Math.sin(t * 0.9) * 0.013;
        globe.scale.setScalar(breath);
        globe.position.y = Math.sin(t * 0.6) * 0.02;

        floatPoints.rotation.y = -t * 0.03;
        floatPoints.rotation.x = Math.sin(t * 0.15) * 0.05;

        renderer.render(scene, camera);
      };
      tick();

      canvas.style.opacity = '1';

      cleanup.push(() => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        landGeo.dispose();
        coastGeo.dispose();
        markerGeo.dispose();
        floatGeo.dispose();
        atmoGeo.dispose();
        rimGeo.dispose();
        landMat.dispose();
        coastMat.dispose();
        markerMat.dispose();
        floatMat.dispose();
        atmoMat.dispose();
        rimMat.dispose();
        sprite.dispose();
        renderer.dispose();
      });
    })().catch((error) => {
      console.error('Holographic globe failed:', error);
    });

    return () => {
      disposed = true;
      cleanup.forEach((fn) => fn());
      cleanup.length = 0;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? 'holographic-globe'}
      role="img"
      aria-label="Rotating globe highlighting Lura operating regions"
    />
  );
}