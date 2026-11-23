// Content for the exhibition. All detections are a conceptual simulation.

export interface DetectedObject {
  id: string;
  label: string;
  confidence: number;
  trackId: string;
  note: string;
  context: string;
}

export const OBJECTS: readonly DetectedObject[] = [
  {
    id: "person",
    label: "Person",
    confidence: 0.97,
    trackId: "TRK-001",
    note: "Human silhouette, upright posture, facing the workspace.",
    context: "Social context: someone is nearby. The interface lowers its voice.",
  },
  {
    id: "chair",
    label: "Chair",
    confidence: 0.91,
    trackId: "TRK-002",
    note: "Four-legged seat, partially occluding the floor plane.",
    context: "Spatial context: a low obstacle in the walking path.",
  },
  {
    id: "laptop",
    label: "Laptop",
    confidence: 0.94,
    trackId: "TRK-003",
    note: "Open clamshell device on a horizontal surface, screen emitting light.",
    context: "Activity context: a workspace in use.",
  },
  {
    id: "cup",
    label: "Cup",
    confidence: 0.88,
    trackId: "TRK-004",
    note: "Small cylindrical vessel with a handle, resting beside the laptop.",
    context: "Object context: fragile, within arm's reach.",
  },
  {
    id: "plant",
    label: "Potted plant",
    confidence: 0.86,
    trackId: "TRK-005",
    note: "Organic geometry, high texture variance, static.",
    context: "Environment context: an interior, lived-in space.",
  },
];

export const CONCEPTS = [
  {
    id: "yolo",
    name: "YOLO",
    tagline: "Real-time object detection",
    body: "One look, one pass. The whole frame is divided into a grid and every cell predicts boxes and classes at once — perception at the speed of sight.",
    stats: ["single-shot", "grid prediction", "~ms latency"],
  },
  {
    id: "spike",
    name: "SpikeYOLO",
    tagline: "Event-driven neural computation",
    body: "Neurons stay silent until something changes. Information travels as discrete spikes, like a biological brain — computing only when the world moves.",
    stats: ["spiking neurons", "sparse events", "ultra-low power"],
  },
  {
    id: "vlm",
    name: "Vision-Language",
    tagline: "Visual understanding and reasoning",
    body: "Pixels and words fold into one shared space. The machine no longer only names what it sees — it describes, relates and reasons about it.",
    stats: ["image tokens", "language tokens", "shared embedding"],
  },
] as const;

export type ConceptId = (typeof CONCEPTS)[number]["id"];

export const MODES = [
  {
    id: "recognition",
    name: "Object Recognition",
    short: "Recognize",
    summary: "Every object in view is identified, classified and tracked across frames.",
    feed: ["5 objects in field of view", "tracking stable · 0 lost", "classes: person, chair, laptop, cup, plant"],
  },
  {
    id: "obstacle",
    name: "Obstacle Awareness",
    short: "Avoid",
    summary: "Depth is estimated for each object. Anything within reach of your path is flagged.",
    feed: ["depth field estimated", "walkable floor mapped", "proximity threshold 3.5 m"],
  },
  {
    id: "scene",
    name: "Scene Understanding",
    short: "Understand",
    summary: "Objects become relationships. The scene is described in natural language.",
    feed: ["relations inferred: 4", "scene type: interior workspace", "caption generated"],
  },
] as const;

export const SCENE_CAPTION =
  "A quiet interior workspace. A person stands to the left of a desk where a laptop is open, a cup resting beside it. A chair sits in the walking path; a plant marks the far corner.";

export const RELATIONS: readonly [string, string, string][] = [
  ["person", "laptop", "uses"],
  ["cup", "laptop", "beside"],
  ["chair", "person", "near"],
  ["plant", "laptop", "behind"],
];
