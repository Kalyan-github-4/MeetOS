"use client"

import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Quaternion, Vector3, type Group } from "three"

import { modelByIndex, type AvatarModel } from "@/lib/avatars"

/** Matches the flat avatar's eye colour, so the two figures stay one design. */
const EYE = "#2E2622"

/** Seconds between blinks, and how long one lasts. */
const BLINK_PERIOD = 5.2
const BLINK_LENGTH = 0.16

// The mic arm, solved once: a capsule points along its own Y axis, so it has to
// be rotated onto the line from the earcup to the mouth and parked halfway.
const EAR = new Vector3(0.82, 2.3, 0)
const MIC = new Vector3(0.2, 1.95, 0.62)
const BOOM_SPAN = new Vector3().subVectors(MIC, EAR)
const BOOM_LENGTH = BOOM_SPAN.length()
const BOOM_MIDPOINT = new Vector3().addVectors(EAR, MIC).multiplyScalar(0.5)
const BOOM_ROTATION = new Quaternion().setFromUnitVectors(
  new Vector3(0, 1, 0),
  BOOM_SPAN.clone().normalize(),
)

/**
 * The figure, built from primitives rather than loaded from a file.
 *
 * Procedural geometry keeps this to a few hundred bytes of code instead of
 * megabytes of GLB, needs no licence, and takes its colours from the same
 * palette the flat avatar uses — so the model you pick here is recognisably
 * the one that represents you in the call.
 */
function Figure({ model }: { model: AvatarModel }) {
  const group = useRef<Group>(null)
  const eyes = useRef<Group>(null)
  const { palette, shape } = model

  useFrame((state, delta) => {
    // A slow turn: enough to show the form is solid, slow enough to ignore.
    if (group.current) group.current.rotation.y += delta * 0.35

    if (eyes.current) {
      // Squash to nothing and back within the blink window, then hold open for
      // the rest of the cycle — a cosine gives the lid its ease at both ends.
      const phase = state.clock.elapsedTime % BLINK_PERIOD
      const open =
        phase < BLINK_LENGTH
          ? Math.abs(Math.cos((phase / BLINK_LENGTH) * Math.PI))
          : 1

      eyes.current.scale.y = Math.max(open, 0.06)
    }
  })

  return (
    <group ref={group} position={[0, -1.15, 0]}>
      <mesh position={[0, 0.95, 0]} scale={[1.18, 0.95, 1.06]} castShadow>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial
          color={palette.base}
          roughness={0.62}
          metalness={0.02}
        />
      </mesh>

      <mesh position={[0, 2.3, 0]} castShadow>
        <sphereGeometry args={[0.74, 48, 48]} />
        <meshStandardMaterial
          color={palette.light}
          roughness={0.55}
          metalness={0.02}
        />
      </mesh>

      {/* Pushed proud of the head sphere so they catch their own specular —
          sunk flush they would read as painted dots. Low roughness is what
          makes them look wet. The group sits at eye height so the blink
          squashes them in place instead of sliding them down the face. */}
      <group ref={eyes} position={[0, 2.36, 0]}>
        {[-0.26, 0.26].map((x) => (
          <mesh key={x} position={[x, 0, 0.65]}>
            <sphereGeometry args={[0.115, 24, 24]} />
            <meshStandardMaterial
              color={EYE}
              roughness={0.16}
              metalness={0.05}
            />
          </mesh>
        ))}
      </group>

      <mesh position={[0, 2.3, 0]} castShadow>
        {/* Half a torus: the band over the crown, not a ring around it. */}
        <torusGeometry args={[0.82, 0.09, 16, 48, Math.PI]} />
        <meshStandardMaterial color={palette.dark} roughness={0.45} />
      </mesh>

      {(shape === "duo" ? [-0.82, 0.82] : [0.82]).map((x) => (
        <mesh key={x} position={[x, 2.3, 0]} scale={[0.55, 1, 0.9]} castShadow>
          <sphereGeometry args={[0.24, 24, 24]} />
          <meshStandardMaterial color={palette.dark} roughness={0.45} />
        </mesh>
      ))}

      <mesh position={BOOM_MIDPOINT} quaternion={BOOM_ROTATION} castShadow>
        <capsuleGeometry args={[0.042, BOOM_LENGTH - 0.084]} />
        <meshStandardMaterial color={palette.dark} roughness={0.45} />
      </mesh>

      <mesh position={MIC} castShadow>
        <sphereGeometry args={[0.1, 20, 20]} />
        <meshStandardMaterial color={palette.dark} roughness={0.4} />
      </mesh>
    </group>
  )
}

/**
 * A live preview of one avatar.
 *
 * Deliberately confined to the pre-join screen. A WebGL context per tile would
 * compete with video encode and decode for the GPU during the call itself;
 * here the viewer is idle and choosing, which is when the cost is worth paying.
 */
export function ModelStudio({
  index,
  className,
}: {
  index: number
  className?: string
}) {
  const model = modelByIndex(index)

  return (
    <div className={className}>
      <Canvas
        shadows
        // Capped so a high-density display does not quadruple the pixel count
        // for a preview this size.
        dpr={[1, 2]}
        camera={{ position: [0, 0.35, 5.4], fov: 30 }}
      >
        <color attach="background" args={[model.palette.ground]} />

        <ambientLight intensity={1.1} />
        <directionalLight
          position={[3.5, 5, 3]}
          intensity={2.4}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        {/* Cool fill from behind, so the unlit side keeps its form. */}
        <directionalLight
          position={[-3, 1.5, -2.5]}
          intensity={0.55}
          color={model.palette.light}
        />

        <Figure model={model} />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.16, 0]}
          receiveShadow
        >
          <circleGeometry args={[3.4, 48]} />
          <shadowMaterial opacity={0.22} />
        </mesh>
      </Canvas>
    </div>
  )
}
