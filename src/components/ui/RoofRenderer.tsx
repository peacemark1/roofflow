import { useEffect, useRef, useState } from 'react'
import { rendersApi } from '@/api'
import { Loader2, Download } from 'lucide-react'

const COLORS = [
  { hex: '#2C2C2A', name: 'Charcoal'     },
  { hex: '#5F5E5A', name: 'Slate'        },
  { hex: '#888780', name: 'Dove gray'    },
  { hex: '#BA7517', name: 'Harvest tan'  },
  { hex: '#993C1D', name: 'Terra cotta'  },
  { hex: '#185FA5', name: 'Steel blue'   },
  { hex: '#3B6D11', name: 'Forest green' },
]
const MATERIALS = ['aluzinc','shingle','metal','tile']

interface Props {
  roofType: 'hip' | 'gable'
  quoteId:  string
}

export function RoofRenderer({ roofType, quoteId }: Props) {
  const mountRef    = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<any>(null)
  const [selColor,    setSelColor]    = useState(0)
  const [selMaterial, setSelMaterial] = useState(0)
  const [rendering,   setRendering]   = useState(false)
  const [renderUrl,   setRenderUrl]   = useState<string|null>(null)

  useEffect(() => {
    let THREE: any, animId: number

    const init = async () => {
      THREE = (window as any).THREE
      if (!THREE) return  // Three.js loaded via CDN in index.html

      const W = mountRef.current!.clientWidth
      const H = 380

      // Scene
      const scene    = new THREE.Scene()
      scene.background = new THREE.Color(0xF0F4F8)

      // Camera
      const camera = new THREE.PerspectiveCamera(35, W/H, 0.1, 1000)
      camera.position.set(15, 12, 15)
      camera.lookAt(0, 2, 0)

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type    = THREE.PCFSoftShadowMap
      mountRef.current!.appendChild(renderer.domElement)
      rendererRef.current = renderer

      // Lights
      scene.add(new THREE.AmbientLight(0xffffff, 0.45))
      const sun = new THREE.DirectionalLight(0xFFF5E0, 1.8)
      sun.position.set(10, 20, 8)
      sun.castShadow = true
      scene.add(sun)
      scene.add(Object.assign(new THREE.DirectionalLight(0xC8D8FF, 0.6), {
        position: { x: -8, y: 10, z: -5, set(x:number,y:number,z:number){this.x=x;this.y=y;this.z=z} }
      }))

      // Ground
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(60, 60),
        new THREE.MeshLambertMaterial({ color: 0xD4E8C2 })
      )
      ground.rotation.x = -Math.PI / 2
      ground.receiveShadow = true
      scene.add(ground)

      // Walls
      const walls = new THREE.Mesh(
        new THREE.BoxGeometry(10, 3, 8),
        new THREE.MeshLambertMaterial({ color: 0xF5F0E8 })
      )
      walls.position.y = 1.5
      walls.castShadow = true
      walls.receiveShadow = true
      scene.add(walls)

      // Build roof
      buildRoof(THREE, scene, roofType, COLORS[selColor].hex)

      // Animate
      const animate = () => {
        animId = requestAnimationFrame(animate)
        renderer.render(scene, camera)
      }
      animate()
    }

    init()
    return () => {
      cancelAnimationFrame(animId)
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement)
        rendererRef.current.dispose()
      }
    }
  }, [roofType, selColor])

  function buildRoof(THREE: any, scene: any, type: string, colorHex: string) {
    // Remove old roof
    scene.children.filter((c: any) => c.userData.isRoof).forEach((c: any) => scene.remove(c))

    const color = new THREE.Color(colorHex)
    const mat   = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide })
    const group = new THREE.Group()
    group.userData.isRoof = true

    const L = 5, W = 4, H = 2.5, OH = 0.5 // half-sizes + overhang + height

    if (type === 'hip') {
      const ridgeL = L - W
      const verts = [
        // Front slope
        -L-OH, 0,  W+OH,  L+OH, 0,  W+OH,  ridgeL, H, 0,   -ridgeL, H, 0,
        // Back slope
        -L-OH, 0, -W-OH,  -ridgeL, H, 0,  ridgeL, H, 0,  L+OH, 0, -W-OH,
        // Left hip
        -L-OH, 0,  W+OH,  -ridgeL, H, 0,  -L-OH, 0, -W-OH,
        // Right hip
         L+OH, 0,  W+OH,   L+OH, 0, -W-OH,  ridgeL, H, 0,
      ]
      const quads = [[0,1,2,3],[4,5,6,7]]
      const tris  = [[8,9,10],[11,12,13]]

      quads.forEach(([a,b,c,d]) => {
        const pos = new Float32Array([
          verts[a*3],verts[a*3+1],verts[a*3+2],
          verts[b*3],verts[b*3+1],verts[b*3+2],
          verts[c*3],verts[c*3+1],verts[c*3+2],
          verts[a*3],verts[a*3+1],verts[a*3+2],
          verts[c*3],verts[c*3+1],verts[c*3+2],
          verts[d*3],verts[d*3+1],verts[d*3+2],
        ])
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
        geo.computeVertexNormals()
        const mesh = new THREE.Mesh(geo, mat)
        mesh.castShadow = true
        group.add(mesh)
      })
      tris.forEach(([a,b,c]) => {
        const pos = new Float32Array([
          verts[a*3],verts[a*3+1],verts[a*3+2],
          verts[b*3],verts[b*3+1],verts[b*3+2],
          verts[c*3],verts[c*3+1],verts[c*3+2],
        ])
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
        geo.computeVertexNormals()
        group.add(new THREE.Mesh(geo, mat))
      })
    } else {
      // Gable
      ;[
        [-L-OH, 0,  W+OH,  L+OH, 0,  W+OH,  L+OH, H, 0,  -L-OH, H, 0],
        [-L-OH, 0, -W-OH,  -L-OH, H, 0,  L+OH, H, 0,  L+OH, 0, -W-OH],
      ].forEach(vs => {
        const pos = new Float32Array([
          vs[0],vs[1],vs[2], vs[3],vs[4],vs[5], vs[6],vs[7],vs[8],
          vs[0],vs[1],vs[2], vs[6],vs[7],vs[8], vs[9],vs[10],vs[11],
        ])
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
        geo.computeVertexNormals()
        group.add(new THREE.Mesh(geo, mat))
      })
    }

    group.position.y = 3
    scene.add(group)
  }

  const handleAIRender = async () => {
    setRendering(true)
    try {
      await rendersApi.request({
        quote_id:   quoteId,
        roof_type:  roofType,
        material:   MATERIALS[selMaterial],
        color_hex:  COLORS[selColor].hex,
        ai_texture: true,
      })
      // Poll for result
      const poll = setInterval(async () => {
        const res = await rendersApi.status(quoteId)
        if (res.data.status === 'ready') {
          setRenderUrl(res.data.url)
          setRendering(false)
          clearInterval(poll)
        }
      }, 3000)
    } catch {
      setRendering(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Three.js canvas */}
      <div ref={mountRef} className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50" />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Color</p>
          <div className="flex gap-2">
            {COLORS.map((c, i) => (
              <button key={c.hex}
                onClick={() => setSelColor(i)}
                title={c.name}
                style={{ background: c.hex }}
                className={`w-7 h-7 rounded-full border-2 transition-all
                  ${i === selColor ? 'border-gray-900 scale-110' : 'border-transparent'}`}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Material</p>
          <div className="flex gap-2">
            {MATERIALS.map((m, i) => (
              <button key={m}
                onClick={() => setSelMaterial(i)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize border transition-all
                  ${i === selMaterial ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 text-gray-600 hover:border-brand-400'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI render button */}
      {!renderUrl && (
        <button onClick={handleAIRender} disabled={rendering} className="btn-primary">
          {rendering
            ? <><Loader2 size={15} className="animate-spin"/> Generating AI render (~30s)...</>
            : '✨ Generate AI texture render'
          }
        </button>
      )}

      {/* AI render result */}
      {renderUrl && (
        <div>
          <img src={renderUrl} alt="AI roof render" className="rounded-xl w-full" />
          <a href={renderUrl} download className="btn-ghost mt-2 inline-flex">
            <Download size={15}/> Download render
          </a>
        </div>
      )}
    </div>
  )
}
